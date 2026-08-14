import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/*
 * The shadcn class helper.
 *
 * Most of this codebase composes classes with template strings, which is fine
 * while every class in the string is written here. It stops being fine the
 * moment a component takes a `className` from its caller and merges it with
 * its own defaults: Tailwind resolves same-property conflicts by stylesheet
 * order, not by the order classes appear in the string, so a caller passing
 * `duration-200` to something that already sets `duration-500` gets whichever
 * one Tailwind emitted last — not the one they asked for. `twMerge` decides
 * that by last-wins on the string instead, which is what a caller expects.
 *
 * Kept at the path shadcn's registry assumes (`@/lib/utils`) so components
 * pulled from it drop in without their imports being rewritten.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
