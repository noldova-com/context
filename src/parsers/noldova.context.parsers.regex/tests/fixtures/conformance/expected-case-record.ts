/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ExpectedPattern } from "./expected-pattern.js";
import type { JsonObject } from "./json-object.js";

export class ExpectedCaseRecord {
  private static readonly REASON: string = "reason";

  public readonly path: string;
  public readonly sha256: string;
  public readonly accepted: readonly ExpectedPattern[];
  public readonly rejected: readonly (readonly ExpectedPattern[])[];
  public readonly reason: string | undefined;

  private constructor(path: string, sha256: string, accepted: readonly ExpectedPattern[], rejected: readonly (readonly ExpectedPattern[])[],
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

  public static from(object: JsonObject): ExpectedCaseRecord {
    if (object.has(ExpectedCaseRecord.REASON))
      return new ExpectedCaseRecord(object.string("path"), object.string("sha256"), [], [], object.string(ExpectedCaseRecord.REASON));

    return new ExpectedCaseRecord(object.string("path"), object.string("sha256"), object.objects("accepted").map(t => ExpectedPattern.from(t)),
      object.objectGroups("rejected").map(group => group.map(t => ExpectedPattern.from(t))), undefined);
  }
}
