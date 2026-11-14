/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DiagnosticAuthority } from "@noldova/context.diagnostics";
import { TypeScriptParser } from "@noldova/context.parsers.typescript";
import { Assert } from "@noldova/context.testing";

import type { ApplicableCaseRecord } from "./applicable-case-record.js";
import { ComparedDiagnostic } from "./compared-diagnostic.js";
import { ConformanceCaseUnit } from "./conformance-case-unit.js";
import { ConformanceCaseVerdict } from "./conformance-case-verdict.js";
import { ParserDiagnosticScope } from "./parser-diagnostic-scope.js";

export class ConformanceCaseComparison {
  private readonly record: ApplicableCaseRecord;
  private readonly units: readonly ConformanceCaseUnit[];
  private readonly scope: ParserDiagnosticScope;

  public constructor(record: ApplicableCaseRecord, units: readonly ConformanceCaseUnit[], scope: ParserDiagnosticScope) {
    this.record = record;
    this.units = units;
    this.scope = scope;
  }

  public run(): ConformanceCaseVerdict {
    const expected = ConformanceCaseComparison.publish(this.record.program.flatMap(t => this.expected(t)));
    const actual = ConformanceCaseComparison.publish(this.record.program.flatMap(t => this.reported(t)));

    const actualKeys = new Set(actual.map(t => t.key));
    const expectedKeys = new Set(expected.map(t => t.key));

    return new ConformanceCaseVerdict(expected.filter(t => !actualKeys.has(t.key)), actual.filter(t => !expectedKeys.has(t.key)));
  }

  private expected(fileIndex: number): readonly ComparedDiagnostic[] {
    const unit = this.units[fileIndex];
    Assert.isDefined(unit);
    if (!unit.isSource)
      return [];

    return this.record.diagnostics.publishedFor(fileIndex).filter(t => this.scope.has(t.code)).map(t => ComparedDiagnostic.fromExpected(t, this.units));
  }

  private reported(fileIndex: number): readonly ComparedDiagnostic[] {
    const unit = this.units[fileIndex];
    Assert.isDefined(unit);
    if (!unit.isSource)
      return [];

    return TypeScriptParser.parse(unit.content, unit.name, unit.kind).diagnostics
      .filter(t => t.code.authority === DiagnosticAuthority.typeScript && this.scope.has(t.code.value))
      .map(t => ComparedDiagnostic.fromReported(t));
  }

  private static publish(diagnostics: readonly ComparedDiagnostic[]): readonly ComparedDiagnostic[] {
    const sorted = diagnostics.toSorted(ComparedDiagnostic.compare);
    const runs: [ComparedDiagnostic, ...ComparedDiagnostic[]][] = [];
    for (const diagnostic of sorted) {
      const run = runs.at(-1);
      if (run !== undefined && run[0].keyWithoutRelated === diagnostic.keyWithoutRelated)
        run.push(diagnostic);
      else
        runs.push([diagnostic]);
    }

    return runs.map(t => t.length === 1 ? t[0] : t[0].withRelated(ConformanceCaseComparison.mergeRelated(t)));
  }

  private static mergeRelated(repeats: readonly ComparedDiagnostic[]): readonly ComparedDiagnostic[] {
    const related = repeats.flatMap(t => t.related).toSorted(ComparedDiagnostic.compare);
    return related.filter((t, index) => index === 0 || related[index - 1]?.key !== t.key);
  }
}
