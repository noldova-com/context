/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { Resources } from "../../resources.js";
import type { ValueParser } from "../../types/value-parser.js";

export class ArrayParser {
  private static readonly openBracket: number = 91;
  private static readonly equals: number = 61;
  private static readonly openBrace: number = 123;
  private static readonly closeBrace: number = 125;
  private static readonly quote: number = 34;
  private static readonly backslash: number = 92;

  private readonly text: string;
  private readonly parse: ValueParser | null;
  private readonly delimiter: number;
  private at: number;

  private constructor(text: string, parse: ValueParser | null, delimiter: string) {
    this.text = text;
    this.parse = parse;
    this.delimiter = delimiter.charCodeAt(0);
    this.at = text.charCodeAt(0) === ArrayParser.openBracket ? text.indexOf(String.fromCharCode(ArrayParser.equals)) + 1 : 0;
  }

  public static parse(text: string, parse: ValueParser | null, delimiter: string = Resources.arrayDelimiter): unknown[] {
    return new ArrayParser(text, parse, delimiter).parseLevel();
  }

  private parseLevel(): unknown[] {
    const values: unknown[] = [];
    const length = this.text.length;
    this.at += 1;
    while (this.at < length && this.readCode() !== ArrayParser.closeBrace) {
      if (this.readCode() === ArrayParser.openBrace)
        values.push(this.parseLevel());
      else if (this.readCode() === ArrayParser.quote) {
        let value = "";
        for (this.at += 1; this.at < length && this.readCode() !== ArrayParser.quote; this.at += 1) {
          if (this.readCode() === ArrayParser.backslash)
            this.at += 1;
          value += this.text.charAt(this.at);
        }
        this.at += 1;
        values.push(Object.isNull(this.parse) ? value : this.parse(value));
      }
      else {
        const start = this.at;
        while (this.at < length && this.readCode() !== this.delimiter && this.readCode() !== ArrayParser.closeBrace)
          this.at += 1;
        const value = this.text.slice(start, this.at);
        values.push(value === Resources.nullLiteral ? null : Object.isNull(this.parse) ? value : this.parse(value));
      }
      if (this.readCode() === this.delimiter)
        this.at += 1;
    }
    this.at += 1;
    return values;
  }

  private readCode(): number {
    return this.text.charCodeAt(this.at);
  }
}
