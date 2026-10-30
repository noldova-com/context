/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { DiagnosticTemplate } from "@noldova/context.diagnostics";
import type { Node } from "@noldova/context.parsers";

import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptIndexSignatureNode } from "../../../models/nodes/declarations/typescript-index-signature.node.js";
import { TypeScriptReadonlyKeywordNode } from "../../../models/nodes/keywords/typescript-readonly-keyword.node.js";
import { TypeScriptStaticKeywordNode } from "../../../models/nodes/keywords/typescript-static-keyword.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";

TypeScriptIndexSignatureNode.prototype.getTypeScriptModifierRejection = function (this: TypeScriptIndexSignatureNode,
  context: TypeScriptParserContext, modifierNode: Node): DiagnosticTemplate | undefined {
  return modifierNode instanceof TypeScriptReadonlyKeywordNode
    || (modifierNode instanceof TypeScriptStaticKeywordNode && context.isClassBodyContext && !context.isTypeMemberContext)
    ? undefined
    : TypeScriptDiagnosticTemplates.TS1071;
};

TypeScriptIndexSignatureNode.prototype.reportTypeScriptGrammarAfterModifiers = function (this: TypeScriptIndexSignatureNode,
  context: TypeScriptParserContext, hasModifierDiagnostics: boolean): void {
  if (!hasModifierDiagnostics)
    this.validateTypeScriptGrammar(context);
  for (const parameterNode of this.indexParameterListNode.children)
    parameterNode.validateTypeScriptSignatureParameter(context);
};

TypeScriptIndexSignatureNode.prototype.validateTypeScriptGrammar = function (this: TypeScriptIndexSignatureNode, context: TypeScriptParserContext): void {
  const diagnostics = context.diagnosticCollector;
  const parameterNodes = this.indexParameterListNode.children;
  const parameterNode = parameterNodes[0];
  if (parameterNodes.length !== 1 || Object.isUndefined(parameterNode)) {
    diagnostics.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1096, parameterNode?.nameNode.span ?? this.span);
    return;
  }

  const parameterSpan = parameterNode.nameNode.span;
  if (!Object.isUndefined(parameterNode.dotDotDotNode))
    diagnostics.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1017, parameterNode.dotDotDotNode.span);
  else if (parameterNode.modifierNodes.length > 0)
    diagnostics.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1018, parameterSpan);
  else if (!Object.isUndefined(parameterNode.questionNode))
    diagnostics.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1019, parameterNode.questionNode.span);
  else if (!Object.isUndefined(parameterNode.initializerNode))
    diagnostics.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1020, parameterSpan);
  else if (Object.isUndefined(parameterNode.colonNode))
    diagnostics.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1022, parameterSpan);
  else if (Object.isUndefined(this.colonNode) && parameterNode.typeNode?.stopsTypeScriptIndexSignatureAtItsParameter() !== true)
    diagnostics.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1021, this.span);

  const trailingCommaNode = this.indexParameterListNode.getTypeScriptTrailingComma();
  if (!Object.isUndefined(trailingCommaNode) && !Object.isUndefined(this.indexParameterListNode.closeBracketNode))
    diagnostics.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1025, trailingCommaNode.span);
};
