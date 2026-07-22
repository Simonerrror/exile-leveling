export type RegexLocale = "en" | "ru";

export type RegexDiagnosticSeverity = "info" | "blocking";

export type RegexDiagnosticCode =
  | "two-pass-required"
  | "unsafe-composition"
  | "atomic-clause-too-long"
  | "two-pass-overflow"
  | "invalid-expression"
  | "minimum-item-level";

export interface RegexDiagnostic {
  code: RegexDiagnosticCode;
  severity: RegexDiagnosticSeverity;
  message: string;
}

export interface RegexCompileResult {
  primary: string;
  secondary?: string;
  composition?: "union" | "intersection";
  length: number;
  diagnostics: RegexDiagnostic[];
}
