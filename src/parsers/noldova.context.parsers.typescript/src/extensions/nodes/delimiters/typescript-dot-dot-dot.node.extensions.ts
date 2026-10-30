/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptDotDotDotNode } from "../../../models/nodes/delimiters/typescript-dot-dot-dot.node.js";
import { TypeScriptSpreadElementNode } from "../../../models/nodes/expressions/typescript-spread-element.node.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

declare module "../../../models/nodes/delimiters/typescript-dot-dot-dot.node.js" {
  interface TypeScriptDotDotDotNode {
    parseTypeScriptSpreadElement(parser: TypeScriptSyntaxParser): TypeScriptSpreadElementNode;
  }
}

TypeScriptDotDotDotNode.prototype.canFollowTypeScriptModifier = function (this: TypeScriptDotDotDotNode): boolean {
  return true;
};

TypeScriptDotDotDotNode.prototype.isTypeScriptUnexpectedStatementToken = function (this: TypeScriptDotDotDotNode): boolean {
  return true;
};

TypeScriptDotDotDotNode.prototype.canStartTypeScriptParameter = function (this: TypeScriptDotDotDotNode, _parser: TypeScriptSyntaxParser): boolean {
  return true;
};

TypeScriptDotDotDotNode.prototype.parseTypeScriptSpreadElement = function (this: TypeScriptDotDotDotNode, parser: TypeScriptSyntaxParser): TypeScriptSpreadElementNode {
  parser.advance();
  const expressionNode = parser.parseAssignmentExpression();
  const span = parser.typescriptLexer.reader.createSpan(this.span, expressionNode.span);
  return new TypeScriptSpreadElementNode(this, span, expressionNode, this.leadingTrivia, expressionNode.trailingTrivia);
};
