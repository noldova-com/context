/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";

import { TypeScriptDeclarationListHolder } from "../../../enums/typescript-declaration-list-holder.js";
import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptBindingPatternNode } from "../../../models/nodes/declarations/typescript-binding-pattern.node.js";
import { TypeScriptVariableDeclarationListNode } from "../../../models/nodes/declarations/typescript-variable-declaration-list.node.js";
import { TypeScriptConstKeywordNode } from "../../../models/nodes/keywords/typescript-const-keyword.node.js";
import { TypeScriptUsingKeywordNode } from "../../../models/nodes/keywords/typescript-using-keyword.node.js";
import { TypeScriptVarKeywordNode } from "../../../models/nodes/keywords/typescript-var-keyword.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";
import { Resources } from "../../../resources.js";

declare module "../../../models/nodes/declarations/typescript-variable-declaration-list.node.js" {
  interface TypeScriptVariableDeclarationListNode {
    getTypeScriptKeywordText(): string;
  }
}

TypeScriptVariableDeclarationListNode.prototype.validateTypeScriptGrammar = function (this: TypeScriptVariableDeclarationListNode, context: TypeScriptParserContext): void {
  const trailingCommaNode = this.getTypeScriptTrailingComma();
  if (!Object.isUndefined(trailingCommaNode)) {
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1009, trailingCommaNode.span);
    return;
  }

  if (this.children.length === 0)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1123,
      new SourceSpan(this.keywordNode.span.endOffset, 0));
};

TypeScriptVariableDeclarationListNode.prototype.readTypeScriptDeclarations = function (this: TypeScriptVariableDeclarationListNode,
  context: TypeScriptParserContext, holder: TypeScriptDeclarationListHolder): void {
  const isUsing = this.keywordNode instanceof TypeScriptUsingKeywordNode;
  const requiresInitializer = isUsing || this.keywordNode instanceof TypeScriptConstKeywordNode;
  const isBlockScoped = !(this.keywordNode instanceof TypeScriptVarKeywordNode);
  const keyword = this.getTypeScriptKeywordText();
  for (const declarationNode of this.children) {
    const nameNode = declarationNode.nameNode;
    const isPattern = nameNode instanceof TypeScriptBindingPatternNode;
    if (isPattern && isUsing) {
      context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1492, nameNode.span, [keyword]);
      continue;
    }

    if (holder !== TypeScriptDeclarationListHolder.ForInOrOfHeader)
      if (context.isAmbient) {
        if (!Object.isUndefined(declarationNode.initializerNode) && !(requiresInitializer && Object.isUndefined(declarationNode.typeNode)))
          context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1039,
            declarationNode.initializerNode.span);
      }
      else if (Object.isUndefined(declarationNode.initializerNode)) {
        if (isPattern) {
          context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1182, nameNode.span);
          continue;
        }
        if (requiresInitializer) {
          context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1155, nameNode.span, [keyword]);
          continue;
        }
      }

    if (!Object.isUndefined(declarationNode.exclamationNode)
      && (holder !== TypeScriptDeclarationListHolder.Statement || !Object.isUndefined(declarationNode.initializerNode)
        || Object.isUndefined(declarationNode.typeNode) || context.isAmbient)) {
      context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source,
        !Object.isUndefined(declarationNode.initializerNode) ? TypeScriptDiagnosticTemplates.TS1263
          : Object.isUndefined(declarationNode.typeNode) ? TypeScriptDiagnosticTemplates.TS1264
            : TypeScriptDiagnosticTemplates.TS1255,
        declarationNode.exclamationNode.span);
      continue;
    }

    if (isBlockScoped)
      nameNode.reportTypeScriptLetNames(context);
  }
};

TypeScriptVariableDeclarationListNode.prototype.getTypeScriptKeywordText = function (this: TypeScriptVariableDeclarationListNode): string {
  return Object.isUndefined(this.awaitKeywordNode) ? this.keywordNode.value : `${this.awaitKeywordNode.value}${Resources.space}${this.keywordNode.value}`;
};

TypeScriptVariableDeclarationListNode.prototype.getTypeScriptFirstTokenSpan = function (this: TypeScriptVariableDeclarationListNode): SourceSpan {
  return (this.awaitKeywordNode ?? this.keywordNode).span;
};

TypeScriptVariableDeclarationListNode.prototype.reportTypeScriptAmbientResourceDeclaration = function (this: TypeScriptVariableDeclarationListNode,
  context: TypeScriptParserContext): void {
  if (this.keywordNode instanceof TypeScriptUsingKeywordNode && context.isAmbient)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source,
      Object.isUndefined(this.awaitKeywordNode) ? TypeScriptDiagnosticTemplates.TS1545 : TypeScriptDiagnosticTemplates.TS1546, this.span);
};

TypeScriptVariableDeclarationListNode.prototype.validateTypeScriptIterationInitializer = function (this: TypeScriptVariableDeclarationListNode,
  context: TypeScriptParserContext, isForOf: boolean): void {
  const nameNode = this.children[0]?.nameNode;
  if (!isForOf && nameNode instanceof TypeScriptBindingPatternNode)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS2491, nameNode.span);
};
