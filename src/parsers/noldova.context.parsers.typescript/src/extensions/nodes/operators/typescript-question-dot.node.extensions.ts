/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptQuestionDotNode } from "../../../models/nodes/operators/typescript-question-dot.node.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptQuestionDotNode.prototype.parseTypeScriptLeftHandSideSuffix = function (
  this: TypeScriptQuestionDotNode,
  parser: TypeScriptSyntaxParser,
  expressionNode: Node): Node | undefined {
  return parser.parseOptionalChainExpression(expressionNode, this);
};

TypeScriptQuestionDotNode.prototype.isTypeScriptUnexpectedStatementToken = function (this: TypeScriptQuestionDotNode): boolean {
  return true;
};
