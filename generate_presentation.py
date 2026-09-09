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
            "subtitle": "Challenges Job Seekers & Hiring Teams Face Today",
            "points": [
                "Flawed Keyword Screening: Traditional ATS portals reject qualified talent simply because exact keyword strings are missing from their resumes.",
                "Unverified Candidate Claims: Static PDF resumes fail to reflect actual coding ability, commit frequency, or real engineering impact.",
                "Lack of Actionable Career Guidance: Rejected applicants receive zero feedback on missing skills or how to bridge gaps for target roles."
            ]
        },
        {
            "type": "content",
            "title": "2. The Solution: CareerPilot AI",
            "subtitle": "Empowering Job Seekers & Recruiters with Intelligence",
            "points": [
                "Contextual Semantic Matching: Evaluates candidate experience based on conceptual skill meaning rather than primitive word matching.",
                "Verified Code Quantification: Connects directly to GitHub to calculate objective developer performance scores from real code activity.",
                "Personalized Growth Roadmaps: Automatically detects candidate skill gaps for any role and constructs step-by-step learning blueprints."
            ]
        },
        {
            "type": "content",
            "title": "3. System Architecture",
            "subtitle": "High-Level Data Flow & Modular Platform Structure",
            "points": [
                "Data Capture: Accepts PDF/Word resumes, GitHub profile links, and live web job postings.",
                "AI Processing Layer: Normalizes skill terms, parses candidate content, and calculates ATS readability & impact metrics.",
                "Vector Search Core: Matches candidate vectors against industry job datasets using high-performance similarity search.",
                "User Interface: Renders interactive dashboards, ATS score breakdowns, and milestone roadmaps."
            ]
        },
        {
            "type": "screenshot",
            "title": "4. Glassmorphic User Dashboard",
            "subtitle": "Feature Highlight 1: Unified Dark-Mode Command Center",
            "points": [
                "Central Command Hub: Allows candidates to manage their profile, view target roles, track scores, and explore roadmaps in one place.",
                "Real-Time Stats Display: Instantly highlights overall ATS compatibility, portfolio strength, and recommended next steps.",
                "Fluid User Experience: Features modern glassmorphism visuals designed for effortless navigation and clarity."
            ],
            "placeholders": [
                "[ 🖼️ INSERT SCREENSHOT HERE: Main Dashboard Homepage (http://localhost:5173/) ]"
            ]
        },
        {
            "type": "multi_screenshot",
            "title": "5. GitHub Portfolio Analyzer",
            "subtitle": "Feature Highlight 2: Code Verification & Technical Scoring (3 Screenshot Slots)",
            "points": [
                "Live Code Analysis: Analyzes public repositories, commit velocity, code syntax, and star counts directly from GitHub.",
                "Objective Developer Score: Converts real activity into a verified Technical Portfolio Score (0-100%).",
                "Stack Breakdown: Displays clear visual charts of language distribution (Frontend, Backend, AI, DevOps)."
            ],
            "placeholders": [
                "[ 🖼️ Image Slot 1: GitHub Profile Analysis & Developer Score ]",
                "[ 🖼️ Image Slot 2: Repository Metrics & Commit Velocity Chart ]",
                "[ 🖼️ Image Slot 3: Tech Stack Breakdown & Language Distribution ]"
            ]
        },
        {
            "type": "screenshot",
            "title": "6. Resume Parsing & ATS Diagnostic Suite",
            "subtitle": "Feature Highlight 3: Document Upload, Readability Check & Compatibility Scoring",
            "points": [
                "Seamless Upload & Extraction: Accepts PDF, Word, or text CVs and extracts structured experience, skills, and contact details.",
                "Formatting & Readability Inspection: Verifies optimal word count (100-1000 words), bullet point density, and machine parseability.",
                "Weighted ATS Compatibility Score: Computes an overall 0-100% score (45% Skills, 25% Impact, 25% Readability, 10% Structure) and provides a checkbox task list to fix issues."
            ],
            "placeholders": [
                "[ 🖼️ INSERT SCREENSHOT HERE: Resume Upload, ATS Score Gauge & Formatting Checklist ]"
            ]
        },
        {
            "type": "screenshot",
            "title": "7. Intelligent Vector Search Job Matching",
            "subtitle": "Feature Highlight 4: Contextual Career Role Recommendations",
            "points": [
                "Contextual Understanding: Evaluates candidates against job openings based on underlying meaning rather than strict word matches.",
                "Sub-Millisecond Matches: Instantly computes similarity match percentages (e.g. 88% Match) across thousands of roles.",
                "Interactive Job Explorer: Allows users to click on any job listing to view detailed requirements and instant skill gap comparisons."
            ],
            "placeholders": [
                "[ 🖼️ INSERT SCREENSHOT HERE: Job Matching Cards & Similarity Percentage Badges ]"
            ]
        },
        {
            "type": "screenshot",
            "title": "8. Kaggle AI Job Dataset Ingestion",
            "subtitle": "Feature Highlight 5: Real-World Industry Benchmarks",
            "points": [
                "Massive Data Catalog: Ingests thousands of active engineering job postings to provide real-world industry benchmarks.",
                "Skill Demand Insights: Shows candidates what skills are currently trending and most requested in their field.",
                "Market Salary Standards: Helps candidates align their career expectations with current industry standards."
            ],
            "placeholders": [
                "[ 🖼️ INSERT SCREENSHOT HERE: Kaggle AI Dataset Search & Industry Role Benchmarks ]"
            ]
        },
        {
            "type": "screenshot",
            "title": "9. Dynamic AI Roadmap Generator",
            "subtitle": "Feature Highlight 6: Personalized Step-by-Step Learning Plans",
            "points": [
                "Automated Skill Gap Detection: Compares current candidate capabilities against target job requirements to identify missing skills.",
                "Structured Milestones: Builds a phased learning blueprint (Foundations, Advanced Tools, Hands-On Projects).",
                "Actionable Guidance: Provides estimated completion timeframes and curated resources for every milestone."
            ],
            "placeholders": [
                "[ 🖼️ INSERT SCREENSHOT HERE: AI Roadmap Modal & Phased Milestone Progression ]"
            ]
        },
        {
            "type": "content",
            "title": "10. Playwright Scraping Microservice",
            "subtitle": "Feature Highlight 7: Autonomous Web Data Extraction (No Image Slot)",
            "points": [
                "Live Job Extraction: Automatically crawls job listings and career portals to pull full job descriptions and requirement details.",
                "Dual Scraping Modes: Supports fast automated browser extraction as well as AI-assisted page parsing.",
                "Multi-Format Data Export: Enables candidates and recruiters to download extracted job data in JSON, CSV, Text, Markdown, or Terraform format."
            ]
        },
        {
            "type": "content",
            "title": "11. IBM Bob Skill Normalization & Verification",
            "subtitle": "Feature Highlight 8: Standardized Skill Taxonomy & Anti-Inflation Agent",
            "points": [
                "Skill Standardization: Translates non-standard resume phrasing into unified skill terms for precise matching.",
                "Candidate Claim Verification: Cross-checks resume experience bullets against actual GitHub repository commits to eliminate resume inflation.",
                "Unbiased Career Guidance: Enforces fair evaluation standards across all candidate assessments and AI roadmaps."
            ]
        },
        {
            "type": "content",
            "title": "12. Robust Database & Data Modeling",
            "subtitle": "Structured Organization for User Profiles & Vector Search",
            "points": [
                "User Profile Records: Securely stores profile info, skill inventories, and target career goals.",
                "Resume & Diagnostic Logs: Manages raw text, structured extraction JSON, formatting flags, and historical ATS scores.",
                "Job & Vector Storage: Indexes high-dimensional vector representations for instant role matching queries."
            ]
        },
        {
            "type": "content",
            "title": "13. Containerized Deployment & Orchestration",
            "subtitle": "Reliable & Scalable Production Architecture",
            "points": [
                "One-Click Environment Setup: Orchestrates the database, backend services, and scraping engines via Docker Compose.",
                "Isolated Service Operations: Ensures web scraping, API handling, and frontend rendering operate smoothly without bottlenecking.",
                "Production-Ready Performance: Guarantees high availability and fast response times for concurrent users."
            ]
        },
        {
            "type": "content",
            "title": "14. Conclusion & Future Roadmap",
            "subtitle": "Transforming Career Growth with AI Intelligence",
            "points": [
                "Empowering Job Seekers: Replaces guesswork with clear ATS feedback, verified portfolio scores, and actionable learning roadmaps.",
                "Streamlining Recruitment: Helps hiring teams identify genuine engineering talent faster through verified code metrics.",
                "Upcoming Capabilities: Expanding into interactive AI mock interviews and automated resume customization per job posting."
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

            # Right side: Single Screenshot Placeholder box
            card_right = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.3), Inches(1.8), Inches(6.2), Inches(5.0))
            card_right.fill.solid()
            card_right.fill.fore_color.rgb = RGBColor(24, 32, 47)
            card_right.line.color.rgb = COLOR_PURPLE
            card_right.line.width = Pt(2)

            ptb = slide.shapes.add_textbox(Inches(6.5), Inches(3.6), Inches(5.8), Inches(1.8))
            ptf = ptb.text_frame
            ptf.word_wrap = True
            pp = ptf.paragraphs[0]
            pp.text = data["placeholders"][0]
            pp.font.name = "Arial"
            pp.font.size = Pt(15)
            pp.font.bold = True
            pp.font.color.rgb = COLOR_PURPLE
            pp.alignment = PP_ALIGN.CENTER

        elif data["type"] == "multi_screenshot":
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

            # Right side: 3 Stacked Screenshot Placeholder boxes
            box_height = 1.5
            gap = 0.25
            top_start = 1.8

            for s_idx, placeholder_text in enumerate(data["placeholders"]):
                c_top = top_start + s_idx * (box_height + gap)
                card_slot = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.3), Inches(c_top), Inches(6.2), Inches(box_height))
                card_slot.fill.solid()
                card_slot.fill.fore_color.rgb = RGBColor(24, 32, 47)
                card_slot.line.color.rgb = COLOR_ACCENT if s_idx == 0 else (COLOR_PURPLE if s_idx == 1 else COLOR_GREEN)
                card_slot.line.width = Pt(2)

                s_tb = slide.shapes.add_textbox(Inches(6.4), Inches(c_top + 0.4), Inches(6.0), Inches(0.8))
                s_tf = s_tb.text_frame
                s_tf.word_wrap = True
                s_p = s_tf.paragraphs[0]
                s_p.text = placeholder_text
                s_p.font.name = "Arial"
                s_p.font.size = Pt(13)
                s_p.font.bold = True
                s_p.font.color.rgb = COLOR_ACCENT if s_idx == 0 else (COLOR_PURPLE if s_idx == 1 else COLOR_GREEN)
                s_p.alignment = PP_ALIGN.CENTER

    output_path = r"C:\Users\saisu\.gemini\antigravity-ide\scratch\Team-Placebo\CareerPilot_AI_Presentation.pptx"
    prs.save(output_path)
    print(f"Presentation updated successfully at {output_path}")

if __name__ == "__main__":
    create_presentation()
