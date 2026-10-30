/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type TypeScriptExpectedDiagnostic from "./typescript-expected-diagnostic.ts";

export default class TypeScriptExpectedDiagnosticSections {
  public readonly config: readonly TypeScriptExpectedDiagnostic[] | undefined;
  public readonly syntactic: readonly TypeScriptExpectedDiagnostic[] | undefined;
  public readonly program: readonly TypeScriptExpectedDiagnostic[] | undefined;
  public readonly global: readonly TypeScriptExpectedDiagnostic[] | undefined;
  public readonly semantic: readonly TypeScriptExpectedDiagnostic[] | undefined;
  public readonly suggestion: readonly TypeScriptExpectedDiagnostic[] | undefined;

  public constructor(config: readonly TypeScriptExpectedDiagnostic[], syntactic: readonly TypeScriptExpectedDiagnostic[],
    program: readonly TypeScriptExpectedDiagnostic[], global: readonly TypeScriptExpectedDiagnostic[], semantic: readonly TypeScriptExpectedDiagnostic[],
    suggestion: readonly TypeScriptExpectedDiagnostic[]) {
    this.config = TypeScriptExpectedDiagnosticSections.written(config);
    this.syntactic = TypeScriptExpectedDiagnosticSections.written(syntactic);
    this.program = TypeScriptExpectedDiagnosticSections.written(program);
    this.global = TypeScriptExpectedDiagnosticSections.written(global);
    this.semantic = TypeScriptExpectedDiagnosticSections.written(semantic);
    this.suggestion = TypeScriptExpectedDiagnosticSections.written(suggestion);
  }

  public static count(sections: TypeScriptExpectedDiagnosticSections): number {
    return [sections.config, sections.syntactic, sections.program, sections.global, sections.semantic, sections.suggestion]
      .reduce((total, t) => total + (t?.length ?? 0), 0);
  }

  private static written(family: readonly TypeScriptExpectedDiagnostic[]): readonly TypeScriptExpectedDiagnostic[] | undefined {
    return family.length === 0 ? undefined : family;
  }
}
