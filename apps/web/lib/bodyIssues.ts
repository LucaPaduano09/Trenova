import { z } from "zod";

export const zones = [
  "head",
  "neck",
  "shoulder",
  "elbow",
  "wrist",
  "thoracic",
  "lumbar",
  "hip",
  "knee",
  "ankle",
] as const;

export type ZoneKey = (typeof zones)[number];
export const zoneEnum = z.enum(zones);

export const bodySides = ["LEFT", "RIGHT", "MIDLINE"] as const;
export type BodySideKey = (typeof bodySides)[number];
export const bodySideEnum = z.enum(bodySides);

export const issueTypes = [
  "PAIN",
  "STIFFNESS",
  "INJURY",
  "POST_OP",
  "OTHER",
] as const;
export type IssueTypeKey = (typeof issueTypes)[number];
export const issueTypeEnum = z.enum(issueTypes);
