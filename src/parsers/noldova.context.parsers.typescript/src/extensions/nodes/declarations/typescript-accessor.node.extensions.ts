/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { DiagnosticTemplate } from "@noldova/context.diagnostics";
import type { Node } from "@noldova/context.parsers";
import { SourceSpan } from "@noldova/context.parsers";

import { TypeScriptDecoratorSupport } from "../../../enums/typescript-decorator-support.js";
import { TypeScriptModifierFlags } from "../../../enums/typescript-modifier-flags.js";
import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptAccessorNode } from "../../../models/nodes/declarations/typescript-accessor.node.js";
import { TypeScriptAbstractKeywordNode } from "../../../models/nodes/keywords/typescript-abstract-keyword.node.js";
import { TypeScriptDeclareKeywordNode } from "../../../models/nodes/keywords/typescript-declare-keyword.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";
import { Resources } from "../../../resources.js";

declare module "../../../models/nodes/declarations/typescript-accessor.node.js" {
  interface TypeScriptAccessorNode {
    reportTypeScriptObjectLiteralMember(context: TypeScriptParserContext): void;
  }
}

TypeScriptAccessorNode.prototype.reportTypeScriptGrammarAfterModifiers = function (this: TypeScriptAccessorNode, context: TypeScriptParserContext,
  hasModifierDiagnostics: boolean): void {
  if (hasModifierDiagnostics)
    return;

  if (context.isTypeMemberContext) {
    if (!Object.isUndefined(this.bodyNode))
      context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1183, this.bodyNode.span);
    return;
  }
  if (!Object.isUndefined(this.bodyNode) || context.isAmbient
    || this.modifierNodes.some(t => t instanceof TypeScriptAbstractKeywordNode || t instanceof TypeScriptDeclareKeywordNode))
    return;
  context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1005,
    new SourceSpan(this.span.endOffset - 1, 1), [Resources.openBrace]);
};

TypeScriptAccessorNode.prototype.getTypeScriptAllowedModifiers = function (this: TypeScriptAccessorNode): TypeScriptModifierFlags {
  return TypeScriptModifierFlags.All & ~(TypeScriptModifierFlags.Async | TypeScriptModifierFlags.Readonly | TypeScriptModifierFlags.Accessor | TypeScriptModifierFlags.Declare);
};

TypeScriptAccessorNode.prototype.getTypeScriptDecoratorSupport = function (this: TypeScriptAccessorNode): TypeScriptDecoratorSupport {
  return Object.isUndefined(this.bodyNode) ? TypeScriptDecoratorSupport.Unsupported : TypeScriptDecoratorSupport.Supported;
};

TypeScriptAccessorNode.prototype.getTypeScriptAbstractRejection = function (this: TypeScriptAccessorNode): DiagnosticTemplate | undefined {
  return TypeScriptDiagnosticTemplates.TS1244;
};

TypeScriptAccessorNode.prototype.getTypeScriptDeclarationNameSpan = function (this: TypeScriptAccessorNode,
  _context: TypeScriptParserContext): SourceSpan {
  return this.nameNode.span;
};

TypeScriptAccessorNode.prototype.getTypeScriptModifierNodes = function (this: TypeScriptAccessorNode): readonly Node[] {
  return this.modifierNodes;
};

TypeScriptAccessorNode.prototype.reportTypeScriptCommaComputedName = function (this: TypeScriptAccessorNode, context: TypeScriptParserContext): void {
  this.nameNode.reportTypeScriptCommaComputedName(context);
};

TypeScriptAccessorNode.prototype.getTypeScriptObjectMemberName = function (this: TypeScriptAccessorNode): Node {
  return this.nameNode;
};

TypeScriptAccessorNode.prototype.reportTypeScriptObjectLiteralMember = function (this: TypeScriptAccessorNode, context: TypeScriptParserContext): void {
  this.nameNode.reportTypeScriptObjectMemberName(context);
};

TypeScriptAccessorNode.prototype.getTypeScriptThisParameterRejection = function (this: TypeScriptAccessorNode): DiagnosticTemplate | undefined {
  return TypeScriptDiagnosticTemplates.TS2784;
};

TypeScriptAccessorNode.prototype.hasTypeScriptBody = function (this: TypeScriptAccessorNode): boolean {
  return this.bodyNode?.isTypeScriptPresent() === true;
};
