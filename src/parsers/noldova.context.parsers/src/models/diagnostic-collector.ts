/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Diagnostic, DiagnosticLocation, type DiagnosticTemplate } from "@noldova/context.diagnostics";

import type { SourceSpan } from "./sources/source-span.js";
import type { Source } from "./sources/source.js";

export class DiagnosticCollector {
  private readonly collectedDiagnostics: Diagnostic[] = [];
  private readonly source: Source;

  public constructor(source: Source) {
    this.source = source;
  }

  public get diagnostics(): readonly Diagnostic[] {
    return this.collectedDiagnostics;
  }

  public add(diagnostic: Diagnostic): void;
  public add(template: DiagnosticTemplate, span: SourceSpan, messageArguments?: readonly (string | number)[]): void;
  public add(diagnosticOrTemplate: Diagnostic | DiagnosticTemplate, span?: SourceSpan, messageArguments: readonly (string | number)[] = []): void {
    if (diagnosticOrTemplate instanceof Diagnostic) {
      this.collectedDiagnostics.push(diagnosticOrTemplate);
      return;
    }

    const diagnosticSourceSpan = span!;
    const location = new DiagnosticLocation(this.source.identity, diagnosticSourceSpan.startOffset, diagnosticSourceSpan.length, this.source.length);
    this.collectedDiagnostics.push(diagnosticOrTemplate.create(location, messageArguments));
  }

  public truncate(count: number): void {
    this.collectedDiagnostics.splice(count);
  }
}
