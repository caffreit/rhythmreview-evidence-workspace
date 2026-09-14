import { z } from 'zod';

export const DEMO_ACTORS = {
  author:{ name:'Alex Morgan',title:'Author',initials:'AM',value:'Alex Morgan · Author' },
  qa:{ name:'Jamie Chen',title:'QA reviewer',initials:'JC',value:'Jamie Chen · QA reviewer' },
  release_approver:{ name:'Priya Shah',title:'Release approver',initials:'PS',value:'Priya Shah · Release approver' },
} as const;

export const DemoRoleSchema = z.enum(['author','qa','release_approver']);
export const AuthorActorSchema = z.literal(DEMO_ACTORS.author.value);
export const QaActorSchema = z.literal(DEMO_ACTORS.qa.value);
export const ReleaseApproverActorSchema = z.literal(DEMO_ACTORS.release_approver.value);
export const DemoActorSchema = z.union([AuthorActorSchema,QaActorSchema,ReleaseApproverActorSchema]);

export type DemoRole = z.infer<typeof DemoRoleSchema>;
export type DemoActor = z.infer<typeof DemoActorSchema>;

export function demoActor(role:DemoRole):DemoActor { return DEMO_ACTORS[role].value; }
