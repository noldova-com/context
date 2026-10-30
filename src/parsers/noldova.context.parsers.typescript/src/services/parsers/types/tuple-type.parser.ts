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
import { TypeScriptCloseBracketNode } from "../../../models/nodes/delimiters/typescript-close-bracket.node.js";
import { TypeScriptColonNode } from "../../../models/nodes/delimiters/typescript-colon.node.js";
import { TypeScriptCommaNode } from "../../../models/nodes/delimiters/typescript-comma.node.js";
import { TypeScriptDotDotDotNode } from "../../../models/nodes/delimiters/typescript-dot-dot-dot.node.js";
import type { TypeScriptOpenBracketNode } from "../../../models/nodes/delimiters/typescript-open-bracket.node.js";
import { TypeScriptQuestionNode } from "../../../models/nodes/operators/typescript-question.node.js";
import { TypeScriptNamedTupleMemberNode } from "../../../models/nodes/types/typescript-named-tuple-member.node.js";
import { TypeScriptOptionalTypeNode } from "../../../models/nodes/types/typescript-optional-type.node.js";
import { TypeScriptRestTypeNode } from "../../../models/nodes/types/typescript-rest-type.node.js";
import { TypeScriptTupleTypeNode } from "../../../models/nodes/types/typescript-tuple-type.node.js";
import { TypeScriptTypeOperatorNode } from "../../../models/nodes/types/typescript-type-operator.node.js";
import { Resources } from "../../../resources.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";

export class TupleTypeParser {
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
  }

  public parse(openBracketNode: TypeScriptOpenBracketNode): TypeScriptTupleTypeNode {
    this.typescriptParser.context.enterList(TypeScriptListKind.TupleElementTypes);
    try {
      const typescriptParser = this.typescriptParser;
      typescriptParser.advance();
      const elementNodes: Node[] = [];
      const commaNodes: TypeScriptCommaNode[] = [];
      let endNode: Node = openBracketNode;

      while (!typescriptParser.isEndOfFile && !(typescriptParser.currentNode instanceof TypeScriptCloseBracketNode)) {
        const startNode = typescriptParser.currentNode;
        if (!startNode.isTypeScriptListElement(TypeScriptListKind.TupleElementTypes, typescriptParser)) {
          typescriptParser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1110, startNode.span);
          if (typescriptParser.context.isListBoundary(typescriptParser))
            break;
          endNode = startNode;
          typescriptParser.advance();
          continue;
        }
        if (typescriptParser.currentNode instanceof TypeScriptCommaNode)
          typescriptParser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1110, typescriptParser.currentNode.span);
        else {
          const elementNode = this.parseElement();
          elementNodes.push(elementNode);
          endNode = elementNode;
        }

        const commaNode = typescriptParser.tryConsume(TypeScriptCommaNode);
        if (!Object.isUndefined(commaNode)) {
          commaNodes.push(commaNode);
          endNode = commaNode;
          continue;
        }
        if (typescriptParser.isEndOfFile || typescriptParser.currentNode instanceof TypeScriptCloseBracketNode)
          break;
        typescriptParser.reportExpected(Resources.comma);
      }

      const closeBracketNode = typescriptParser.tryConsume(TypeScriptCloseBracketNode);
      if (Object.isUndefined(closeBracketNode))
        typescriptParser.reportExpected(Resources.closeBracket);
      else
        endNode = closeBracketNode;

      const span = typescriptParser.typescriptLexer.reader.createSpan(openBracketNode.span, endNode.span);

      return new TypeScriptTupleTypeNode(
        openBracketNode,
        elementNodes,
        commaNodes,
        span,
        closeBracketNode,
        openBracketNode.leadingTrivia,
        endNode.trailingTrivia);
    }
    finally {
      this.typescriptParser.context.leaveList();
    }
  }

  private parseElement(): Node {
    if (this.isNamedElementStart())
      return this.parseNamedElement();
    return this.parseElementType();
  }

  private parseElementType(): Node {
    const typescriptParser = this.typescriptParser;
    const dotDotDotNode = typescriptParser.tryConsume(TypeScriptDotDotDotNode);
    const typeNode = this.typescriptParser.parseType();
    if (!Object.isUndefined(dotDotDotNode)) {
      const span = typescriptParser.typescriptLexer.reader.createSpan(dotDotDotNode.span, typeNode.span);
      return new TypeScriptRestTypeNode(dotDotDotNode, span, typeNode, dotDotDotNode.leadingTrivia, typeNode.trailingTrivia);
    }

    if (typeNode instanceof TypeScriptTypeOperatorNode && typeNode.operatorNode instanceof TypeScriptQuestionNode
      && !Object.isUndefined(typeNode.typeNode) && typeNode.span.startOffset === typeNode.typeNode.span.startOffset)
      return new TypeScriptOptionalTypeNode(typeNode.typeNode, typeNode.operatorNode, typeNode.span, typeNode.leadingTrivia, typeNode.trailingTrivia);
    return typeNode;
  }

  private isNamedElementStart(): boolean {
    const typescriptParser = this.typescriptParser;
    return typescriptParser.lookAhead(() => {
      typescriptParser.tryConsume(TypeScriptDotDotDotNode);
      const nameNode = typescriptParser.currentNode;
      if (!nameNode.isTypeScriptBindingIdentifier())
        return false;

      typescriptParser.advance();
      typescriptParser.tryConsume(TypeScriptQuestionNode);
      return typescriptParser.currentNode instanceof TypeScriptColonNode;
    });
  }

  private parseNamedElement(): TypeScriptNamedTupleMemberNode {
    const typescriptParser = this.typescriptParser;
    const startNode = typescriptParser.currentNode;
    const dotDotDotNode = typescriptParser.tryConsume(TypeScriptDotDotDotNode);
    const nameNode = typescriptParser.currentNode;
    typescriptParser.consumeName();
    const questionNode = typescriptParser.tryConsume(TypeScriptQuestionNode);
    const colonNode = typescriptParser.requireCurrentNode(TypeScriptColonNode);

    typescriptParser.advance();
    const typeNode = this.parseElementType();
    const span = typescriptParser.typescriptLexer.reader.createSpan(startNode.span, typeNode.span);

    return new TypeScriptNamedTupleMemberNode(
      nameNode,
      colonNode,
      span,
      typeNode,
      dotDotDotNode,
      questionNode,
      startNode.leadingTrivia,
      typeNode.trailingTrivia);
  }
}
