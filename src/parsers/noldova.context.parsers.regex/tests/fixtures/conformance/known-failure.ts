/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { ConformanceCaseVerdict } from "./conformance-case-verdict.js";
import { ExpectedPattern } from "./expected-pattern.js";
import type { JsonObject } from "./json-object.js";

export class KnownFailure {
  public readonly path: string;
  public readonly refused: readonly ExpectedPattern[];
  public readonly accepted: readonly (readonly ExpectedPattern[])[];

  public constructor(path: string, refused: readonly ExpectedPattern[], accepted: readonly (readonly ExpectedPattern[])[]) {
    this.path = path;
    this.refused = refused;
    this.accepted = accepted;
  }

  public static fromVerdict(path: string, verdict: ConformanceCaseVerdict): KnownFailure {
    return new KnownFailure(path, verdict.refused, verdict.accepted);
  }

  public static from(object: JsonObject): KnownFailure {
    return new KnownFailure(object.string("path"), object.objects("refused").map(t => ExpectedPattern.from(t)),
      object.objectGroups("accepted").map(group => group.map(t => ExpectedPattern.from(t))));
  }

  public isRecordedAs(verdict: ConformanceCaseVerdict): boolean {
    return KnownFailure.keys(this.refused) === KnownFailure.keys(verdict.refused)
      && KnownFailure.keys(this.accepted.map(group => group[0]!)) === KnownFailure.keys(verdict.accepted.map(group => group[0]!));
  }

  public contains(failure: KnownFailure): boolean {
    const refused = new Set(this.refused.map(t => t.start));
    const accepted = new Set(this.accepted.map(group => group[0]!.start));
    return failure.refused.every(t => refused.has(t.start)) && failure.accepted.every(group => accepted.has(group[0]!.start));
  }

  private static keys(patterns: readonly ExpectedPattern[]): string {
    return JSON.stringify(patterns.map(t => t.start).toSorted((left, right) => left - right));
  }
}
