/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { JsonObject } from "./json-object.js";

export class ExpectedPattern {
  public readonly start: number;
  public readonly pattern: string;
  public readonly flags: string;

  public constructor(start: number, pattern: string, flags: string) {
    this.start = start;
    this.pattern = pattern;
    this.flags = flags;
  }

  public static from(object: JsonObject): ExpectedPattern {
    return new ExpectedPattern(object.number("start"), object.string("pattern"), object.string("flags"));
  }

  public describe(): string {
    return `@${this.start} /${this.pattern}/${this.flags}`;
  }
}
