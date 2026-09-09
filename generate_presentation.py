import sys
import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

def create_presentation():
    prs = Presentation()
    # 16:9 widescreen layout
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)

    # Color Palette (Dark Cyberpunk / Glassmorphic Aesthetic)
    COLOR_BG = RGBColor(15, 23, 42)       # Slate 900
    COLOR_CARD = RGBColor(30, 41, 59)     # Slate 800
    COLOR_TEXT = RGBColor(241, 245, 249)  # Slate 100
    COLOR_MUTED = RGBColor(148, 163, 184)# Slate 400
    COLOR_ACCENT = RGBColor(59, 130, 246) # Blue 500
    COLOR_PURPLE = RGBColor(168, 85, 247) # Purple 500
    COLOR_GREEN = RGBColor(16, 185, 129)  # Emerald 500
    COLOR_BORDER = RGBColor(71, 85, 105)  # Slate 600

    blank_layout = prs.slide_layouts[6]

    slides_data = [
        {
            "type": "title",
            "title": "CareerPilot AI",
            "subtitle": "AI-Powered Career Intelligence & Vector Search Recruitment Engine\nPresented by Team Placebo",
            "footer": "Confidential • Project Presentation 2026"
        },
        {
            "type": "content",
            "title": "1. Problem Statement",
            "subtitle": "The Limitations of Traditional Recruitment & Job Search",
            "points": [
                "Rigid Keyword Matching: Traditional ATS screeners reject candidates based on exact string matches, ignoring real technical capability.",
                "Static Resumes vs Dynamic Portfolios: PDF resumes fail to reflect actual coding output, commit frequency, or open-source impact.",
                "Unclear Skill Progression: Job seekers lack personalized, data-driven roadmaps to bridge their specific skill gaps."
            ]
        },
        {
            "type": "content",
            "title": "2. The Solution: CareerPilot AI",
            "subtitle": "An End-to-End AI & Vector-Search Career Acceleration Ecosystem",
            "points": [
                "Semantic Vector Matching: High-dimensional embeddings with PostgreSQL pgvector to match context, not just keywords.",
                "Automated GitHub Portfolio Analysis: Direct integration with GitHub API to compute real technical capability scores.",
                "Dynamic AI Roadmap Engine: Tailored step-by-step milestones to bridge candidate skill gaps for target roles."
            ]
        },
        {
            "type": "content",
            "title": "3. System Architecture",
            "subtitle": "Modern Full-Stack Microservice Ecosystem",
            "points": [
                "Frontend: React 18 + Vite + TypeScript + Tailwind CSS (Dark Glassmorphic UI)",
                "Backend API: Node.js + Express + TypeScript + Prisma ORM",
                "Database: PostgreSQL 16 + pgvector (HNSW Indexing for vector search)",
                "Microservice: Python 3.11 + Playwright Async Browser Scraper + Streamlit Dashboard"
            ]
        },
        {
            "type": "screenshot",
            "title": "4. Modern Glassmorphic Dashboard",
            "subtitle": "Feature Highlight 1: Unified Dark Mode Interface",
            "points": [
                "Cyberpunk-inspired glassmorphism with high-contrast UI tokens.",
                "Live navigation across Portfolio, ATS Scoring, Role Analysis, and AI Roadmaps.",
                "Responsive dashboard layouts optimized for all display sizes."
            ],
            "placeholder": "[ 🖼️ INSERT SCREENSHOT HERE: Main Dashboard Homepage (http://localhost:5173/) ]"
        },
        {
            "type": "screenshot",
            "title": "5. GitHub Portfolio Analyzer",
            "subtitle": "Feature Highlight 2: Real-World Code Quantification",
            "points": [
                "Extracts public repositories, commit velocity, languages, and star counts.",
                "Calculates objective Technical Portfolio Score (0-100%).",
                "Provides stack distribution breakdown (Frontend, Backend, DevOps, AI)."
            ],
            "placeholder": "[ 🖼️ INSERT SCREENSHOT HERE: GitHub Portfolio Analyzer Dashboard ]"
        },
        {
            "type": "screenshot",
            "title": "6. Resume Upload & Extraction Engine",
            "subtitle": "Feature Highlight 3: AI Document Parsing",
            "points": [
                "Supports PDF, DOCX, and TXT resume file uploads.",
                "Extracts structured JSON schema using Google Gemini AI.",
                "Categorizes skills, work experiences, education, and impact statements."
            ],
            "placeholder": "[ 🖼️ INSERT SCREENSHOT HERE: Resume Upload & Structured JSON View ]"
        },
        {
            "type": "screenshot",
            "title": "7. Automated ATS Compatibility Scoring",
            "subtitle": "Feature Highlight 4: Real-Life Recruiter Weightage Engine",
            "points": [
                "45% Keyword & Skill Density Match",
                "25% Measurable Experience Impact",
                "25% Readability & Machine-Parseability",
                "10% Document Structure & Completeness"
            ],
            "placeholder": "[ 🖼️ INSERT SCREENSHOT HERE: ATS Score Gauge & Point Breakdown Chart ]"
        },
        {
            "type": "screenshot",
            "title": "8. Formatting Diagnostics & Readability Check",
            "subtitle": "Feature Highlight 5: Automated Document Inspection",
            "points": [
                "Length Verification: Ensures optimal word count range (100 - 1000 words).",
                "Bullet Density Analysis: Requires standard ATS bullet structures.",
                "Generates interactive To-Do checklist for instant candidate formatting fixes."
            ],
            "placeholder": "[ 🖼️ INSERT SCREENSHOT HERE: Formatting Diagnostics & Issue Checklist ]"
        },
        {
            "type": "screenshot",
            "title": "9. Vector Search Job Matching (pgvector)",
            "subtitle": "Feature Highlight 6: Cosine Similarity Matching",
            "points": [
                "Embeds target job requirements and candidate profiles into 384-dim vector space.",
                "HNSW Indexing provides sub-millisecond similarity search.",
                "Displays real-time similarity match percentages (e.g. 88% Match)."
            ],
            "placeholder": "[ 🖼️ INSERT SCREENSHOT HERE: Role Analysis & Cosine Similarity Match Cards ]"
        },
        {
            "type": "screenshot",
            "title": "10. Kaggle AI Dataset Benchmark",
            "subtitle": "Feature Highlight 7: Industry Job Ingestion",
            "points": [
                "Ingests thousands of real AI & software engineering job postings.",
                "Automatic embedding generation using Xenova/Sentence-Transformers.",
                "Provides market benchmarks for salary, skills demand, and role requirements."
            ],
            "placeholder": "[ 🖼️ INSERT SCREENSHOT HERE: Kaggle AI Dataset Search & Benchmarks ]"
        },
        {
            "type": "screenshot",
            "title": "11. Dynamic AI Roadmap Generator",
            "subtitle": "Feature Highlight 8: Personalised Career Blueprints",
            "points": [
                "Performs automated skill gap analysis against candidate profiles.",
                "Generates step-by-step milestones (Foundations, Advanced Tools, Real-World Projects).",
                "Includes estimated completion timeframes and recommended learning resources."
            ],
            "placeholder": "[ 🖼️ INSERT SCREENSHOT HERE: AI Roadmap Modal & Milestone Progression ]"
        },
        {
            "type": "screenshot",
            "title": "12. Playwright Scraping Microservice",
            "subtitle": "Feature Highlight 9: Async Scraping Dashboard",
            "points": [
                "Autonomous Python microservice with Streamlit UI (http://localhost:8501).",
                "Dual-mode: Direct Playwright browser scraping & Gemini Agentic scraping.",
                "Multi-format export: JSON, CSV, Markdown, Text, and Terraform (.tf)."
            ],
            "placeholder": "[ 🖼️ INSERT SCREENSHOT HERE: Streamlit Web & Resume Scraping Dashboard ]"
        },
        {
            "type": "content",
            "title": "13. Database Schema & Prisma ORM",
            "subtitle": "Robust Data Modeling for High-Performance Queries",
            "points": [
                "User & Profile Schemas: Stores core details, career goals, and skills inventory.",
                "Resume & ATS Schemas: Stores raw text, parsed JSON chunks, and score breakdowns.",
                "Job & Vector Embeddings: Utilizes PostgreSQL vector type with HNSW index for lightning fast queries."
            ]
        },
        {
            "type": "content",
            "title": "14. Containerization & Deployment",
            "subtitle": "Docker Compose Microservice Orchestration",
            "points": [
                "PostgreSQL Container: pgvector/pgvector:pg16 running on port 5432.",
                "Web Scraper Container: Containerized Python 3.11 + Playwright environment on port 8501.",
                "Express & Vite Services: Zero-downtime development and production build pipeline."
            ]
        },
        {
            "type": "content",
            "title": "15. Conclusion & Future Roadmap",
            "subtitle": "CareerPilot AI — Next Steps & Impact",
            "points": [
                "Impact: Empowers job seekers with data-driven clarity and ATS compatibility.",
                "Upcoming Features: Real-time mock interview simulator, auto-tailored cover letter generator, and live recruiter connection portal.",
                "Thank You! All source code available at Team-Placebo repository."
            ]
        }
    ]

    for index, data in enumerate(slides_data):
        slide = prs.slides.add_slide(blank_layout)

        # Background fill
        bg_shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(7.5))
        bg_shape.fill.solid()
        bg_shape.fill.fore_color.rgb = COLOR_BG
        bg_shape.line.color.rgb = COLOR_BG

        # Top Accent Line
        top_line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(0.1))
        top_line.fill.solid()
        top_line.fill.fore_color.rgb = COLOR_ACCENT
        top_line.line.color.rgb = COLOR_ACCENT

        if data["type"] == "title":
            # Title slide layout
            tb = slide.shapes.add_textbox(Inches(1.0), Inches(2.2), Inches(11.333), Inches(3.5))
            tf = tb.text_frame
            tf.word_wrap = True

            p1 = tf.paragraphs[0]
            p1.text = data["title"]
            p1.font.name = "Arial"
            p1.font.size = Pt(48)
            p1.font.bold = True
            p1.font.color.rgb = COLOR_TEXT
            p1.alignment = PP_ALIGN.LEFT

            p2 = tf.add_paragraph()
            p2.text = data["subtitle"]
            p2.font.name = "Arial"
            p2.font.size = Pt(22)
            p2.font.color.rgb = COLOR_MUTED
            p2.space_before = Pt(20)

            # Footer
            ftb = slide.shapes.add_textbox(Inches(1.0), Inches(6.5), Inches(11.333), Inches(0.5))
            ftf = ftb.text_frame
            fp = ftf.paragraphs[0]
            fp.text = data["footer"]
            fp.font.size = Pt(12)
            fp.font.color.rgb = COLOR_MUTED

        elif data["type"] == "content":
            # Title
            tb = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.733), Inches(1.2))
            tf = tb.text_frame
            tf.word_wrap = True

            p1 = tf.paragraphs[0]
            p1.text = data["title"]
            p1.font.name = "Arial"
            p1.font.size = Pt(32)
            p1.font.bold = True
            p1.font.color.rgb = COLOR_TEXT

            p2 = tf.add_paragraph()
            p2.text = data["subtitle"]
            p2.font.name = "Arial"
            p2.font.size = Pt(16)
            p2.font.color.rgb = COLOR_MUTED
            p2.space_before = Pt(6)

            # Content Card
            card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.8), Inches(11.733), Inches(5.0))
            card.fill.solid()
            card.fill.fore_color.rgb = COLOR_CARD
            card.line.color.rgb = COLOR_BORDER

            ctb = slide.shapes.add_textbox(Inches(1.2), Inches(2.2), Inches(10.933), Inches(4.2))
            ctf = ctb.text_frame
            ctf.word_wrap = True

            for idx, pt in enumerate(data["points"]):
                p = ctf.paragraphs[0] if idx == 0 else ctf.add_paragraph()
                p.text = f"• {pt}"
                p.font.name = "Arial"
                p.font.size = Pt(18)
                p.font.color.rgb = COLOR_TEXT
                p.space_after = Pt(20)

        elif data["type"] == "screenshot":
            # Title
            tb = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.733), Inches(1.2))
            tf = tb.text_frame
            tf.word_wrap = True

            p1 = tf.paragraphs[0]
            p1.text = data["title"]
            p1.font.name = "Arial"
            p1.font.size = Pt(28)
            p1.font.bold = True
            p1.font.color.rgb = COLOR_TEXT

            p2 = tf.add_paragraph()
            p2.text = data["subtitle"]
            p2.font.name = "Arial"
            p2.font.size = Pt(15)
            p2.font.color.rgb = COLOR_MUTED
            p2.space_before = Pt(4)

            # Left side: Points card
            card_left = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.8), Inches(5.2), Inches(5.0))
            card_left.fill.solid()
            card_left.fill.fore_color.rgb = COLOR_CARD
            card_left.line.color.rgb = COLOR_BORDER

            ctb = slide.shapes.add_textbox(Inches(1.0), Inches(2.0), Inches(4.8), Inches(4.6))
            ctf = ctb.text_frame
            ctf.word_wrap = True

            for idx, pt in enumerate(data["points"]):
                p = ctf.paragraphs[0] if idx == 0 else ctf.add_paragraph()
                p.text = f"• {pt}"
                p.font.name = "Arial"
                p.font.size = Pt(15)
                p.font.color.rgb = COLOR_TEXT
                p.space_after = Pt(14)

            # Right side: Screenshot Placeholder box
            card_right = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.3), Inches(1.8), Inches(6.2), Inches(5.0))
            card_right.fill.solid()
            card_right.fill.fore_color.rgb = RGBColor(24, 32, 47)
            card_right.line.color.rgb = COLOR_PURPLE
            card_right.line.width = Pt(2)

            ptb = slide.shapes.add_textbox(Inches(6.5), Inches(3.6), Inches(5.8), Inches(1.8))
            ptf = ptb.text_frame
            ptf.word_wrap = True
            pp = ptf.paragraphs[0]
            pp.text = data["placeholder"]
            pp.font.name = "Arial"
            pp.font.size = Pt(15)
            pp.font.bold = True
            pp.font.color.rgb = COLOR_PURPLE
            pp.alignment = PP_ALIGN.CENTER

    output_path = r"C:\Users\saisu\.gemini\antigravity-ide\scratch\Team-Placebo\CareerPilot_AI_Presentation.pptx"
    prs.save(output_path)
    print(f"Presentation saved successfully at {output_path}")

if __name__ == "__main__":
    create_presentation()
