/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import type { TypeScriptAwaitKeywordNode } from "../../../models/nodes/keywords/typescript-await-keyword.node.js";
import type { TypeScriptConstKeywordNode } from "../../../models/nodes/keywords/typescript-const-keyword.node.js";
import type { TypeScriptLetKeywordNode } from "../../../models/nodes/keywords/typescript-let-keyword.node.js";
import type { TypeScriptUsingKeywordNode } from "../../../models/nodes/keywords/typescript-using-keyword.node.js";
import type { TypeScriptVarKeywordNode } from "../../../models/nodes/keywords/typescript-var-keyword.node.js";
import { TypeScriptVariableStatementNode } from "../../../models/nodes/statements/typescript-variable-statement.node.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";
import { VariableDeclarationListParser } from "../declarations/variable-declaration-list.parser.js";

export class VariableStatementParser {
  private readonly typescriptParser: TypeScriptSyntaxParser;
  private readonly variableDeclarationListParser: VariableDeclarationListParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
    this.variableDeclarationListParser = new VariableDeclarationListParser(typescriptParser);
  }

  public parse(keywordNode: TypeScriptConstKeywordNode | TypeScriptLetKeywordNode | TypeScriptVarKeywordNode | TypeScriptUsingKeywordNode,
    modifierNodes: readonly Node[] = [], awaitKeywordNode?: TypeScriptAwaitKeywordNode): TypeScriptVariableStatementNode {
    const typescriptParser = this.typescriptParser;
    const startNode = modifierNodes[0] ?? awaitKeywordNode ?? keywordNode;
    const declarationListNode = this.variableDeclarationListParser.parse(keywordNode, awaitKeywordNode);
    const semicolonNode = typescriptParser.parseStatementTerminator();
    const endNode = semicolonNode ?? declarationListNode;
    const span = typescriptParser.typescriptLexer.reader.createSpan(startNode.span, endNode.span);
    const resultNode = new TypeScriptVariableStatementNode(
      declarationListNode,
      span,
      semicolonNode,
      modifierNodes,
      startNode.leadingTrivia,
      endNode.trailingTrivia);

    resultNode.validateTypeScriptGrammar(typescriptParser.context);
    return resultNode;
  }
}
