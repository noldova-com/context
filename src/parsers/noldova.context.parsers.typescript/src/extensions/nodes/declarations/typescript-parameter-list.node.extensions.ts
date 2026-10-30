/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptBindingPatternNode } from "../../../models/nodes/declarations/typescript-binding-pattern.node.js";
import { TypeScriptParameterListNode } from "../../../models/nodes/declarations/typescript-parameter-list.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";
import { Resources } from "../../../resources.js";

declare module "../../../models/nodes/declarations/typescript-parameter-list.node.js" {
  interface TypeScriptParameterListNode {
    readTypeScriptHolder(context: TypeScriptParserContext, holderNode: Node): void;
  }
}

TypeScriptParameterListNode.prototype.validateTypeScriptGrammar = function (this: TypeScriptParameterListNode, context: TypeScriptParserContext): void {
  const diagnostics = context.diagnosticCollector;
  const diagnosticCount = diagnostics.diagnostics.length;
  const trailingCommaNode = this.getTypeScriptTrailingComma();
  let hasOptionalParameter = false;
  for (let index = 0; index < this.children.length; index++) {
    const parameterNode = this.children[index]!;
    const isOptionalParameter = parameterNode.isTypeScriptOptionalParameter();
    if (!Object.isUndefined(parameterNode.dotDotDotNode) && index < this.children.length - 1)
      diagnostics.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1014, parameterNode.dotDotDotNode.span);
    else if (!Object.isUndefined(parameterNode.dotDotDotNode) && !Object.isUndefined(trailingCommaNode) && !context.isAmbient)
      diagnostics.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1013, trailingCommaNode.span);
    else if (hasOptionalParameter && !isOptionalParameter && Object.isUndefined(parameterNode.initializerNode) && Object.isUndefined(parameterNode.dotDotDotNode))
      diagnostics.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1016, parameterNode.nameNode.span);
    else
      parameterNode.validateTypeScriptGrammar(context);

    if (diagnostics.diagnostics.length !== diagnosticCount)
      return;

    hasOptionalParameter ||= isOptionalParameter;
  }
};

TypeScriptParameterListNode.prototype.readTypeScriptHolder = function (this: TypeScriptParameterListNode, context: TypeScriptParserContext,
  holderNode: Node): void {
  const hasBody = holderNode.hasTypeScriptBody();
  const thisRejection = holderNode.getTypeScriptThisParameterRejection();
  for (const [index, parameterNode] of this.children.entries()) {
    if (parameterNode.isTypeScriptThisParameter()) {
      if (index !== 0)
        context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS2680, parameterNode.span, [Resources.this]);
      if (!Object.isUndefined(thisRejection))
        context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, thisRejection, parameterNode.span);
    }
    if (!hasBody)
      parameterNode.validateTypeScriptSignatureParameter(context);
    else if (!Object.isUndefined(parameterNode.questionNode) && Object.isUndefined(parameterNode.initializerNode)
      && parameterNode.nameNode instanceof TypeScriptBindingPatternNode)
      context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS2463, parameterNode.span);
  }
};
