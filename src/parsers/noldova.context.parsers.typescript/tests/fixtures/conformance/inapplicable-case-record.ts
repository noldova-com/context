/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ExpectedCaseRecord } from "./expected-case-record.js";
import type { JsonObject } from "./json-object.js";

export class InapplicableCaseRecord extends ExpectedCaseRecord {
  public readonly reason: string;

  public constructor(path: string, sha256: string, reason: string) {
    super(path, sha256);
    this.reason = reason;
  }

  public static from(object: JsonObject): InapplicableCaseRecord {
    return new InapplicableCaseRecord(object.string("path"), object.string("sha256"), object.string("reason"));
  }
}
