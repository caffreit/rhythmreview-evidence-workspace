#!/usr/bin/env python3
"""Build the verified Phase 1.5 walkthrough handoff PDF."""

from pathlib import Path

from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen.canvas import Canvas
from reportlab.platypus import Paragraph


ROOT = Path(__file__).resolve().parents[1]
SCREENSHOTS = ROOT / "tmp" / "pdfs"
OUTPUT = ROOT / "output" / "pdf" / "rhythmreview_phase_1_5_walkthrough.pdf"
PAGE_W, PAGE_H = 960, 540

NAVY = HexColor("#17324D")
INK = HexColor("#203449")
MUTED = HexColor("#647487")
PALE = HexColor("#F3F6F8")
GOLD = HexColor("#D7A83F")
CREAM = HexColor("#FFF8E8")
WHITE = HexColor("#FFFFFF")
RED = HexColor("#A94646")


def paragraph(canvas, text, x, y_top, width, font_size=12, leading=None,
              color=INK, bold=False, max_height=100):
    style = ParagraphStyle(
        "body",
        fontName="Helvetica-Bold" if bold else "Helvetica",
        fontSize=font_size,
        leading=leading or font_size * 1.28,
        textColor=color,
        alignment=TA_LEFT,
        spaceAfter=0,
    )
    flow = Paragraph(text, style)
    _, height = flow.wrap(width, max_height)
    flow.drawOn(canvas, x, y_top - height)
    return height


def page_frame(canvas, page_number, eyebrow, title, subtitle=None):
    canvas.setFillColor(WHITE)
    canvas.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    canvas.setFillColor(NAVY)
    canvas.rect(0, PAGE_H - 78, PAGE_W, 78, stroke=0, fill=1)
    canvas.setFillColor(GOLD)
    canvas.roundRect(36, PAGE_H - 51, 32, 32, 8, stroke=0, fill=1)
    canvas.setFillColor(NAVY)
    canvas.setFont("Helvetica-Bold", 15)
    canvas.drawCentredString(52, PAGE_H - 40, str(page_number))
    canvas.setFillColor(GOLD)
    canvas.setFont("Helvetica-Bold", 9)
    canvas.drawString(82, PAGE_H - 26, eyebrow.upper())
    canvas.setFillColor(WHITE)
    available = 650 if subtitle else 825
    title_size = 24
    while stringWidth(title, "Helvetica-Bold", title_size) > available and title_size > 18:
        title_size -= 1
    canvas.setFont("Helvetica-Bold", title_size)
    canvas.drawString(82, PAGE_H - 53, title)
    if subtitle:
        canvas.setFillColor(HexColor("#C9D5DF"))
        canvas.setFont("Helvetica", 9.5)
        canvas.drawRightString(PAGE_W - 34, PAGE_H - 48, subtitle)
    canvas.setStrokeColor(HexColor("#DDE4E9"))
    canvas.line(36, 29, PAGE_W - 36, 29)
    canvas.setFillColor(MUTED)
    canvas.setFont("Helvetica", 8.5)
    canvas.drawString(36, 15, "RhythmReview · Phase 1.5 guided demo · internal QA/RA review")
    canvas.drawRightString(PAGE_W - 36, 15, f"{page_number} / 8")


def screenshot(canvas, filename, x, y, width, height, label=None):
    path = SCREENSHOTS / filename
    if not path.exists():
        raise FileNotFoundError(path)
    canvas.setFillColor(HexColor("#DCE3E8"))
    canvas.roundRect(x - 4, y - 4, width + 8, height + 8, 8, stroke=0, fill=1)
    image = ImageReader(str(path))
    iw, ih = image.getSize()
    scale = max(width / iw, height / ih)
    sw, sh = iw * scale, ih * scale
    canvas.saveState()
    clip = canvas.beginPath()
    clip.roundRect(x, y, width, height, 5)
    canvas.clipPath(clip, stroke=0, fill=0)
    canvas.drawImage(image, x + (width - sw) / 2, y + (height - sh) / 2,
                     width=sw, height=sh, mask="auto")
    canvas.restoreState()
    if label:
        canvas.setFillColor(NAVY)
        canvas.roundRect(x + 10, y + height - 30, 122, 20, 10, stroke=0, fill=1)
        canvas.setFillColor(WHITE)
        canvas.setFont("Helvetica-Bold", 8)
        canvas.drawCentredString(x + 71, y + height - 23, label.upper())


def note_box(canvas, x, y, width, height, title, body, accent=GOLD):
    canvas.setFillColor(PALE)
    canvas.roundRect(x, y, width, height, 8, stroke=0, fill=1)
    canvas.setFillColor(accent)
    canvas.roundRect(x, y, 5, height, 2.5, stroke=0, fill=1)
    canvas.setFillColor(NAVY)
    canvas.setFont("Helvetica-Bold", 10)
    canvas.drawString(x + 17, y + height - 22, title.upper())
    paragraph(canvas, body, x + 17, y + height - 34, width - 32, 10.5,
              leading=13.4, max_height=height - 40)


def numbered_line(canvas, number, text, x, y, width, accent=GOLD):
    canvas.setFillColor(accent)
    canvas.circle(x + 10, y + 6, 10, stroke=0, fill=1)
    canvas.setFillColor(NAVY if accent == GOLD else WHITE)
    canvas.setFont("Helvetica-Bold", 9)
    canvas.drawCentredString(x + 10, y + 3, str(number))
    return paragraph(canvas, text, x + 28, y + 14, width - 28, 10.5,
                     leading=13.2, max_height=70)


def cover(canvas):
    canvas.setFillColor(NAVY)
    canvas.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    canvas.setFillColor(GOLD)
    canvas.roundRect(48, PAGE_H - 77, 42, 42, 10, stroke=0, fill=1)
    canvas.setFillColor(NAVY)
    canvas.setFont("Helvetica-Bold", 18)
    canvas.drawCentredString(69, PAGE_H - 62, "BB")
    canvas.setFillColor(GOLD)
    canvas.setFont("Helvetica-Bold", 11)
    canvas.drawString(108, PAGE_H - 50, "BLUE BRIDGE · INTERNAL QA/RA REVIEW")
    canvas.setFillColor(WHITE)
    canvas.setFont("Helvetica-Bold", 34)
    canvas.drawString(48, PAGE_H - 128, "RhythmReview guided demo")
    canvas.setFont("Helvetica", 18)
    canvas.setFillColor(HexColor("#CFD9E2"))
    canvas.drawString(48, PAGE_H - 159, "Phase 1.5 walkthrough and handoff pack")
    screenshot(canvas, "01-overview.png", 48, 78, 555, 312, "walkthrough step 1")
    canvas.setFillColor(WHITE)
    canvas.setFont("Helvetica-Bold", 15)
    canvas.drawString(636, 371, "Presentable for one purpose")
    paragraph(canvas,
              "A 10–12 minute internal review of workflow mechanics, human decision points, and immutable evidence history.",
              636, 349, 270, 12, leading=16, color=HexColor("#D7E0E7"), max_height=80)
    canvas.setFillColor(GOLD)
    canvas.roundRect(636, 248, 270, 70, 8, stroke=0, fill=1)
    canvas.setFillColor(NAVY)
    canvas.setFont("Helvetica-Bold", 11)
    canvas.drawString(654, 295, "PROTOTYPE BOUNDARY")
    paragraph(canvas,
              "Fictional data. Decision support only. Simulated roles are not electronic signatures.",
              654, 282, 236, 10.5, leading=13.5, color=NAVY, max_height=48)
    canvas.setFillColor(HexColor("#AFC0CE"))
    canvas.setFont("Helvetica", 9)
    canvas.drawString(636, 198, "Use the persistent “Start guided walkthrough” control.")
    canvas.drawString(636, 181, "The tour never performs a controlled action silently.")
    canvas.drawString(636, 164, "Reset the workspace before every presentation.")
    canvas.setFillColor(HexColor("#AFC0CE"))
    canvas.setFont("Helvetica", 8.5)
    canvas.drawString(48, 35, "Prepared 8 September 2026 · RR-1.0 starting baseline")
    canvas.drawRightString(PAGE_W - 48, 35, "1 / 8")


def build():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    canvas = Canvas(str(OUTPUT), pagesize=(PAGE_W, PAGE_H), pageCompression=1)
    canvas.setTitle("RhythmReview Phase 1.5 guided walkthrough")
    canvas.setAuthor("Blue Bridge")

    cover(canvas)
    canvas.showPage()

    page_frame(canvas, 2, "Steps 2–3", "Checks and evidence direction", "2 minutes")
    screenshot(canvas, "02-findings.png", 36, 104, 565, 318, "walkthrough step 2")
    note_box(canvas, 628, 315, 296, 107, "Say this",
             "Three findings are deterministic rules. Three are evaluation fixtures. Do not combine them into a compliance score.")
    numbered_line(canvas, 2, "Point to the two groups and explain why their provenance is visibly different.", 628, 265, 290)
    numbered_line(canvas, 3, "Open REQ-004 next. Relationship labels report stored source and target direction only.", 628, 205, 290)
    note_box(canvas, 628, 104, 296, 72, "QA/RA question",
             "Which controlled dependency meanings should each relationship type carry?", accent=RED)
    canvas.showPage()

    page_frame(canvas, 3, "Steps 3–4", "Direction and immutable snapshots", "2 minutes")
    screenshot(canvas, "03-relationships.png", 36, 214, 432, 243, "walkthrough step 3")
    screenshot(canvas, "04-documents.png", 492, 214, 432, 243, "walkthrough step 4")
    note_box(canvas, 36, 74, 432, 108, "Incoming / outgoing",
             "Incoming means the current item is the stored target. Outgoing means it is the stored source. Neither label claims upstream or downstream dependency semantics.")
    note_box(canvas, 492, 74, 432, 108, "Snapshot proof",
             "Show baseline ID, snapshot ID, source versions, and approver. These are abbreviated controlled views, not submission-ready documents.")
    canvas.showPage()

    page_frame(canvas, 4, "Steps 5–7", "Create the timing replay", "2 minutes")
    screenshot(canvas, "05-timing-scenario.png", 36, 105, 570, 321, "walkthrough step 5")
    numbered_line(canvas, 5, "Create the human-authored proposal: extend the controlled result time from 30 to 60 seconds.", 630, 380, 292)
    numbered_line(canvas, 6, "Load replay data. Compare deterministic graph paths with unlinked semantic candidates.", 630, 307, 292)
    numbered_line(canvas, 7, "Switch to Jamie Chen. The role change remains an explicit presenter action.", 630, 244, 292)
    note_box(canvas, 630, 105, 294, 103, "Replay boundary",
             "Fixtures demonstrate workflow mechanics. They are not live model output and cannot approve, waive, or create controlled content.")
    canvas.showPage()

    page_frame(canvas, 5, "Steps 8–12", "Make and retain human decisions", "3 minutes")
    screenshot(canvas, "06-candidate-checks.png", 36, 104, 565, 318, "walkthrough step 12")
    numbered_line(canvas, 8, "Accept REQ-004.", 630, 401, 285)
    numbered_line(canvas, 9, "Reject TEST-007, then revise it to accepted. Open audit history to show both decisions.", 630, 358, 285)
    numbered_line(canvas, 10, "Edit UN-004 from review to update.", 630, 288, 285)
    numbered_line(canvas, 11, "Use the guided helper only after those examples. It fills pending decisions with explicit fixture provenance.", 630, 241, 285)
    numbered_line(canvas, 12, "Switch to the author, edit a candidate, and rerun the projected candidate checks.", 630, 167, 285)
    canvas.showPage()

    page_frame(canvas, 6, "Steps 13–14", "Approve, audit, and compare", "2 minutes")
    screenshot(canvas, "07-approval.png", 36, 220, 432, 243, "walkthrough step 13")
    screenshot(canvas, "08-baseline-history.png", 492, 220, 432, 243, "walkthrough step 14")
    numbered_line(canvas, 13, "Submit as the author, switch to QA, then approve RR-1.1 as a separate human decision.", 36, 155, 432)
    numbered_line(canvas, 14, "Expand an audit event, then select RR-1.0 to prove the earlier immutable snapshot is retained.", 492, 155, 432)
    note_box(canvas, 36, 70, 888, 58, "Reset after the comparison",
             "Choose Reset workspace. The demonstration change is removed and RR-1.0 becomes current again.")
    canvas.showPage()

    page_frame(canvas, 7, "Appendix", "Evaluation is not performance evidence", "Keep outside the main tour")
    screenshot(canvas, "09-evaluation.png", 36, 104, 570, 321, "evaluation appendix")
    note_box(canvas, 630, 319, 294, 107, "Use with caution",
             "Replay suggestions were authored from the same provisional answer key used for scoring. This can show calculation mechanics only.", accent=RED)
    paragraph(canvas, "Open answer-key review", 630, 286, 294, 13, bold=True, color=NAVY)
    numbered_line(canvas, "?", "CLM-003 is absent from scenario 2.", 630, 246, 290, accent=RED)
    numbered_line(canvas, "?", "LBL-004 is absent from scenario 3.", 630, 202, 290, accent=RED)
    numbered_line(canvas, "?", "REQ-001 has a questionable expected action.", 630, 158, 290, accent=RED)
    paragraph(canvas, "Independent QA/RA review is required before any performance claim.",
              630, 112, 290, 9.5, leading=12, color=RED, bold=True)
    canvas.showPage()

    page_frame(canvas, 8, "Handoff", "Reset, review, then begin Phase 2", "Decision checklist")
    canvas.setFillColor(PALE)
    canvas.roundRect(36, 88, 410, 364, 10, stroke=0, fill=1)
    paragraph(canvas, "Before handing over", 58, 425, 360, 17, bold=True, color=NAVY)
    numbered_line(canvas, 1, "Reset the workspace and confirm RR-1.0 is current.", 58, 375, 350)
    numbered_line(canvas, 2, "Rehearse the 15-step path at presentation size.", 58, 320, 350)
    numbered_line(canvas, 3, "State the prototype and replay boundaries before showing findings.", 58, 265, 350)
    numbered_line(canvas, 4, "Keep evaluation in the appendix until the answer key is independently reviewed.", 58, 200, 350)
    numbered_line(canvas, 5, "Record QA/RA decisions on relationship semantics and answer-key questions.", 58, 135, 350)

    paragraph(canvas, "Phase 2 roadmap", 490, 425, 414, 17, bold=True, color=NAVY)
    roadmap = [
        ("01", "Traceability coverage matrix"),
        ("02", "Risk workflow"),
        ("03", "Verification workflow"),
        ("04", "Release readiness"),
        ("05", "Relationship editing"),
    ]
    y = 380
    for code, title in roadmap:
        canvas.setFillColor(GOLD)
        canvas.roundRect(490, y - 8, 42, 30, 7, stroke=0, fill=1)
        canvas.setFillColor(NAVY)
        canvas.setFont("Helvetica-Bold", 10)
        canvas.drawCentredString(511, y + 2, code)
        canvas.setFillColor(INK)
        canvas.setFont("Helvetica-Bold", 12)
        canvas.drawString(548, y + 1, title)
        y -= 53
    note_box(canvas, 490, 88, 414, 58, "After Phase 2",
             "Add a fixture-backed Jira adapter. Live Jira remains outside Phase 1.5.")

    canvas.save()
    print(OUTPUT)


if __name__ == "__main__":
    build()
