'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export type WalkthroughView = 'overview'|'evidence'|'documents'|'changes'|'evaluation';
type StepBase = { id:string;view:WalkthroughView;target:string;title:string;body:string };
export type WalkthroughStep = StepBase & (
  | { kind:'explain' }
  | { kind:'action';complete:boolean;waiting:string }
);

type TargetRect = { top:number;right:number;bottom:number;left:number;width:number;height:number };
type CalloutPosition = { top:number;left:number;placement:'left'|'right'|'above'|'below'|'center' };

const SESSION_STEP = 'rhythmreview.walkthrough.step';
const SESSION_ACTIVE = 'rhythmreview.walkthrough.active';

function clamp(value:number,min:number,max:number):number { return Math.min(Math.max(value,min),max); }

export function positionWalkthroughCallout(rect:TargetRect|null,viewport:{ width:number;height:number }):CalloutPosition {
  const width = Math.min(360,viewport.width - 24);
  const estimatedHeight = 300;
  if (!rect) return { top:Math.max(12,(viewport.height - estimatedHeight) / 2),left:Math.max(12,(viewport.width - width) / 2),placement:'center' };
  if (viewport.width - rect.right >= width + 28) return { top:clamp(rect.top,12,viewport.height - estimatedHeight - 12),left:rect.right + 18,placement:'right' };
  if (rect.left >= width + 28) return { top:clamp(rect.top,12,viewport.height - estimatedHeight - 12),left:rect.left - width - 18,placement:'left' };
  if (viewport.height - rect.bottom >= estimatedHeight + 20) return { top:rect.bottom + 14,left:clamp(rect.left,12,viewport.width - width - 12),placement:'below' };
  return { top:Math.max(12,rect.top - estimatedHeight - 14),left:clamp(rect.left,12,viewport.width - width - 12),placement:'above' };
}

export function GuidedWalkthrough({ steps,onNavigate,onStepEnter,onResetWorkspace }:{
  steps:WalkthroughStep[];
  onNavigate:(view:WalkthroughView)=>void;
  onStepEnter:(stepId:string)=>void;
  onResetWorkspace:()=>Promise<void>;
}) {
  const [mounted,setMounted] = useState(false);
  const [active,setActive] = useState(false);
  const [index,setIndex] = useState(0);
  const [targetRect,setTargetRect] = useState<TargetRect|null>(null);
  const [targetMissing,setTargetMissing] = useState(false);
  const [restartOpen,setRestartOpen] = useState(false);
  const [resetting,setResetting] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const initializedRef = useRef(false);
  const step = steps[index] ?? steps[0];

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    const timer = window.setTimeout(() => {
      setMounted(true);
      const storedId = window.sessionStorage.getItem(SESSION_STEP);
      const storedIndex = storedId ? steps.findIndex((candidate) => candidate.id === storedId) : -1;
      if (storedIndex >= 0) setIndex(storedIndex);
      setActive(window.sessionStorage.getItem(SESSION_ACTIVE) === 'true');
    },0);
    return () => window.clearTimeout(timer);
  },[steps]);

  useEffect(() => {
    if (!mounted || !step) return;
    window.sessionStorage.setItem(SESSION_STEP,step.id);
    window.sessionStorage.setItem(SESSION_ACTIVE,String(active));
  },[active,mounted,step]);

  useEffect(() => {
    if (!active || !step) return;
    onNavigate(step.view);
    onStepEnter(step.id);
  },[active,onNavigate,onStepEnter,step]);

  const locateTarget = useCallback(() => {
    if (!active || !step) return;
    const element = document.querySelector(`[data-walkthrough="${step.target}"]`);
    if (!(element instanceof HTMLElement)) {
      setTargetRect(null);
      setTargetMissing(true);
      return;
    }
    element.scrollIntoView({ behavior:'smooth',block:'center',inline:'nearest' });
    window.setTimeout(() => {
      const rect = element.getBoundingClientRect();
      setTargetRect({ top:rect.top,right:rect.right,bottom:rect.bottom,left:rect.left,width:rect.width,height:rect.height });
      setTargetMissing(false);
    },180);
  },[active,step]);

  useEffect(() => {
    if (!active || !step) return;
    const observer = new MutationObserver(locateTarget);
    observer.observe(document.body,{ childList:true,subtree:true });
    const timer = window.setTimeout(locateTarget,80);
    window.addEventListener('resize',locateTarget);
    window.addEventListener('scroll',locateTarget,true);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
      window.removeEventListener('resize',locateTarget);
      window.removeEventListener('scroll',locateTarget,true);
    };
  },[active,locateTarget,step]);

  useEffect(() => {
    if (!active) return;
    headingRef.current?.focus();
  },[active,index]);

  useEffect(() => {
    if (!active) return;
    const handleKey = (event:KeyboardEvent) => {
      if (event.key === 'Escape') setActive(false);
      if (event.altKey && event.key === 'ArrowLeft') setIndex((current) => Math.max(0,current - 1));
      if (event.altKey && event.key === 'ArrowRight' && step && (step.kind === 'explain' || step.complete)) setIndex((current) => Math.min(steps.length - 1,current + 1));
    };
    window.addEventListener('keydown',handleKey);
    return () => window.removeEventListener('keydown',handleKey);
  },[active,step,steps.length]);

  const position = useMemo(() => {
    if (!mounted) return { top:12,left:12,placement:'center' as const };
    return positionWalkthroughCallout(targetRect,{ width:window.innerWidth,height:window.innerHeight });
  },[mounted,targetRect]);
  const canContinue = step?.kind === 'explain' || step?.complete;
  const isLast = index === steps.length - 1;

  const restart = async (resetWorkspace:boolean) => {
    setResetting(true);
    try {
      if (resetWorkspace) await onResetWorkspace();
      setIndex(0);
      setRestartOpen(false);
      setActive(true);
    } finally {
      setResetting(false);
    }
  };

  const launcher = <button className="walkthrough-launcher" data-walkthrough="walkthrough-launcher" onClick={() => setActive(true)}>{index > 0 ? 'Resume guided walkthrough' : 'Start guided walkthrough'}<span>10–12 min · QA/RA</span></button>;
  if (!mounted || !step) return launcher;

  return <>{launcher}{active && createPortal(<div className="walkthrough-layer" aria-live="polite">
    {targetRect && <div className="walkthrough-spotlight" style={{ top:targetRect.top - 7,left:targetRect.left - 7,width:targetRect.width + 14,height:targetRect.height + 14 }} />}
    <section className={`walkthrough-callout ${position.placement}`} role="dialog" aria-labelledby="walkthrough-title" style={{ top:position.top,left:position.left }}>
      <div className="walkthrough-progress"><span>Guided demo</span><b>{index + 1} / {steps.length}</b></div>
      <h2 id="walkthrough-title" ref={headingRef} tabIndex={-1}>{step.title}</h2>
      <p>{step.body}</p>
      {targetMissing && <p className="walkthrough-waiting">This section is still loading. The highlight will reconnect automatically.</p>}
      {step.kind === 'action' && !step.complete && <p className="walkthrough-waiting">Next action: {step.waiting}</p>}
      {restartOpen ? <div className="walkthrough-restart">
        <p>Restart the instructions only, or reset RR-1.0 and restart from a clean workspace.</p>
        <button disabled={resetting} onClick={() => void restart(false)}>Keep workspace</button>
        <button className="danger" disabled={resetting} onClick={() => void restart(true)}>{resetting ? 'Resetting…' : 'Reset and restart'}</button>
        <button disabled={resetting} onClick={() => setRestartOpen(false)}>Cancel</button>
      </div> : <>
        <div className="walkthrough-actions">
          <button onClick={() => setRestartOpen(true)}>Restart</button>
          <button onClick={() => setActive(false)}>Pause</button>
          <span />
          <button disabled={index === 0} onClick={() => setIndex((current) => Math.max(0,current - 1))}>Previous</button>
          <button className="primary" disabled={!canContinue} onClick={() => isLast ? setActive(false) : setIndex((current) => Math.min(steps.length - 1,current + 1))}>{isLast ? 'Finish' : 'Next'}</button>
        </div>
        <small>Esc pauses · Alt + arrows move between completed steps</small>
      </>}
    </section>
  </div>,document.body)}</>;
}
