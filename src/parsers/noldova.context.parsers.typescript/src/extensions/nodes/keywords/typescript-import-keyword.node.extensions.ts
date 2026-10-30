/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";
import { SourceSpan } from "@noldova/context.parsers";

import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptDotNode } from "../../../models/nodes/delimiters/typescript-dot.node.js";
import { TypeScriptOpenBraceNode } from "../../../models/nodes/delimiters/typescript-open-brace.node.js";
import { TypeScriptOpenParenthesisNode } from "../../../models/nodes/delimiters/typescript-open-parenthesis.node.js";
import type { TypeScriptMetaPropertyNode } from "../../../models/nodes/expressions/typescript-meta-property.node.js";
import { TypeScriptImportKeywordNode } from "../../../models/nodes/keywords/typescript-import-keyword.node.js";
import { TypeScriptAsteriskNode } from "../../../models/nodes/operators/typescript-asterisk.node.js";
import { TypeScriptLessThanNode } from "../../../models/nodes/operators/typescript-less-than.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";
import { Resources } from "../../../resources.js";
import type { TypeParser } from "../../../services/parsers/types/type.parser.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

declare module "../../../models/nodes/keywords/typescript-import-keyword.node.js" {
  interface TypeScriptImportKeywordNode {
    validateTypeScriptMetaProperty(context: TypeScriptParserContext, metaPropertyNode: TypeScriptMetaPropertyNode, isCallee: boolean): void;
  }
}

TypeScriptImportKeywordNode.prototype.canStartTypeScriptExpression = function (this: TypeScriptImportKeywordNode, parser: TypeScriptSyntaxParser): boolean {
  return this.canStartTypeScriptLeftHandSideExpression(parser);
};

TypeScriptImportKeywordNode.prototype.canStartTypeScriptStatement = function (this: TypeScriptImportKeywordNode, parser: TypeScriptSyntaxParser): boolean {
  return this.isTypeScriptDeclarationStart(parser) || this.canStartTypeScriptLeftHandSideExpression(parser);
};

TypeScriptImportKeywordNode.prototype.isTypeScriptUnexpectedStatementToken = function (this: TypeScriptImportKeywordNode, parser: TypeScriptSyntaxParser): boolean {
  return !this.canStartTypeScriptStatement(parser);
};

TypeScriptImportKeywordNode.prototype.isTypeScriptQuickTypedCallee = function (this: TypeScriptImportKeywordNode): boolean {
  return false;
};

TypeScriptImportKeywordNode.prototype.canStartTypeScriptLeftHandSideExpression = function (this: TypeScriptImportKeywordNode, parser: TypeScriptSyntaxParser): boolean {
  return parser.lookAhead(() => {
    parser.advance();
    return parser.currentNode instanceof TypeScriptOpenParenthesisNode || parser.currentNode instanceof TypeScriptLessThanNode
      || parser.currentNode instanceof TypeScriptDotNode;
  });
};

TypeScriptImportKeywordNode.prototype.isTypeScriptDeclarationKeyword = function (this: TypeScriptImportKeywordNode, _parser: TypeScriptSyntaxParser): boolean {
  return true;
};

TypeScriptImportKeywordNode.prototype.isTypeScriptDeclarationStart = function (this: TypeScriptImportKeywordNode, parser: TypeScriptSyntaxParser): boolean {
  return parser.lookAhead(() => {
    parser.advance();
    return parser.currentNode.isTypeScriptModuleExportName() || parser.currentNode instanceof TypeScriptOpenBraceNode || parser.currentNode instanceof TypeScriptAsteriskNode;
  });
};

TypeScriptImportKeywordNode.prototype.parseTypeScriptStatement = function (this: TypeScriptImportKeywordNode, parser: TypeScriptSyntaxParser, modifierNodes: readonly Node[] = []): Node {
  return modifierNodes.length > 0 || this.isTypeScriptDeclarationStart(parser)
    ? parser.parseImportDeclaration(this, modifierNodes)
    : parser.parseExpressionOrLabeledStatement();
};

TypeScriptImportKeywordNode.prototype.parseTypeScriptMemberExpression = function (
  this: TypeScriptImportKeywordNode,
  parser: TypeScriptSyntaxParser): Node {
  return parser.parseImportExpression(this);
};

TypeScriptImportKeywordNode.prototype.canStartTypeScriptType = function (this: TypeScriptImportKeywordNode, _parser: TypeScriptSyntaxParser): boolean {
  return true;
};

TypeScriptImportKeywordNode.prototype.parseTypeScriptPrimaryType = function (this: TypeScriptImportKeywordNode, parser: TypeParser): Node {
  return parser.parseImportType(this);
};

TypeScriptImportKeywordNode.prototype.validateTypeScriptMetaProperty = function (this: TypeScriptImportKeywordNode, context: TypeScriptParserContext,
  metaPropertyNode: TypeScriptMetaPropertyNode, isCallee: boolean): void {
  const nameNode = metaPropertyNode.nameNode;
  const value = context.source.getText(nameNode.span);
  if (value === Resources.defer) {
    if (!isCallee)
      context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1005,
        new SourceSpan(metaPropertyNode.span.endOffset, 0), [Resources.openParenthesis]);
  }
  else if (value !== Resources.meta)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source,
      isCallee ? TypeScriptDiagnosticTemplates.TS18061 : TypeScriptDiagnosticTemplates.TS17012, nameNode.span,
      isCallee ? [value] : [value, Resources.import, Resources.meta]);
};
