/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type TypeScriptVendoredCorpus from "./typescript-vendored-corpus.ts";
import type TypeScriptVendoredDiagnostics from "./typescript-vendored-diagnostics.ts";
import type TypeScriptVendoredLibraryRecord from "./typescript-vendored-library-record.ts";

export default class TypeScriptVendoredTotals {
  public readonly caseFiles: number;
  public readonly diagnosticBaselineFiles: number;
  public readonly diagnosticDefinitionFiles: number;
  public readonly diagnosticDefinitions: number;
  public readonly effectiveDiagnosticDefinitions: number;
  public readonly standardLibraryFiles: number;

  public constructor(corpus: TypeScriptVendoredCorpus, standardLibrary: TypeScriptVendoredLibraryRecord, diagnostics: TypeScriptVendoredDiagnostics) {
    const catalogs = [diagnostics.classic, diagnostics.native];
    this.caseFiles = corpus.native.cases.files + corpus.classic.cases.files;
    this.diagnosticBaselineFiles = corpus.native.diagnosticBaselines.files + corpus.classic.diagnosticBaselines.files;
    this.diagnosticDefinitionFiles = catalogs.length;
    this.diagnosticDefinitions = catalogs.reduce((total, t) => total + t.entries, 0);
    this.effectiveDiagnosticDefinitions = diagnostics.composition.entries;
    this.standardLibraryFiles = standardLibrary.files;
  }
}
