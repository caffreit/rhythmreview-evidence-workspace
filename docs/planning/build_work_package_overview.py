"""Build a concise companion to the feature map. Run from any directory."""

from html import escape
from html.parser import HTMLParser
import json
from pathlib import Path
import sys

sys.dont_write_bytecode = True
from work_package_task_views import build_task_views, TASK_STYLE, TASK_SCRIPT

DOCS = Path(__file__).resolve().parents[1]

# Editorial summaries. Package identities and pilot effort are checked against
# the source documents so a source change cannot silently drop a package.
PACKAGES = [
    ("P0", "Agree the foundations", "Agree where controlled records live, how versions and links work, who reviews them, and how accepted outputs move between tools. Establish the common record and processing rules used by the first workflow.", "Set up a project, follow a record to its source and review decision, then save or exchange the accepted version."),
    ("P1", "Turn source material into reviewed requirements", "Start with a transcript or text source. Clarify questions, draft needs with source citations, then derive requirements from reviewed needs and relevant context. Check and revise drafts, independently inspect the evidence, and record human decisions on the records and their links.", "Capture a discussion, resolve ambiguity, review needs and requirements, and save accepted records with their supporting evidence."),
    ("P2", "Understand and coordinate change", "Show how existing records relate and what a proposed change may affect. Explain known impacts, expose gaps, and use independent review to look beyond recorded links. Give follow-up work an owner and a recorded outcome.", "Review a threshold change, identify requirements, controls, tests and labels to revisit, then assign updates and retesting."),
    ("P3", "Connect requirements to implementation and tests", "Connect requirements and design to exact work items, code, builds, test plans and test results. Reviewers can distinguish current support from failed or outdated evidence. Manual references can start the workflow; checks in pull requests and automated capture can follow.", "Follow a requirement through design and implementation to the relevant test execution and its reviewed result."),
    ("P4", "Produce documents from an agreed evidence version", "Review an exact set of evidence versions, called a baseline, and produce identifiable specifications, reports or packages. Outputs retain their evidence and template versions. Label authoring and release or transfer support are further increments with additional evidence needs.", "Agree the evidence baseline, generate a selected document, review it, and explain what changed in the next version."),
    ("P-IN", "Connect the tools people already use", "Add selected adapters for chat, meetings, work trackers, repositories or CI. Deliver each separately to reduce manual copying while preserving source identity, versions and the downstream review path.", "Capture material or engineering evidence from a chosen system and route it into the relevant review workflow."),
    ("P-R", "Review risk and control evidence", "Support risk records and connect controls to requirements and test evidence. Help reviewers reconsider the risk decision when a control or its supporting evidence changes.", "Change a control, inspect the affected requirements and tests, and reconsider the risk decision."),
    ("P-U", "Connect user tasks, UI and usability evidence", "Link user tasks to UI requirements, use-related risks and evaluation results. Support the selected usability workflow, with more dedicated study and coverage support added as needed.", "Follow a critical user task through its UI requirements and risks to the relevant usability evaluation outcome."),
    ("P-V", "Explain the evidence for needs and claims", "Connect each selected need or claim to evaluation plans, results, limitations and decisions for the evaluated product configuration. Extend the workflow to further study types as required.", "Review whether the evaluated product meets a need or supports a claim, and record the evidence and its limits."),
    ("P-M", "Keep model and dataset evidence aligned", "Where the product uses machine learning, connect exact model and data versions to implementation, performance, risk and evaluation evidence. Make version mismatches visible.", "Review a model or dataset change and check that the build and performance evidence refer to the same versions."),
    ("P-L", "Improve the method using real corrections", "Capture corrections and their reasons from the first workflow. Investigate failures, evaluate proposed changes to prompts or working methods against both failure and correct cases, and adopt reviewed improvements.", "Record a reviewer correction, investigate its cause, test a method change, then decide whether to adopt it."),
]


class PackageReader(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "details" and attrs.get("class") == "package":
            self.ids.append(attrs["id"].upper())


def svg_text(x, y, value, size=14, weight="normal", fill="#334155", anchor="start"):
    return f'<text x="{x}" y="{y}" font-size="{size}" font-weight="{weight}" fill="{fill}" text-anchor="{anchor}">{escape(value)}</text>'


def stage_chart():
    labels = ["Agree foundations", "Deliver the first pilot", "Extend evidence workflows", "Add scoped release support"]
    left, col, top, row = 328, 243, 127, 43
    bars = {
        "P0": (0, 1, "core", "Conventions and exchange"),
        "P1": (1, 1, "core", "Source to reviewed evidence"),
        "P2": (1, 1, "core", "Trace and change review"),
        "P3": (2, 1, "core", "Implementation and tests"),
        "P4": (2, 2, "core", "Documents, then scoped release support"),
        "P-IN": (1, 3, "select", "Choose and deliver adapters individually"),
        "P-R": (1, 3, "select", "Select native risk workflow when needed"),
        "P-U": (1, 3, "select", "Select native usability workflow when needed"),
        "P-V": (1, 3, "select", "Select native validation workflow when needed"),
        "P-M": (1, 3, "select", "Select model/data workflow if applicable"),
        "P-L": (1, 3, "ongoing", "Capture corrections; evaluate method improvements"),
    }
    out = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1320 712" role="img" aria-labelledby="st-title st-desc">',
           '<title id="st-title">Work packages by suggested delivery stage</title>',
           '<desc id="st-desc">Rows show all eleven work packages. Columns are delivery stages, not time units. P0 sets foundations; the chosen pilot delivers P1 then P2. P3 and P4 extend the workflows. Integrations and native domain workflows are selected as needed. Learning starts with the first workflow. Bar width does not indicate effort or duration.</desc>',
           '<rect width="1320" height="712" fill="white"/>', '<g font-family="system-ui,Arial,sans-serif">',
           svg_text(16, 28, "Suggested delivery sequence", 20, "600"),
           svg_text(16, 53, "Work packages by delivery stage. No calendar dates or durations assigned.", 14),
           svg_text(16, 105, "Work package", 13, "600"),
           svg_text(left, 80, "Delivery stage", 12, fill="#64748b")]
    for i, label in enumerate(labels):
        x = left + i * col
        out.append(f'<rect x="{x}" y="90" width="{col}" height="520" fill="{"#f8fafc" if i % 2 == 0 else "#ffffff"}"/>')
        out.append(svg_text(x + col / 2, 109, label, 12, "600", anchor="middle"))
    for i, (pid, title, *_rest) in enumerate(PACKAGES):
        y = top + i * row
        start, span, kind, label = bars[pid]
        x, w = left + start * col + 8, span * col - 16
        out.append(f'<line x1="16" y1="{y + 35}" x2="1300" y2="{y + 35}" stroke="#e2e8f0"/>')
        short_titles = {"P1": "Source to reviewed requirements", "P2": "Trace and change review", "P3": "Implementation and verification", "P4": "Baselines and outputs", "P-IN": "Selected integrations", "P-R": "Risk and controls", "P-U": "Tasks, UI and usability", "P-V": "Validation and claims", "P-M": "Models and datasets", "P-L": "Feedback and improvement"}
        out.append(svg_text(16, y + 21, f"{pid}  {short_titles.get(pid, title)}", 13, "500"))
        if kind == "core":
            style = 'fill="#315d7e"'
            color = "#ffffff"
        elif kind == "select":
            style = 'fill="#f8fafc" stroke="#94a3b8" stroke-dasharray="5 4"'
            color = "#475569"
        else:
            style = 'fill="#dce9f2"'
            color = "#243746"
        out.append(f'<a href="#package-{pid.lower()}"><rect x="{x}" y="{y}" width="{w}" height="29" rx="3" {style}/>{svg_text(x + 12, y + 19, label, 12, fill=color)}</a>')
    out += [svg_text(16, 634, "Filled bars: suggested core sequence. Dashed bars: select increments. Pale bar: ongoing improvement.", 13),
            svg_text(16, 659, "P1 then P2 is the pilot planning order. P2 can start first with existing records and links.", 13),
            svg_text(16, 683, "P4 documents can start from an external baseline. Required domain evidence must be available from the first relevant workflow.", 13),
            svg_text(16, 705, "Source: BlueBridge feature map, 9 October 2026. Stage placement is an editorial proposal; bar widths are not estimates.", 11, fill="#64748b"),
            '</g></svg>']
    return "\n".join(out)


def pilot_chart(estimates):
    hours_per_day = estimates["focused_engineering_hours_per_day"]
    out = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 225" role="img" aria-labelledby="pi-title pi-desc">',
           '<title id="pi-title">Central pilot engineering effort in focused days</title>',
           '<desc id="pi-desc">P0 takes three focused engineering days, followed by three for P1 and three for P2. This shows cumulative engineering effort, not elapsed calendar time. Domain input and independent review are additional.</desc>',
           '<rect width="1000" height="225" fill="white"/><g font-family="system-ui,Arial,sans-serif">',
           svg_text(10, 23, "Central pilot effort", 18, "600"),
           svg_text(190, 51, "Cumulative focused engineering days, 6 engineering hours per day", 12)]
    tasks = estimates["tasks"]
    total = estimates["totals"]["engineering_hours"]["central"] / hours_per_day
    col, left, offset = 790 / total, 190, 0
    for i in range(int(total) + 1):
        x = left + i * col
        out.append(f'<line x1="{x}" y1="70" x2="{x}" y2="188" stroke="#e2e8f0"/>')
        out.append(svg_text(x, 66, str(i), 12, anchor="middle"))
    for i, pid in enumerate(["P0", "P1", "P2"]):
        days = sum(t["engineering_hours"]["central"] for t in tasks if t["package"] == pid) / hours_per_day
        y = 79 + i * 36
        out.append(svg_text(10, y + 18, f'{pid}  {dict(P0="Foundations", P1="Reviewed requirements", P2="Change review")[pid]}', 12))
        out.append(f'<rect x="{left + offset * col}" y="{y}" width="{days * col}" height="27" rx="3" fill="#315d7e"/>')
        out.append(svg_text(left + offset * col + 10, y + 18, f"{days:g} focused days", 12, fill="#ffffff"))
        offset += days
    out += [svg_text(10, 218, "Source: BlueBridge first estimation pass, 9 October 2026. Central fresh-build scenario; no code-reuse saving.", 11, fill="#64748b"), '</g></svg>']
    return "\n".join(out)


STYLE = """
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#fff;color:#243746;font:16px/1.55 system-ui,Arial,sans-serif}main{max-width:1320px;margin:auto;padding:36px 32px 50px}h1{font-size:30px;line-height:1.2;margin:8px 0 14px}h2{font-size:23px;line-height:1.3;margin:34px 0 12px}h3{font-size:18px;line-height:1.35;margin:0 0 9px}p{margin:0 0 12px}.eyebrow,.meta{font-size:13px;color:#64748b}.intro{max-width:930px;font-size:18px}.nav{display:flex;gap:20px;flex-wrap:wrap;align-items:center;margin:24px 0;border-bottom:1px solid #d8dfe4;padding-bottom:16px}a{color:#315d7e}button{font:inherit;color:#315d7e;background:#fff;border:1px solid #d8dfe4;border-radius:4px;padding:5px 12px;cursor:pointer}.callout{background:#f2f6f9;padding:18px 22px;margin:24px 0}.callout p:last-child{margin-bottom:0}.chart{overflow:auto;border:1px solid #d8dfe4;border-radius:4px}.chart svg{display:block;width:100%;min-width:1020px;height:auto}.pilot svg{min-width:690px}.caption{font-size:14px;color:#52616b;margin:10px 0 0}.package{display:grid;grid-template-columns:270px minmax(0,1fr);gap:28px;padding:23px 0;border-bottom:1px solid #d8dfe4;scroll-margin-top:20px}.package .id{display:block;color:#315d7e;font-size:13px;font-weight:700;margin-bottom:5px}.workflow{font-size:15px;color:#52616b;margin:10px 0 0}.workflow strong{font-weight:600;color:#243746}.group-intro{max-width:980px;color:#52616b}.specialist .package{padding:19px 0}.estimate{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:24px}.estimate aside{background:#f8fafc;padding:18px}.estimate aside p{font-size:14px}.estimate aside strong{font-size:23px;font-weight:600;display:block;color:#243746}.notes{display:grid;grid-template-columns:1fr 1fr;gap:28px;margin:24px 0}.notes p{font-size:14px}footer{border-top:1px solid #d8dfe4;padding-top:20px;margin-top:30px;font-size:13px;color:#64748b}@media(max-width:850px){main{padding:24px 18px}.package{grid-template-columns:1fr;gap:0}.package .id{display:inline;margin-right:8px}.estimate,.notes{grid-template-columns:1fr}.intro{font-size:16px}}@media print{@page{size:A4 landscape;margin:12mm}main{padding:0;max-width:none}.nav{display:none}h1{font-size:25px}h2{font-size:20px}.intro{font-size:16px}.chart{overflow:visible}.chart svg{min-width:0}.package{break-inside:avoid;padding:14px 0}.callout{break-inside:avoid}.estimate{break-inside:avoid}a{color:inherit}.notes{break-inside:avoid}footer{font-size:11px}}
"""


def package_html(package):
    pid, title, description, workflow = package
    return f'''<article class="package" id="package-{pid.lower()}">
<h3><span class="id">{pid}</span>{escape(title)}</h3>
<div><p>{escape(description)}</p><p class="workflow"><strong>Workflow enabled.</strong> {escape(workflow)}</p></div></article>'''


def main():
    reader = PackageReader()
    reader.feed((DOCS / "bluebridge-feature-map.html").read_text())
    assert reader.ids == [p[0] for p in PACKAGES], "Source packages changed; review summaries."
    estimates = json.loads((DOCS / "planning/bluebridge-estimate-data.json").read_text())
    for kind in ["engineering_hours", "review_hours"]:
        for scenario in ["lower", "central", "upper"]:
            assert sum(t[kind][scenario] for t in estimates["tasks"]) == estimates["totals"][kind][scenario]
    hours = estimates["totals"]["engineering_hours"]
    review = estimates["totals"]["review_hours"]
    per_day = estimates["focused_engineering_hours_per_day"]
    stage_svg = stage_chart()
    task_map, executive_roadmap, task_markdown = build_task_views(DOCS, PACKAGES)
    html = f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>BlueBridge tasks, work packages and roadmap</title><style>{STYLE}{TASK_STYLE}</style></head>
<body><main><header><p class="eyebrow">BlueBridge / work package overview</p>
<h1>What can colleagues do as we build the internal tool?</h1>
<p class="intro">Start with the work people recognise. Each umbrella task draws on selected capabilities from several work packages. Deliver the parts needed for a usable workflow, then expand its scope.</p>
<p class="meta">Simplified companion to the feature map dated 9 October 2026. Package scope and delivery choices remain provisional.</p></header>
<nav class="nav" aria-label="Overview sections"><a href="#executive-roadmap">Executive roadmap</a><a href="#task-map">Task/package matrix</a><a href="#reference">Original package overview</a><a href="bluebridge-feature-map.html">Full feature map</a><button type="button" onclick="window.print()">Print / save PDF</button></nav>
<div class="callout"><p><strong>The packages are building blocks; the deliveries are usable workflows.</strong> For example, risk-change review combines selected change-review, risk and test-evidence scope. It does not require completion of every later feature in those packages.</p><p>Discussion proposal. The task mapping describes intended internal support. The roadmap proposes workflow increments; months, staffing and savings remain open.</p></div>
{executive_roadmap}
{task_map}
<details class="archive" id="reference"><summary>Original package overview, sequence and pilot estimate</summary>
<div class="callout"><p><strong>Recommended first delivery: P0 + P1 + P2.</strong> Establish the shared rules, turn one representative transcript into independently checked and human-reviewed needs and requirements, then exercise a significant change against a small evidence set.</p><p>Start with manual context, imports and transfer where useful. Add live integrations and wider lifecycle workflows as separate increments.</p></div>
<section id="sequence"><h2>A suggested delivery sequence</h2><p>These stages describe a possible rollout. Bar widths indicate stage coverage and do not represent effort, duration or work already completed.</p><div class="chart">{stage_svg}</div><p class="caption">The first pilot uses P0, then P1, then P2. Existing records can make P2 the first useful workflow instead. P4 document production can start earlier from an external baseline.</p></section>
<section id="packages"><h2>The main evidence workflow</h2>{''.join(package_html(p) for p in PACKAGES[:5])}</section>
<section class="specialist"><h2>Integrations, specialist evidence and improvement</h2><p class="group-intro">Select the specialist workflows to suit the product and the tools already in use. Required risk, usability, validation or model evidence can come from existing processes before BlueBridge has its own authoring modules. Start capturing corrections with the first delivered workflow.</p>{''.join(package_html(p) for p in PACKAGES[5:])}</section>
<section id="pilot"><h2>The estimated first pilot</h2><p>The existing estimate covers a fresh build for one project in one development environment, with plain-text input, a small evidence set and manual independent checking. Live connectors and P3/P4 or native specialist modules need separate estimates.</p>
<div class="estimate"><div><div class="chart pilot">{pilot_chart(estimates)}</div><p class="caption">This Gantt shows cumulative engineering effort. Domain input and independent review are additional; availability and waiting time determine the calendar schedule.</p></div>
<aside><p><strong>{hours['central'] / per_day:g} focused engineering days</strong>{hours['central']} engineering hours in the central scenario.</p><p><strong>{review['central']} review hours</strong>Product/domain input and independent human checking.</p><p>Engineering scenarios span {hours['lower'] / per_day:g} to {hours['upper'] / per_day:g} focused days. The source treats roughly two weeks as a provisional target if inputs and reviewers are available.</p></aside></div></section>
</details>
<footer><p>Source basis: <a href="bluebridge-jobs-map.html">Jobs map</a> and <a href="bluebridge-feature-map.html">feature map</a>, dated 9 October 2026. Umbrella tasks, effort rankings and workflow increments are editorial proposals for discussion. Capability hard prerequisites are included; conditional requirements remain explicit. Counts are not completion or savings measures.</p><p>Regenerate with <code>python3 docs/planning/build_work_package_overview.py</code>. Edit the discussion mapping in <a href="planning/bluebridge-task-roadmap-data.json">task and roadmap data</a>. <a href="bluebridge-work-packages.md">Markdown version</a> · <a href="planning/bluebridge-work-packages.svg">Original stage chart</a></p></footer>
</main><script>{TASK_SCRIPT}</script></body></html>'''
    markdown = ["# BlueBridge work packages at a glance", "", "Simplified companion to the [feature map](bluebridge-feature-map.html), dated 9 October 2026. Scope and delivery choices remain provisional.", "", "Turn source material into agreed needs and requirements, understand the consequences of change, connect evidence to implementation and tests, and produce documents from an agreed evidence version.", "", "## Suggested delivery sequence", "", "![Work packages by suggested delivery stage](planning/bluebridge-work-packages.svg)", "", "Stages describe a suggested rollout. Bar widths do not represent effort, duration or completion. Use P0, then P1, then P2 for the chosen pilot. P2 can start first with existing records and links. P4 documents can start from an external baseline. Required domain evidence must be available from the first relevant workflow, even when native modules come later.", "", "## Main evidence workflow", ""]
    for i, (pid, title, description, workflow) in enumerate(PACKAGES):
        if i == 5:
            markdown += ["## Integrations, specialist evidence and improvement", "", "Select these workflows to suit the product and existing tools. Existing processes can supply required domain evidence before native authoring modules exist. Capture corrections with the first delivered workflow.", ""]
        markdown += [f"### {pid}: {title}", "", description, "", f"Workflow enabled: {workflow}", ""]
    markdown += ["## Estimated first pilot", "", "P0 + P1 + P2 cover one project in one development environment, with plain-text input, a small evidence set and manual independent checking.", "", "![Central pilot engineering effort in focused days](planning/bluebridge-pilot-effort.svg)", "", f"The central fresh-build scenario is {hours['central']} engineering hours, or {hours['central'] / per_day:g} focused engineering days at {per_day} hours per day, plus {review['central']} hours of domain input and independent review. Engineering scenarios span {hours['lower'] / per_day:g} to {hours['upper'] / per_day:g} focused days. This is engineering effort, not a calendar schedule. Roughly two weeks is a provisional target if required inputs and reviewers are available.", "", "Live integrations, P3/P4 and native specialist modules remain unestimated. See the [first estimation pass](bluebridge-estimation.md) for scope and staffing assumptions.", "", "Regenerate with `python3 docs/planning/build_work_package_overview.py`.", ""]
    (DOCS / "bluebridge-work-packages.html").write_text(html)
    (DOCS / "bluebridge-work-packages.md").write_text("# BlueBridge tasks, work packages and roadmap\n\n" + task_markdown + "\n\n## Original package overview and estimate\n\n" + "\n".join(markdown[2:]))
    (DOCS / "planning/bluebridge-work-packages.svg").write_text(stage_svg)
    (DOCS / "planning/bluebridge-pilot-effort.svg").write_text(pilot_chart(estimates))
    print(f"Built overview for {len(PACKAGES)} source packages, eight task slices and five proposed roadmap increments; checked mappings and pilot totals.")


if __name__ == "__main__":
    main()
