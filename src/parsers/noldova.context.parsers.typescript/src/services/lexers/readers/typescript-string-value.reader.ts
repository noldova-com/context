/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceReader } from "@noldova/context.parsers";
import { EcmaScriptLineTerminator, StringBuilder } from "@noldova/context.text";

import { Resources } from "../../../resources.js";
import { TypeScriptUnicodeEscapeReader } from "./typescript-unicode-escape.reader.js";

export class TypeScriptStringValueReader {
  private readonly unicodeEscapeReader: TypeScriptUnicodeEscapeReader = new TypeScriptUnicodeEscapeReader();
  private readonly lineTerminator: EcmaScriptLineTerminator = new EcmaScriptLineTerminator();

  public read(reader: SourceReader): string | undefined {
    const quote = reader.readCodeUnit();
    let startOffset = reader.currentOffset;
    let builder: StringBuilder | undefined;
    while (!reader.isAtEnd) {
      const character = reader.peekCodeUnit();
      if (character === quote) {
        const text = reader.source.getText(startOffset, reader.currentOffset - startOffset);
        reader.advance();
        return Object.isUndefined(builder) ? text : builder.append(text).toString();
      }
      if (character === Resources.backslash) {
        builder ??= new StringBuilder();
        builder.append(reader.source.getText(startOffset, reader.currentOffset - startOffset));
        const value = this.readEscape(reader);
        if (Object.isUndefined(value))
          return undefined;
        builder.append(value);
        startOffset = reader.currentOffset;
      }
      else
        reader.advance();
    }
    return undefined;
  }

  public readTokenValue(reader: SourceReader): string {
    const quote = reader.readCodeUnit();
    const builder = new StringBuilder();
    let startOffset = reader.currentOffset;
    while (!reader.isAtEnd && reader.peekCodeUnit() !== quote) {
      if (reader.peekCodeUnit() !== Resources.backslash) {
        reader.advance();
        continue;
      }
      builder.append(reader.source.getText(startOffset, reader.currentOffset - startOffset));
      const escapeOffset = reader.currentOffset;
      const value = this.readEscape(reader);
      if (!Object.isUndefined(value)) {
        builder.append(value);
        startOffset = reader.currentOffset;
        continue;
      }
      reader.seek(escapeOffset + Resources.backslash.length);
      startOffset = reader.isAtEnd ? reader.currentOffset : escapeOffset;
    }
    return builder.append(reader.source.getText(startOffset, reader.currentOffset - startOffset)).toString();
  }

  private readEscape(reader: SourceReader): string | undefined {
    if (reader.startsWith(Resources.unicodeEscapePrefix)) {
      const value = this.unicodeEscapeReader.read(reader);
      return Object.isUndefined(value) ? undefined : String.fromCodePoint(value);
    }
    if (reader.startsWith(Resources.hexadecimalEscapePrefix)) {
      reader.advance(Resources.hexadecimalEscapePrefix.length);
      const startOffset = reader.currentOffset;
      for (let index = 0; index < Resources.hexadecimalEscapeDigitCount; index++)
        if (!String.isAsciiHexDigit(reader.readCodeUnit()))
          return undefined;
      return String.fromCharCode(Number.parseInt(reader.source.getText(startOffset, Resources.hexadecimalEscapeDigitCount), Resources.hexadecimalRadix));
    }
    reader.advance();
    if (reader.isAtEnd)
      return undefined;
    const lineLength = this.lineTerminator.getLength(reader.source.content, reader.currentOffset);
    if (lineLength > 0) {
      reader.advance(lineLength);
      return String.empty;
    }
    const character = reader.readCodeUnit();
    if (String.isAsciiOctalDigit(character)) {
      const startOffset = reader.currentOffset - 1;
      if (Number.parseInt(character, Resources.octalRadix) <= Resources.maximumThreeDigitOctalEscapeLeadingDigit
        && String.isAsciiOctalDigit(reader.peekCodeUnit()))
        reader.advance();
      if (String.isAsciiOctalDigit(reader.peekCodeUnit()))
        reader.advance();
      return String.fromCharCode(Number.parseInt(reader.source.getText(startOffset, reader.currentOffset - startOffset), Resources.octalRadix));
    }
    return Resources.stringEscapeValues.get(character) ?? character;
  }
}
