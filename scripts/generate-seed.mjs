import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const evidence = [];

function addGroup(prefix, type, owner, entries) {
  entries.forEach((entry, index) => {
    const number = String(index + 1).padStart(3, '0');
    const id = `${prefix}-${number}`;
    const status = entry.status ?? 'approved';
    evidence.push({
      id,
      versionId: `${id}-v1.0`,
      version: '1.0',
      type,
      title: entry.title,
      statement: entry.statement,
      rationale: entry.rationale ?? `Defines controlled ${type.replaceAll('_', ' ')} evidence for RhythmReview.`,
      owner,
      criticality: entry.criticality ?? 'medium',
      jurisdictions: entry.jurisdictions ?? ['US', 'EU'],
      status,
      sources: entry.sources ?? ['RhythmReview fictional design baseline RR-1.0'],
      flags: entry.flags ?? [],
      approvedBy: status === 'approved' ? 'Jamie Chen · QA reviewer' : null,
      approvedAt: status === 'approved' ? '2026-08-14T10:00:00.000Z' : null,
    });
  });
}

addGroup('IU', 'intended_use', 'Regulatory', [
  { title: 'Intended use', statement: 'RhythmReview analyses a 30-second single-lead ECG recording to assist a qualified clinician in identifying possible atrial fibrillation in adults aged 22 and over. It is not intended for continuous monitoring, emergency use, or standalone diagnosis.', criticality: 'high' },
]);

addGroup('CLM', 'claim', 'Regulatory', [
  { title: 'Possible AF indication', statement: 'RhythmReview identifies ECG recordings that may show atrial fibrillation for clinician review.', criticality: 'high' },
  { title: 'Three controlled outcomes', statement: 'The application reports Possible AF, No AF detected, or Unreadable recording.', criticality: 'high' },
  { title: 'Time to result', statement: 'For supported recordings, the application returns a result within 30 seconds after upload completes.', criticality: 'medium' },
  { title: 'Clinician decision support', statement: 'The result informs but does not replace clinical judgement or diagnostic confirmation.', criticality: 'high' },
]);

addGroup('UN', 'user_need', 'Product', [
  { title: 'Upload a short ECG', statement: 'The clinician needs to submit a 30-second single-lead ECG without reformatting the signal.', criticality: 'medium' },
  { title: 'Recognise unusable signals', statement: 'The clinician needs a clear indication when signal quality is insufficient for analysis.', criticality: 'high' },
  { title: 'Interpret the result correctly', statement: 'The clinician needs result wording that makes the need for professional review unambiguous.', criticality: 'high' },
  { title: 'Receive a timely result', statement: 'The clinician needs a result quickly enough to use during the active review workflow.', criticality: 'high' },
  { title: 'Know the use limitations', statement: 'The clinician needs visible warnings that RhythmReview is not for emergencies or standalone diagnosis.', criticality: 'high' },
  { title: 'Trust the analysed version', statement: 'The clinician needs the application to use only the released and validated algorithm version.', criticality: 'high' },
  { title: 'Protect ECG data', statement: 'The organisation needs ECG recordings and results protected during transfer and storage.', criticality: 'high' },
  { title: 'Review an accountable history', statement: 'Quality staff need an audit history of uploads, results, acknowledgements, and released versions.', criticality: 'medium' },
]);

addGroup('REQ', 'requirement', 'Engineering', [
  { title: 'Supported recording duration', statement: 'The system shall accept a single-lead ECG recording with a duration of 30 seconds ± 1 second.', criticality: 'high' },
  { title: 'Supported sampling rate', statement: 'The system shall accept sampling rates from 250 Hz through 500 Hz and reject unsupported rates.', criticality: 'medium' },
  { title: 'Signal quality gate', statement: 'The system shall classify a recording as Unreadable when the released signal-quality threshold is not met.', criticality: 'high' },
  { title: 'Maximum analysis time', statement: 'The system shall display a controlled result no later than 30 seconds after a valid upload completes.', criticality: 'high' },
  { title: 'Controlled timeout', statement: 'The system shall stop analysis and display a controlled failure message if no result is available after 35 seconds.', criticality: 'high' },
  { title: 'Permitted result classes', statement: 'The system shall produce only Possible AF, No AF detected, or Unreadable recording.', criticality: 'high' },
  { title: 'Possible AF display copy', statement: 'For a positive triage result, the interface shall display “Possible AF” and a clinician-review prompt.', criticality: 'high' },
  { title: 'Result acknowledgement', statement: 'The system shall require the clinician to acknowledge the result before closing the review.', criticality: 'medium' },
  { title: 'Emergency-use warning', statement: 'The upload screen shall state that RhythmReview is not intended for emergency assessment.', criticality: 'high' },
  { title: 'Audit event capture', statement: 'The system shall record the user, timestamp, model version, input identifier, result, and acknowledgement event.', criticality: 'medium' },
  { title: 'Transport encryption', statement: 'The system shall protect ECG and result data in transit using the organisation’s approved encrypted protocol.', criticality: 'high' },
  { title: 'Role restriction', statement: 'Only users assigned the clinician role shall initiate ECG analysis or view patient-linked results.', criticality: 'high' },
  { title: 'Locked model version', statement: 'Production analysis shall execute only the algorithm version identified in the approved release baseline.', criticality: 'high' },
  { title: 'Internal confidence handling', statement: 'Internal confidence values shall not be presented as diagnostic probabilities to the clinician.', criticality: 'medium' },
  { title: 'Recording retention', statement: 'The service shall delete uploaded ECG payloads after the configured clinical retention period expires.', criticality: 'medium' },
  { title: 'Recoverable service failure', statement: 'The interface shall preserve the upload reference and permit a controlled retry after a transient service failure.', criticality: 'medium' },
]);

addGroup('HAZ', 'hazard', 'Risk management', [
  { title: 'False negative delays care', statement: 'A false No AF detected result may delay further clinical assessment.', criticality: 'high' },
  { title: 'False positive drives unnecessary action', statement: 'A false Possible AF result may lead to unnecessary testing or treatment.', criticality: 'high' },
  { title: 'Late result disrupts review', statement: 'An unexpectedly delayed result may cause the clinician to proceed without reviewing the output.', criticality: 'high' },
  { title: 'Poor signal produces misleading result', statement: 'An artefact-heavy recording may be classified instead of rejected as unreadable.', criticality: 'high' },
  { title: 'Unsupported population used', statement: 'Performance may be unknown when the application is used outside the validated adult population.', criticality: 'high' },
  { title: 'Decision-support result treated as diagnosis', statement: 'A user may treat the triage output as diagnostic confirmation.', criticality: 'high' },
  { title: 'ECG data disclosed', statement: 'ECG recordings or result data may be exposed to an unauthorised party.', criticality: 'high' },
  { title: 'Service unavailable during review', statement: 'Loss of service may interrupt a clinician’s review workflow.', criticality: 'medium' },
]);

addGroup('RC', 'risk_control', 'Risk management', [
  { title: 'Sensitivity acceptance criterion', statement: 'Release testing shall demonstrate sensitivity at or above the approved threshold for the intended population.', criticality: 'high' },
  { title: 'Specificity acceptance criterion', statement: 'Release testing shall demonstrate specificity at or above the approved threshold for the intended population.', criticality: 'high' },
  { title: 'Visible analysis timer', statement: 'The interface shall show analysis progress and a controlled timeout message before the workflow deadline.', criticality: 'high' },
  { title: 'Signal quality rejection', statement: 'The quality gate shall route low-quality recordings to Unreadable before rhythm classification.', criticality: 'high' },
  { title: 'Population restriction', statement: 'Labelling and interface controls shall restrict use to adults aged 22 and over.', criticality: 'high', flags: ['missing_verification_link'] },
  { title: 'Decision-support disclaimer', statement: 'Every result view shall state that the output requires clinician interpretation and is not a diagnosis.', criticality: 'high' },
  { title: 'Encryption and access control', statement: 'The service shall combine encrypted transport, least-privilege roles, and access logging.', criticality: 'high' },
  { title: 'Controlled retry path', statement: 'Service failures shall produce a safe state with no clinical classification and an explicit retry option.', criticality: 'medium' },
  { title: 'Released-model enforcement', statement: 'Deployment shall block models whose identifier is absent from the approved release configuration.', criticality: 'high' },
]);

addGroup('DES', 'design', 'Engineering', [
  { title: 'Upload gateway', statement: 'Validates file shape, duration, sampling metadata, role, and transfer integrity before accepting an ECG.', criticality: 'high' },
  { title: 'Analysis orchestrator', statement: 'Coordinates quality assessment, locked-model inference, timing control, and result persistence.', criticality: 'high' },
  { title: 'Clinician result panel', statement: 'Renders the three permitted results, review prompt, limitations, and acknowledgement control.', criticality: 'high' },
  { title: 'Timeout supervisor', statement: 'Tracks elapsed analysis time and transitions the request to a controlled failure state.', criticality: 'high' },
  { title: 'Audit ledger', statement: 'Stores immutable workflow events and released component identifiers.', criticality: 'medium' },
  { title: 'PDF evidence exporter', statement: 'Produces an administrative PDF copy of completed audit events for internal review.', criticality: 'low', flags: ['plausible_irrelevant_item'] },
  { title: 'Telemetry monitor', statement: 'Collects service health and analysis-latency metrics without ECG signal payloads.', criticality: 'medium', flags: ['missing_from_component_inventory'] },
]);

addGroup('TEST', 'test', 'Verification', [
  { title: 'Recording boundary verification', statement: 'Verify acceptance at 29, 30, and 31 seconds and rejection outside the specified tolerance.', criticality: 'high' },
  { title: 'Sampling-rate verification', statement: 'Verify supported and unsupported sampling rates at every boundary.', criticality: 'medium' },
  { title: 'Analysis-time verification', statement: 'Verify the 95th percentile and worst-case valid-upload result time remain at or below 30 seconds.', criticality: 'high' },
  { title: 'Timeout verification', statement: 'Verify analysis stops at 35 seconds and produces no rhythm classification.', criticality: 'high' },
  { title: 'Result-copy verification', statement: 'Verify each controlled output and clinician-review prompt against the approved copy specification.', criticality: 'high' },
  { title: 'Signal-quality challenge', statement: 'Verify noisy, truncated, flat-line, and saturated signals are routed to Unreadable.', criticality: 'high' },
  { title: 'Clinical workflow validation', statement: 'Representative clinicians shall correctly interpret each output and its limitations in simulated use.', criticality: 'high' },
  { title: 'Failure recovery verification', statement: 'Verify retry behaviour after network, inference, and persistence failures.', criticality: 'medium' },
  { title: 'Legacy timing result', statement: 'Historical build RR-0.8 returned results within 45 seconds under the retired infrastructure.', criticality: 'medium', status: 'superseded', flags: ['superseded_result_referenced'] },
  { title: 'Security control verification', statement: 'Verify transport encryption, access restrictions, and audit records in the release environment.', criticality: 'high' },
  { title: 'Model-version enforcement', statement: 'Verify unapproved model identifiers cannot enter service and produce no result.', criticality: 'high' },
  { title: 'Retention verification', statement: 'Verify ECG payload deletion at the configured retention boundary while audit metadata remains.', criticality: 'medium' },
]);

addGroup('CE', 'clinical_evidence', 'Clinical', [
  { title: 'Adult performance study', statement: 'Retrospective multi-site study supporting AF triage performance in adults aged 22 and over.', criticality: 'high' },
  { title: 'Subgroup analysis', statement: 'Performance analysis by age, sex, site, device source, and clinically relevant rhythm subgroup.', criticality: 'high' },
  { title: 'Clinical workflow study', statement: 'Simulated-use study assessing result interpretation, acknowledgement, and referral decisions by clinicians.', criticality: 'high' },
]);

addGroup('LBL', 'label', 'Regulatory', [
  { title: 'Possible AF result label', statement: 'Possible AF. Review the ECG and assess the patient using your clinical judgement.', criticality: 'high' },
  { title: 'Time-to-result statement', statement: 'RhythmReview usually provides a result within 35 seconds of upload.', criticality: 'medium', flags: ['inconsistent_timing_value'] },
  { title: 'Clinical claim statement', statement: 'RhythmReview confirms atrial fibrillation from a single-lead ECG recording.', criticality: 'high', flags: ['overstated_claim'] },
  { title: 'Use limitation', statement: 'For adults aged 22 and over. Not for emergencies, continuous monitoring, or use as a standalone diagnosis.', criticality: 'high' },
]);

if (evidence.length !== 72) throw new Error(`Expected 72 evidence items, got ${evidence.length}`);

const relationships = [];
const seen = new Set();
function relate(sourceId, targetId, type) {
  if (sourceId === targetId) return;
  const key = `${sourceId}|${targetId}|${type}`;
  if (seen.has(key)) return;
  seen.add(key);
  relationships.push({ id: `REL-${String(relationships.length + 1).padStart(3, '0')}`, sourceId, targetId, type, baselineId: 'BL-RR-1.0', active: true });
}

for (let i = 1; i <= 4; i += 1) relate(`CLM-${String(i).padStart(3, '0')}`, 'IU-001', 'REFINES');
for (let i = 1; i <= 8; i += 1) relate(`UN-${String(i).padStart(3, '0')}`, 'IU-001', 'REFINES');
for (let i = 1; i <= 16; i += 1) relate(`REQ-${String(i).padStart(3, '0')}`, `UN-${String(((i - 1) % 8) + 1).padStart(3, '0')}`, 'REFINES');
for (let i = 1; i <= 8; i += 1) relate(`HAZ-${String(i).padStart(3, '0')}`, 'IU-001', 'MAY_AFFECT');
for (let i = 1; i <= 9; i += 1) relate(`RC-${String(i).padStart(3, '0')}`, `HAZ-${String(((i - 1) % 8) + 1).padStart(3, '0')}`, 'MITIGATES');
for (let i = 1; i <= 16; i += 1) relate(`DES-${String(((i - 1) % 7) + 1).padStart(3, '0')}`, `REQ-${String(i).padStart(3, '0')}`, 'IMPLEMENTS');
for (let i = 1; i <= 16; i += 1) relate(`TEST-${String(((i - 1) % 12) + 1).padStart(3, '0')}`, `REQ-${String(i).padStart(3, '0')}`, 'VERIFIES');
for (let i = 1; i <= 9; i += 1) if (i !== 5) relate(`TEST-${String(((i + 4) % 12) + 1).padStart(3, '0')}`, `RC-${String(i).padStart(3, '0')}`, 'VERIFIES');
for (let i = 1; i <= 4; i += 1) relate(`CLM-${String(i).padStart(3, '0')}`, `CE-${String(((i - 1) % 3) + 1).padStart(3, '0')}`, 'SUPPORTED_BY');
for (let i = 1; i <= 4; i += 1) relate(`CLM-${String(i).padStart(3, '0')}`, `LBL-${String(i).padStart(3, '0')}`, 'DISCLOSED_IN');
for (let i = 1; i <= 6; i += 1) relate(`DES-${String(i).padStart(3, '0')}`, `DES-${String(i + 1).padStart(3, '0')}`, 'DEPENDS_ON');

const additionalImpactPairs = [
  ['REQ-004','HAZ-003'],['REQ-005','HAZ-003'],['REQ-007','HAZ-006'],['REQ-009','HAZ-006'],['REQ-011','HAZ-007'],
  ['REQ-012','HAZ-007'],['REQ-013','HAZ-001'],['REQ-015','HAZ-007'],['REQ-016','HAZ-008'],['LBL-001','UN-003'],
  ['LBL-002','UN-004'],['LBL-003','HAZ-006'],['LBL-004','HAZ-005'],['CE-001','HAZ-005'],['CE-002','HAZ-005'],
  ['TEST-007','UN-003'],['TEST-007','UN-005'],['TEST-003','UN-004'],['DES-007','REQ-004'],
];
additionalImpactPairs.forEach(([sourceId,targetId]) => relate(sourceId,targetId,'MAY_AFFECT'));
if (relationships.length !== 118) throw new Error(`Expected 118 relationships, got ${relationships.length}`);

const documents = [
  { id:'DOC-001', code:'PDD', title:'Product and intended-use definition', description:'Controlled product purpose, users, population, claims, and exclusions.', types:['intended_use','claim'] },
  { id:'DOC-002', code:'UNS', title:'User-needs specification', description:'The needs that anchor the system and software requirements.', types:['user_need'] },
  { id:'DOC-003', code:'SRS', title:'Software requirements specification', description:'Atomic, testable requirements for the released system.', types:['requirement'] },
  { id:'DOC-004', code:'RMS', title:'Risk-management summary', description:'Hazards, hazardous situations, and their risk controls.', types:['hazard','risk_control'] },
  { id:'DOC-005', code:'SAD', title:'Software architecture and design', description:'Components that implement controlled requirements.', types:['design','requirement'] },
  { id:'DOC-006', code:'CCI', title:'Component and cybersecurity inventory', description:'Released components and security-relevant controls.', types:['design'], excludeFlags:['missing_from_component_inventory'] },
  { id:'DOC-007', code:'VVP', title:'Verification and validation plan', description:'Planned verification of requirements and controls.', types:['requirement','risk_control','test'] },
  { id:'DOC-008', code:'VVR', title:'Verification and validation report', description:'Released test evidence, including one deliberately stale reference.', types:['test'] },
  { id:'DOC-009', code:'CES', title:'Clinical-evaluation summary', description:'Clinical evidence supporting the intended use and claims.', types:['clinical_evidence','claim'] },
  { id:'DOC-010', code:'IFU', title:'Labelling and instructions for use', description:'Clinician-facing claims, warnings, results, and limitations.', types:['label','intended_use'] },
];

const scenarioDefinitions = [
  {
    id:'SCN-001', number:'01', slug:'wording', title:'Clarify result wording', scale:'Narrow impact', anchorId:'LBL-001',
    proposedText:'Possible atrial fibrillation; clinician review required.',
    rationale:'Make the result explicit and reduce the chance that a user reads the abbreviation as a diagnosis.',
    expected:['LBL-001','REQ-007','DES-003','TEST-005','UN-003','CLM-002'],
    critical:['LBL-001','REQ-007','TEST-005'], nonImpacts:['CE-001','REQ-013','DES-006'],
    drafts:[
      { itemId:'LBL-001',text:'Possible atrial fibrillation; clinician review required.' },
      { itemId:'REQ-007',text:'For a positive triage result, the interface shall display “Possible atrial fibrillation; clinician review required.”' },
      { itemId:'DES-003',text:'Renders the three permitted results, including the controlled Possible atrial fibrillation wording and clinician-review requirement, plus limitations and the acknowledgement control.' },
      { itemId:'TEST-005',text:'Verify the exact text of each controlled output and clinician-review prompt, including “Possible atrial fibrillation; clinician review required.”, against the approved copy specification.' },
    ],
    presenter:'Start with a wording change that looks trivial. Follow the path from label to interface requirement, result panel, and copy verification. Point out that the algorithm and clinical performance evidence stay out of the update set.',
    metrics:{ manual:{recall:100,precision:100,minutes:16}, chat:{recall:83,precision:71,minutes:10}, structured:{recall:100,precision:86,minutes:6} },
  },
  {
    id:'SCN-002', number:'02', slug:'timing', title:'Extend analysis time', scale:'Moderate impact', anchorId:'REQ-004',
    proposedText:'The system shall display a controlled result no later than 60 seconds after a valid upload completes.',
    rationale:'Support a more computationally demanding released algorithm while preserving a controlled clinician workflow.',
    expected:['REQ-004','UN-004','HAZ-003','RC-003','DES-002','TEST-003','TEST-004','LBL-002','REQ-005','DES-004','TEST-007'],
    critical:['REQ-004','HAZ-003','RC-003','TEST-003','TEST-004'], nonImpacts:['CE-001','REQ-011','DES-006'],
    drafts:[
      { itemId:'REQ-004',text:'The system shall display a controlled result no later than 60 seconds after a valid upload completes.' },
      { itemId:'DES-002',text:'Coordinates quality assessment, locked-model inference, result persistence, and timing control for a maximum 60-second result window.' },
      { itemId:'TEST-003',text:'Verify that the 95th percentile and worst-case valid-upload result time remain at or below 60 seconds.' },
      { itemId:'TEST-004',text:'Verify that analysis stops at 65 seconds and produces no rhythm classification when no controlled result is available.' },
      { itemId:'LBL-002',text:'RhythmReview provides a controlled result within 60 seconds of a valid upload.' },
      { itemId:'REQ-005',text:'The system shall stop analysis and display a controlled failure message if no result is available after 65 seconds.' },
      { itemId:'DES-004',text:'Tracks elapsed analysis time, enforces the 60-second result deadline, and transitions the request to a controlled failure state at 65 seconds.' },
      { itemId:'TEST-007',text:'Representative clinicians shall correctly interpret each output and its limitations in simulated use with result delivery times up to 60 seconds.' },
    ],
    presenter:'Change one performance requirement from 30 to 60 seconds. Show deterministic trace paths first, then the related items found from text. Review the timeout contradiction and the effect on clinical workflow validation.',
    metrics:{ manual:{recall:91,precision:83,minutes:28}, chat:{recall:73,precision:62,minutes:19}, structured:{recall:100,precision:79,minutes:13} },
  },
  {
    id:'SCN-003', number:'03', slug:'population', title:'Expand to adolescents', scale:'Broad impact', anchorId:'IU-001',
    proposedText:'RhythmReview analyses a 30-second single-lead ECG recording to assist a qualified clinician in identifying possible atrial fibrillation in patients aged 12 and over.',
    rationale:'Expand the intended population to include adolescent patients aged 12 through 21.',
    expected:['IU-001','CLM-001','CLM-004','UN-001','UN-003','UN-005','REQ-001','REQ-003','REQ-009','HAZ-001','HAZ-002','HAZ-005','RC-001','RC-002','RC-005','TEST-006','TEST-007','CE-001','CE-002'],
    critical:['IU-001','HAZ-005','RC-005','CE-001','CE-002'], nonImpacts:['REQ-011','REQ-015','DES-006'],
    drafts:[
      { itemId:'IU-001',text:'RhythmReview analyses a 30-second single-lead ECG recording to assist a qualified clinician in identifying possible atrial fibrillation in patients aged 12 and over. It is not intended for continuous monitoring, emergency use, or standalone diagnosis.' },
      { itemId:'REQ-001',text:'The system shall accept a single-lead ECG recording with a duration of 30 seconds ± 1 second for each age group in the approved population.' },
      { itemId:'REQ-003',text:'The system shall classify a recording as Unreadable when the released signal-quality threshold validated for the approved population is not met.' },
      { itemId:'REQ-009',text:'The upload screen shall state that RhythmReview is not intended for emergency assessment and is approved only for patients aged 12 and over.' },
      { itemId:'TEST-006',text:'Verify that noisy, truncated, flat-line, and saturated signals from adult and adolescent validation sets are routed to Unreadable.' },
      { itemId:'TEST-007',text:'Representative clinicians shall correctly interpret each output, its limitations, and the use of RhythmReview for patients aged 12 and over in simulated use.' },
    ],
    presenter:'Use the population expansion to test recall. The change must reach clinical evidence, subgroup performance, risk, usability, labelling, and validation. A polished wording update alone is a failure.',
    metrics:{ manual:{recall:89,precision:88,minutes:48}, chat:{recall:68,precision:55,minutes:31}, structured:{recall:89,precision:74,minutes:21} },
  },
];

const itemById = new Map(evidence.map((item) => [item.id, item]));
const actionFor = (type) => type === 'test' ? 'retest' : type === 'design' || type === 'requirement' || type === 'label' || type === 'intended_use' ? 'update' : 'review';
const rationaleByScenario = {
  'SCN-001':{
    'LBL-001':'The controlled result label is the wording being changed and needs a new approved version.',
    'REQ-007':'The display requirement contains the old “Possible AF” copy and must match the proposed wording.',
    'DES-003':'The result panel renders the controlled copy and clinician-review prompt, so its design description must match the revised text.',
    'TEST-005':'Copy verification must be rerun against the newly approved result wording and clinician-review prompt.',
    'UN-003':'QA must confirm that the new text still makes professional review unambiguous.',
    'CLM-002':'QA must confirm that spelling out atrial fibrillation does not change the approved three-outcome claim.',
  },
  'SCN-002':{
    'REQ-004':'The maximum result time is the controlled requirement being changed from 30 to 60 seconds.',
    'UN-004':'QA must confirm that a 60-second result still supports the active clinician review workflow.',
    'HAZ-003':'The longer result window may increase the chance that a clinician proceeds before reviewing the output.',
    'RC-003':'The progress indicator and timeout message must remain effective across the longer analysis window.',
    'DES-002':'The orchestrator enforces analysis timing and must support the new 60-second result deadline.',
    'TEST-003':'Timing verification uses the old 30-second acceptance limit and must be rerun at 60 seconds.',
    'TEST-004':'The current 35-second timeout conflicts with a permitted 60-second analysis and needs a new boundary test.',
    'LBL-002':'The time-to-result label says 35 seconds and must agree with the new controlled timing claim.',
    'REQ-005':'The 35-second controlled timeout would stop analysis before the proposed 60-second result deadline.',
    'DES-004':'The timeout supervisor implements the current 35-second limit and must enforce the revised boundaries.',
    'TEST-007':'Workflow validation must confirm that clinicians can use results delivered near the new 60-second limit.',
  },
  'SCN-003':{
    'IU-001':'The intended population is being expanded from adults aged 22 and over to patients aged 12 and over.',
    'CLM-001':'QA must confirm that the indication is supported for adolescents before the population claim changes.',
    'CLM-004':'QA must confirm that the decision-support limitation remains adequate for adolescent use.',
    'UN-001':'QA must confirm that adolescent recordings use the same supported format and duration.',
    'UN-003':'QA must review whether clinicians need different result interpretation guidance for adolescent patients.',
    'UN-005':'The user need for visible limitations must cover the expanded age boundary.',
    'REQ-001':'The recording input requirement must be reviewed for the expanded population and its validation data.',
    'REQ-003':'Signal-quality thresholds may perform differently in adolescent ECG recordings and need controlled evidence.',
    'REQ-009':'The upload warning must state the revised lower age boundary with the existing emergency-use limitation.',
    'HAZ-001':'False-negative risk must be reassessed for adolescents because adult performance cannot be assumed.',
    'HAZ-002':'False-positive risk must be reassessed for adolescents because prevalence and performance may differ.',
    'HAZ-005':'The unsupported-population hazard changes directly when patients aged 12 through 21 enter the intended use.',
    'RC-001':'The sensitivity acceptance criterion must be reviewed against evidence for the expanded population.',
    'RC-002':'The specificity acceptance criterion must be reviewed against evidence for the expanded population.',
    'RC-005':'The population restriction control must change from adults aged 22 and over and gain verification coverage.',
    'TEST-006':'Signal-quality challenge testing must include representative adolescent recordings.',
    'TEST-007':'Clinical workflow validation must cover clinicians interpreting results for adolescent patients.',
    'CE-001':'The adult performance study does not support patients aged 12 through 21 and needs a documented applicability review.',
    'CE-002':'The subgroup analysis must add and evaluate the adolescent age groups in the proposed population.',
  },
};
const semanticByScenario = {
  'SCN-001':new Set(['TEST-005']),
  'SCN-002':new Set(['LBL-002','TEST-007']),
  'SCN-003':new Set(['CE-001','CE-002']),
};

function shortestPath(start,target,maxDepth = 3) {
  if (start === target) return [start];
  const adjacency = new Map();
  for (const relation of relationships) {
    adjacency.set(relation.sourceId,[...(adjacency.get(relation.sourceId) ?? []),relation.targetId]);
    adjacency.set(relation.targetId,[...(adjacency.get(relation.targetId) ?? []),relation.sourceId]);
  }
  const queue = [{ id:start,path:[start] }];
  const visited = new Set([start]);
  while (queue.length > 0) {
    const current = queue.shift();
    if (current.path.length > maxDepth) continue;
    for (const neighbour of adjacency.get(current.id) ?? []) {
      if (visited.has(neighbour)) continue;
      const path = [...current.path,neighbour];
      if (neighbour === target) return path;
      visited.add(neighbour);
      queue.push({ id:neighbour,path });
    }
  }
  return null;
}
const replayRuns = scenarioDefinitions.map((scenario) => ({
  id:`RUN-${scenario.number}-REPLAY`, scenarioId:scenario.id, name:'Locked replay fixture', model:'saved-output-no-api', promptVersion:'impact-replay-v2',
  suggestions:scenario.expected.map((targetId,index) => {
    const item = itemById.get(targetId);
    const semantic = semanticByScenario[scenario.id].has(targetId);
    const linkedPath = shortestPath(scenario.anchorId,targetId);
    return {
      id:`SUG-${scenario.number}-${String(index + 1).padStart(2,'0')}`,
      targetId,
      action:actionFor(item.type),
      origin:semantic || !linkedPath ? 'semantic' : 'linked',
      rationale:rationaleByScenario[scenario.id][targetId],
      path:semantic || !linkedPath ? [targetId] : linkedPath,
      citations:targetId === scenario.anchorId ? [scenario.anchorId] : [scenario.anchorId,targetId],
      critical:scenario.critical.includes(targetId),
      decision:'pending',
    };
  }),
}));

const seed = {
  generatedAt:'2026-09-03T00:00:00.000Z',
  product:{ name:'RhythmReview', baselineId:'BL-RR-1.0', baselineLabel:'RR-1.0', description:'Clinician-facing ECG triage application', population:'Adults aged 22 and over', algorithm:'Locked model', evidenceCount:72, relationshipCount:118 },
  baseline:{ id:'BL-RR-1.0', label:'RR-1.0', status:'approved', approvedBy:'Jamie Chen · QA reviewer', approvedAt:'2026-08-14T10:00:00.000Z' },
  evidence,
  relationships,
  documents,
  scenarios:scenarioDefinitions,
  replayRuns,
};

const destination = resolve('lib/data/seed.json');
mkdirSync(dirname(destination), { recursive:true });
writeFileSync(destination, `${JSON.stringify(seed,null,2)}\n`);
console.log(`Generated ${evidence.length} evidence items, ${relationships.length} relationships, ${documents.length} documents, and ${scenarioDefinitions.length} scenarios.`);
