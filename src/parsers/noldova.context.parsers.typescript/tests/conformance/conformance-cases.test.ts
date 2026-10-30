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

import { ConformanceCaseComparison } from "../fixtures/conformance/conformance-case-comparison.js";
import { ConformanceExpectationsReader } from "../fixtures/conformance/conformance-expectations.reader.js";
import { KnownFailuresLedger } from "../fixtures/conformance/known-failures-ledger.js";
import { ParserDiagnosticScope } from "../fixtures/conformance/parser-diagnostic-scope.js";

@Category("TypeScriptConformance")
@TestClass
export class ConformanceCasesTests {
  private static readonly HASH_ALGORITHM: string = "sha256";
  private static readonly FIRST_REGEX_ANALYZER_CODE: number = 1499;
  private static readonly LAST_REGEX_ANALYZER_CODE: number = 1538;

  @TestMethod
  public matchesTheReferenceUnlessKnownToFail(casePath: string): void {
    const expectations = ConformanceExpectationsReader.load();
    const record = expectations.applicableRecords.get(casePath)!;
    const verdict = new ConformanceCaseComparison(record, expectations.readUnits(record), ParserDiagnosticScope.load()).run();

    const failure = KnownFailuresLedger.load().failing.get(casePath);
    if (Object.isUndefined(failure))
      Assert.isTrue(verdict.isMatch, `${casePath} differs from the reference:\n${verdict.describe()}`);
    else {
      Assert.isFalse(verdict.isMatch, `${casePath} now matches the reference; remove it from known-failures.json.`);
      Assert.isTrue(failure.isRecordedAs(verdict), `${casePath} no longer differs as known-failures.json records:\n${verdict.describe()}`);
    }
  }

  @TestMethod
  public keepsTheKnownFailuresAccountedAndCurrent(): void {
    const ledger = KnownFailuresLedger.load();
    const expectations = ConformanceExpectationsReader.load();
    const applicable = expectations.applicableRecords.size;

    Assert.areEqual(expectations.manifest.resultsSha256, ledger.expectedDiagnosticsSha256,
      "known-failures.json was measured against other expected diagnostics; run npm run generate:typescript-known-failures.");
    const paths = ledger.entries.map(t => t.path);
    Assert.areEqual(applicable, ledger.summary.applicable);
    Assert.areEqual(ledger.statedDifferences.length, ledger.summary.statedDifferences);
    Assert.areEqual(ledger.checkerDecided.length, ledger.summary.checkerDecided);
    Assert.areEqual(ledger.entries.length - ledger.statedDifferences.length - ledger.checkerDecided.length, ledger.summary.failing);
    Assert.areEqual(applicable - ledger.entries.length, ledger.summary.passing);
    Assert.areEqual(ledger.entries.length, ledger.failing.size);
    Assert.areEqual(paths.join(), paths.toSorted().join());
    for (const casePath of paths)
      Assert.isTrue(expectations.applicableRecords.has(casePath), `${casePath} is a known failure but is not an applicable case.`);
    for (const casePath of [...ledger.statedDifferences, ...ledger.checkerDecided])
      Assert.isTrue(ledger.failing.has(casePath), `${casePath} is classified in known-failures.json but is not a known failure.`);
  }

  @TestMethod
  public claimsNoRegexAnalyzerCode(): void {
    const scope = ParserDiagnosticScope.load();
    for (let code = ConformanceCasesTests.FIRST_REGEX_ANALYZER_CODE; code <= ConformanceCasesTests.LAST_REGEX_ANALYZER_CODE; code++)
      Assert.isFalse(scope.has(code), `TS${code} is the reference's regular expression analyzer's; noldova.context.parsers.regex answers it in its own codes.`);
  }

  @TestMethod
  public recordsEveryVendoredCaseInPathOrder(): void {
    const expectations = ConformanceExpectationsReader.load();

    Assert.areEqual(JSON.stringify(expectations.listCases()), JSON.stringify([...expectations.records.keys()]));
  }

  @TestMethod
  public keepsTheExpectedDiagnosticsAccountedAndIntact(): void {
    const expectations = ConformanceExpectationsReader.load();
    for (const record of expectations.records.values()) {
      const bytes = readFileSync(expectations.casePath(record));
      Assert.areEqual(record.sha256, createHash(ConformanceCasesTests.HASH_ALGORITHM).update(bytes).digest("hex"),
        `${record.path} is not the file the expected diagnostics were generated from.`);
    }

    const inapplicableByReason = new Map<string, number>();
    for (const record of expectations.inapplicableRecords.values())
      inapplicableByReason.set(record.reason, (inapplicableByReason.get(record.reason) ?? 0) + 1);
    const diagnostics = [...expectations.applicableRecords.values()].reduce((total, record) => total + record.diagnostics.count, 0);

    Assert.areEqual(expectations.manifest.caseFiles, expectations.records.size);
    Assert.areEqual(expectations.manifest.applicable, expectations.applicableRecords.size);
    Assert.areEqual(expectations.manifest.inapplicable, expectations.inapplicableRecords.size);
    Assert.areEqual(expectations.manifest.diagnostics, diagnostics);
    Assert.areEqual(JSON.stringify([...expectations.manifest.inapplicableByReason].toSorted()), JSON.stringify([...inapplicableByReason].toSorted()));
  }
}

for (const record of [...ConformanceExpectationsReader.load().applicableRecords.values()].toReversed())
  TestData(record.path)(ConformanceCasesTests.prototype.matchesTheReferenceUnlessKnownToFail);
