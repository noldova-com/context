/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type TypeScriptConformanceCase from "./typescript-conformance-case.ts";
import type TypeScriptExpectedDiagnosticSections from "./typescript-expected-diagnostic-sections.ts";
import TypeScriptExpectedRecordFile from "./typescript-expected-record-file.ts";
import TypeScriptExpectedRecord from "./typescript-expected-record.ts";

export default class TypeScriptExpectedApplicableRecord extends TypeScriptExpectedRecord {
  public static readonly APPLICABILITY: "applicable" = "applicable";

  public readonly applicability: typeof TypeScriptExpectedApplicableRecord.APPLICABILITY;
  public readonly files: readonly TypeScriptExpectedRecordFile[];
  public readonly program: readonly number[];
  public readonly diagnostics: TypeScriptExpectedDiagnosticSections;

  public constructor(conformanceCase: TypeScriptConformanceCase, program: readonly number[], diagnostics: TypeScriptExpectedDiagnosticSections) {
    super(conformanceCase.path, conformanceCase.sha256);
    this.applicability = TypeScriptExpectedApplicableRecord.APPLICABILITY;
    this.files = conformanceCase.units.map(t => new TypeScriptExpectedRecordFile(t.name, t.sha256));
    this.program = program;
    this.diagnostics = diagnostics;
  }
}
