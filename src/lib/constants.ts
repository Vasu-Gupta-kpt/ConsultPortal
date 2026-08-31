import type { Program } from "./types";

export const PROGRAMS: Program[] = ["PGP", "MBA-EX", "Other"];

export function isProgram(value: string): value is Program {
  return (PROGRAMS as string[]).includes(value);
}
