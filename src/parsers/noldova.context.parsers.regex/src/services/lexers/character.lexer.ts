/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { UnicodeCodePointService } from "@noldova/context.text";

import { RegexCharacterNode } from "../../models/nodes/regex-character.node.js";
import type { RegexLexer } from "./regex.lexer.js";

export class CharacterLexer {
  public lex(lexer: RegexLexer, character: string): RegexCharacterNode {
    const startOffset = lexer.reader.currentOffset;
    let value = character;

    if ((lexer.unicodeMode || lexer.isInGroupName) && UnicodeCodePointService.isLeadingSurrogate(character.charCodeAt(0))) {
      const trailingCharacter = lexer.reader.peekCodeUnit(1);
      if (UnicodeCodePointService.isTrailingSurrogate(trailingCharacter.charCodeAt(0)))
        value += trailingCharacter;
    }

    lexer.reader.advance(value.length);

    const span = lexer.reader.createSpan(startOffset, lexer.reader.currentOffset - startOffset);
    return new RegexCharacterNode(value, span);
  }
}
