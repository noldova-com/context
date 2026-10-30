/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptColonNode } from "../../../models/nodes/delimiters/typescript-colon.node.js";
import { TypeScriptOpenBraceNode } from "../../../models/nodes/delimiters/typescript-open-brace.node.js";
import { TypeScriptSemicolonNode } from "../../../models/nodes/delimiters/typescript-semicolon.node.js";
import { TypeScriptOfKeywordNode } from "../../../models/nodes/keywords/typescript-of-keyword.node.js";
import { TypeScriptUsingKeywordNode } from "../../../models/nodes/keywords/typescript-using-keyword.node.js";
import { TypeScriptEqualsNode } from "../../../models/nodes/operators/typescript-equals.node.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptUsingKeywordNode.prototype.isTypeScriptVariableDeclarationKeyword = function (this: TypeScriptUsingKeywordNode): this is TypeScriptUsingKeywordNode {
  return true;
};

TypeScriptUsingKeywordNode.prototype.isTypeScriptVariableStatementStart = function (this: TypeScriptUsingKeywordNode, parser: TypeScriptSyntaxParser): this is TypeScriptUsingKeywordNode {
  return parser.lookAhead(() => {
    parser.advance();
    return !parser.hasPrecedingLineBreak()
      && (parser.currentNode.isTypeScriptBindingIdentifier() || parser.currentNode instanceof TypeScriptOpenBraceNode);
  });
};

TypeScriptUsingKeywordNode.prototype.isTypeScriptForVariableDeclarationStart = function (this: TypeScriptUsingKeywordNode, parser: TypeScriptSyntaxParser): this is TypeScriptUsingKeywordNode {
  return parser.lookAhead(() => {
    parser.advance();
    const nameNode = parser.currentNode;
    if (nameNode instanceof TypeScriptOfKeywordNode) {
      parser.advance();
      return parser.currentNode instanceof TypeScriptEqualsNode || parser.currentNode instanceof TypeScriptSemicolonNode || parser.currentNode instanceof TypeScriptColonNode;
    }
    return !parser.hasPrecedingLineBreak()
      && (parser.currentNode.isTypeScriptBindingIdentifier() || parser.currentNode instanceof TypeScriptOpenBraceNode);
  });
};

TypeScriptUsingKeywordNode.prototype.isTypeScriptDeclarationKeyword = function (this: TypeScriptUsingKeywordNode, _parser: TypeScriptSyntaxParser): boolean {
  return true;
};

TypeScriptUsingKeywordNode.prototype.isTypeScriptDeclarationStart = function (this: TypeScriptUsingKeywordNode, parser: TypeScriptSyntaxParser): boolean {
  return this.isTypeScriptVariableStatementStart(parser);
};

TypeScriptUsingKeywordNode.prototype.parseTypeScriptStatement = function (this: TypeScriptUsingKeywordNode, parser: TypeScriptSyntaxParser, modifierNodes: readonly Node[] = []): Node {
  return modifierNodes.length > 0 || this.isTypeScriptVariableStatementStart(parser)
    ? parser.parseVariableStatement(this, modifierNodes)
    : parser.parseExpressionOrLabeledStatement();
};
