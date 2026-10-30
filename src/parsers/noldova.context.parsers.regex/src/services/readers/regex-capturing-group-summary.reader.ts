/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import type { SourceReader } from "@noldova/context.parsers";

import { RegexCapturingGroupSummary } from "../../models/regex-capturing-group-summary.js";
import { Resources } from "../../resources.js";
import { RegexGroupNameReader } from "./regex-group-name.reader.js";

export class RegexCapturingGroupSummaryReader {
  private readonly groupNameReader: RegexGroupNameReader = new RegexGroupNameReader();

  public read(reader: SourceReader, unicodeSetsMode: boolean): RegexCapturingGroupSummary {
    const startPosition = reader.currentOffset;
    const namedCapturingGroupNames: Set<string> = new Set();
    let capturingGroupCount = 0;
    let characterClassDepth = 0;

    while (!reader.isAtEnd) {
      const character = reader.readCodeUnit();
      if (character === Resources.backslash) {
        reader.readCodePoint();
        continue;
      }

      if (character === Resources.openBracket) {
        if (characterClassDepth === 0 || unicodeSetsMode)
          characterClassDepth++;
        continue;
      }

      if (character === Resources.closeBracket && characterClassDepth > 0) {
        characterClassDepth--;
        continue;
      }

      if (characterClassDepth > 0 || character !== Resources.openParenthesis)
        continue;

      if (reader.peekCodeUnit() !== Resources.question) {
        capturingGroupCount++;
        continue;
      }

      const prefix = reader.peekCodeUnit(Resources.question.length);
      if (prefix !== Resources.lessThan)
        continue;

      const following = reader.peekCodeUnit(Resources.question.length + Resources.lessThan.length);
      if (following === Resources.equals || following === Resources.exclamation)
        continue;

      capturingGroupCount++;
      reader.advance(Resources.question.length + Resources.lessThan.length);
      const groupName = this.groupNameReader.read(reader);
      if (!Object.isUndefined(groupName))
        namedCapturingGroupNames.add(groupName.value);
    }

    reader.seek(startPosition);
    return new RegexCapturingGroupSummary(capturingGroupCount, namedCapturingGroupNames);
  }
}
