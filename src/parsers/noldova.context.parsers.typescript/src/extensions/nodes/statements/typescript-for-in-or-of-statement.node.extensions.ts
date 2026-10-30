/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";

import { TypeScriptDeclarationListHolder } from "../../../enums/typescript-declaration-list-holder.js";
import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptVariableDeclarationListNode } from "../../../models/nodes/declarations/typescript-variable-declaration-list.node.js";
import { TypeScriptUsingKeywordNode } from "../../../models/nodes/keywords/typescript-using-keyword.node.js";
import { TypeScriptForInOrOfStatementNode } from "../../../models/nodes/statements/typescript-for-in-or-of-statement.node.js";
import { TypeScriptForOfStatementNode } from "../../../models/nodes/statements/typescript-for-of-statement.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";

TypeScriptForInOrOfStatementNode.prototype.validateTypeScriptGrammar = function (this: TypeScriptForInOrOfStatementNode,
  context: TypeScriptParserContext): void {
  const initializerNode = this.initializerNode;
  initializerNode.readTypeScriptDeclarations(context, TypeScriptDeclarationListHolder.ForInOrOfHeader);
  const forOfNode = this instanceof TypeScriptForOfStatementNode ? this : undefined;
  const isForOf = !Object.isUndefined(forOfNode);
  if (!isForOf && initializerNode instanceof TypeScriptVariableDeclarationListNode)
    for (const declarationNode of initializerNode.children)
      if (!Object.isUndefined(declarationNode.initializerNode) && !declarationNode.nameNode.readsTypeScriptDeclaredType(false))
        context.records.uncheckedSpans.push(declarationNode.initializerNode.span);

  initializerNode.validateTypeScriptIterationInitializer(context, isForOf);

  if ((context.isAmbient && !context.hasReportedAmbientStatement)
    || (!Object.isUndefined(forOfNode?.awaitKeywordNode) && !context.isAwaitContext && !context.isClassStaticBlock && !context.isSourceTopLevel))
    return;

  if (isForOf && !context.isAwaitContext && initializerNode.isTypeScriptAsyncIdentifier()) {
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1106, initializerNode.span);
    return;
  }

  if (!(initializerNode instanceof TypeScriptVariableDeclarationListNode))
    return;

  const isUsing = initializerNode.keywordNode instanceof TypeScriptUsingKeywordNode;
  if (initializerNode.children.length === 0 || !Object.isUndefined(initializerNode.getTypeScriptTrailingComma()))
    return;
  if (isUsing && !isForOf) {
    const template = Object.isUndefined(initializerNode.awaitKeywordNode)
      ? TypeScriptDiagnosticTemplates.TS1493
      : TypeScriptDiagnosticTemplates.TS1494;
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, template, initializerNode.span);
    return;
  }
  if (isUsing && context.isAmbient) {
    initializerNode.reportTypeScriptAmbientResourceDeclaration(context);
    return;
  }
  if (!Object.isUndefined(initializerNode.awaitKeywordNode) && (context.isClassStaticBlock || !context.isAwaitContext))
    return;

  if (initializerNode.children.length > 1) {
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source,
      isForOf ? TypeScriptDiagnosticTemplates.TS1188 : TypeScriptDiagnosticTemplates.TS1091,
      initializerNode.children[1]!.nameNode.getTypeScriptFirstTokenSpan());
    return;
  }

  const declarationNode = initializerNode.children[0]!;
  if (!Object.isUndefined(declarationNode.initializerNode))
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source,
      isForOf ? TypeScriptDiagnosticTemplates.TS1190 : TypeScriptDiagnosticTemplates.TS1189, declarationNode.nameNode.span);
  else if (!Object.isUndefined(declarationNode.typeNode))
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source,
      isForOf ? TypeScriptDiagnosticTemplates.TS2483 : TypeScriptDiagnosticTemplates.TS2404, declarationNode.nameNode.span);
};

TypeScriptForInOrOfStatementNode.prototype.getTypeScriptFirstTokenSpan = function (this: TypeScriptForInOrOfStatementNode): SourceSpan {
  return this.forKeywordNode.span;
};
