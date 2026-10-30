/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { Assert, Category, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { ConformanceCaseVerdict } from "../fixtures/conformance/conformance-case-verdict.js";
import { ConformanceExpectationsReader } from "../fixtures/conformance/conformance-expectations.reader.js";
import { KnownFailuresLedger } from "../fixtures/conformance/known-failures-ledger.js";

@Category("RegexConformance")
@TestClass
export class ConformanceCasesTests {
  private static readonly HASH_ALGORITHM: string = "sha256";

  @TestMethod
  public matchesTest262UnlessKnownToFail(casePath: string): void {
    const verdict = ConformanceCaseVerdict.of(ConformanceExpectationsReader.load().applicableRecords.get(casePath)!);

    const failure = KnownFailuresLedger.load().failing.get(casePath);
    if (Object.isUndefined(failure))
      Assert.isTrue(verdict.isMatch, `${casePath} differs from Test262:\n${verdict.describe()}`);
    else {
      Assert.isFalse(verdict.isMatch, `${casePath} now matches Test262; remove it from known-failures.json.`);
      Assert.isTrue(failure.isRecordedAs(verdict), `${casePath} no longer differs as known-failures.json records:\n${verdict.describe()}`);
    }
  }

  @TestMethod
  public keepsTheKnownFailuresAccountedAndCurrent(): void {
    const ledger = KnownFailuresLedger.load();
    const expectations = ConformanceExpectationsReader.load();
    const applicable = expectations.applicableRecords.size;

    Assert.areEqual(expectations.manifest.patternsSha256, ledger.expectedPatternsSha256,
      "known-failures.json was measured against other expected patterns; run npm run generate:regex-known-failures.");
    const paths = ledger.entries.map(t => t.path);
    Assert.areEqual(applicable, ledger.summary.applicable);
    Assert.areEqual(ledger.statedDifferences.length, ledger.summary.statedDifferences);
    Assert.areEqual(ledger.entries.length - ledger.statedDifferences.length, ledger.summary.failing);
    Assert.areEqual(applicable - ledger.entries.length, ledger.summary.passing);
    Assert.areEqual(ledger.entries.length, ledger.failing.size);
    Assert.areEqual(paths.join(), paths.toSorted().join());
    for (const casePath of paths)
      Assert.isTrue(expectations.applicableRecords.has(casePath), `${casePath} is a known failure but is not an applicable case.`);
    for (const casePath of ledger.statedDifferences)
      Assert.isTrue(ledger.failing.has(casePath), `${casePath} is classified in known-failures.json but is not a known failure.`);
  }

  @TestMethod
  public recordsEveryVendoredCaseInPathOrder(): void {
    const expectations = ConformanceExpectationsReader.load();

    Assert.areEqual(JSON.stringify(expectations.listCases()), JSON.stringify([...expectations.records.keys()]));
  }

  @TestMethod
  public keepsTheExpectedPatternsAccountedAndIntact(): void {
    const expectations = ConformanceExpectationsReader.load();
    for (const record of expectations.records.values()) {
      const bytes = readFileSync(expectations.casePath(record));
      Assert.areEqual(record.sha256, createHash(ConformanceCasesTests.HASH_ALGORITHM).update(bytes).digest("hex"),
        `${record.path} is not the file the expected patterns were read from.`);
    }

    const inapplicableByReason = new Map<string, number>();
    for (const record of expectations.records.values())
      if (!Object.isUndefined(record.reason))
        inapplicableByReason.set(record.reason, (inapplicableByReason.get(record.reason) ?? 0) + 1);
    const applicableRecords = [...expectations.applicableRecords.values()];

    Assert.areEqual(expectations.manifest.caseFiles, expectations.records.size);
    Assert.areEqual(expectations.manifest.applicable, applicableRecords.length);
    Assert.areEqual(expectations.manifest.inapplicable, expectations.records.size - applicableRecords.length);
    Assert.areEqual(expectations.manifest.acceptedPatterns, applicableRecords.reduce((total, record) => total + record.accepted.length, 0));
    Assert.areEqual(expectations.manifest.rejectedGroups, applicableRecords.reduce((total, record) => total + record.rejected.length, 0));
    Assert.areEqual(JSON.stringify([...expectations.manifest.inapplicableByReason].toSorted()), JSON.stringify([...inapplicableByReason].toSorted()));
  }
}

for (const record of [...ConformanceExpectationsReader.load().applicableRecords.values()].toReversed())
  TestData(record.path)(ConformanceCasesTests.prototype.matchesTest262UnlessKnownToFail);
