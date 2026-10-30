/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert } from "@noldova/context.testing";

import { ConformanceCaseVerdict } from "./conformance-case-verdict.js";
import { ConformanceExpectationsReader } from "./conformance-expectations.reader.js";
import { KnownFailure } from "./known-failure.js";
import { KnownFailuresLedger } from "./known-failures-ledger.js";

export class KnownFailuresGenerator {
  public run(): void {
    const expectations = ConformanceExpectationsReader.load();
    const ledger = KnownFailuresLedger.load();

    const failures: KnownFailure[] = [];
    for (const record of expectations.applicableRecords.values()) {
      const verdict = ConformanceCaseVerdict.of(record);
      if (!verdict.isMatch)
        failures.push(KnownFailure.fromVerdict(record.path, verdict));
    }
    failures.sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0);

    const isBaseline = ledger.expectedPatternsSha256 !== expectations.manifest.patternsSha256;
    const regressions = failures.filter(t => ledger.failing.get(t.path)?.contains(t) !== true).map(t => t.path);
    if (!isBaseline)
      Assert.areEqual(0, regressions.length, KnownFailuresGenerator.regressions(regressions));

    const remaining = new Set(failures.map(t => t.path));
    KnownFailuresLedger.create(expectations.manifest.patternsSha256, expectations.applicableRecords.size, failures,
      ledger.statedDifferences.filter(t => remaining.has(t))).write();

    console.log(isBaseline
      ? KnownFailuresGenerator.baselineWritten(failures.length, regressions.length)
      : KnownFailuresGenerator.casesRemoved(ledger.entries.length - failures.length, failures.length));
  }

  private static regressions(paths: readonly string[]): string {
    return `These cases differ from Test262 beyond what the ledger records; repair them rather than record them:\n  ${paths.join("\n  ")}`;
  }

  private static baselineWritten(failing: number, changed: number): string {
    return `The ledger was measured against other expected patterns, so a new one was written: ${failing} known failures, `
      + (changed === 0 ? "none of them new or changed." : `${changed} of them new or changed; classify those.`);
  }

  private static casesRemoved(removed: number, failing: number): string {
    return `Removed ${removed} cases that now match and narrowed the rest to what still differs; ${failing} known failures remain.`;
  }
}
