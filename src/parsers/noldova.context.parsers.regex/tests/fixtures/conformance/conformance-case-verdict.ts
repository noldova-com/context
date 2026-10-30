/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexParserFixture } from "../regex-parser.fixture.js";
import type { ExpectedCaseRecord } from "./expected-case-record.js";
import type { ExpectedPattern } from "./expected-pattern.js";

export class ConformanceCaseVerdict {
  public readonly refused: readonly ExpectedPattern[];
  public readonly accepted: readonly (readonly ExpectedPattern[])[];

  private constructor(refused: readonly ExpectedPattern[], accepted: readonly (readonly ExpectedPattern[])[]) {
    this.refused = refused;
    this.accepted = accepted;
  }

  public get isMatch(): boolean {
    return this.refused.length === 0 && this.accepted.length === 0;
  }

  public static of(record: ExpectedCaseRecord): ConformanceCaseVerdict {
    return new ConformanceCaseVerdict(record.accepted.filter(t => !ConformanceCaseVerdict.accepts(t)),
      record.rejected.filter(group => group.every(t => ConformanceCaseVerdict.accepts(t))));
  }

  public describe(): string {
    return [
      ...this.refused.map(t => `  refused ${t.describe()}, which Test262 accepts`),
      ...this.accepted.map(group => `  accepted ${group.map(t => t.describe()).join(", ")}, which Test262 refuses`),
    ].join("\n");
  }

  private static accepts(pattern: ExpectedPattern): boolean {
    return RegexParserFixture.parse(pattern.pattern, pattern.flags).diagnostics.length === 0;
  }
}
