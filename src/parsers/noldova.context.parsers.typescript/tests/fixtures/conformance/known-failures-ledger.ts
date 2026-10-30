/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { ConformanceExpectationsReader } from "./conformance-expectations.reader.js";
import { JsonObject } from "./json-object.js";
import { KnownFailure } from "./known-failure.js";
import { KnownFailuresSummary } from "./known-failures-summary.js";

export class KnownFailuresLedger {
  private static readonly FILE_NAME: string = "known-failures.json";
  private static readonly FILE_PATH: string = path.join(ConformanceExpectationsReader.CONFORMANCE_DIRECTORY, KnownFailuresLedger.FILE_NAME);
  private static readonly TEXT_ENCODING: BufferEncoding = "utf8";
  private static readonly JSON_INDENTATION: number = 2;
  private static readonly LINE_FEED: string = "\n";

  private static instance: KnownFailuresLedger | undefined;

  public readonly expectedDiagnosticsSha256: string;
  public readonly summary: KnownFailuresSummary;
  public readonly entries: readonly KnownFailure[];
  public readonly failing: ReadonlyMap<string, KnownFailure>;
  public readonly statedDifferences: readonly string[];
  public readonly checkerDecided: readonly string[];

  private constructor(expectedDiagnosticsSha256: string, summary: KnownFailuresSummary, entries: readonly KnownFailure[],
    statedDifferences: readonly string[], checkerDecided: readonly string[]) {
    this.expectedDiagnosticsSha256 = expectedDiagnosticsSha256;
    this.summary = summary;
    this.entries = entries;
    this.failing = new Map(entries.map(t => [t.path, t]));
    this.statedDifferences = statedDifferences;
    this.checkerDecided = checkerDecided;
  }

  public static load(): KnownFailuresLedger {
    if (KnownFailuresLedger.instance !== undefined)
      return KnownFailuresLedger.instance;

    const ledger = JsonObject.parse(readFileSync(KnownFailuresLedger.FILE_PATH, KnownFailuresLedger.TEXT_ENCODING), KnownFailuresLedger.FILE_NAME);
    KnownFailuresLedger.instance = new KnownFailuresLedger(ledger.string("expectedDiagnosticsSha256"), KnownFailuresSummary.from(ledger.object("summary")),
      ledger.objects("failing").map(t => KnownFailure.from(t)), ledger.strings("statedDifferences"), ledger.strings("checkerDecided"));

    return KnownFailuresLedger.instance;
  }

  public static create(expectedDiagnosticsSha256: string, applicable: number, entries: readonly KnownFailure[], statedDifferences: readonly string[],
    checkerDecided: readonly string[]): KnownFailuresLedger {
    const summary = new KnownFailuresSummary(applicable, applicable - entries.length, statedDifferences.length, checkerDecided.length,
      entries.length - statedDifferences.length - checkerDecided.length);
    return new KnownFailuresLedger(expectedDiagnosticsSha256, summary, entries, statedDifferences, checkerDecided);
  }

  public write(): void {
    const document = {
      expectedDiagnosticsSha256: this.expectedDiagnosticsSha256,
      summary: this.summary,
      failing: this.entries,
      statedDifferences: this.statedDifferences,
      checkerDecided: this.checkerDecided,
    };
    writeFileSync(KnownFailuresLedger.FILE_PATH, `${JSON.stringify(document, null, KnownFailuresLedger.JSON_INDENTATION)}${KnownFailuresLedger.LINE_FEED}`);
  }
}
