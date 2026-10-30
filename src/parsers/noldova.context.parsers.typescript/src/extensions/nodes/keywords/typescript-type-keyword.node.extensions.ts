/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptOpenBraceNode } from "../../../models/nodes/delimiters/typescript-open-brace.node.js";
import { TypeScriptFromKeywordNode } from "../../../models/nodes/keywords/typescript-from-keyword.node.js";
import { TypeScriptTypeKeywordNode } from "../../../models/nodes/keywords/typescript-type-keyword.node.js";
import { TypeScriptAsteriskNode } from "../../../models/nodes/operators/typescript-asterisk.node.js";
import { TypeScriptEqualsNode } from "../../../models/nodes/operators/typescript-equals.node.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptTypeKeywordNode.prototype.isTypeScriptTypeAliasStart = function (
  this: TypeScriptTypeKeywordNode,
  parser: TypeScriptSyntaxParser): this is TypeScriptTypeKeywordNode {
  return parser.lookAhead(() => {
    parser.advance();
    return !parser.hasPrecedingLineBreak() && parser.currentNode.isTypeScriptIdentifier(parser.context);
  });
};

TypeScriptTypeKeywordNode.prototype.parseTypeScriptStatement = function (this: TypeScriptTypeKeywordNode, parser: TypeScriptSyntaxParser, modifierNodes: readonly Node[] = []): Node {
  return modifierNodes.length > 0 || this.isTypeScriptTypeAliasStart(parser)
    ? parser.parseTypeAliasDeclaration(this, modifierNodes)
    : parser.parseExpressionOrLabeledStatement();
};

TypeScriptTypeKeywordNode.prototype.isTypeScriptDeclarationKeyword = function (this: TypeScriptTypeKeywordNode, _parser: TypeScriptSyntaxParser): boolean {
  return true;
};

TypeScriptTypeKeywordNode.prototype.isTypeScriptDeclarationStart = function (this: TypeScriptTypeKeywordNode, parser: TypeScriptSyntaxParser): boolean {
  return this.isTypeScriptTypeAliasStart(parser);
};

TypeScriptTypeKeywordNode.prototype.isTypeScriptImportPhase = function (this: TypeScriptTypeKeywordNode,
  parser: TypeScriptSyntaxParser): this is TypeScriptTypeKeywordNode {
  if (parser.currentNode instanceof TypeScriptFromKeywordNode && !parser.lookAhead(() => {
    parser.advance();
    return parser.currentNode instanceof TypeScriptFromKeywordNode || parser.currentNode instanceof TypeScriptEqualsNode;
  }))
    return false;
  return parser.currentNode.isTypeScriptBindingIdentifier() || parser.currentNode instanceof TypeScriptAsteriskNode || parser.currentNode instanceof TypeScriptOpenBraceNode;
};

TypeScriptTypeKeywordNode.prototype.canFollowTypeScriptExportKeyword = function (this: TypeScriptTypeKeywordNode, parser: TypeScriptSyntaxParser): boolean {
  return parser.lookAhead(() => {
    parser.advance();
    return parser.currentNode.canFollowTypeScriptExportModifier();
  });
};

TypeScriptTypeKeywordNode.prototype.isTypeScriptExportFormStart = function (this: TypeScriptTypeKeywordNode, parser: TypeScriptSyntaxParser): boolean {
  return this.isTypeScriptTypeAliasStart(parser) || parser.lookAhead(() => {
    parser.advance();
    return parser.currentNode.isTypeScriptExportClauseStart();
  });
};
