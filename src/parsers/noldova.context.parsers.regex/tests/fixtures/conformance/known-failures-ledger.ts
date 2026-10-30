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

  public readonly expectedPatternsSha256: string;
  public readonly summary: KnownFailuresSummary;
  public readonly entries: readonly KnownFailure[];
  public readonly failing: ReadonlyMap<string, KnownFailure>;
  public readonly statedDifferences: readonly string[];

  private constructor(expectedPatternsSha256: string, summary: KnownFailuresSummary, entries: readonly KnownFailure[], statedDifferences: readonly string[]) {
    this.expectedPatternsSha256 = expectedPatternsSha256;
    this.summary = summary;
    this.entries = entries;
    this.failing = new Map(entries.map(t => [t.path, t]));
    this.statedDifferences = statedDifferences;
  }

  public static load(): KnownFailuresLedger {
    if (KnownFailuresLedger.instance !== undefined)
      return KnownFailuresLedger.instance;

    const ledger = JsonObject.parse(readFileSync(KnownFailuresLedger.FILE_PATH, KnownFailuresLedger.TEXT_ENCODING), KnownFailuresLedger.FILE_NAME);
    KnownFailuresLedger.instance = new KnownFailuresLedger(ledger.string("expectedPatternsSha256"), KnownFailuresSummary.from(ledger.object("summary")),
      ledger.objects("failing").map(t => KnownFailure.from(t)), ledger.strings("statedDifferences"));

    return KnownFailuresLedger.instance;
  }

  public static create(expectedPatternsSha256: string, applicable: number, entries: readonly KnownFailure[],
    statedDifferences: readonly string[]): KnownFailuresLedger {
    const summary = new KnownFailuresSummary(applicable, applicable - entries.length, statedDifferences.length, entries.length - statedDifferences.length);
    return new KnownFailuresLedger(expectedPatternsSha256, summary, entries, statedDifferences);
  }

  public write(): void {
    const document = {
      expectedPatternsSha256: this.expectedPatternsSha256,
      summary: this.summary,
      failing: this.entries,
      statedDifferences: this.statedDifferences,
    };
    writeFileSync(KnownFailuresLedger.FILE_PATH, `${JSON.stringify(document, null, KnownFailuresLedger.JSON_INDENTATION)}${KnownFailuresLedger.LINE_FEED}`);
  }
}
