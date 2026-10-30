/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { JsonObject } from "./json-object.js";

export class ExpectedCaseFile {
  public readonly name: string;
  public readonly sha256: string;

  public constructor(name: string, sha256: string) {
    this.name = name;
    this.sha256 = sha256;
  }

  public static from(object: JsonObject): ExpectedCaseFile {
    return new ExpectedCaseFile(object.string("name"), object.string("sha256"));
  }
}
