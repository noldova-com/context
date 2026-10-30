/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptNameReservation } from "../../../enums/typescript-name-reservation.js";
import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptLetKeywordNode } from "../../../models/nodes/keywords/typescript-let-keyword.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptLetKeywordNode.prototype.isTypeScriptVariableStatementStart = function (
  this: TypeScriptLetKeywordNode,
  parser: TypeScriptSyntaxParser): this is TypeScriptLetKeywordNode {
  return parser.lookAhead(() => {
    parser.advance();
    return parser.currentNode.canStartTypeScriptBindingName();
  });
};

TypeScriptLetKeywordNode.prototype.isTypeScriptBindingIdentifier = function (this: TypeScriptLetKeywordNode): boolean {
  return true;
};

TypeScriptLetKeywordNode.prototype.isTypeScriptVariableDeclarationKeyword = function (this: TypeScriptLetKeywordNode): this is TypeScriptLetKeywordNode {
  return true;
};

TypeScriptLetKeywordNode.prototype.parseTypeScriptStatement = function (this: TypeScriptLetKeywordNode, parser: TypeScriptSyntaxParser, modifierNodes: readonly Node[] = []): Node {
  return modifierNodes.length > 0 || this.isTypeScriptVariableStatementStart(parser)
    ? parser.parseVariableStatement(this, modifierNodes)
    : parser.parseExpressionOrLabeledStatement();
};

TypeScriptLetKeywordNode.prototype.isTypeScriptDeclarationStart = function (this: TypeScriptLetKeywordNode, _parser: TypeScriptSyntaxParser): boolean {
  return true;
};

TypeScriptLetKeywordNode.prototype.getTypeScriptNameReservation = function (this: TypeScriptLetKeywordNode): TypeScriptNameReservation {
  return TypeScriptNameReservation.Strict;
};

TypeScriptLetKeywordNode.prototype.reportTypeScriptLetNames = function (this: TypeScriptLetKeywordNode, context: TypeScriptParserContext): void {
  context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS2480, this.span);
};
