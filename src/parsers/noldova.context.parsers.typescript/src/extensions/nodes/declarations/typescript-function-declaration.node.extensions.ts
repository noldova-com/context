/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { DiagnosticTemplate } from "@noldova/context.diagnostics";
import type { Node, SourceSpan } from "@noldova/context.parsers";

import { TypeScriptModifierFlags } from "../../../enums/typescript-modifier-flags.js";
import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptFunctionDeclarationNode } from "../../../models/nodes/declarations/typescript-function-declaration.node.js";
import { TypeScriptAsyncKeywordNode } from "../../../models/nodes/keywords/typescript-async-keyword.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";

TypeScriptFunctionDeclarationNode.prototype.getTypeScriptAllowedModifiers = function (this: TypeScriptFunctionDeclarationNode): TypeScriptModifierFlags {
  return TypeScriptModifierFlags.All & ~(TypeScriptModifierFlags.Abstract | TypeScriptModifierFlags.Readonly | TypeScriptModifierFlags.Accessor);
};

TypeScriptFunctionDeclarationNode.prototype.getTypeScriptModifierRejection = function (this: TypeScriptFunctionDeclarationNode,
  context: TypeScriptParserContext, modifierNode: Node): DiagnosticTemplate | undefined {
  return context.isModuleStatementList || modifierNode instanceof TypeScriptAsyncKeywordNode
    ? undefined
    : TypeScriptDiagnosticTemplates.TS1184;
};

TypeScriptFunctionDeclarationNode.prototype.isTypeScriptDeclarationStatement = function (this: TypeScriptFunctionDeclarationNode): boolean {
  return true;
};

TypeScriptFunctionDeclarationNode.prototype.requiresTypeScriptDeclareModifier = function (this: TypeScriptFunctionDeclarationNode): boolean {
  return !this.modifierNodes.some(t => t.isTypeScriptDeclarationFileModifier());
};

TypeScriptFunctionDeclarationNode.prototype.getTypeScriptFirstTokenSpan = function (this: TypeScriptFunctionDeclarationNode): SourceSpan {
  return this.modifierNodes[0]?.getTypeScriptFirstTokenSpan() ?? this.functionKeywordNode.span;
};
