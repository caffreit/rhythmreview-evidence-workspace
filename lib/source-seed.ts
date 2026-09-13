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

const sourceSpan = (sourceRevisionId:string,quote:string) => ({ kind:'source_span' as const,sourceRevisionId,quote });
type RecordedClarification = { id:string;question:string;status:string;answer:string|null };

function timingAnswerCitation(clarifications:RecordedClarification[]) {
  const timing = clarifications.find((item) => item.status === 'answered' && item.answer && /30 seconds|60 seconds/i.test(item.answer));
  return timing?.answer ? { kind:'clarification_answer' as const,clarificationId:timing.id,quote:timing.answer } : null;
}

export const sourceContextReplay = (sourceId:string,revisionId:string) => {
  if (sourceId === 'SRC-001') return { questions:[
    { kind:'contradiction' as const,severity:'required' as const,question:'Is 30 seconds a mandatory maximum result time or a user-facing performance target that may extend to 60 seconds at peak load?',rationale:'The transcript gives two incompatible timing expectations that would produce different requirements.',citations:[
      sourceSpan(revisionId,'A completed analysis should normally appear within 30 seconds after the recording is submitted.'),
      sourceSpan(revisionId,'The latest service design allows up to 60 seconds during peak load.'),
    ] },
    { kind:'missing_decision' as const,severity:'advisory' as const,question:'Who owns escalation after repeated analysis failures?',rationale:'The source identifies an unresolved operating responsibility that may affect workflow requirements.',citations:[
      sourceSpan(revisionId,'We still need to decide whether the user or the clinical administrator owns escalation after repeated analysis failures.'),
    ] },
  ] };
  if (sourceId === 'SRC-002') return { questions:[
    { kind:'missing_decision' as const,severity:'advisory' as const,question:'What operating procedure will define the trigger, handling, and handoff for repeated failure escalation?',rationale:'The current joint ownership is explicit, but the operating procedure remains unresolved and may affect future workflow requirements.',citations:[sourceSpan(revisionId,'Repeated failure escalation is still owned jointly by Product and Clinical Operations until the operating procedure is agreed.')] },
  ] };
  return { questions:[] };
};

export const userNeedsReplay = (sourceId:string,revisionId:string,clarifications:RecordedClarification[] = []) => {
  if (sourceId === 'SRC-001') {
    const timingCitation = timingAnswerCitation(clarifications);
    return { candidates:[
      { title:'Review a clearly qualified analysis result',supportedUser:'qualified clinician',goalOrConstraint:'see that atrial fibrillation is possible rather than confirmed and retain responsibility for diagnosis',rationale:'Preserves the decision-support role described by the clinical lead.',citations:[sourceSpan(revisionId,'RhythmReview is used by qualified clinicians reviewing a 30-second single-lead ECG recording for adults aged 22 and over.'),sourceSpan(revisionId,'the output indicates possible atrial fibrillation. It cannot confirm a diagnosis and should always prompt clinical review.')] },
      ...(timingCitation ? [{ title:'Receive a timely result',supportedUser:'qualified clinician',goalOrConstraint:'receive the completed analysis within 30 seconds during the active clinical review',rationale:'Captures the timing need after the required timing question is resolved.',citations:[sourceSpan(revisionId,'RhythmReview is used by qualified clinicians reviewing a 30-second single-lead ECG recording for adults aged 22 and over.'),sourceSpan(revisionId,'A completed analysis should normally appear within 30 seconds after the recording is submitted.'),timingCitation] }] : []),
      { title:'Recover from an unsuccessful analysis',supportedUser:'qualified clinician',goalOrConstraint:'see a clear failure state and retain access to the original recording for another attempt',rationale:'Captures the stated recovery need without choosing an escalation owner.',citations:[sourceSpan(revisionId,'RhythmReview is used by qualified clinicians reviewing a 30-second single-lead ECG recording for adults aged 22 and over.'),sourceSpan(revisionId,'If analysis cannot complete, the clinician needs a clear failure state and the recording must remain available for another attempt.')] },
    ] };
  }
  if (sourceId === 'SRC-002') return { candidates:[
    { title:'Identify the analyzed recording',supportedUser:'qualified clinician',goalOrConstraint:'identify the recording and acquisition time used for each result',rationale:'Captures the traceability need in the follow-up notes.',citations:[sourceSpan(revisionId,'Intended users remain qualified clinicians. Administrators configure access but do not interpret results.'),sourceSpan(revisionId,'The analysis result must identify the recording and acquisition time used for the result.')] },
  ] };
  return { candidates:[
    { title:'Review result accountability',supportedUser:'Product team',goalOrConstraint:'see which clinician reviewed a result and when so that the clinical review is traceable',rationale:'Captures the requested audit view without inventing an operator for it.',citations:[sourceSpan(revisionId,'From: Product\n\nAgreed. We also need an audit view showing which clinician reviewed the result and when.')] },
  ] };
};

export const requirementsReplay = (sourceId:string,revisionId:string,approvedNeedIds:string[],clarifications:RecordedClarification[] = []) => {
  const parents = approvedNeedIds;
  if (sourceId === 'SRC-001') {
    const timingCitation = timingAnswerCitation(clarifications);
    return { candidates:[
      { title:'Qualify the analysis result',statement:'The system shall display an atrial-fibrillation analysis result using wording that indicates possibility and a prompt for clinical review.',rationale:'Implements the accepted clinical interpretation need.',level:'system' as const,parentIds:parents.slice(0,1),citations:[sourceSpan(revisionId,'It cannot confirm a diagnosis and should always prompt clinical review.')] },
      ...(timingCitation && parents[1] ? [{ title:'Complete analysis within 30 seconds',statement:'The system shall complete analysis and display the result within 30 seconds after the recording is submitted.',rationale:'Implements the recorded maximum response-time decision.',level:'system' as const,parentIds:[parents[1]],citations:[sourceSpan(revisionId,'A completed analysis should normally appear within 30 seconds after the recording is submitted.'),timingCitation] }] : []),
      ...(parents[2] ? [{ title:'Preserve recording after failure',statement:'If analysis does not complete, the analysis service shall return a failure state without deleting or replacing the submitted ECG recording.',rationale:'Creates a verifiable subsystem behaviour for recovery.',level:'subsystem' as const,parentIds:[parents[2]],citations:[sourceSpan(revisionId,'If analysis cannot complete, the clinician needs a clear failure state and the recording must remain available for another attempt.')] }] : []),
    ] };
  }
  if (sourceId === 'SRC-002') return { candidates:[
    { title:'Display source-recording identity',statement:'The result view shall display the identifier and acquisition time of the ECG recording used for analysis.',rationale:'Makes the accepted traceability need verifiable.',level:'system' as const,parentIds:parents.slice(0,1),citations:[sourceSpan(revisionId,'The analysis result must identify the recording and acquisition time used for the result.')] },
  ] };
  return { candidates:[
    { title:'Record clinical result review',statement:'The system shall record the clinician identity and timestamp when a clinician marks an analysis result as reviewed.',rationale:'Makes the accepted accountability need verifiable.',level:'system' as const,parentIds:parents.slice(0,1),citations:[sourceSpan(revisionId,'We also need an audit view showing which clinician reviewed the result and when.')] },
  ] };
};
