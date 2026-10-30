/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptColonNode } from "../../../models/nodes/delimiters/typescript-colon.node.js";
import { TypeScriptOpenBracketNode } from "../../../models/nodes/delimiters/typescript-open-bracket.node.js";
import { TypeScriptKeywordNode } from "../../../models/nodes/keywords/typescript-keyword.node.js";
import { TypeScriptAsteriskNode } from "../../../models/nodes/operators/typescript-asterisk.node.js";
import { TypeScriptEqualsNode } from "../../../models/nodes/operators/typescript-equals.node.js";
import { TypeScriptExclamationNode } from "../../../models/nodes/operators/typescript-exclamation.node.js";
import { TypeScriptQuestionNode } from "../../../models/nodes/operators/typescript-question.node.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptKeywordNode.prototype.hasTypeScriptKeywordEscape = function (this: TypeScriptKeywordNode): boolean {
  return this.span.length !== this.value.length;
};

TypeScriptKeywordNode.prototype.isTypeScriptIdentifierName = function (this: TypeScriptKeywordNode): boolean {
  return true;
};

TypeScriptKeywordNode.prototype.isTypeScriptLeftHandSideExpression = function (this: TypeScriptKeywordNode): boolean {
  return this.isTypeScriptBindingIdentifier();
};

TypeScriptKeywordNode.prototype.reportTypeScriptInvalidVariableDeclaration = function (this: TypeScriptKeywordNode, parser: TypeScriptSyntaxParser): void {
  parser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1389, this.span, [this.value]);
};

TypeScriptKeywordNode.prototype.canStartTypeScriptPropertyName = function (this: TypeScriptKeywordNode): boolean {
  return true;
};

TypeScriptKeywordNode.prototype.isTypeScriptAccessName = function (this: TypeScriptKeywordNode): boolean {
  return true;
};

TypeScriptKeywordNode.prototype.canFollowTypeScriptUnscopedAwaitOrYield = function (this: TypeScriptKeywordNode): boolean {
  return true;
};

TypeScriptKeywordNode.prototype.toTypeScriptBindingName = function (this: TypeScriptKeywordNode): TypeScriptKeywordNode | undefined {
  return this.isTypeScriptBindingIdentifier() ? this : undefined;
};

TypeScriptKeywordNode.prototype.reportTypeScriptMissingSemicolon = function (this: TypeScriptKeywordNode, parser: TypeScriptSyntaxParser): void {
  parser.reportMissingSemicolonAfterName(this);
};

TypeScriptKeywordNode.prototype.reportTypeScriptInvalidBindingName = function (this: TypeScriptKeywordNode, parser: TypeScriptSyntaxParser): void {
  parser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1359, this.span, [parser.context.source.getText(this.span)]);
};

TypeScriptKeywordNode.prototype.canStartTypeScriptClassMember = function (this: TypeScriptKeywordNode, parser: TypeScriptSyntaxParser): boolean {
  if (this.startsTypeScriptClassMember())
    return true;
  return parser.lookAhead(() => {
    let node: Node = this;
    while (node.isTypeScriptDeclarationModifier()) {
      parser.advance();
      node = parser.currentNode;
      if (node.startsTypeScriptClassMember())
        return true;
      if (node instanceof TypeScriptAsteriskNode || (!node.isTypeScriptDeclarationModifier() && node.canStartTypeScriptPropertyName()))
        return node.canStartTypeScriptClassMember(parser);
    }
    if (node === this) {
      parser.advance();
      node = parser.currentNode;
    }
    return node instanceof TypeScriptOpenBracketNode || node.canStartTypeScriptSignature() || node instanceof TypeScriptColonNode
      || node instanceof TypeScriptQuestionNode || node instanceof TypeScriptExclamationNode || node instanceof TypeScriptEqualsNode
      || parser.canParseStatementTerminator();
  });
};

TypeScriptKeywordNode.prototype.reportTypeScriptInvalidParameter = function (this: TypeScriptKeywordNode, parser: TypeScriptSyntaxParser): void {
  parser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1390, this.span, [this.value]);
};

TypeScriptKeywordNode.prototype.getTypeScriptTokenValue = function (this: TypeScriptKeywordNode): string | undefined {
  return this.getTypeScriptDiagnosticText();
};
