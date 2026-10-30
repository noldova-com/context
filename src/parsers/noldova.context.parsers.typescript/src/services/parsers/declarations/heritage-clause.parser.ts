/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptListKind } from "../../../enums/typescript-list-kind.js";
import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptHeritageClauseNode } from "../../../models/nodes/declarations/typescript-heritage-clause.node.js";
import { TypeScriptCommaNode } from "../../../models/nodes/delimiters/typescript-comma.node.js";
import { TypeScriptExtendsKeywordNode } from "../../../models/nodes/keywords/typescript-extends-keyword.node.js";
import { TypeScriptImplementsKeywordNode } from "../../../models/nodes/keywords/typescript-implements-keyword.node.js";
import { TypeScriptExpressionWithTypeArgumentsNode } from "../../../models/nodes/types/typescript-expression-with-type-arguments.node.js";
import { Resources } from "../../../resources.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";

export class HeritageClauseParser {
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
  }

  public parseList(): TypeScriptHeritageClauseNode[] {
    const typescriptParser = this.typescriptParser;
    const clauseNodes: TypeScriptHeritageClauseNode[] = [];
    typescriptParser.context.enterList(TypeScriptListKind.HeritageClauses);
    try {
      while (typescriptParser.currentNode instanceof TypeScriptExtendsKeywordNode || typescriptParser.currentNode instanceof TypeScriptImplementsKeywordNode)
        clauseNodes.push(this.parse(typescriptParser.currentNode));
    }
    finally {
      typescriptParser.context.leaveList();
    }
    return clauseNodes;
  }

  private parse(
    keywordNode: TypeScriptExtendsKeywordNode | TypeScriptImplementsKeywordNode): TypeScriptHeritageClauseNode {
    const typescriptParser = this.typescriptParser;
    typescriptParser.advance();
    const typeNodes: Node[] = [];
    const commaNodes: TypeScriptCommaNode[] = [];
    let endNode: Node = keywordNode;
    typescriptParser.context.enterList(TypeScriptListKind.HeritageClauseElement);
    try {
      while (!typescriptParser.isEndOfFile) {
        const node = typescriptParser.currentNode;
        if (!node.canStartTypeScriptHeritageExpression(typescriptParser)) {
          if (node.isTypeScriptListTerminator(TypeScriptListKind.HeritageClauseElement, typescriptParser))
            break;
          typescriptParser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1109, node.span);
          if (typescriptParser.context.isListBoundary(typescriptParser))
            break;
          endNode = node;
          typescriptParser.advance();
          continue;
        }
        let typeNode = typescriptParser.parseLeftHandSideExpression();
        if (!(typeNode instanceof TypeScriptExpressionWithTypeArgumentsNode)) {
          const typeArgumentListNode = typescriptParser.parseTypeArgumentList();
          const typeEndNode = typeArgumentListNode ?? typeNode;
          const span = typescriptParser.typescriptLexer.reader.createSpan(typeNode.span, typeEndNode.span);
          typeNode = new TypeScriptExpressionWithTypeArgumentsNode(typeNode, span, typeArgumentListNode, typeNode.leadingTrivia, typeEndNode.trailingTrivia);
        }
        typeNodes.push(typeNode);
        endNode = typeNode;

        const commaNode = typescriptParser.tryConsume(TypeScriptCommaNode);
        if (!Object.isUndefined(commaNode)) {
          commaNodes.push(commaNode);
          endNode = commaNode;
        }
        else {
          if (typescriptParser.isEndOfFile
            || typescriptParser.currentNode.isTypeScriptListTerminator(TypeScriptListKind.HeritageClauseElement, typescriptParser))
            break;
          typescriptParser.reportExpected(Resources.comma);
        }
      }
    }
    finally {
      typescriptParser.context.leaveList();
    }

    const span = typescriptParser.typescriptLexer.reader.createSpan(keywordNode.span, endNode.span);
    const resultNode = new TypeScriptHeritageClauseNode(keywordNode, typeNodes, commaNodes, span, keywordNode.leadingTrivia, endNode.trailingTrivia);

    resultNode.validateTypeScriptGrammar(typescriptParser.context);
    return resultNode;
  }
}
