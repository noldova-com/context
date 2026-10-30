/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, SourceSpan } from "@noldova/context.parsers";

import { RegexClassIntersectionNode } from "../../../models/nodes/classes/regex-class-intersection.node.js";
import { RegexAmpersandAmpersandNode } from "../../../models/nodes/punctuators/regex-ampersand-ampersand.node.js";
import { RegexCharacterNode } from "../../../models/nodes/regex-character.node.js";
import type { RegexSyntaxParser } from "../../../services/regex-syntax.parser.js";

RegexAmpersandAmpersandNode.prototype.parseRegexAtom = function (this: RegexAmpersandAmpersandNode, parser: RegexSyntaxParser): RegexCharacterNode {
  parser.advance();
  return new RegexCharacterNode(this.value, this.span);
};

RegexAmpersandAmpersandNode.prototype.isRegexClassSetOperator = function (this: RegexAmpersandAmpersandNode): boolean {
  return true;
};

RegexAmpersandAmpersandNode.prototype.createRegexClassSetExpression = function (this: RegexAmpersandAmpersandNode, operands: readonly Node[], span: SourceSpan): RegexClassIntersectionNode {
  return new RegexClassIntersectionNode(operands, span);
};
