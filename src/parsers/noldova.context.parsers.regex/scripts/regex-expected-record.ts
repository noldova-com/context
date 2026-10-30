/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type RegexWrittenPattern from "./regex-written-pattern.ts";

export default class RegexExpectedRecord {
  public static readonly NO_WRITTEN_PATTERN: string = "NoWrittenPattern";
  public static readonly RUNTIME_PATTERNS: string = "RuntimePatterns";
  public static readonly LITERAL_BOUNDARY: string = "LiteralBoundary";

  public readonly path: string;
  public readonly sha256: string;
  public readonly accepted: readonly RegexWrittenPattern[];
  public readonly rejected: readonly (readonly RegexWrittenPattern[])[];
  public readonly reason: string | undefined;

  private constructor(path: string, sha256: string, accepted: readonly RegexWrittenPattern[], rejected: readonly (readonly RegexWrittenPattern[])[],
    reason: string | undefined) {
    this.path = path;
    this.sha256 = sha256;
    this.accepted = accepted;
    this.rejected = rejected;
    this.reason = reason;
  }

  public get isApplicable(): boolean {
    return this.reason === undefined;
  }

  public static applicable(path: string, sha256: string, accepted: readonly RegexWrittenPattern[],
    rejected: readonly (readonly RegexWrittenPattern[])[]): RegexExpectedRecord {
    return new RegexExpectedRecord(path, sha256, accepted, rejected, undefined);
  }

  public static inapplicable(path: string, sha256: string, reason: string): RegexExpectedRecord {
    return new RegexExpectedRecord(path, sha256, [], [], reason);
  }

  public serialize(): string {
    return this.isApplicable
      ? JSON.stringify({ path: this.path, sha256: this.sha256, accepted: this.accepted, rejected: this.rejected })
      : JSON.stringify({ path: this.path, sha256: this.sha256, reason: this.reason });
  }
}
