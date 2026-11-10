/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { ValueParser } from "../types/value-parser.js";
import type { ValueSerializer } from "../types/value-serializer.js";

export class TypeDefinition {
  public readonly to: number | string;
  public readonly from: readonly (number | string)[];
  public readonly serialize: ValueSerializer | null;
  public readonly parse: ValueParser | null;

  public constructor(to: number | string, from: readonly (number | string)[], serialize: ValueSerializer | null, parse: ValueParser | null) {
    this.to = to;
    this.from = from;
    this.serialize = serialize;
    this.parse = parse;
  }

  public get oids(): readonly (number | string)[] {
    return [this.to, ...this.from];
  }
}
