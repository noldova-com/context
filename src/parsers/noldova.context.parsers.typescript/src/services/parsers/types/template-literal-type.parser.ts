/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptCloseBraceNode } from "../../../models/nodes/delimiters/typescript-close-brace.node.js";
import type { TypeScriptTemplateHeadNode } from "../../../models/nodes/literals/typescript-template-head.node.js";
import { TypeScriptTemplateTailNode } from "../../../models/nodes/literals/typescript-template-tail.node.js";
import { TypeScriptTemplateLiteralTypeSpanNode } from "../../../models/nodes/types/typescript-template-literal-type-span.node.js";
import { TypeScriptTemplateLiteralTypeNode } from "../../../models/nodes/types/typescript-template-literal-type.node.js";
import { Resources } from "../../../resources.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";

export class TemplateLiteralTypeParser {
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
  }

  public parse(headNode: TypeScriptTemplateHeadNode): TypeScriptTemplateLiteralTypeNode {
    const typescriptParser = this.typescriptParser;
    if (headNode.containsInvalidEscape)
      typescriptParser.reLexUntaggedTemplate();
    typescriptParser.advance();

    const spanNodes: Node[] = [];
    let endNode: Node = headNode;
    while (true) {
      const typeNode = this.typescriptParser.parseType();
      if (!(typescriptParser.currentNode instanceof TypeScriptCloseBraceNode)) {
        typescriptParser.reportExpected(Resources.closeBrace);
        const spanNode = new TypeScriptTemplateLiteralTypeSpanNode(typeNode, undefined, typeNode.span, typeNode.leadingTrivia, typeNode.trailingTrivia);
        spanNodes.push(spanNode);
        endNode = spanNode;
        break;
      }

      typescriptParser.reLexTemplateContinuation(false);
      const literalNode: Node = typescriptParser.currentNode;
      typescriptParser.advance();
      const span = typescriptParser.typescriptLexer.reader.createSpan(typeNode.span, literalNode.span);
      spanNodes.push(new TypeScriptTemplateLiteralTypeSpanNode(
        typeNode,
        literalNode,
        span,
        typeNode.leadingTrivia,
        literalNode.trailingTrivia));
      endNode = literalNode;

      if (literalNode instanceof TypeScriptTemplateTailNode)
        break;
    }

    const span = typescriptParser.typescriptLexer.reader.createSpan(headNode.span, endNode.span);
    return new TypeScriptTemplateLiteralTypeNode(
      headNode,
      spanNodes,
      span,
      headNode.leadingTrivia,
      endNode.trailingTrivia);
  }
}
