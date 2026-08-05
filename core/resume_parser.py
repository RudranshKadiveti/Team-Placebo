import os
import io
import asyncio
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from google import genai
from google.genai import types

try:
    import pypdf
    HAS_PYPDF = True
except ImportError:
    HAS_PYPDF = False

try:
    import docx
    HAS_DOCX = True
except ImportError:
    HAS_DOCX = False


class WorkExperienceItem(BaseModel):
    """Structured work experience item."""
    job_title: str = Field(default="", description="Job title or role name")
    company: str = Field(default="", description="Company or organization name")
    duration: str = Field(default="", description="Dates or duration of employment, e.g., 2021 - 2023")
    description: str = Field(default="", description="Key responsibilities and achievements")


class EducationItem(BaseModel):
    """Structured education background item."""
    degree: str = Field(default="", description="Degree, diploma, or qualification")
    institution: str = Field(default="", description="University, college, or institution name")
    graduation_year: str = Field(default="", description="Graduation year or date range")


class ProjectItem(BaseModel):
    """Structured project item."""
    title: str = Field(default="", description="Project name or title")
    technologies: str = Field(default="", description="Technologies, languages, or tools used")
    description: str = Field(default="", description="Overview of the project")


class ResumeParseResult(BaseModel):
    """Strict Pydantic model for structured Resume/CV extraction output."""
    candidate_name: str = Field(default="", description="Full name of the candidate")
    email: str = Field(default="", description="Email address")
    phone: str = Field(default="", description="Phone number")
    linkedin_url: str = Field(default="", description="LinkedIn profile URL")
    github_url: str = Field(default="", description="GitHub or portfolio website URL")
    location: str = Field(default="", description="City, state, or country of residence")
    executive_summary: str = Field(default="", description="Professional summary or bio")
    skills: List[str] = Field(default_factory=list, description="List of technical and soft skills")
    work_experience: List[WorkExperienceItem] = Field(default_factory=list, description="Work experience list")
    education: List[EducationItem] = Field(default_factory=list, description="Education background list")
    certifications: List[str] = Field(default_factory=list, description="List of certifications, licenses, or awards")
    projects: List[ProjectItem] = Field(default_factory=list, description="Featured projects list")

    def to_dict(self) -> Dict[str, Any]:
        """Return dictionary representation of parsed resume data."""
        return self.model_dump()


def extract_text_from_document(file_bytes: bytes, filename: str) -> str:
    """Extract raw text from PDF, DOCX, or TXT document bytes."""
    ext = os.path.splitext(filename)[1].lower()
    
    if ext == ".pdf":
        if not HAS_PYPDF:
            raise ImportError("pypdf package is required to parse PDF resumes. Please install pypdf.")
        reader = pypdf.PdfReader(io.BytesIO(file_bytes))
        pages_text = [page.extract_text() or "" for page in reader.pages]
        extracted = "\n".join(pages_text).strip()
        if not extracted:
            raise ValueError("Could not extract readable text from PDF file. It might be scanned or image-only.")
        return extracted

    elif ext in (".docx", ".doc"):
        if not HAS_DOCX:
            raise ImportError("python-docx package is required to parse Word resumes. Please install python-docx.")
        doc = docx.Document(io.BytesIO(file_bytes))
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        return "\n".join(paragraphs).strip()

    else:
        # Plain text / Markdown
        return file_bytes.decode("utf-8", errors="ignore").strip()


class ResumeParser:
    """Core Resume / CV extraction engine powered by Gemini AI."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")

    async def parse_resume(
        self, 
        file_bytes: bytes, 
        filename: str, 
        custom_instructions: Optional[str] = None,
        model_name: str = "gemini-flash-latest"
    ) -> ResumeParseResult:
        """Extract text from uploaded Resume/CV document and parse into structured ResumeParseResult schema using Gemini AI."""
        # Step 1: Extract document text
        resume_text = extract_text_from_document(file_bytes, filename)
        
        api_key = self.api_key or os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("Gemini API key must be provided or set in the GEMINI_API_KEY environment variable.")

        client = genai.Client(api_key=api_key)
        
        # Step 2: Prepare prompt payload
        max_chars = 30000
        truncated_text = resume_text[:max_chars] if len(resume_text) > max_chars else resume_text
        
        prompt_content = f"Filename: {filename}\n\nResume Document Content:\n{truncated_text}"
        if custom_instructions and custom_instructions.strip():
            prompt_content += f"\n\nAdditional Focus Instructions:\n{custom_instructions}"

        candidate_models = [model_name]
        for fallback in ["gemini-flash-latest", "gemini-3.6-flash", "gemini-2.0-flash"]:
            if fallback not in candidate_models:
                candidate_models.append(fallback)

        last_error = None
        for current_model in candidate_models:
            try:
                response = client.models.generate_content(
                    model=current_model,
                    contents=prompt_content,
                    config=types.GenerateContentConfig(
                        system_instruction=(
                            "You are an expert HR resume parser and talent analyst. "
                            "Extract candidate contact details, skills, work experience, education, certifications, and projects "
                            "from the provided resume document text into a structured JSON matching the schema precisely."
                        ),
                        response_mime_type="application/json",
                        response_schema=ResumeParseResult,
                    ),
                )
                if response.text:
                    return ResumeParseResult.model_validate_json(response.text)
            except Exception as e:
                last_error = e
                err_str = str(e)
                if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str or "404" in err_str or "NOT_FOUND" in err_str:
                    await asyncio.sleep(1)
                    continue
                else:
                    raise e

        if last_error:
            raise last_error
        raise RuntimeError("Failed to parse resume with Gemini API.")
