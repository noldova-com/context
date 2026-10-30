/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexOpenBraceNode } from "../../../models/nodes/punctuators/regex-open-brace.node.js";
import { RegexCharacterNode } from "../../../models/nodes/regex-character.node.js";
import type { RegexSyntaxParser } from "../../../services/regex-syntax.parser.js";

RegexOpenBraceNode.prototype.parseRegexAtom = function (this: RegexOpenBraceNode, parser: RegexSyntaxParser): RegexCharacterNode | undefined {
  if (parser.regexLexer.unicodeMode)
    return undefined;

  parser.advance();
  return new RegexCharacterNode(this.value, this.span);
};
