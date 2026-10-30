/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type RegexExpectedRecord from "./regex-expected-record.ts";

export default class RegexExpectedManifest {
  private static readonly JSON_INDENTATION: number = 2;
  private static readonly LINE_FEED: string = "\n";
  private static readonly SCHEMA_VERSION: number = 1;

  public readonly schemaVersion: number;
  public readonly typescriptVersion: string;
  public readonly readingVersion: number;
  public readonly caseFiles: number;
  public readonly applicable: number;
  public readonly inapplicable: number;
  public readonly inapplicableByReason: Readonly<Record<string, number>>;
  public readonly acceptedPatterns: number;
  public readonly rejectedGroups: number;
  public readonly patternsSha256: string;

  public constructor(typescriptVersion: string, readingVersion: number, records: readonly RegexExpectedRecord[], patternsSha256: string) {
    const applicable = records.filter(t => t.isApplicable);
    const reasons = records.flatMap(t => t.reason === undefined ? [] : [t.reason]).toSorted();
    this.schemaVersion = RegexExpectedManifest.SCHEMA_VERSION;
    this.typescriptVersion = typescriptVersion;
    this.readingVersion = readingVersion;
    this.caseFiles = records.length;
    this.applicable = applicable.length;
    this.inapplicable = records.length - applicable.length;
    this.inapplicableByReason = Object.fromEntries([...new Set(reasons)].map(reason => [reason, reasons.filter(t => t === reason).length]));
    this.acceptedPatterns = applicable.reduce((total, record) => total + record.accepted.length, 0);
    this.rejectedGroups = applicable.reduce((total, record) => total + record.rejected.length, 0);
    this.patternsSha256 = patternsSha256;
  }

  public serialize(): string {
    return `${JSON.stringify(this, null, RegexExpectedManifest.JSON_INDENTATION)}${RegexExpectedManifest.LINE_FEED}`;
  }
}
