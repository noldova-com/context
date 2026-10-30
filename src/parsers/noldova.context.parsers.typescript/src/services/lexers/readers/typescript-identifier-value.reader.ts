/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import type { SourceReader } from "@noldova/context.parsers";
import { StringBuilder } from "@noldova/context.text";

import { Resources } from "../../../resources.js";
import { TypeScriptCharacterClassifier } from "../typescript-character-classifier.js";
import { TypeScriptUnicodeEscapeReader } from "./typescript-unicode-escape.reader.js";

export class TypeScriptIdentifierValueReader {
  private readonly unicodeEscapeReader: TypeScriptUnicodeEscapeReader = new TypeScriptUnicodeEscapeReader();

  public read(reader: SourceReader): string | undefined {
    const startOffset = reader.currentOffset;
    let segmentStartOffset = startOffset;
    let builder: StringBuilder | undefined;

    while (!reader.isAtEnd) {
      const partOffset = reader.currentOffset;
      const escapedCodePoint = reader.source.content.charAt(partOffset) === Resources.backslash ? this.unicodeEscapeReader.read(reader) : undefined;
      const codePoint = escapedCodePoint ?? reader.readCodePoint();
      const isIdentifierCodePoint = partOffset === startOffset
        ? TypeScriptCharacterClassifier.isIdentifierStart(codePoint)
        : TypeScriptCharacterClassifier.isIdentifierPart(codePoint);
      if (!isIdentifierCodePoint) {
        reader.seek(partOffset);
        break;
      }

      if (!Object.isUndefined(escapedCodePoint)) {
        builder ??= new StringBuilder();
        if (segmentStartOffset < partOffset)
          builder.append(reader.source.getText(segmentStartOffset, partOffset - segmentStartOffset));

        builder.append(String.fromCodePoint(escapedCodePoint));
        segmentStartOffset = reader.currentOffset;
      }
    }

    if (reader.currentOffset === startOffset)
      return undefined;

    const text = reader.source.getText(segmentStartOffset, reader.currentOffset - segmentStartOffset);
    return Object.isUndefined(builder) ? text : builder.append(text).toString();
  }
}
