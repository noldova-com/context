/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, SourceSpan } from "@noldova/context.parsers";

import { RegexClassSubtractionNode } from "../../../models/nodes/classes/regex-class-subtraction.node.js";
import { RegexHyphenHyphenNode } from "../../../models/nodes/punctuators/regex-hyphen-hyphen.node.js";
import { RegexCharacterNode } from "../../../models/nodes/regex-character.node.js";
import type { RegexSyntaxParser } from "../../../services/regex-syntax.parser.js";

RegexHyphenHyphenNode.prototype.parseRegexAtom = function (this: RegexHyphenHyphenNode, parser: RegexSyntaxParser): RegexCharacterNode {
  parser.advance();
  return new RegexCharacterNode(this.value, this.span);
};

RegexHyphenHyphenNode.prototype.isRegexClassSetOperator = function (this: RegexHyphenHyphenNode): boolean {
  return true;
};

RegexHyphenHyphenNode.prototype.createRegexClassSetExpression = function (this: RegexHyphenHyphenNode, operands: readonly Node[], span: SourceSpan): RegexClassSubtractionNode {
  return new RegexClassSubtractionNode(operands, span);
};
