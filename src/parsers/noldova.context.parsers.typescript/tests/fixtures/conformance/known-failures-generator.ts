/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert } from "@noldova/context.testing";

import { ConformanceCaseComparison } from "./conformance-case-comparison.js";
import { ConformanceExpectationsReader } from "./conformance-expectations.reader.js";
import { KnownFailure } from "./known-failure.js";
import { KnownFailuresLedger } from "./known-failures-ledger.js";
import { ParserDiagnosticScope } from "./parser-diagnostic-scope.js";

export class KnownFailuresGenerator {
  public run(): void {
    const expectations = ConformanceExpectationsReader.load();
    const scope = ParserDiagnosticScope.load();
    const ledger = KnownFailuresLedger.load();

    const failures: KnownFailure[] = [];
    for (const record of expectations.applicableRecords.values()) {
      const verdict = new ConformanceCaseComparison(record, expectations.readUnits(record), scope).run();
      if (!verdict.isMatch)
        failures.push(KnownFailure.fromVerdict(record.path, verdict));
    }
    failures.sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0);

    const isBaseline = ledger.expectedDiagnosticsSha256 !== expectations.manifest.resultsSha256;
    const regressions = failures.filter(t => ledger.failing.get(t.path)?.contains(t) !== true).map(t => t.path);
    if (!isBaseline)
      Assert.areEqual(0, regressions.length, KnownFailuresGenerator.regressions(regressions));

    const remaining = new Set(failures.map(t => t.path));
    KnownFailuresLedger.create(expectations.manifest.resultsSha256, expectations.applicableRecords.size, failures,
      ledger.statedDifferences.filter(t => remaining.has(t)), ledger.checkerDecided.filter(t => remaining.has(t))).write();

    console.log(isBaseline
      ? KnownFailuresGenerator.baselineWritten(failures.length, regressions.length)
      : KnownFailuresGenerator.casesRemoved(ledger.entries.length - failures.length, failures.length));
  }

  private static regressions(paths: readonly string[]): string {
    return `These cases differ from the reference beyond what the ledger records; repair them rather than record them:\n  ${paths.join("\n  ")}`;
  }

  private static baselineWritten(failing: number, changed: number): string {
    return `The ledger was measured against other expected diagnostics, so a new one was written: ${failing} known failures, `
      + (changed === 0 ? "none of them new or changed." : `${changed} of them new or changed; classify those.`);
  }

  private static casesRemoved(removed: number, failing: number): string {
    return `Removed ${removed} cases that now match and narrowed the rest to what still differs; ${failing} known failures remain.`;
  }
}
