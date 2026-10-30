/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import type { TypeScriptAssertsKeywordNode } from "../../../models/nodes/keywords/typescript-asserts-keyword.node.js";
import { TypeScriptIsKeywordNode } from "../../../models/nodes/keywords/typescript-is-keyword.node.js";
import { TypeScriptThisKeywordNode } from "../../../models/nodes/keywords/typescript-this-keyword.node.js";
import { TypeScriptThisTypeNode } from "../../../models/nodes/types/typescript-this-type.node.js";
import { TypeScriptTypePredicateNode } from "../../../models/nodes/types/typescript-type-predicate.node.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";

export class TypePredicateParser {
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
  }

  public tryParse(): TypeScriptTypePredicateNode | undefined {
    const parser = this.typescriptParser;
    const nameNode = parser.currentNode;
    if (!nameNode.isTypeScriptBindingIdentifier() || !parser.lookAhead(() => {
      parser.advance();
      return !parser.hasPrecedingLineBreak() && parser.currentNode instanceof TypeScriptIsKeywordNode;
    }))
      return undefined;

    parser.consumeName();
    return this.parse(nameNode, parser.requireCurrentNode(TypeScriptIsKeywordNode));
  }

  public parse(parameterNameNode: Node, isKeywordNode: TypeScriptIsKeywordNode): TypeScriptTypePredicateNode {
    const parser = this.typescriptParser;
    parser.advance();
    const typeNode = parser.parseType();
    const span = parser.typescriptLexer.reader.createSpan(parameterNameNode.span, typeNode.span);
    const node = new TypeScriptTypePredicateNode(parameterNameNode, span, undefined, isKeywordNode, typeNode,
      parameterNameNode.leadingTrivia, typeNode.trailingTrivia);
    parser.context.records.writtenTypePredicates.push(node);
    return node;
  }

  public isAssertionStart(): boolean {
    const parser = this.typescriptParser;
    return parser.lookAhead(() => {
      parser.advance();
      return !parser.hasPrecedingLineBreak() && (parser.currentNode.isTypeScriptBindingIdentifier() || parser.currentNode instanceof TypeScriptThisKeywordNode);
    });
  }

  public parseAssertion(assertsKeywordNode: TypeScriptAssertsKeywordNode): TypeScriptTypePredicateNode {
    const parser = this.typescriptParser;
    parser.advance();
    const nameNode = parser.currentNode;
    let parameterNameNode: Node;
    if (nameNode instanceof TypeScriptThisKeywordNode) {
      parser.advance();
      parameterNameNode = new TypeScriptThisTypeNode(nameNode, nameNode.span, nameNode.leadingTrivia, nameNode.trailingTrivia);
    }
    else
      parameterNameNode = parser.consumeName();
    const isKeywordNode = parser.tryConsume(TypeScriptIsKeywordNode);
    const typeNode = Object.isUndefined(isKeywordNode) ? undefined : parser.parseType();
    const endNode = typeNode ?? isKeywordNode ?? parameterNameNode;
    const node = new TypeScriptTypePredicateNode(parameterNameNode, parser.typescriptLexer.reader.createSpan(assertsKeywordNode.span, endNode.span),
      assertsKeywordNode, isKeywordNode, typeNode, assertsKeywordNode.leadingTrivia, endNode.trailingTrivia);
    parser.context.records.writtenTypePredicates.push(node);
    return node;
  }
}
