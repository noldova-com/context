/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptContextFlags } from "../../../enums/typescript-context-flags.js";
import { TypeScriptListKind } from "../../../enums/typescript-list-kind.js";
import { TypeScriptVariableDeclarationListNode } from "../../../models/nodes/declarations/typescript-variable-declaration-list.node.js";
import type { TypeScriptVariableDeclarationNode } from "../../../models/nodes/declarations/typescript-variable-declaration.node.js";
import { TypeScriptCloseParenthesisNode } from "../../../models/nodes/delimiters/typescript-close-parenthesis.node.js";
import { TypeScriptCommaNode } from "../../../models/nodes/delimiters/typescript-comma.node.js";
import type { TypeScriptAwaitKeywordNode } from "../../../models/nodes/keywords/typescript-await-keyword.node.js";
import type { TypeScriptConstKeywordNode } from "../../../models/nodes/keywords/typescript-const-keyword.node.js";
import type { TypeScriptLetKeywordNode } from "../../../models/nodes/keywords/typescript-let-keyword.node.js";
import { TypeScriptOfKeywordNode } from "../../../models/nodes/keywords/typescript-of-keyword.node.js";
import type { TypeScriptUsingKeywordNode } from "../../../models/nodes/keywords/typescript-using-keyword.node.js";
import type { TypeScriptVarKeywordNode } from "../../../models/nodes/keywords/typescript-var-keyword.node.js";
import { Resources } from "../../../resources.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";
import { VariableDeclarationParser } from "./variable-declaration.parser.js";

export class VariableDeclarationListParser {
  private readonly typescriptParser: TypeScriptSyntaxParser;
  private readonly variableDeclarationParser: VariableDeclarationParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
    this.variableDeclarationParser = new VariableDeclarationParser(typescriptParser);
  }

  public parse(keywordNode: TypeScriptConstKeywordNode | TypeScriptLetKeywordNode | TypeScriptVarKeywordNode | TypeScriptUsingKeywordNode,
    awaitKeywordNode?: TypeScriptAwaitKeywordNode): TypeScriptVariableDeclarationListNode {
    return this.parseDeclarations(keywordNode, false, awaitKeywordNode);
  }

  public parseWithoutIn(keywordNode: TypeScriptConstKeywordNode | TypeScriptLetKeywordNode | TypeScriptVarKeywordNode | TypeScriptUsingKeywordNode,
    awaitKeywordNode?: TypeScriptAwaitKeywordNode): TypeScriptVariableDeclarationListNode {
    return this.parseDeclarations(keywordNode, true, awaitKeywordNode);
  }

  private parseDeclarations(
    keywordNode: TypeScriptConstKeywordNode | TypeScriptLetKeywordNode | TypeScriptVarKeywordNode | TypeScriptUsingKeywordNode,
    isForInitializer: boolean,
    awaitKeywordNode?: TypeScriptAwaitKeywordNode): TypeScriptVariableDeclarationListNode {
    const typescriptParser = this.typescriptParser;
    const context = typescriptParser.context;
    const previousFlags = context.contextFlags;
    context.contextFlags = isForInitializer
      ? previousFlags | TypeScriptContextFlags.DisallowIn
      : previousFlags & ~TypeScriptContextFlags.DisallowIn;
    context.enterList(TypeScriptListKind.VariableDeclarations);
    try {
      const startNode = awaitKeywordNode ?? keywordNode;
      typescriptParser.advance();
      const declarationNodes: TypeScriptVariableDeclarationNode[] = [];
      const commaNodes: TypeScriptCommaNode[] = [];
      let endNode: Node = keywordNode;
      const hasMissingDeclaration = this.isMissingDeclarationBeforeOf();
      while (!hasMissingDeclaration && !typescriptParser.isEndOfFile) {
        const node = typescriptParser.currentNode;
        if (!node.isTypeScriptListElement(TypeScriptListKind.VariableDeclarations, typescriptParser)) {
          if (node.isTypeScriptListTerminator(TypeScriptListKind.VariableDeclarations, typescriptParser))
            break;
          node.reportTypeScriptInvalidVariableDeclaration(typescriptParser);
          if (context.isListBoundary(typescriptParser))
            break;
          typescriptParser.advance();
          endNode = node;
          continue;
        }
        const declarationNode = isForInitializer
          ? this.variableDeclarationParser.parseWithoutExclamation()
          : this.variableDeclarationParser.parse();
        declarationNodes.push(declarationNode);
        endNode = declarationNode;

        const commaNode = typescriptParser.tryConsume(TypeScriptCommaNode);
        if (Object.isUndefined(commaNode)) {
          if (typescriptParser.currentNode.isTypeScriptListTerminator(TypeScriptListKind.VariableDeclarations, typescriptParser))
            break;

          typescriptParser.reportExpected(Resources.comma);
          continue;
        }

        commaNodes.push(commaNode);
        endNode = commaNode;
      }

      const span = typescriptParser.typescriptLexer.reader.createSpan(startNode.span, endNode.span);
      const resultNode = new TypeScriptVariableDeclarationListNode(
        keywordNode,
        declarationNodes,
        commaNodes,
        span,
        awaitKeywordNode,
        startNode.leadingTrivia,
        endNode.trailingTrivia);

      resultNode.validateTypeScriptGrammar(typescriptParser.context);
      return resultNode;
    }
    finally {
      context.leaveList();
      context.contextFlags = previousFlags;
    }
  }

  private isMissingDeclarationBeforeOf(): boolean {
    const parser = this.typescriptParser;
    return parser.currentNode instanceof TypeScriptOfKeywordNode && parser.lookAhead(() => {
      parser.advance();
      if (!parser.currentNode.isTypeScriptIdentifier(parser.context))
        return false;
      parser.advance();
      return parser.currentNode instanceof TypeScriptCloseParenthesisNode;
    });
  }
}
