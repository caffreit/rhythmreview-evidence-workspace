export const SOURCE_SEED = [
  {
    id:'SRC-001',revisionId:'SRV-001-01',title:'Product discovery call',kind:'transcript' as const,capturedAt:'2026-08-18T09:30:00.000Z',
    content:`00:42 Product manager: RhythmReview is used by qualified clinicians reviewing a 30-second single-lead ECG recording for adults aged 22 and over.

05:18 Clinical lead: The result should make it clear that the output indicates possible atrial fibrillation. It cannot confirm a diagnosis and should always prompt clinical review.

12:14 Product manager: A completed analysis should normally appear within 30 seconds after the recording is submitted.

18:02 Engineering lead: The latest service design allows up to 60 seconds during peak load. We have not agreed whether 30 seconds is a hard limit or only the target shown to users.

24:36 Clinical lead: If analysis cannot complete, the clinician needs a clear failure state and the recording must remain available for another attempt.

31:10 Product manager: We still need to decide whether the user or the clinical administrator owns escalation after repeated analysis failures.`,
  },
  {
    id:'SRC-002',revisionId:'SRV-002-01',title:'Discovery follow-up notes',kind:'meeting_notes' as const,capturedAt:'2026-08-19T14:00:00.000Z',
    content:`RhythmReview follow-up

- Intended users remain qualified clinicians. Administrators configure access but do not interpret results.
- The analysis result must identify the recording and acquisition time used for the result.
- Clinicians asked for a visible record of algorithm version and analysis time.
- Offline review was discussed but no decision was made. The current product requires a network connection.
- Repeated failure escalation is still owned jointly by Product and Clinical Operations until the operating procedure is agreed.`,
  },
  {
    id:'SRC-003',revisionId:'SRV-003-01',title:'Clinical workflow email thread',kind:'email_thread' as const,capturedAt:'2026-08-21T11:12:00.000Z',
    content:`From: Clinical Operations
Subject: RhythmReview result wording

Please keep the wording at "possible atrial fibrillation" and retain the direction to review the ECG and patient context. We cannot present the result as a diagnosis.

From: Product

Agreed. We also need an audit view showing which clinician reviewed the result and when. Email alerts were suggested, but they are not approved for this release.

From: Quality

Please trace any new result wording to the intended-use statement, the relevant user need, the software requirement, the result-panel component, and verification evidence.`,
  },
] as const;

export const sourceContextReplay = (sourceId:string,revisionId:string) => {
  if (sourceId === 'SRC-001') return { questions:[
    { kind:'contradiction' as const,severity:'required' as const,question:'Is 30 seconds a mandatory maximum result time or a user-facing performance target that may extend to 60 seconds at peak load?',rationale:'The transcript gives two incompatible timing expectations that would produce different requirements.',citations:[
      { sourceRevisionId:revisionId,label:'12:14',quote:'A completed analysis should normally appear within 30 seconds after the recording is submitted.' },
      { sourceRevisionId:revisionId,label:'18:02',quote:'The latest service design allows up to 60 seconds during peak load.' },
    ] },
    { kind:'missing_decision' as const,severity:'advisory' as const,question:'Who owns escalation after repeated analysis failures?',rationale:'The source identifies an unresolved operating responsibility that may affect workflow requirements.',citations:[
      { sourceRevisionId:revisionId,label:'31:10',quote:'We still need to decide whether the user or the clinical administrator owns escalation after repeated analysis failures.' },
    ] },
  ] };
  if (sourceId === 'SRC-002') return { questions:[
    { kind:'scope' as const,severity:'advisory' as const,question:'Should offline review remain outside the current release scope?',rationale:'Offline operation was discussed but the current product requires a network connection.',citations:[{ sourceRevisionId:revisionId,label:'Follow-up note 4',quote:'Offline review was discussed but no decision was made. The current product requires a network connection.' }] },
  ] };
  return { questions:[
    { kind:'scope' as const,severity:'advisory' as const,question:'Should email alerts remain excluded from this release?',rationale:'The source records a suggestion and an explicit lack of approval.',citations:[{ sourceRevisionId:revisionId,label:'Product reply',quote:'Email alerts were suggested, but they are not approved for this release.' }] },
  ] };
};

export const userNeedsReplay = (sourceId:string,revisionId:string) => {
  if (sourceId === 'SRC-001') return { candidates:[
    { title:'Review a clearly qualified analysis result',statement:'As a qualified clinician, I need the analysis result to state that atrial fibrillation is possible rather than confirmed so that I retain responsibility for diagnosis.',rationale:'Preserves the decision-support role described by the clinical lead.',level:'product' as const,parentIds:[],citations:[{ sourceRevisionId:revisionId,label:'05:18',quote:'the output indicates possible atrial fibrillation. It cannot confirm a diagnosis and should always prompt clinical review.' }] },
    { title:'Receive a timely result',statement:'As a reviewing clinician, I need a completed analysis within the approved response-time limit so that the result can support the active clinical review.',rationale:'Captures the timing need after the required timing question is resolved.',level:'product' as const,parentIds:[],citations:[{ sourceRevisionId:revisionId,label:'12:14 and clarification answer',quote:'A completed analysis should normally appear within 30 seconds after the recording is submitted.' }] },
    { title:'Recover from an unsuccessful analysis',statement:'As a reviewing clinician, I need a clear failure state and access to the original recording so that I can retry or follow the approved escalation process.',rationale:'Captures the stated recovery need without choosing an escalation owner.',level:'product' as const,parentIds:[],citations:[{ sourceRevisionId:revisionId,label:'24:36',quote:'If analysis cannot complete, the clinician needs a clear failure state and the recording must remain available for another attempt.' }] },
  ] };
  if (sourceId === 'SRC-002') return { candidates:[
    { title:'Identify the analyzed recording',statement:'As a reviewing clinician, I need each result to identify its recording and acquisition time so that I can confirm the result belongs to the intended ECG.',rationale:'Captures the traceability need in the follow-up notes.',level:'product' as const,parentIds:[],citations:[{ sourceRevisionId:revisionId,label:'Follow-up note 2',quote:'The analysis result must identify the recording and acquisition time used for the result.' }] },
  ] };
  return { candidates:[
    { title:'Review result accountability',statement:'As a quality reviewer, I need to see which clinician reviewed a result and when so that the clinical review is traceable.',rationale:'Captures the requested audit view.',level:'product' as const,parentIds:[],citations:[{ sourceRevisionId:revisionId,label:'Product reply',quote:'We also need an audit view showing which clinician reviewed the result and when.' }] },
  ] };
};

export const requirementsReplay = (sourceId:string,revisionId:string,approvedNeedIds:string[]) => {
  const parents = approvedNeedIds;
  if (sourceId === 'SRC-001') return { candidates:[
    { title:'Qualify the analysis result',statement:'The system shall display an atrial-fibrillation analysis result using wording that indicates possibility and shall display a prompt for clinical review.',rationale:'Implements the accepted clinical interpretation need.',level:'system' as const,parentIds:parents.slice(0,1),citations:[{ sourceRevisionId:revisionId,label:'05:18',quote:'It cannot confirm a diagnosis and should always prompt clinical review.' }] },
    { title:'Complete analysis within the approved limit',statement:'The system shall complete analysis and display the result within the response-time limit recorded in the approved clarification.',rationale:'Keeps the requirement tied to the human-resolved timing decision.',level:'system' as const,parentIds:parents.slice(1,2),citations:[{ sourceRevisionId:revisionId,label:'12:14 and clarification answer',quote:'A completed analysis should normally appear within 30 seconds after the recording is submitted.' }] },
    { title:'Preserve recording after failure',statement:'If analysis does not complete, the analysis service shall return a failure state without deleting or replacing the submitted ECG recording.',rationale:'Creates a verifiable subsystem behaviour for recovery.',level:'subsystem' as const,parentIds:parents.slice(2,3),citations:[{ sourceRevisionId:revisionId,label:'24:36',quote:'If analysis cannot complete, the clinician needs a clear failure state and the recording must remain available for another attempt.' }] },
  ] };
  if (sourceId === 'SRC-002') return { candidates:[
    { title:'Display source-recording identity',statement:'The result view shall display the identifier and acquisition time of the ECG recording used for analysis.',rationale:'Makes the accepted traceability need verifiable.',level:'system' as const,parentIds:parents.slice(0,1),citations:[{ sourceRevisionId:revisionId,label:'Source statement',quote:'The analysis result must identify the recording and acquisition time used for the result.' }] },
  ] };
  return { candidates:[
    { title:'Record clinical result review',statement:'The system shall record the clinician identity and timestamp when a clinician marks an analysis result as reviewed.',rationale:'Makes the accepted accountability need verifiable.',level:'system' as const,parentIds:parents.slice(0,1),citations:[{ sourceRevisionId:revisionId,label:'Product reply',quote:'We also need an audit view showing which clinician reviewed the result and when.' }] },
  ] };
};
