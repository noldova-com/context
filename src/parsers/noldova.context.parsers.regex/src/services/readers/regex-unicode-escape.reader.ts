/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import type { SourceReader } from "@noldova/context.parsers";
import { UnicodeCodePointService } from "@noldova/context.text";

import { RegexUnicodeEscapeValue } from "../../models/regex-unicode-escape-value.js";
import { Resources } from "../../resources.js";

export class RegexUnicodeEscapeReader {
  private static readonly FIXED_DIGIT_COUNT: number = 4;
  private static readonly HEXADECIMAL_RADIX: number = 16;
  private static readonly MAXIMUM_CODE_POINT: number = 0x10FFFF;
  private static readonly MINIMUM_LEAD_SURROGATE: number = 0xD800;
  private static readonly MINIMUM_TRAIL_SURROGATE: number = 0xDC00;
  private static readonly SURROGATE_FACTOR: number = 0x400;
  private static readonly SURROGATE_OFFSET: number = 0x10000;

  public read(reader: SourceReader, unicodeMode: boolean): RegexUnicodeEscapeValue | undefined {
    const startOffset = reader.currentOffset;
    const prefix = Resources.unicodeEscapePrefix;
    if (!reader.startsWith(prefix))
      return undefined;

    reader.advance(prefix.length);
    if (unicodeMode && reader.peekCodeUnit() === Resources.openBrace)
      return this.readBraced(reader, startOffset);

    const firstCodePoint = this.readFixedCodePoint(reader);
    if (Object.isUndefined(firstCodePoint))
      return undefined;

    if (!unicodeMode || !UnicodeCodePointService.isLeadingSurrogate(firstCodePoint))
      return this.createValue(reader, startOffset, firstCodePoint);

    const trailStartOffset = reader.currentOffset;
    if (!reader.startsWith(prefix))
      return this.createValue(reader, startOffset, firstCodePoint);

    reader.advance(prefix.length);
    const trailCodePoint = this.readFixedCodePoint(reader);
    if (Object.isUndefined(trailCodePoint) || !UnicodeCodePointService.isTrailingSurrogate(trailCodePoint)) {
      reader.seek(trailStartOffset);
      return this.createValue(reader, startOffset, firstCodePoint);
    }

    const codePoint =
      (firstCodePoint - RegexUnicodeEscapeReader.MINIMUM_LEAD_SURROGATE) * RegexUnicodeEscapeReader.SURROGATE_FACTOR +
      trailCodePoint - RegexUnicodeEscapeReader.MINIMUM_TRAIL_SURROGATE + RegexUnicodeEscapeReader.SURROGATE_OFFSET;

    return this.createValue(reader, startOffset, codePoint);
  }

  private createValue(reader: SourceReader, startOffset: number, codePoint: number): RegexUnicodeEscapeValue {
    const value = reader.source.getText(startOffset, reader.currentOffset - startOffset);
    return new RegexUnicodeEscapeValue(value, codePoint);
  }

  private readBraced(reader: SourceReader, startOffset: number): RegexUnicodeEscapeValue | undefined {
    reader.advance();
    const digits = reader.readWhile(String.isAsciiHexDigit);

    if (digits.length === 0 || reader.peekCodeUnit() !== Resources.closeBrace)
      return undefined;

    const codePoint = Number.parseInt(digits.toString(), RegexUnicodeEscapeReader.HEXADECIMAL_RADIX);
    if (codePoint > RegexUnicodeEscapeReader.MAXIMUM_CODE_POINT)
      return undefined;

    reader.advance();
    return this.createValue(reader, startOffset, codePoint);
  }

  private readFixedCodePoint(reader: SourceReader): number | undefined {
    const digitStartOffset = reader.currentOffset;

    for (let index = 0; index < RegexUnicodeEscapeReader.FIXED_DIGIT_COUNT; index++) {
      if (!String.isAsciiHexDigit(reader.peekCodeUnit()))
        return undefined;

      reader.advance();
    }

    const digits = reader.source.getText(digitStartOffset, reader.currentOffset - digitStartOffset);
    return Number.parseInt(digits, RegexUnicodeEscapeReader.HEXADECIMAL_RADIX);
  }
}
