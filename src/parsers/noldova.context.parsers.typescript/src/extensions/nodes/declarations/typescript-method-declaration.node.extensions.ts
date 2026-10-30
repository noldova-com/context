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
import { TypeScriptObjectMemberKind } from "../../../enums/typescript-object-member-kind.js";
import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptMethodDeclarationNode } from "../../../models/nodes/declarations/typescript-method-declaration.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";
import { Resources } from "../../../resources.js";
import "../operators/typescript-exclamation.node.extensions.js";
import "../operators/typescript-question.node.extensions.js";

declare module "../../../models/nodes/declarations/typescript-method-declaration.node.js" {
  interface TypeScriptMethodDeclarationNode {
    reportTypeScriptObjectLiteralMember(context: TypeScriptParserContext): void;
  }
}

TypeScriptMethodDeclarationNode.prototype.getTypeScriptAllowedModifiers = function (this: TypeScriptMethodDeclarationNode): TypeScriptModifierFlags {
  return TypeScriptModifierFlags.All & ~(TypeScriptModifierFlags.Readonly | TypeScriptModifierFlags.Accessor | TypeScriptModifierFlags.Declare);
};

TypeScriptMethodDeclarationNode.prototype.getTypeScriptDecoratorSupport = function (this: TypeScriptMethodDeclarationNode): TypeScriptDecoratorSupport {
  return Object.isUndefined(this.bodyNode) ? TypeScriptDecoratorSupport.Overload : TypeScriptDecoratorSupport.Supported;
};

TypeScriptMethodDeclarationNode.prototype.getTypeScriptAbstractRejection = function (this: TypeScriptMethodDeclarationNode): DiagnosticTemplate | undefined {
  return TypeScriptDiagnosticTemplates.TS1244;
};

TypeScriptMethodDeclarationNode.prototype.getTypeScriptDeclarationNameSpan = function (this: TypeScriptMethodDeclarationNode,
  _context: TypeScriptParserContext): SourceSpan {
  return this.nameNode.span;
};

TypeScriptMethodDeclarationNode.prototype.getTypeScriptModifierNodes = function (this: TypeScriptMethodDeclarationNode): readonly Node[] {
  return this.modifierNodes;
};

TypeScriptMethodDeclarationNode.prototype.reportTypeScriptCommaComputedName = function (this: TypeScriptMethodDeclarationNode, context: TypeScriptParserContext): void {
  this.nameNode.reportTypeScriptCommaComputedName(context);
};

TypeScriptMethodDeclarationNode.prototype.getTypeScriptObjectMemberKind = function (this: TypeScriptMethodDeclarationNode): TypeScriptObjectMemberKind {
  return TypeScriptObjectMemberKind.Method;
};

TypeScriptMethodDeclarationNode.prototype.getTypeScriptObjectMemberName = function (this: TypeScriptMethodDeclarationNode): Node {
  return this.nameNode;
};

TypeScriptMethodDeclarationNode.prototype.reportTypeScriptObjectLiteralMember = function (this: TypeScriptMethodDeclarationNode, context: TypeScriptParserContext): void {
  if (Object.isUndefined(this.bodyNode))
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1005,
      new SourceSpan(this.span.endOffset - 1, 1), [Resources.openBrace]);
  this.nameNode.reportTypeScriptObjectMemberName(context);
  (this.questionNode ?? this.exclamationNode)?.reportTypeScriptObjectMemberMarker(context);
};

TypeScriptMethodDeclarationNode.prototype.hasTypeScriptBody = function (this: TypeScriptMethodDeclarationNode): boolean {
  return this.bodyNode?.isTypeScriptPresent() === true;
};
