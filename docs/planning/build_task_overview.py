"""Build the concise jobs-to-capabilities discussion page, without packages."""

from html import escape
import json
from pathlib import Path
import sys

sys.dont_write_bytecode = True
from work_package_task_views import resolve_scope

DOCS = Path(__file__).resolve().parents[1]

# Short presentation headings over the existing jobs, with representative
# subtasks and evidence. These summaries are editorial, not a new job catalogue.
SUMMARIES = {
    "needs": ("Needs and requirements", ["Capture source information and clarify what it means.", "Agree the needs and derive testable requirements.", "Review the records and their supporting links."], ["SRC", "NEED", "SYS", "SUB"], "Turn a discussion or text source into reviewed needs and requirements, with source references and saved decisions."),
    "risk": ("Risk and controls", ["Analyse hazards, define controls and assess residual risk.", "Review evidence that controls are implemented and effective.", "Maintain links to requirements and tests."], ["HAZ", "CTRL", "RISK"], "Keep risk records, controls, supporting evidence and review decisions connected."),
    "usability": ("User tasks and usability", ["Define user tasks and the relevant UI requirements.", "Review usability findings and decide what changes.", "Connect critical tasks to evaluation evidence."], ["USE", "SUB", "VR"], "Follow a critical user task through UI requirements, evaluation findings and the resulting actions."),
    "verification": ("Implementation and verification", ["Connect requirements and design to what was built.", "Plan verification and retain exact test results.", "Review failures and assign follow-up."], ["ARCH", "DESIGN", "CODE", "TEST", "RUN"], "Follow a requirement through design, an exact build and a reviewed test execution."),
    "validation": ("Validation of needs and claims", ["Define how selected needs and claims will be evaluated.", "Review results, limitations and evidence gaps.", "Record the evidence basis for each conclusion."], ["NEED", "CLAIM", "VP", "VR"], "Explain which evidence supports a need or claim, for which product version, and with what limitations."),
    "change": ("Product changes", ["Determine what a proposed change affects.", "Assign updates, retesting and reviews.", "Record findings and their outcomes."], ["CHANGE", "LINK", "REVIEW"], "Bring together the relevant evidence, review known impacts and coordinate owned follow-up."),
    "outputs": ("Evidence, documents and release", ["Resolve gaps and agree an exact evidence baseline.", "Produce and review the selected documents.", "Assess release readiness and record its separate decision."], ["BASE", "DOC", "LABEL", "REL"], "Start with a reviewed baseline and a selected document. Label authoring and release support add further evidence needs."),
    "models": ("Models and datasets", ["Maintain exact model and dataset identities.", "Connect versions to build and evaluation evidence.", "Review the consequences of model or data changes."], ["ML", "CODE", "RUN", "VR"], "Keep model, dataset, build and evaluation versions aligned where the product uses machine learning."),
}

LABELS = {"core": "Needed", "dependency": "Needed", "conditional": "Scope", "enhancement": "Addition"}

EVIDENCE_LABELS = {
    "SRC": "source records", "NEED": "user needs", "SYS": "system requirements",
    "SUB": "allocated requirements", "HAZ": "risk analyses", "CTRL": "risk controls",
    "RISK": "risk decisions", "USE": "user tasks and usability evidence",
    "ARCH": "architecture", "DESIGN": "design records", "CODE": "build references",
    "TEST": "test plans", "RUN": "test results", "CLAIM": "product claims",
    "VP": "evaluation plans", "VR": "evaluation results", "CHANGE": "change records",
    "LINK": "evidence relationships", "REVIEW": "review findings and decisions",
    "BASE": "agreed baselines", "DOC": "documents", "LABEL": "labels and instructions",
    "REL": "release decisions", "ML": "model and dataset records",
}

STYLE = """
*{box-sizing:border-box}body{margin:0;background:#fff;color:#263746;font:16px/1.5 system-ui,Arial,sans-serif}main{max-width:1400px;margin:auto;padding:36px 30px 48px}h1{font-size:30px;line-height:1.2;margin:6px 0 16px}h2{font-size:22px;margin:32px 0 12px}h3{font-size:19px;margin:0 0 10px}p{margin:0 0 12px}a{color:#315d7e}.eyebrow,.small{color:#64748b;font-size:13px}.intro{max-width:970px;font-size:18px}.basis{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;margin:25px 0 32px;border-top:1px solid #d8dfe4;border-bottom:1px solid #d8dfe4;padding:18px 0}.basis strong{display:block;margin-bottom:6px}.basis p{font-size:14px;color:#52616b;margin:0}.task-buttons{display:grid;grid-template-columns:repeat(4,1fr);gap:0 20px;margin:18px 0 24px}.task-buttons button{background:#fff;color:#315d7e;border:0;border-bottom:1px solid #d8dfe4;font:inherit;font-size:14px;text-align:left;padding:12px 8px;cursor:pointer}.task-buttons button[aria-pressed=true]{background:#e8f0f6;border-bottom:2px solid #315d7e;font-weight:600}.task-panel{background:#f6f8fa;padding:20px 24px}.task-columns{display:grid;grid-template-columns:1fr 1fr;gap:30px}.task-columns ul{padding-left:20px;margin:0}.task-columns li{padding-bottom:7px;font-size:15px}.task-panel details{font-size:13px;margin-top:12px}.task-panel summary{cursor:pointer;color:#315d7e}.job-list{padding:8px 0}.job-list a{display:block;padding:3px 0}.homes{width:100%;border-collapse:collapse;font-size:12px}.homes th,.homes td{text-align:left;padding:7px;border-bottom:1px solid #d8dfe4;vertical-align:top}.matrix-controls{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin:15px 0}.matrix-controls label{font-size:14px;cursor:pointer}.matrix-controls input{accent-color:#315d7e}.matrix-wrap{overflow:auto;border:1px solid #d8dfe4;max-height:760px}.matrix{border-collapse:separate;border-spacing:0;width:100%;min-width:1150px;font-size:12px}.matrix caption{text-align:left;padding:10px 12px;color:#52616b;font-size:13px}.matrix th,.matrix td{padding:8px 9px;border-bottom:1px solid #e2e8f0;text-align:center}.matrix thead th{position:sticky;top:0;background:#f8fafc;z-index:2;vertical-align:top;font-size:12px}.matrix thead th:first-child{z-index:3}.matrix tbody th{font-weight:400;text-align:left;width:390px;min-width:390px}.matrix th:first-child{position:sticky;left:0;background:#fff;z-index:1}.matrix th:first-child>a{display:block;text-decoration:none;color:#263746}.matrix th small{color:#64748b;margin-right:8px;font-size:10px}.matrix th>a:hover{text-decoration:underline}.matrix th button{font:inherit;color:#315d7e;background:transparent;border:0;padding:0;text-align:center;cursor:pointer}.matrix th button span{display:block;font-weight:700;margin-bottom:5px}.matrix .selected{background:#e8f0f6}.matrix thead th.selected{background:#dce9f2}.matrix .needed{font-weight:600;color:#315d7e}.matrix .conditional{color:#52616b;border-bottom-style:dashed}.matrix .addition{color:#64748b;font-size:11px}.legend{font-size:13px;color:#52616b;max-width:1120px}.example{max-width:1080px;margin:20px 0;padding:16px 20px;border-left:3px solid #315d7e;background:#f6f8fa}.example p{font-size:14px;margin:0}.support{max-width:1080px;font-size:14px;margin-top:24px}footer{border-top:1px solid #d8dfe4;padding-top:16px;margin-top:28px;font-size:13px;color:#64748b}[hidden]{display:none!important}button:focus-visible,a:focus-visible,input:focus-visible{outline:2px solid #315d7e;outline-offset:3px}input{width:16px;height:16px;vertical-align:middle;margin-right:7px}noscript p{font-size:14px}@media(max-width:900px){.basis,.task-buttons{grid-template-columns:repeat(2,1fr)}.task-columns{grid-template-columns:1fr;gap:15px}.matrix tbody th{min-width:290px;width:290px}}@media(max-width:550px){main{padding:24px 16px}h1{font-size:25px}.intro{font-size:16px}.basis{gap:15px}.task-buttons{gap:0 10px}.task-panel{padding:18px}.matrix th,.matrix td{padding:7px}.matrix tbody th{min-width:230px;width:230px}.matrix{min-width:1020px}.matrix-controls{display:block}.matrix-controls label{display:block;margin-bottom:8px}}@media print{@page{size:A4 landscape;margin:12mm}main{max-width:none;padding:0}h1{font-size:24px}.task-buttons,.matrix-controls{display:none}.matrix-wrap{overflow:visible;max-height:none}.matrix{min-width:0;font-size:9px}.matrix th,.matrix td{padding:5px}.matrix th:first-child{position:static;min-width:230px;width:230px}.matrix thead th{position:static;font-size:9px}.task-panel{break-inside:avoid}.matrix thead{display:table-header-group}.matrix tr{break-inside:avoid}}
"""

SCRIPT = """
(() => {
  const taskIds = Array.from(document.querySelectorAll('[data-panel]'), p => p.dataset.panel);
  function choose(id) {
    if (!taskIds.includes(id)) return;
    document.querySelectorAll('[data-panel]').forEach(p => { p.hidden = p.dataset.panel !== id; });
    document.querySelectorAll('[data-task]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.task === id)));
    document.querySelectorAll('[data-column]').forEach(c => c.classList.toggle('selected', c.dataset.column === id));
    document.getElementById('selected-task').textContent = document.querySelector(`[data-task="${id}"]`).textContent.trim();
  }
  document.querySelectorAll('[data-task]').forEach(b => b.addEventListener('click', () => choose(b.dataset.task)));
  const additions = document.getElementById('show-additions');
  function showAdditions() {
    document.querySelectorAll('[data-extra]').forEach(row => { row.hidden = !additions.checked; });
    const visible = document.querySelectorAll('.matrix tbody tr:not([hidden])').length;
    document.getElementById('row-count').textContent = `${visible} capabilities shown`;
  }
  additions.addEventListener('change', showAdditions);
  showAdditions();
  choose(taskIds[0]);
})();
"""


def main():
    catalogue = json.loads((DOCS / 'planning/bluebridge-feature-map-data.json').read_text())
    job_data = json.loads((DOCS / 'planning/bluebridge-jobs-map-data.json').read_text())
    discussion = json.loads((DOCS / 'planning/bluebridge-task-roadmap-data.json').read_text())
    features = {f['id']: f for f in catalogue['features']}
    jobs = {j['id']: j for j in job_data['jobs']}
    records = {r['id']: r for r in job_data['records']}
    tasks = discussion['tasks']
    assert set(SUMMARIES) == {t['id'] for t in tasks}
    assert [t['number'] for t in tasks] == list(range(1, 9))
    # This page keeps only the jobs-to-capabilities mapping. Feedback and method
    # improvement are outside its scope; no package or roadmap data is rendered.
    common = {'common': ['CAP-01', 'CAP-04', 'CAP-38'], 'common_enhancements': []}
    maps = {t['id']: resolve_scope(t, common, features) for t in tasks}
    excluded = {'CAP-35', 'CAP-36', 'CAP-37'}
    assert all(not (set(picks) & excluded) for picks in maps.values())
    buttons, panels = [], []
    for t in tasks:
        tid, number = t['id'], t['number']
        title, subtasks, evidence, support = SUMMARIES[tid]
        assert set(t['jobs']) <= set(jobs)
        assert set(evidence) <= set(records)
        buttons.append(f'<button type="button" data-task="{tid}" aria-pressed="{"true" if number == 1 else "false"}">{number}. {escape(title)}</button>')
        job_links = ''.join(f'<a href="bluebridge-jobs-map.html#{j.lower()}">{j} · {escape(jobs[j]["title"])}</a>' for j in t['jobs'])
        evidence_names = ', '.join(EVIDENCE_LABELS[r] for r in evidence)
        homes = ''.join(f'<tr><th scope="row">{escape(records[r]["title"])}</th><td>{escape(records[r]["home"])}</td></tr>' for r in evidence)
        panels.append(f'''<article class="task-panel" id="task-{tid}" data-panel="{tid}" {'hidden' if number != 1 else ''}>
<h3>{number}. {escape(title)}</h3><div class="task-columns"><div><ul>{''.join(f'<li>{escape(s)}</li>' for s in subtasks)}</ul></div><div><p>{escape(support)}</p><p class="small">Evidence includes {escape(evidence_names)}.</p></div></div>
<details><summary>See the jobs and evidence homes</summary><div class="job-list">{job_links}</div><table class="homes"><thead><tr><th scope="col">Evidence</th><th scope="col">Proposed record home</th></tr></thead><tbody>{homes}</tbody></table></details></article>''')
    headers = ''.join(f'<th scope="col" data-column="{t["id"]}"><button type="button" data-task="{t["id"]}" aria-pressed="{"true" if t["number"] == 1 else "false"}"><span>{t["number"]}</span>{escape(SUMMARIES[t["id"]][0])}</button></th>' for t in tasks)
    rows = []
    for fid, f in features.items():
        if fid in excluded:
            continue
        selections = [maps[t['id']].get(fid) for t in tasks]
        assert any(selections), f'Unmapped capability: {fid}'
        extra_only = all(not s or s['kind'] == 'enhancement' for s in selections)
        cells = []
        for t, pick in zip(tasks, selections):
            if pick:
                kind = pick['kind']
                explanation = ' '.join(pick['reasons'])
                # Retain source conditional prerequisites in the explanation.
                conditions = ' '.join(f'{c["when"]}: {", ".join(c["requires"])}.' for c in f.get('conditional', []))
                tip = escape((explanation + ' ' + conditions).strip(), quote=True)
                css = 'needed' if kind in ['core', 'dependency'] else 'conditional' if kind == 'conditional' else 'addition'
                content = f'<span title="{tip}">{LABELS[kind]}</span>'
            else:
                css, content = 'blank', '<span aria-label="Not selected in this draft">·</span>'
            cells.append(f'<td class="{css}" data-column="{t["id"]}">{content}</td>')
        rows.append(f'<tr data-feature="{fid}" {"data-extra hidden" if extra_only else ""}><th scope="row"><a href="bluebridge-feature-map.html#{fid.lower()}"><small>{fid}</small> {escape(f["title"])}</a></th>{"".join(cells)}</tr>')
    html = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BlueBridge: jobs, evidence and capabilities</title><style>{STYLE}</style></head><body><main>
<p class="eyebrow">BlueBridge · discussion draft</p><h1>Start with the work colleagues need to do</h1>
<p class="intro">We used the V-model to identify the jobs, the evidence each job needs or produces, and how that evidence relates. The umbrella tasks below group related jobs under short headings. The matrix shows the capabilities the internal tool would need to support them.</p>
<div class="basis"><div><strong>1. V-model</strong><p>Product development and the evidence that supports it.</p></div><div><strong>2. Jobs and evidence</strong><p>What people do, which records they use, and where those records belong.</p></div><div><strong>3. Umbrella tasks</strong><p>Related jobs grouped under a recognisable heading.</p></div><div><strong>4. Capabilities</strong><p>What the tool needs to help people perform those jobs.</p></div></div>
<section aria-labelledby="tasks-title"><h2 id="tasks-title">Eight headings for the existing jobs</h2><p>Select a heading to see a few representative subtasks and the evidence behind them.</p><div class="task-buttons" role="group" aria-label="Choose an umbrella task">{''.join(buttons)}</div>{''.join(panels)}</section>
<section aria-labelledby="matrix-title"><h2 id="matrix-title">What capabilities does each task need?</h2><p>Read down a task's column to see its proposed starting scope. A capability can support several tasks.</p>
<div class="matrix-controls"><span class="small">Selected: <strong id="selected-task" aria-live="polite">1. Needs and requirements</strong></span><label><input type="checkbox" id="show-additions">Show extra capture and automation options</label></div>
<div class="matrix-wrap" tabindex="0" role="region" aria-label="Capability matrix, scroll to view all rows and columns"><table class="matrix"><caption>Proposed internal-tool support by umbrella task</caption><thead><tr><th scope="col">Capability</th>{headers}</tr></thead><tbody>{''.join(rows)}</tbody></table></div>
<p class="legend"><strong>Needed</strong> is selected for the starting workflow, including shared prerequisites. <strong>Scope</strong> is needed when that evidence or activity applies. <strong>Addition</strong> broadens the workflow later. A dot means no selection in this draft. These labels describe proposed scope, not delivery status.</p><p class="small" id="row-count"></p></section>
<div class="example"><p><strong>For example, needs and requirements.</strong> Start with text capture, clarification, cited drafting, checking, links and review decisions. Document extraction or live meeting capture can follow. Risk and usability capabilities apply when those records supply requirement inputs.</p></div>
<p class="support">Internal support means helping people prepare, connect, check and retain evidence. People still conduct engineering and studies, resolve questions and make decisions. To choose the first build, agree a task and a starting scope, then select the capabilities needed to complete it.</p>
<noscript><p>JavaScript is needed to switch task descriptions and show additional capability rows. The starting-scope matrix and the first task are available without it.</p></noscript>
<footer>Discussion groupings and capability selections are proposals. Evidence homes remain provisional. The detailed basis is in the <a href="bluebridge-jobs-map.html">jobs and evidence map</a> and the <a href="bluebridge-feature-map.html">feature catalogue</a>.</footer>
</main><script>{SCRIPT}</script></body></html>'''
    assert 'P-IN' not in html and 'work package' not in html.lower()
    output = DOCS / 'bluebridge-task-overview.html'
    output.write_text(html)
    print(f'Built {output.name}: eight umbrella tasks and {len(rows)} capabilities, with checked job, evidence and prerequisite references.')


if __name__ == '__main__':
    main()
