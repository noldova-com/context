/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexEqualsNode } from "../../../models/nodes/punctuators/regex-equals.node.js";
import { RegexCharacterNode } from "../../../models/nodes/regex-character.node.js";
import type { RegexSyntaxParser } from "../../../services/regex-syntax.parser.js";

RegexEqualsNode.prototype.parseRegexAtom = function (this: RegexEqualsNode, parser: RegexSyntaxParser): RegexCharacterNode {
  parser.advance();
  return new RegexCharacterNode(this.value, this.span);
};
