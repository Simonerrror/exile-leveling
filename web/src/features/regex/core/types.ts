export type RegexLocale = "en" | "ru";

export type RegexDiagnosticSeverity = "info" | "blocking";

export type RegexDiagnosticCode =
  | "two-pass-required"
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
  length: number;
  diagnostics: RegexDiagnostic[];
}
