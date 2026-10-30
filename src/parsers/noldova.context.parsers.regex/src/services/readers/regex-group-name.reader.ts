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

import { RegexGroupName } from "../../models/regex-group-name.js";
import { Resources } from "../../resources.js";
import { RegexGroupNameValidator } from "../validators/regex-group-name.validator.js";
import { RegexUnicodeEscapeReader } from "./regex-unicode-escape.reader.js";

export class RegexGroupNameReader {
  private readonly groupNameValidator: RegexGroupNameValidator = new RegexGroupNameValidator();
  private readonly unicodeEscapeReader: RegexUnicodeEscapeReader = new RegexUnicodeEscapeReader();

  public read(reader: SourceReader): RegexGroupName | undefined {
    const value = new StringBuilder();
    let isValid = true;

    while (!reader.isAtEnd) {
      if (reader.peekCodeUnit() === Resources.greaterThan) {
        reader.advance();
        return new RegexGroupName(value.toString(), isValid && value.length > 0);
      }

      let codePoint: number;
      if (reader.peekCodeUnit() === Resources.backslash) {
        const escapeStartOffset = reader.currentOffset;
        const escape = this.unicodeEscapeReader.read(reader, true);
        if (Object.isUndefined(escape)) {
          reader.seek(escapeStartOffset);
          return undefined;
        }

        codePoint = escape.codePoint;
      }
      else
        codePoint = reader.readCodePoint();

      if (!this.groupNameValidator.isValidCodePoint(codePoint, value.length === 0))
        isValid = false;
      value.append(String.fromCodePoint(codePoint));
    }

    return undefined;
  }
}
