/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptPrivateIdentifierNode } from "../../../models/nodes/identifiers/typescript-private-identifier.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";
import { Resources } from "../../../resources.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptPrivateIdentifierNode.prototype.canStartTypeScriptExpression = function (this: TypeScriptPrivateIdentifierNode): boolean {
  return true;
};

TypeScriptPrivateIdentifierNode.prototype.canStartTypeScriptPropertyName = function (this: TypeScriptPrivateIdentifierNode): boolean {
  return true;
};

TypeScriptPrivateIdentifierNode.prototype.canStartTypeScriptPrimaryExpression = function (this: TypeScriptPrivateIdentifierNode): boolean {
  return true;
};

TypeScriptPrivateIdentifierNode.prototype.isTypeScriptAccessName = function (this: TypeScriptPrivateIdentifierNode): boolean {
  return true;
};

TypeScriptPrivateIdentifierNode.prototype.canFollowTypeScriptUnscopedAwaitOrYield = function (this: TypeScriptPrivateIdentifierNode): boolean {
  return true;
};

TypeScriptPrivateIdentifierNode.prototype.parseTypeScriptPrimaryExpression = function (this: TypeScriptPrivateIdentifierNode, parser: TypeScriptSyntaxParser): TypeScriptPrivateIdentifierNode {
  parser.advance();
  this.validateTypeScriptIdentifierName(parser.context);
  if (!parser.context.isClassBodyContext)
    parser.context.diagnosticCollector.addTypeScriptGrammarDiagnostic(parser.context.source, TypeScriptDiagnosticTemplates.TS18016, this.span);

  return this;
};

TypeScriptPrivateIdentifierNode.prototype.isTypeScriptLeftHandSideExpression = function (this: TypeScriptPrivateIdentifierNode): boolean {
  return true;
};

TypeScriptPrivateIdentifierNode.prototype.canStartTypeScriptVariableDeclaration = function (this: TypeScriptPrivateIdentifierNode): boolean {
  return true;
};

TypeScriptPrivateIdentifierNode.prototype.canStartTypeScriptParameter = function (this: TypeScriptPrivateIdentifierNode, _parser: TypeScriptSyntaxParser): boolean {
  return true;
};

TypeScriptPrivateIdentifierNode.prototype.isTypeScriptIdentifierName = function (this: TypeScriptPrivateIdentifierNode): boolean {
  return true;
};

TypeScriptPrivateIdentifierNode.prototype.canStartTypeScriptType = function (this: TypeScriptPrivateIdentifierNode, _parser: TypeScriptSyntaxParser): boolean {
  return false;
};

TypeScriptPrivateIdentifierNode.prototype.validateTypeScriptIdentifierName = function (this: TypeScriptPrivateIdentifierNode, context: TypeScriptParserContext): void {
  if (this.value === Resources.hash + Resources.constructorKeyword)
    context.diagnosticCollector.addTypeScriptBinderDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS18012, this.span, [this.value]);
};

TypeScriptPrivateIdentifierNode.prototype.reportTypeScriptObjectMemberName = function (this: TypeScriptPrivateIdentifierNode, context: TypeScriptParserContext): void {
  context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS18016, this.span);
};

TypeScriptPrivateIdentifierNode.prototype.getTypeScriptTokenValue = function (this: TypeScriptPrivateIdentifierNode): string | undefined {
  return this.getTypeScriptDiagnosticText();
};
