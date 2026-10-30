/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import type { TypeScriptParameterNode } from "../../../models/nodes/declarations/typescript-parameter.node.js";
import { TypeScriptThisTypeNode } from "../../../models/nodes/types/typescript-this-type.node.js";
import { TypeScriptTypePredicateNode } from "../../../models/nodes/types/typescript-type-predicate.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";

TypeScriptTypePredicateNode.prototype.validateTypeScriptPredicateParameter = function (this: TypeScriptTypePredicateNode,
  context: TypeScriptParserContext, parameterNodes: readonly TypeScriptParameterNode[]): void {
  const parameterNameNode = this.parameterNameNode;
  if (parameterNameNode instanceof TypeScriptThisTypeNode)
    return;

  const name = parameterNameNode.getTypeScriptDiagnosticText();
  const parameterNode = parameterNodes.find(t => t.nameNode.isTypeScriptBindingIdentifier() && t.nameNode.hasTypeScriptBindingName(name));
  if (!Object.isUndefined(parameterNode)) {
    if (!Object.isUndefined(parameterNode.dotDotDotNode))
      context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1229, parameterNameNode.span);
    return;
  }

  context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source,
    parameterNodes.some(t => t.nameNode.hasTypeScriptBindingName(name)) ? TypeScriptDiagnosticTemplates.TS1230 : TypeScriptDiagnosticTemplates.TS1225,
    parameterNameNode.span, [name]);
};
