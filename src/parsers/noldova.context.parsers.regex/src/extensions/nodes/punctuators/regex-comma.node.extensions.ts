/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexCommaNode } from "../../../models/nodes/punctuators/regex-comma.node.js";
import { RegexCharacterNode } from "../../../models/nodes/regex-character.node.js";
import type { RegexSyntaxParser } from "../../../services/regex-syntax.parser.js";

RegexCommaNode.prototype.parseRegexAtom = function (this: RegexCommaNode, parser: RegexSyntaxParser): RegexCharacterNode {
  parser.advance();
  return new RegexCharacterNode(this.value, this.span);
};
