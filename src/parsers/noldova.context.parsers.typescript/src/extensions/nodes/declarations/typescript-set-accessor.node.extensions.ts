/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptObjectMemberKind } from "../../../enums/typescript-object-member-kind.js";
import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptSetAccessorNode } from "../../../models/nodes/declarations/typescript-set-accessor.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";

TypeScriptSetAccessorNode.prototype.validateTypeScriptGrammar = function (this: TypeScriptSetAccessorNode, context: TypeScriptParserContext): void {
  const span = this.nameNode.span;
  const parameterNodes = this.parameterListNode.children.filter(t => !t.isTypeScriptThisParameter());
  const parameterNode = parameterNodes[0];

  if (!Object.isUndefined(this.typeParameterListNode))
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1094, span);
  else if (parameterNodes.length !== 1 || Object.isUndefined(parameterNode))
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1049, span);
  else if (!Object.isUndefined(this.colonNode))
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1095, span);
  else if (!Object.isUndefined(parameterNode.dotDotDotNode))
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1053, parameterNode.dotDotDotNode.span);
  else if (!Object.isUndefined(parameterNode.questionNode))
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1051, parameterNode.questionNode.span);
  else if (!Object.isUndefined(parameterNode.initializerNode))
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1052, span);
};

TypeScriptSetAccessorNode.prototype.getTypeScriptObjectMemberKind = function (this: TypeScriptSetAccessorNode): TypeScriptObjectMemberKind {
  return TypeScriptObjectMemberKind.Set;
};
