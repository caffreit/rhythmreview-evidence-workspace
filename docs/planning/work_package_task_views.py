"""Render task slices and a discussion roadmap from checked editorial mappings."""

from collections import Counter
from html import escape
import json
from pathlib import Path


LABELS = {"core": "Core task scope", "dependency": "Shared prerequisite", "conditional": "Scope-dependent", "enhancement": "Later addition"}
PRIORITY = {"core": 0, "dependency": 1, "conditional": 2, "enhancement": 3}


def feature_link(feature):
    return f'<a href="bluebridge-feature-map.html#{feature["id"].lower()}">{feature["id"]}</a>'


def resolve_scope(task, data, features):
    """Retain explicit task picks and recursively include source hard prerequisites.

    Conditional source requirements remain visible in each feature's boundary
    note, rather than becoming universal hard dependencies.
    """
    picks = {}

    def add(fid, kind, reason):
        assert fid in features, fid
        previous = picks.get(fid)
        if previous is None:
            picks[fid] = {"kind": kind, "reasons": [reason]}
        else:
            if reason not in previous["reasons"]:
                previous["reasons"].append(reason)
            if PRIORITY[kind] < PRIORITY[previous["kind"]]:
                previous["kind"] = kind

    for index, subtask in enumerate(task["subtasks"], 1):
        for fid in subtask["caps"]:
            add(fid, "core", f'Subtask {index}: {subtask["title"]}')
    for fid in data["common"]:
        add(fid, "dependency", "Common scope, recorded decisions, usable exchange and correction capture.")
    for fid in data["common_enhancements"]:
        add(fid, "enhancement", "Periodic cause review and evaluated method improvement can grow after feedback capture.")
    for group, kind in [("conditional", "conditional"), ("enhancements", "enhancement")]:
        for item in task[group]:
            for fid in item["caps"]:
                add(fid, kind, item["when"])

    # Stop when both membership and classifications converge. A core pick wins
    # over a later/conditional use of the same capability; reasons are retained.
    while True:
        before = [(fid, p["kind"]) for fid, p in picks.items()]
        for fid, pick in list(picks.items()):
            inherited = "dependency" if pick["kind"] in ["core", "dependency"] else pick["kind"]
            for dependency in features[fid]["hard"]:
                add(dependency, inherited, f'Prerequisite for {fid}: {features[fid]["title"]}.')
        if before == [(fid, p["kind"]) for fid, p in picks.items()]:
            break
    for fid, pick in picks.items():
        for dependency in features[fid]["hard"]:
            assert dependency in picks
            assert PRIORITY[picks[dependency]["kind"]] <= max(1, PRIORITY[pick["kind"]])
    return picks


def capability_details(fid, pick, features):
    f = features[fid]
    conditions = " ".join(f'{c["when"]}: {", ".join(c["requires"])}.' for c in f.get("conditional", []))
    boundary = f'<p class="caption"><strong>Additional prerequisites when applicable.</strong> {escape(conditions)}</p>' if conditions else ""
    return f'''<details class="capability {pick['kind']}" data-cap="{fid}"><summary>
<span class="badge {pick['kind']}">{LABELS[pick['kind']]}</span> {feature_link(f)} {escape(f['title'])}</summary>
<div><p><strong>Minimum support.</strong> {escape(f['minimum'])}</p>
<p class="caption">{' '.join(escape(r) for r in pick['reasons'])}</p>{boundary}
<p class="caption"><strong>Further scope in the catalogue.</strong> {escape(f['later'])}</p></div></details>'''


def task_panel(task, picks, features, packages):
    tid = task["id"]
    subtasks = []
    for s in task["subtasks"]:
        links = " · ".join(feature_link(features[fid]) for fid in s["caps"])
        subtasks.append(f'<li><strong>{escape(s["title"])}</strong><p>{escape(s["support"])}</p><p class="caption">Selected capabilities: {links}</p></li>')
    groups = []
    for pid, title, *_ in packages:
        members = {fid: pick for fid, pick in picks.items() if features[fid]["package"] == pid}
        if not members:
            continue
        catalogue = [f for f in features.values() if f["package"] == pid]
        required = [fid for fid, pick in members.items() if pick["kind"] in ["core", "dependency"]]
        remaining = [f for f in catalogue if f["id"] not in required]
        scope_text = f'{len(required)} of {len(catalogue)} catalogue capabilities in the core/prerequisite slice.' if required else 'Scope-dependent or later additions only.'
        details = "".join(capability_details(fid, members[fid], features) for fid in sorted(members, key=lambda x: (PRIORITY[members[x]["kind"]], x)))
        others = " · ".join(f'{feature_link(f)} {escape(f["title"])}' for f in remaining)
        omitted = f'<p class="caption">Outside the core/prerequisite slice: {others}</p>' if remaining else '<p class="caption">All catalogue capabilities appear in this slice; their later increments remain separate scope.</p>'
        counts = Counter(p['kind'] for p in members.values())
        qualifiers = []
        if counts['conditional']:
            qualifiers.append(f"{counts['conditional']} scope-dependent")
        if counts['enhancement']:
            qualifiers.append(f"{counts['enhancement']} later")
        qualifier_text = (' ' + ', '.join(qualifiers) + '.') if qualifiers else ''
        groups.append(f'<details class="scope-package" id="scope-{tid}-{pid.lower()}" tabindex="-1"><summary><strong>{pid} · {escape(title)}</strong><span class="caption">{scope_text}{qualifier_text}</span></summary><div>{details}{omitted}</div></details>')
    jobs = " · ".join(f'<a href="bluebridge-jobs-map.html#{j.lower()}">{j}</a>' for j in task["jobs"])
    return f'''<article class="task-panel" id="task-{tid}" data-panel="{tid}" {'hidden' if task['number'] != 1 else ''}>
<h3>{task['number']}. {escape(task['title'])}</h3><p class="task-outcome">{escape(task['outcome'])}</p>
<div class="task-layout"><div><h4>Heavier subtasks first</h4><p class="caption">A rough ranking of colleague effort for discussion, not development effort or measured timings.</p>
<ol class="subtasks">{''.join(subtasks)}</ol><div class="people"><strong>Work that remains with people</strong><p>{escape(task['remains'])}</p></div><p class="caption">Jobs-map basis: {jobs}.</p></div>
<div><h4>The selected parts of each package</h4><p class="caption">Open a package, then a capability, for its minimum scope and boundaries. Selecting a capability does not select all its later increments.</p>{''.join(groups)}</div></div></article>'''


def build_task_views(docs, packages):
    data = json.loads((docs / "planning/bluebridge-task-roadmap-data.json").read_text())
    catalogue = json.loads((docs / "planning/bluebridge-feature-map-data.json").read_text())
    features = {f["id"]: f for f in catalogue["features"]}
    jobs = {j["id"] for j in json.loads((docs / "planning/bluebridge-jobs-map-data.json").read_text())["jobs"]}
    tasks = data["tasks"]
    assert len({t["id"] for t in tasks}) == len(tasks)
    assert [t["number"] for t in tasks] == list(range(1, len(tasks) + 1))
    for t in tasks:
        assert set(t["jobs"]) <= jobs
        assert len(t["subtasks"]) == 3
    maps = {t["id"]: resolve_scope(t, data, features) for t in tasks}
    columns = ''.join(f'<th scope="col" data-column="{t["id"]}"><button type="button" data-select-task="{t["id"]}" aria-pressed="{"true" if t["number"] == 1 else "false"}"><span>{t["number"]}</span>{escape(t["short"])}</button></th>' for t in tasks)
    rows = []
    for pid, title, *_ in packages:
        cells = []
        for t in tasks:
            members = {fid: p for fid, p in maps[t["id"]].items() if features[fid]["package"] == pid}
            counts = Counter(p["kind"] for p in members.values())
            core = counts['core'] + counts['dependency']
            if not members:
                contents = '<span class="no-scope" aria-label="No selected scope">—</span>'
            else:
                bits = []
                if core:
                    bits.append(f'<strong>{core} {"shared" if not counts["core"] else "core"}</strong>')
                if counts['conditional']:
                    bits.append(f'<span>{counts["conditional"]} scoped</span>')
                if counts['enhancement']:
                    bits.append(f'<span>{counts["enhancement"]} later</span>')
                label = f'{pid} for task {t["number"]}: {core} core or shared, {counts["conditional"]} scope-dependent, {counts["enhancement"]} later capabilities'
                contents = f'<button type="button" data-select-task="{t["id"]}" data-package="{pid.lower()}" aria-label="{label}">{"".join(bits)}</button>'
            cells.append(f'<td data-column="{t["id"]}" class="{"has-core" if core else "has-options" if members else "unmapped"}">{contents}</td>')
        rows.append(f'<tr><th scope="row"><a href="#package-{pid.lower()}">{pid}</a><small>{escape(title)}</small></th>{"".join(cells)}</tr>')
    options = ''.join(f'<option value="{t["id"]}">{t["number"]}. {escape(t["title"])}</option>' for t in tasks)
    panels = ''.join(task_panel(t, maps[t['id']], features, packages) for t in tasks)
    mapping = f'''<section id="task-map"><h2>What does each task need from the packages?</h2>
<p>Each column is a colleague's umbrella task. Each row is a building block. Select a task or a matrix cell to see the particular capabilities and the subtasks they support.</p>
<div class="matrix-wrap"><table class="task-matrix"><caption>Capabilities selected from each work package for eight proposed umbrella tasks</caption><thead><tr><th scope="col">Work package</th>{columns}</tr></thead><tbody>{''.join(rows)}</tbody></table></div>
<p class="caption"><strong>Read the counts as scope, not progress.</strong> Core includes task capabilities and their shared prerequisites. Scoped depends on the product or workflow; later is an optional addition. Counts do not measure task completion or effort saved. This is a proposed internal-tool mapping, not current implementation status.</p>
<div class="task-controls"><label for="task-choice">Explore an umbrella task</label><select id="task-choice">{options}</select><button type="button" id="previous-task">Previous task</button><button type="button" id="next-task">Next task</button><span id="task-position" aria-live="polite">Task 1 of {len(tasks)}</span></div>
<noscript><p>The first task is shown below. Use the <a href="bluebridge-work-packages.md">Markdown version</a> for all task mappings without JavaScript.</p></noscript>{panels}</section>'''

    cards, markdown = [], ["## Tasks cutting across packages", "", "Discussion proposal. Subtasks are ranked roughly by colleague effort, not measured timings. Capability counts describe selected scope, not progress or savings. Hard prerequisites are included; scope-dependent requirements remain explicit.", ""]
    for t in tasks:
        markdown += [f'### {t["number"]}. {t["title"]}', '', t['outcome'], '']
        for n, s in enumerate(t['subtasks'], 1):
            markdown += [f'{n}. {s["title"]}. Internal support: {s["support"]} Selected capabilities: {", ".join(s["caps"])}.']
        markdown += ['', f'People retain: {t["remains"]}', '']
        for pid, title, *_ in packages:
            members = {fid: p for fid, p in maps[t['id']].items() if features[fid]['package'] == pid}
            if members:
                listed = '; '.join(f'{fid} {features[fid]["title"]} [{LABELS[p["kind"]]}]' for fid, p in sorted(members.items()))
                markdown += [f'- {pid}: {listed}.']
        markdown += ['']
    markdown += ['## Executive roadmap proposal', '', 'A proposed order of usable workflow increments. Dates, staffing and effort savings remain open. Specialist branches can be selected independently; baseline-to-document work can start earlier.', '']
    for r in data['roadmap']:
        assert set(r['tasks']) <= set(maps)
        assert set(r['scope']) <= set(features)
        # Resolve dependencies for each proposed delivery as well as whole tasks.
        bundle_task = {'subtasks': [{'title': r['title'], 'caps': r['scope']}], 'conditional': [], 'enhancements': []}
        bundle = resolve_scope(bundle_task, {**data, 'common_enhancements': []}, features)
        package_ids = [p[0] for p in packages if any(features[fid]['package'] == p[0] for fid in bundle)]
        task_buttons = ''.join(f'<button type="button" data-select-task="{tid}" data-jump-task="true">{next(t["short"] for t in tasks if t["id"] == tid)}</button>' for tid in r['tasks'])
        cap_list = ''.join(f'<li>{feature_link(features[fid])} {escape(features[fid]["title"])}</li>' for fid in r['scope'])
        cards.append(f'''<article class="roadmap-step"><p class="eyebrow">Proposed increment {r['id'][1:]} · dates open</p><h3>{escape(r['title'])}</h3><p>{escape(r['outcome'])}</p>
<p class="saving"><strong>Where effort may reduce.</strong> {escape(r['saving'])}</p><p class="caption">{escape(r['boundary'])}</p><div class="task-links">{task_buttons}</div>
<details><summary>Selected scope from {', '.join(package_ids)}</summary><ul>{cap_list}</ul><p class="caption">Shared identity, review, exchange and feedback foundations are included. Hard prerequisites are included in the package list. This is a scoped delivery proposal, not completion of every feature in these packages.</p></details></article>''')
        markdown += [f'### {r["id"]}: {r["title"]}', '', r['outcome'], '', f'Potential effort reduction: {r["saving"]}', '', f'Selected capabilities: {", ".join(r["scope"])}. Packages including prerequisites: {", ".join(package_ids)}.', '', f'Boundary: {r["boundary"]}', '']
    roadmap = f'''<section id="executive-roadmap"><h2>Deliver usable workflows, drawing on several packages</h2><p>These are proposed increments for discussion. Each adds an activity colleagues can complete, using selected scope from several building blocks. Dates and effort savings remain open.</p><div class="roadmap-steps">{''.join(cards)}</div><div class="roadmap-note"><p><strong>Flexible order.</strong> Select usability, validation and model/data branches independently. Document production can start earlier from a usable baseline. Bring in live adapters where manual capture becomes the main friction.</p><p><strong>Before assigning months.</strong> Agree the examples, evidence scope and a completion check for each chosen increment. That is enough to estimate a bounded delivery without estimating the whole catalogue.</p></div></section>'''
    return mapping, roadmap, '\n'.join(markdown)


TASK_STYLE = """
[hidden]{display:none!important}section{scroll-margin-top:20px}.matrix-wrap{overflow:auto;border:1px solid #d8dfe4}.task-matrix{border-collapse:collapse;width:100%;min-width:1110px;font-size:13px}.task-matrix caption{text-align:left;padding:12px;font-weight:600;background:#f8fafc}.task-matrix th,.task-matrix td{border-bottom:1px solid #e2e8f0;padding:8px;vertical-align:middle;text-align:left}.task-matrix thead th{vertical-align:top}.task-matrix th:first-child{width:225px;position:sticky;left:0;background:white;z-index:1}.task-matrix th small{display:block;font-size:11px;font-weight:400;max-width:190px;color:#64748b}.task-matrix button{border:0;background:transparent;padding:5px;width:100%;text-align:left;font-size:12px;line-height:1.4}.task-matrix button span{display:block}.task-matrix thead button>span{font-weight:700;color:#315d7e;margin-bottom:4px}.task-matrix td button strong{display:block;color:#315d7e}.task-matrix td button span{font-size:11px;color:#64748b}.task-matrix .has-core{background:#f4f7fa}.task-matrix .is-selected{background:#dce9f2}.task-matrix th.is-selected{border-top:3px solid #315d7e}.no-scope{color:#94a3b8}.task-controls{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:28px 0 20px;padding:18px 0;border-top:1px solid #d8dfe4;border-bottom:1px solid #d8dfe4}.task-controls label{font-weight:600}.task-controls select{font:inherit;font-size:14px;max-width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:4px;background:#fff;color:#243746}.task-controls span{font-size:13px;color:#64748b}.task-panel>h3{font-size:21px;margin:12px 0}.task-outcome{font-size:17px;max-width:940px}.task-layout{display:grid;grid-template-columns:minmax(260px,.85fr) minmax(350px,1.15fr);gap:36px;margin-top:25px}.task-layout h4{font-size:16px;margin:0 0 10px}.subtasks{padding-left:24px}.subtasks li{padding:10px 0 16px}.subtasks li p{font-size:14px;margin:6px 0}.people{background:#f8fafc;padding:16px;font-size:14px}.people p{margin:8px 0 0}.scope-package{border-top:1px solid #d8dfe4;padding:16px 0;scroll-margin-top:20px}.scope-package>summary{cursor:pointer;line-height:1.5}.scope-package>summary>.caption{display:block;margin-top:5px}.scope-package>div{padding:12px 0 0}.scope-package:focus{outline:2px solid #315d7e;outline-offset:4px}.capability{border-bottom:1px solid #e2e8f0;font-size:13px}.capability summary{cursor:pointer;padding:9px 0;line-height:1.6}.capability>div{padding:8px 12px;background:#f8fafc}.badge{display:inline-block;font-size:10px;font-weight:600;border:1px solid #cbd5e1;border-radius:3px;padding:0 5px;margin-right:4px;white-space:nowrap}.badge.core{background:#315d7e;color:white;border-color:#315d7e}.badge.dependency{background:#e8eff4}.badge.conditional{border-style:dashed}.badge.enhancement{color:#64748b}.roadmap-steps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0 28px}.roadmap-step{padding:20px 0;border-top:2px solid #d8dfe4}.roadmap-step h3{font-size:19px}.roadmap-step p{font-size:14px}.roadmap-step .eyebrow{font-size:12px}.roadmap-step .saving{background:#f4f7fa;padding:12px}.roadmap-step details{font-size:13px;margin-top:12px}.roadmap-step summary{cursor:pointer}.roadmap-note{border-top:1px solid #d8dfe4;padding-top:18px;font-size:14px}.task-links{display:flex;flex-wrap:wrap;gap:6px}.task-links button{font-size:12px;padding:4px 7px}button:focus-visible,a:focus-visible,select:focus-visible{outline:2px solid #315d7e;outline-offset:3px}.archive>summary{cursor:pointer;font-size:18px;font-weight:600;padding:20px 0}.archive{margin-top:28px;border-top:1px solid #d8dfe4}@media(max-width:850px){.task-layout,.roadmap-steps{grid-template-columns:1fr}.task-controls select{width:100%}.matrix-wrap{max-width:100%}}@media print{.task-controls,.task-links{display:none}.matrix-wrap{overflow:visible}.task-matrix{min-width:0;font-size:9px}.task-matrix th:first-child{position:static;width:140px}.task-matrix button{font-size:9px}.task-matrix th small,.task-matrix td button span{font-size:8px}.task-layout{grid-template-columns:1fr 1.4fr}.roadmap-steps{grid-template-columns:repeat(3,1fr)}.roadmap-step,.scope-package{break-inside:avoid}.archive{display:none}}
"""

TASK_SCRIPT = """
(() => {
  const select = document.getElementById('task-choice');
  const ids = Array.from(select.options, o => o.value);
  function choose(id, packageId, jump) {
    if (!ids.includes(id)) return;
    select.value = id;
    document.querySelectorAll('[data-panel]').forEach(p => { p.hidden = p.dataset.panel !== id; });
    document.querySelectorAll('[data-column]').forEach(c => c.classList.toggle('is-selected', c.dataset.column === id));
    document.querySelectorAll('thead [data-select-task]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.selectTask === id)));
    const index = ids.indexOf(id);
    document.getElementById('task-position').textContent = `Task ${index + 1} of ${ids.length}`;
    document.getElementById('previous-task').disabled = index === 0;
    document.getElementById('next-task').disabled = index === ids.length - 1;
    if (packageId) {
      const section = document.getElementById(`scope-${id}-${packageId}`);
      if (section) { section.open = true; section.scrollIntoView({block: 'start'}); section.focus({preventScroll: true}); }
    } else if (jump) {
      document.getElementById(`task-${id}`).scrollIntoView({block: 'start'});
    }
  }
  select.addEventListener('change', () => choose(select.value));
  document.querySelectorAll('[data-select-task]').forEach(b => b.addEventListener('click', () => choose(b.dataset.selectTask, b.dataset.package, b.dataset.jumpTask === 'true')));
  document.getElementById('previous-task').addEventListener('click', () => choose(ids[ids.indexOf(select.value) - 1]));
  document.getElementById('next-task').addEventListener('click', () => choose(ids[ids.indexOf(select.value) + 1]));
  function revealHash() {
    const hash = location.hash.slice(1);
    if (hash.startsWith('task-') && ids.includes(hash.slice(5))) choose(hash.slice(5));
    if (hash === 'reference' || hash.startsWith('package-') || ['sequence', 'packages', 'pilot'].includes(hash)) {
      document.getElementById('reference').open = true;
    }
  }
  choose(ids[0]);
  revealHash();
  window.addEventListener('hashchange', revealHash);
})();
"""
