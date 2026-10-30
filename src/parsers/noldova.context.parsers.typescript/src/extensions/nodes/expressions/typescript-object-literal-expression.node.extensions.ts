/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptObjectMemberKind } from "../../../enums/typescript-object-member-kind.js";
import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptObjectLiteralExpressionNode } from "../../../models/nodes/expressions/typescript-object-literal-expression.node.js";
import { TypeScriptEqualsNode } from "../../../models/nodes/operators/typescript-equals.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";

TypeScriptObjectLiteralExpressionNode.prototype.isTypeScriptLeftHandSideExpression = function (this: TypeScriptObjectLiteralExpressionNode): boolean {
  return true;
};

TypeScriptObjectLiteralExpressionNode.prototype.validateTypeScriptAssignmentTarget = function (this: TypeScriptObjectLiteralExpressionNode, context: TypeScriptParserContext, operatorNode: Node): void {
  if (operatorNode instanceof TypeScriptEqualsNode)
    this.reportTypeScriptRestTrailingComma(context);
};

TypeScriptObjectLiteralExpressionNode.prototype.markTypeScriptPattern = function (this: TypeScriptObjectLiteralExpressionNode, context: TypeScriptParserContext): void {
  context.records.patternLiterals.push(this);
  for (const memberNode of this.children)
    memberNode.markTypeScriptPattern(context);
};

TypeScriptObjectLiteralExpressionNode.prototype.validateTypeScriptGrammar = function (this: TypeScriptObjectLiteralExpressionNode, context: TypeScriptParserContext): void {
  const seen = new Map<string, TypeScriptObjectMemberKind>();
  for (const memberNode of this.children) {
    memberNode.validateTypeScriptObjectLiteralMember(context);
    const kind = memberNode.getTypeScriptObjectMemberKind();
    const nameNode = memberNode.getTypeScriptObjectMemberName();
    const name = nameNode?.getTypeScriptEffectivePropertyName(context);
    if (Object.isUndefined(nameNode) || Object.isUndefined(name))
      continue;
    const existing = seen.get(name) ?? TypeScriptObjectMemberKind.None;
    if (existing === TypeScriptObjectMemberKind.None)
      seen.set(name, kind);
    else if ((kind & TypeScriptObjectMemberKind.Method) !== 0 && (existing & TypeScriptObjectMemberKind.Method) !== 0)
      continue;
    else if ((kind & TypeScriptObjectMemberKind.Property) !== 0 && (existing & TypeScriptObjectMemberKind.Property) !== 0)
      context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1117, nameNode.span);
    else if ((kind & (TypeScriptObjectMemberKind.Get | TypeScriptObjectMemberKind.Set)) !== 0
      && (existing & (TypeScriptObjectMemberKind.Get | TypeScriptObjectMemberKind.Set)) !== 0)
      if (existing !== (TypeScriptObjectMemberKind.Get | TypeScriptObjectMemberKind.Set) && kind !== existing)
        seen.set(name, kind | existing);
      else {
        context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1118, nameNode.span);
        return;
      }
    else {
      context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1119, nameNode.span);
      return;
    }
  }
};

TypeScriptObjectLiteralExpressionNode.prototype.validateTypeScriptDestructuringTarget = function (this: TypeScriptObjectLiteralExpressionNode,
  context: TypeScriptParserContext): void {
  for (const memberNode of this.children)
    memberNode.validateTypeScriptDestructuringTarget(context);
};

TypeScriptObjectLiteralExpressionNode.prototype.isTypeScriptNonArithmeticLiteral = function (this: TypeScriptObjectLiteralExpressionNode): boolean {
  return true;
};

TypeScriptObjectLiteralExpressionNode.prototype.readsTypeScriptContextualType = function (this: TypeScriptObjectLiteralExpressionNode): boolean {
  return true;
};

TypeScriptObjectLiteralExpressionNode.prototype.validateTypeScriptIterationInitializer = function (this: TypeScriptObjectLiteralExpressionNode, context: TypeScriptParserContext,
  isForOf: boolean): void {
  if (isForOf)
    this.validateTypeScriptDestructuringTarget(context);
  else
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS2491, this.span);
};
