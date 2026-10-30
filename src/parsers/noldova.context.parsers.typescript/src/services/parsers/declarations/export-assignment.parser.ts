/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptContextFlags } from "../../../enums/typescript-context-flags.js";
import { TypeScriptExportAssignmentNode } from "../../../models/nodes/declarations/typescript-export-assignment.node.js";
import { TypeScriptSemicolonNode } from "../../../models/nodes/delimiters/typescript-semicolon.node.js";
import type { TypeScriptDefaultKeywordNode } from "../../../models/nodes/keywords/typescript-default-keyword.node.js";
import type { TypeScriptExportKeywordNode } from "../../../models/nodes/keywords/typescript-export-keyword.node.js";
import type { TypeScriptEqualsNode } from "../../../models/nodes/operators/typescript-equals.node.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";

export class ExportAssignmentParser {
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
  }

  public parse(exportKeywordNode: TypeScriptExportKeywordNode, assignmentTokenNode: TypeScriptDefaultKeywordNode | TypeScriptEqualsNode,
    modifierNodes: readonly Node[] = []): TypeScriptExportAssignmentNode {
    const parser = this.typescriptParser;
    const startNode = modifierNodes[0] ?? exportKeywordNode;
    const previousFlags = parser.context.contextFlags;
    const previousAwaitNameCount = parser.context.records.awaitNameCount;
    parser.context.contextFlags |= TypeScriptContextFlags.Await;
    try {
      parser.advance();
      const expressionNode = this.parseValue();
      const semicolonNode = parser.parseStatementTerminator();
      const endNode = semicolonNode ?? expressionNode;
      const resultNode = new TypeScriptExportAssignmentNode(exportKeywordNode, assignmentTokenNode, expressionNode,
        parser.typescriptLexer.reader.createSpan(startNode.span, endNode.span), semicolonNode, modifierNodes, startNode.leadingTrivia, endNode.trailingTrivia);

      resultNode.validateTypeScriptGrammar(parser.context);
      return resultNode;
    }
    finally {
      parser.context.contextFlags = previousFlags;
      parser.context.records.awaitNameCount = previousAwaitNameCount;
    }
  }

  private parseValue(): Node {
    const parser = this.typescriptParser;
    const node = parser.currentNode;
    if (parser.isEndOfFile || node.isTypeScriptClosingDelimiter() || node instanceof TypeScriptSemicolonNode)
      return node.reportTypeScriptMissingExpression(parser);
    return parser.parseAssignmentExpression();
  }
}
