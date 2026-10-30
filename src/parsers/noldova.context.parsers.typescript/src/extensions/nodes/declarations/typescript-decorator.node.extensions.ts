/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, SourceSpan } from "@noldova/context.parsers";

import { TypeScriptDecoratorSupport } from "../../../enums/typescript-decorator-support.js";
import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptDecoratorNode } from "../../../models/nodes/declarations/typescript-decorator.node.js";
import { TypeScriptParenthesizedExpressionNode } from "../../../models/nodes/expressions/typescript-parenthesized-expression.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";

TypeScriptDecoratorNode.prototype.validateTypeScriptModifierForDeclaration = function (this: TypeScriptDecoratorNode, context: TypeScriptParserContext,
  declarationNode: Node): void {
  const support = declarationNode.getTypeScriptDecoratorSupport();
  if (support === TypeScriptDecoratorSupport.Supported)
    return;

  context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source,
    support === TypeScriptDecoratorSupport.Overload ? TypeScriptDiagnosticTemplates.TS1249 : TypeScriptDiagnosticTemplates.TS1206, this.atNode.span);
};

TypeScriptDecoratorNode.prototype.getTypeScriptFirstTokenSpan = function (this: TypeScriptDecoratorNode): SourceSpan {
  return this.atNode.span;
};

TypeScriptDecoratorNode.prototype.validateTypeScriptGrammar = function (this: TypeScriptDecoratorNode, context: TypeScriptParserContext): void {
  const expressionNode = this.expressionNode;
  if (expressionNode instanceof TypeScriptParenthesizedExpressionNode)
    return;

  const syntaxErrorNode = expressionNode.getTypeScriptDecoratorSyntaxError();
  if (Object.isUndefined(syntaxErrorNode))
    return;

  context.diagnosticCollector.addTypeScriptRelatedGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1497, expressionNode.span,
    TypeScriptDiagnosticTemplates.TS1498, syntaxErrorNode.span);
};
