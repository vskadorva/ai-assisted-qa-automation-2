/** Curated invalid program names for validation edge cases — not generated at runtime. */
export const INVALID_PROGRAM_NAMES = {
  empty: "",
  whitespaceOnly: "   ",
  overMaxLength: `${"N".repeat(100)}X`,
} as const;
