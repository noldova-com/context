/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import type { SourceReader } from "@noldova/context.parsers";
import "@noldova/context.text";

import { Resources } from "../../../resources.js";

export class TypeScriptUnicodeEscapeReader {
  public read(reader: SourceReader): number | undefined {
    if (!reader.startsWith(Resources.unicodeEscapePrefix))
      return undefined;

    if (reader.peekCodeUnit(Resources.unicodeEscapePrefix.length) === Resources.openBrace)
      return this.readExtended(reader);

    return this.readFixed(reader);
  }

  private readFixed(reader: SourceReader): number | undefined {
    let value = 0;

    for (let index = 0; index < Resources.unicodeEscapeDigitCount; index++) {
      const character = reader.peekCodeUnit(Resources.unicodeEscapePrefix.length + index);
      const digit = this.getHexadecimalDigit(character);
      if (Object.isUndefined(digit))
        return undefined;

      value = value * Resources.hexadecimalRadix + digit;
    }

    reader.advance(Resources.unicodeEscapePrefix.length + Resources.unicodeEscapeDigitCount);
    return value;
  }

  private readExtended(reader: SourceReader): number | undefined {
    let digitCount = 0;
    let offset = Resources.unicodeEscapePrefix.length + Resources.openBrace.length;
    let value = 0;

    while (true) {
      if (reader.currentOffset + offset >= reader.endOffset)
        return undefined;

      const character = reader.peekCodeUnit(offset);
      if (character === Resources.closeBrace)
        break;

      const digit = this.getHexadecimalDigit(character);
      if (Object.isUndefined(digit))
        return undefined;

      digitCount++;
      offset++;
      value = value * Resources.hexadecimalRadix + digit;
    }

    if (digitCount === 0 || value > Resources.maximumUnicodeCodePoint)
      return undefined;

    reader.advance(offset + Resources.closeBrace.length);
    return value;
  }

  private getHexadecimalDigit(character: string): number | undefined {
    if (!String.isAsciiHexDigit(character))
      return undefined;

    return Number.parseInt(character, Resources.hexadecimalRadix);
  }
}
