/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { BinaryDecoder } from "../types/binary-decoder.js";
import type { ValueParser } from "../types/value-parser.js";

export class Column {
  public readonly name: string;
  public readonly parser: ValueParser | null;
  public readonly decode: BinaryDecoder | null;
  public readonly table: number;
  public readonly number: number;
  public readonly type: number;

  public constructor(name: string, parser: ValueParser | null, decode: BinaryDecoder | null, table: number, number: number, type: number) {
    this.name = name;
    this.parser = parser;
    this.decode = decode;
    this.table = table;
    this.number = number;
    this.type = type;
  }

  public withDecoder(decode: BinaryDecoder): Column {
    return new Column(this.name, this.parser, decode, this.table, this.number, this.type);
  }

  public withParser(parser: ValueParser | null): Column {
    return new Column(this.name, parser, null, this.table, this.number, this.type);
  }
}
