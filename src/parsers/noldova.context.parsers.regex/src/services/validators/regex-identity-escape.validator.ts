/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Resources } from "../../resources.js";
import type { RegexLexer } from "../lexers/regex.lexer.js";

export class RegexIdentityEscapeValidator {
  public isValid(lexer: RegexLexer, character: string): boolean {
    if (!lexer.unicodeMode) {
      if (lexer.hasNamedCapturingGroups && character === Resources.namedBackreferenceEscapeCharacter)
        return false;

      return true;
    }

    if (Resources.syntaxCharacters.includes(character) || character === Resources.slash)
      return true;

    if (!lexer.isInCharacterClass)
      return false;

    if (character === Resources.hyphen)
      return true;

    return lexer.unicodeSetsMode && Resources.classSetReservedPunctuators.includes(character);
  }
}
