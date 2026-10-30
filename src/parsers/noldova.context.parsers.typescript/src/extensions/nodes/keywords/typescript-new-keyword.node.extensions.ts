/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import type { TypeScriptMetaPropertyNode } from "../../../models/nodes/expressions/typescript-meta-property.node.js";
import { TypeScriptNewKeywordNode } from "../../../models/nodes/keywords/typescript-new-keyword.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";
import { Resources } from "../../../resources.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

declare module "../../../models/nodes/keywords/typescript-new-keyword.node.js" {
  interface TypeScriptNewKeywordNode {
    validateTypeScriptMetaProperty(context: TypeScriptParserContext, metaPropertyNode: TypeScriptMetaPropertyNode): void;
  }
}

TypeScriptNewKeywordNode.prototype.canStartTypeScriptExpression = function (this: TypeScriptNewKeywordNode): boolean {
  return true;
};

TypeScriptNewKeywordNode.prototype.parseTypeScriptPrimaryExpression = function (
  this: TypeScriptNewKeywordNode,
  parser: TypeScriptSyntaxParser): Node {
  return parser.parseNewExpression(this);
};

TypeScriptNewKeywordNode.prototype.canStartTypeScriptType = function (this: TypeScriptNewKeywordNode, _parser: TypeScriptSyntaxParser): boolean {
  return true;
};

TypeScriptNewKeywordNode.prototype.canStartTypeScriptLeftHandSideExpression = function (this: TypeScriptNewKeywordNode): boolean {
  return true;
};

TypeScriptNewKeywordNode.prototype.validateTypeScriptMetaProperty = function (this: TypeScriptNewKeywordNode, context: TypeScriptParserContext,
  metaPropertyNode: TypeScriptMetaPropertyNode): void {
  if (!context.isNewTargetScope)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS17013, metaPropertyNode.span, [Resources.newTarget]);

  const nameNode = metaPropertyNode.nameNode;
  const value = context.source.getText(nameNode.span);
  if (value !== Resources.target)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS17012, nameNode.span, [value, Resources.new, Resources.target]);
};
