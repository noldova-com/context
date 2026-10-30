/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ExpectedDiagnostic } from "./expected-diagnostic.js";
import type { JsonObject } from "./json-object.js";

export class ExpectedDiagnosticFamilies {
  public readonly config: readonly ExpectedDiagnostic[];
  public readonly syntactic: readonly ExpectedDiagnostic[];
  public readonly program: readonly ExpectedDiagnostic[];
  public readonly global: readonly ExpectedDiagnostic[];
  public readonly semantic: readonly ExpectedDiagnostic[];
  public readonly suggestion: readonly ExpectedDiagnostic[];

  public constructor(config: readonly ExpectedDiagnostic[], syntactic: readonly ExpectedDiagnostic[], program: readonly ExpectedDiagnostic[],
    global: readonly ExpectedDiagnostic[], semantic: readonly ExpectedDiagnostic[], suggestion: readonly ExpectedDiagnostic[]) {
    this.config = config;
    this.syntactic = syntactic;
    this.program = program;
    this.global = global;
    this.semantic = semantic;
    this.suggestion = suggestion;
  }

  public get count(): number {
    return this.config.length + this.syntactic.length + this.program.length + this.global.length + this.semantic.length + this.suggestion.length;
  }

  public static from(object: JsonObject): ExpectedDiagnosticFamilies {
    const family = (name: string): readonly ExpectedDiagnostic[] => object.optionalObjects(name).map(t => ExpectedDiagnostic.from(t));
    return new ExpectedDiagnosticFamilies(family("config"), family("syntactic"), family("program"), family("global"), family("semantic"),
      family("suggestion"));
  }

  public publishedFor(fileIndex: number): readonly ExpectedDiagnostic[] {
    const inUnit = (t: readonly ExpectedDiagnostic[]): readonly ExpectedDiagnostic[] => t.filter(t => t.file === fileIndex);
    const syntax = [...inUnit(this.config), ...inUnit(this.syntactic)];
    if (syntax.length !== 0)
      return syntax;

    const options = [...inUnit(this.program), ...inUnit(this.global)];

    return options.length !== 0 ? options : inUnit(this.semantic);
  }
}
