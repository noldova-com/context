/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptDotNode } from "../../../models/nodes/delimiters/typescript-dot.node.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptDotNode.prototype.parseTypeScriptMemberSuffix = function (
  this: TypeScriptDotNode,
  parser: TypeScriptSyntaxParser,
  expressionNode: Node): Node | undefined {
  parser.advance();
  return parser.parsePropertyAccessExpression(expressionNode, this);
};

TypeScriptDotNode.prototype.isTypeScriptUnexpectedStatementToken = function (this: TypeScriptDotNode): boolean {
  return true;
};
