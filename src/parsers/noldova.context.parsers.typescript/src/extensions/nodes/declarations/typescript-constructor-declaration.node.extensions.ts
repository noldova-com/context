/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { DiagnosticTemplate } from "@noldova/context.diagnostics";
import { SourceSpan } from "@noldova/context.parsers";

import { TypeScriptModifierFlags } from "../../../enums/typescript-modifier-flags.js";
import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptConstructorDeclarationNode } from "../../../models/nodes/declarations/typescript-constructor-declaration.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";

TypeScriptConstructorDeclarationNode.prototype.validateTypeScriptGrammar = function (this: TypeScriptConstructorDeclarationNode, context: TypeScriptParserContext): void {
  const typeParameterListNode = this.typeParameterListNode;
  if (!Object.isUndefined(typeParameterListNode)) {
    const startOffset = typeParameterListNode.children[0]?.span.startOffset ?? typeParameterListNode.lessThanNode.span.endOffset;
    const endOffset = typeParameterListNode.children.at(-1)?.span.endOffset ?? startOffset;
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1092,
      new SourceSpan(startOffset, endOffset - startOffset));
  }
  else if (!Object.isUndefined(this.returnTypeNode))
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1093, this.returnTypeNode.span);
};

TypeScriptConstructorDeclarationNode.prototype.getTypeScriptDeclarationNameSpan = function (this: TypeScriptConstructorDeclarationNode,
  _context: TypeScriptParserContext): SourceSpan {
  return new SourceSpan(this.span.startOffset, this.nameNode.span.endOffset - this.span.startOffset);
};

TypeScriptConstructorDeclarationNode.prototype.getTypeScriptAllowedModifiers = function (this: TypeScriptConstructorDeclarationNode): TypeScriptModifierFlags {
  return TypeScriptModifierFlags.All & ~(TypeScriptModifierFlags.Async | TypeScriptModifierFlags.Abstract | TypeScriptModifierFlags.Readonly
    | TypeScriptModifierFlags.Accessor | TypeScriptModifierFlags.Declare | TypeScriptModifierFlags.Static | TypeScriptModifierFlags.Override);
};

TypeScriptConstructorDeclarationNode.prototype.getTypeScriptThisParameterRejection = function (this: TypeScriptConstructorDeclarationNode): DiagnosticTemplate | undefined {
  return TypeScriptDiagnosticTemplates.TS2681;
};

TypeScriptConstructorDeclarationNode.prototype.hasTypeScriptBody = function (this: TypeScriptConstructorDeclarationNode): boolean {
  return this.bodyNode?.isTypeScriptPresent() === true;
};
