import os
import io
import asyncio
from datetime import datetime
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


class ContactInfo(BaseModel):
    """Candidate contact and personal details."""
    name: str = Field(default="", description="Full name of the candidate")
    email: str = Field(default="", description="Email address")
    phone: str = Field(default="", description="Phone number with country code if available")
    location: str = Field(default="", description="City, State, Country of residence")
    linkedin: str = Field(default="", description="LinkedIn profile URL")
    github: str = Field(default="", description="GitHub profile URL")
    portfolio: str = Field(default="", description="Personal website or portfolio URL")


class CategorizedSkills(BaseModel):
    """Skills grouped by category."""
    programming_languages: List[str] = Field(default_factory=list, description="Programming languages (e.g. Python, Java, JS)")
    frameworks_libraries: List[str] = Field(default_factory=list, description="Frameworks and libraries (e.g. React, PyTorch, Django)")
    tools_platforms: List[str] = Field(default_factory=list, description="Tools, databases, and cloud platforms (e.g. Docker, AWS, PostgreSQL, Git)")
    domain_knowledge: List[str] = Field(default_factory=list, description="Domain knowledge and industry concepts (e.g. Machine Learning, CI/CD, Agile)")
    soft_skills: List[str] = Field(default_factory=list, description="Soft skills and interpersonal abilities (e.g. Leadership, Problem Solving)")
    languages_spoken: List[str] = Field(default_factory=list, description="Languages spoken (e.g. English, Spanish)")


class WorkExperienceItem(BaseModel):
    """Enriched work experience entry with ISO normalized dates."""
    job_title: str = Field(default="", description="Job title or role designation")
    company: str = Field(default="", description="Company or organization name")
    location: str = Field(default="", description="Job location or Remote status")
    start_date: str = Field(default="", description="Start date in ISO format YYYY-MM or YYYY")
    end_date: str = Field(default="", description="End date in ISO format YYYY-MM, YYYY, or Present")
    is_current: bool = Field(default=False, description="True if candidate currently works in this role")
    responsibilities: List[str] = Field(default_factory=list, description="Key duties and responsibilities")
    achievements: List[str] = Field(default_factory=list, description="Quantifiable metrics, impacts, and achievements")
    technologies_used: List[str] = Field(default_factory=list, description="Technologies, languages, and tools used in this role")


class EducationItem(BaseModel):
    """Enriched education background entry with ISO normalized dates."""
    degree: str = Field(default="", description="Degree, diploma, or qualification title")
    field_of_study: str = Field(default="", description="Major, specialization, or field of study")
    institution: str = Field(default="", description="University, college, or institution name")
    location: str = Field(default="", description="Institution location")
    start_date: str = Field(default="", description="Start date in ISO format YYYY-MM or YYYY")
    end_date: str = Field(default="", description="Graduation or end date in ISO format YYYY-MM or YYYY")
    gpa_or_grade: str = Field(default="", description="GPA, grade, or academic honors achieved")


class CertificationItem(BaseModel):
    """Enriched certification entry with ISO normalized dates."""
    title: str = Field(default="", description="Certification title or name")
    issuing_organization: str = Field(default="", description="Issuing organization or authority")
    issue_date: str = Field(default="", description="Issue date in ISO format YYYY-MM or YYYY")
    expiration_date: str = Field(default="", description="Expiration date in ISO format YYYY-MM or YYYY")
    credential_id_or_url: str = Field(default="", description="Credential ID or validation URL")


class ProjectItem(BaseModel):
    """Enriched project entry with ISO normalized dates."""
    title: str = Field(default="", description="Project title or name")
    role: str = Field(default="", description="Role or contribution in the project")
    start_date: str = Field(default="", description="Start date in ISO format YYYY-MM or YYYY")
    end_date: str = Field(default="", description="End date in ISO format YYYY-MM or YYYY")
    description: str = Field(default="", description="Summary and objective of the project")
    technologies_used: List[str] = Field(default_factory=list, description="Technologies and tools used in this project")
    project_url: str = Field(default="", description="Repository or live demo URL")


class ATSAnalysis(BaseModel):
    """ATS evaluation calculated using real-life factor weightages."""
    ats_score: int = Field(default=0, description="Overall weighted ATS score (0-100) calculated from the 4 pillars")
    keyword_skill_match_score: int = Field(default=0, description="Keyword & Skill Match score (45% weight): Hard skills, tech stack, and industry terms")
    formatting_compatibility_score: int = Field(default=0, description="Parsing & Formatting Compatibility score (25% weight): Clean machine-readable text and standard headings")
    content_impact_score: int = Field(default=0, description="Content Quality & Impact score (25% weight): Quantified achievements, metrics, and active bullet points")
    structure_length_score: int = Field(default=0, description="Structure & Length score (10% weight): Logical section flow and appropriate length")
    strengths: List[str] = Field(default_factory=list, description="Key resume strengths")
    issues: List[str] = Field(default_factory=list, description="Formatting or content issues impacting ATS scanning")
    suggestions: List[str] = Field(default_factory=list, description="Actionable ATS improvement recommendations")


class ResumeMetadata(BaseModel):
    """Document and parsing metadata."""
    filename: str = Field(default="", description="Original document file name")
    file_type: str = Field(default="", description="Document file extension/type")
    character_count: int = Field(default=0, description="Total character count of extracted text")
    parsed_at: str = Field(default="", description="ISO timestamp when parsing occurred")


class ResumeParseResult(BaseModel):
    """Strict, standardized Pydantic model for complete structured Resume/CV parsing."""
    metadata: ResumeMetadata = Field(default_factory=ResumeMetadata, description="Document metadata")
    contact: ContactInfo = Field(default_factory=ContactInfo, description="Candidate contact information")
    executive_summary: str = Field(default="", description="Professional summary or bio")
    skills: CategorizedSkills = Field(default_factory=CategorizedSkills, description="Grouped candidate skills")
    work_experience: List[WorkExperienceItem] = Field(default_factory=list, description="Work experience history")
    education: List[EducationItem] = Field(default_factory=list, description="Education history")
    certifications: List[CertificationItem] = Field(default_factory=list, description="Certifications and credentials")
    projects: List[ProjectItem] = Field(default_factory=list, description="Featured projects")
    extracted_keywords: List[str] = Field(default_factory=list, description="Key industry keywords extracted")
    ats_analysis: ATSAnalysis = Field(default_factory=ATSAnalysis, description="ATS evaluation and scoring")
    parser_confidence: float = Field(default=1.0, description="Parser confidence score between 0.0 and 1.0")

    # Helper properties for backwards compatibility
    @property
    def candidate_name(self) -> str:
        return self.contact.name

    @property
    def email(self) -> str:
        return self.contact.email

    @property
    def phone(self) -> str:
        return self.contact.phone

    @property
    def location(self) -> str:
        return self.contact.location

    @property
    def linkedin_url(self) -> str:
        return self.contact.linkedin

    @property
    def github_url(self) -> str:
        return self.contact.github

    def to_dict(self) -> Dict[str, Any]:
        """Return clean dictionary representation matching the schema."""
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
    """Core Resume / CV extraction engine enforcing strict real-life factor weightage ATS scoring via Gemini AI."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")

    async def parse_resume(
        self, 
        file_bytes: bytes, 
        filename: str, 
        custom_instructions: Optional[str] = None,
        model_name: str = "gemini-flash-latest"
    ) -> ResumeParseResult:
        """Extract text from uploaded Resume/CV and parse into standardized ResumeParseResult schema using Gemini AI."""
        # Step 1: Extract document text
        resume_text = extract_text_from_document(file_bytes, filename)
        file_ext = os.path.splitext(filename)[1].lower().lstrip(".")
        now_iso = datetime.now().isoformat()
        
        api_key = self.api_key or os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("Gemini API key must be provided or set in the GEMINI_API_KEY environment variable.")

        client = genai.Client(api_key=api_key)
        
        # Step 2: Truncate text if excessively long
        max_chars = 30000
        truncated_text = resume_text[:max_chars] if len(resume_text) > max_chars else resume_text
        
        prompt_content = f"Filename: {filename}\nFile Type: {file_ext}\n\nResume Text Content:\n{truncated_text}"
        if custom_instructions and custom_instructions.strip():
            prompt_content += f"\n\nTarget Role / Custom Focus Instructions:\n{custom_instructions}"

        candidate_models = [model_name]
        for fallback in ["gemini-flash-latest", "gemini-3.6-flash", "gemini-2.0-flash", "gemini-3.5-flash"]:
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
                            "You are an expert HR resume parser and ATS talent scanner. "
                            "Parse the resume text into the requested strict JSON schema without omitting any fields. "
                            "Normalize all dates into ISO format (YYYY-MM or YYYY). "
                            "Group skills into programming_languages, frameworks_libraries, tools_platforms, domain_knowledge, soft_skills, and languages_spoken. "
                            "Place all contact details in the contact object. "
                            "Calculate the ats_analysis object strictly using REAL-LIFE FACTOR WEIGHTAGES:\n"
                            "1. keyword_skill_match_score (45% Weight): Exact hard skills, required tech stack, and industry terms.\n"
                            "2. formatting_compatibility_score (25% Weight): Clean machine-readable text layout and standard section headings without graphics.\n"
                            "3. content_impact_score (25% Weight): Quantified achievements, metrics, clear work history, and active bullet points.\n"
                            "4. structure_length_score (10% Weight): Logical section flow and appropriate length for experience level.\n"
                            "Set overall ats_score as the weighted average: (keyword_skill_match_score * 0.45) + (formatting_compatibility_score * 0.25) + (content_impact_score * 0.25) + (structure_length_score * 0.10).\n"
                            "Provide actionable strengths, issues, and suggestions.\n"
                            "If any field is unavailable in the resume text, use empty strings, empty lists, or 0. "
                            "Return strictly valid JSON with no markdown block or explanatory text."
                        ),
                        response_mime_type="application/json",
                        response_schema=ResumeParseResult,
                    ),
                )
                if response.text:
                    parsed_obj = ResumeParseResult.model_validate_json(response.text)
                    # Enrich metadata
                    parsed_obj.metadata.filename = filename
                    parsed_obj.metadata.file_type = file_ext
                    parsed_obj.metadata.character_count = len(resume_text)
                    parsed_obj.metadata.parsed_at = now_iso
                    return parsed_obj

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
