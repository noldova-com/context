/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexHyphenNode } from "../../../models/nodes/punctuators/regex-hyphen.node.js";
import { RegexCharacterNode } from "../../../models/nodes/regex-character.node.js";
import { Resources } from "../../../resources.js";
import type { RegexSyntaxParser } from "../../../services/regex-syntax.parser.js";

RegexHyphenNode.prototype.getRegexCharacterValue = function (this: RegexHyphenNode): number {
  return Resources.hyphen.charCodeAt(0);
};

RegexHyphenNode.prototype.parseRegexAtom = function (this: RegexHyphenNode, parser: RegexSyntaxParser): RegexCharacterNode {
  parser.advance();
  return new RegexCharacterNode(this.value, this.span);
};
