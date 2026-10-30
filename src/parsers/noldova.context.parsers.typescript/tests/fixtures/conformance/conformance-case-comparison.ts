/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DiagnosticAuthority } from "@noldova/context.diagnostics";
import { TypeScriptParser } from "@noldova/context.parsers.typescript";

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
    if (!this.units[fileIndex]!.isSource)
      return [];

    return this.record.diagnostics.publishedFor(fileIndex).filter(t => this.scope.has(t.code)).map(t => ComparedDiagnostic.fromExpected(t, this.units));
  }

  private reported(fileIndex: number): readonly ComparedDiagnostic[] {
    const unit = this.units[fileIndex]!;
    if (!unit.isSource)
      return [];

    return TypeScriptParser.parse(unit.content, unit.name, unit.kind).diagnostics
      .filter(t => t.code.authority === DiagnosticAuthority.typeScript && this.scope.has(t.code.value))
      .map(t => ComparedDiagnostic.fromReported(t));
  }

  private static publish(diagnostics: readonly ComparedDiagnostic[]): readonly ComparedDiagnostic[] {
    const sorted = diagnostics.toSorted(ComparedDiagnostic.compare);
    const published: ComparedDiagnostic[] = [];
    let index = 0;
    while (index < sorted.length) {
      const first = sorted[index]!;
      let end = index + 1;
      while (end < sorted.length && sorted[end]!.keyWithoutRelated === first.keyWithoutRelated)
        end++;
      if (end - index === 1)
        published.push(first);
      else
        published.push(first.withRelated(ConformanceCaseComparison.mergeRelated(sorted.slice(index, end))));
      index = end;
    }

    return published;
  }

  private static mergeRelated(repeats: readonly ComparedDiagnostic[]): readonly ComparedDiagnostic[] {
    const related = repeats.flatMap(t => t.related).toSorted(ComparedDiagnostic.compare);
    return related.filter((t, index) => index === 0 || related[index - 1]!.key !== t.key);
  }
}
