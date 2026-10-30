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
import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptArrayBindingPatternNode } from "../../../models/nodes/declarations/typescript-array-binding-pattern.node.js";
import { TypeScriptBindingElementNode } from "../../../models/nodes/declarations/typescript-binding-element.node.js";
import { TypeScriptObjectBindingPatternNode } from "../../../models/nodes/declarations/typescript-object-binding-pattern.node.js";
import { TypeScriptCloseBraceNode } from "../../../models/nodes/delimiters/typescript-close-brace.node.js";
import { TypeScriptCloseBracketNode } from "../../../models/nodes/delimiters/typescript-close-bracket.node.js";
import { TypeScriptColonNode } from "../../../models/nodes/delimiters/typescript-colon.node.js";
import { TypeScriptCommaNode } from "../../../models/nodes/delimiters/typescript-comma.node.js";
import { TypeScriptDotDotDotNode } from "../../../models/nodes/delimiters/typescript-dot-dot-dot.node.js";
import { TypeScriptOpenBraceNode } from "../../../models/nodes/delimiters/typescript-open-brace.node.js";
import { TypeScriptOpenBracketNode } from "../../../models/nodes/delimiters/typescript-open-bracket.node.js";
import { TypeScriptOmittedExpressionNode } from "../../../models/nodes/expressions/typescript-omitted-expression.node.js";
import { TypeScriptMissingIdentifierNode } from "../../../models/nodes/identifiers/typescript-missing-identifier.node.js";
import { TypeScriptPrivateIdentifierNode } from "../../../models/nodes/identifiers/typescript-private-identifier.node.js";
import { TypeScriptEqualsNode } from "../../../models/nodes/operators/typescript-equals.node.js";
import { Resources } from "../../../resources.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";
import { PropertyNameParser } from "./property-name.parser.js";

export class BindingNameParser {
  private readonly propertyNameParser: PropertyNameParser;
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
    this.propertyNameParser = new PropertyNameParser(typescriptParser);
  }

  public parseVariableName(): Node {
    const node = this.typescriptParser.currentNode;
    if (node instanceof TypeScriptPrivateIdentifierNode) {
      this.typescriptParser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS18029, node.span);
      return this.typescriptParser.consumeBindingName();
    }
    return this.parse();
  }

  public parse(): Node {
    const context = this.typescriptParser.context;
    context.enterRecursion(this.typescriptParser.currentNode.span);
    try {
      const node = this.typescriptParser.currentNode;
      if (node instanceof TypeScriptPrivateIdentifierNode) {
        context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS18016, node.span);
        return this.typescriptParser.consumeBindingName();
      }
      if (node instanceof TypeScriptOpenBracketNode)
        return this.parseArrayBindingPattern(node);

      if (node instanceof TypeScriptOpenBraceNode)
        return this.parseObjectBindingPattern(node);

      if (!(node.isTypeScriptBindingIdentifier())) {
        node.reportTypeScriptInvalidBindingName(this.typescriptParser);
        return new TypeScriptMissingIdentifierNode(node.getTypeScriptMissingNodeSpan());
      }

      const nameNode = this.typescriptParser.consumeBindingName();
      this.typescriptParser.readEvalOrArgumentsName(nameNode);
      return nameNode;
    }
    finally {
      context.leaveRecursion();
    }
  }

  private parseArrayBindingPattern(openBracketNode: TypeScriptOpenBracketNode): TypeScriptArrayBindingPatternNode {
    const context = this.typescriptParser.context;
    const previousFlags = context.contextFlags;
    context.contextFlags &= ~TypeScriptContextFlags.DisallowIn;
    context.enterList(TypeScriptListKind.ArrayBindingElements);
    try {
      this.typescriptParser.advance();
      const elementNodes: Node[] = [];
      const commaNodes: TypeScriptCommaNode[] = [];
      let endNode: Node = openBracketNode;
      while (!this.typescriptParser.isEndOfFile && !(this.typescriptParser.currentNode instanceof TypeScriptCloseBracketNode)) {
        const startNode = this.typescriptParser.currentNode;
        if (!startNode.isTypeScriptListElement(TypeScriptListKind.ArrayBindingElements, this.typescriptParser)) {
          this.typescriptParser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1181, startNode.span);
          if (this.typescriptParser.context.isListBoundary(this.typescriptParser))
            break;
          endNode = startNode;
          this.typescriptParser.advance();
          continue;
        }
        if (this.typescriptParser.currentNode instanceof TypeScriptCommaNode) {
          const elementNode = new TypeScriptOmittedExpressionNode(
            this.typescriptParser.typescriptLexer.reader.createSpan(this.typescriptParser.currentNode.span.startOffset, 0),
            this.typescriptParser.currentNode.leadingTrivia);
          elementNodes.push(elementNode);
          endNode = elementNode;
        }
        else {
          const elementNode = this.parseArrayElement();
          elementNodes.push(elementNode);
          endNode = elementNode;
        }

        const commaNode = this.typescriptParser.tryConsume(TypeScriptCommaNode);
        if (!Object.isUndefined(commaNode)) {
          commaNodes.push(commaNode);
          endNode = commaNode;
          continue;
        }
        if (this.typescriptParser.isEndOfFile || this.typescriptParser.currentNode instanceof TypeScriptCloseBracketNode)
          break;
        this.typescriptParser.reportExpected(Resources.comma);
      }

      const closeBracketNode = this.typescriptParser.tryConsume(TypeScriptCloseBracketNode);
      if (Object.isUndefined(closeBracketNode))
        this.typescriptParser.reportExpected(Resources.closeBracket);
      else
        endNode = closeBracketNode;

      const span = this.typescriptParser.typescriptLexer.reader.createSpan(openBracketNode.span, endNode.span);
      const patternNode = new TypeScriptArrayBindingPatternNode(
        openBracketNode,
        elementNodes,
        commaNodes,
        span,
        closeBracketNode,
        openBracketNode.leadingTrivia,
        endNode.trailingTrivia);
      patternNode.validateTypeScriptGrammar(this.typescriptParser.context);
      return patternNode;
    }
    finally {
      context.leaveList();
      context.contextFlags = previousFlags;
    }
  }

  private parseObjectBindingPattern(openBraceNode: TypeScriptOpenBraceNode): TypeScriptObjectBindingPatternNode {
    const context = this.typescriptParser.context;
    const previousFlags = context.contextFlags;
    context.contextFlags &= ~TypeScriptContextFlags.DisallowIn;
    context.enterList(TypeScriptListKind.ObjectBindingElements);
    try {
      this.typescriptParser.advance();
      const elementNodes: Node[] = [];
      const commaNodes: TypeScriptCommaNode[] = [];
      let endNode: Node = openBraceNode;
      while (!this.typescriptParser.isEndOfFile && !(this.typescriptParser.currentNode instanceof TypeScriptCloseBraceNode)) {
        const startNode = this.typescriptParser.currentNode;
        if (!startNode.isTypeScriptListElement(TypeScriptListKind.ObjectBindingElements, this.typescriptParser)) {
          this.typescriptParser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1180, startNode.span);
          if (this.typescriptParser.context.isListBoundary(this.typescriptParser))
            break;
          endNode = startNode;
          this.typescriptParser.advance();
          continue;
        }
        const elementNode = this.parseObjectElement();
        elementNodes.push(elementNode);
        endNode = elementNode;

        const commaNode = this.typescriptParser.tryConsume(TypeScriptCommaNode);
        if (!Object.isUndefined(commaNode)) {
          commaNodes.push(commaNode);
          endNode = commaNode;
          continue;
        }
        if (this.typescriptParser.isEndOfFile || this.typescriptParser.currentNode instanceof TypeScriptCloseBraceNode)
          break;
        this.typescriptParser.reportExpected(Resources.comma);
      }

      const closeBraceNode = this.typescriptParser.tryConsume(TypeScriptCloseBraceNode);
      if (Object.isUndefined(closeBraceNode))
        this.typescriptParser.reportExpected(Resources.closeBrace);
      else
        endNode = closeBraceNode;

      const span = this.typescriptParser.typescriptLexer.reader.createSpan(openBraceNode.span, endNode.span);
      const patternNode = new TypeScriptObjectBindingPatternNode(
        openBraceNode,
        elementNodes,
        commaNodes,
        span,
        closeBraceNode,
        openBraceNode.leadingTrivia,
        endNode.trailingTrivia);
      patternNode.validateTypeScriptGrammar(this.typescriptParser.context);
      return patternNode;
    }
    finally {
      context.leaveList();
      context.contextFlags = previousFlags;
    }
  }

  private parseArrayElement(): TypeScriptBindingElementNode {
    const startNode = this.typescriptParser.currentNode;
    const dotDotDotNode = this.typescriptParser.tryConsume(TypeScriptDotDotDotNode);
    return this.finishElement(startNode, dotDotDotNode, undefined, undefined, this.parse());
  }

  private parseObjectElement(): TypeScriptBindingElementNode {
    const parser = this.typescriptParser;
    const startNode = parser.currentNode;
    const dotDotDotNode = parser.tryConsume(TypeScriptDotDotDotNode);
    const isBindingIdentifier = parser.currentNode.isTypeScriptBindingIdentifier();
    const propertyNameNode = this.propertyNameParser.parse();
    const colonNode = parser.tryConsume(TypeScriptColonNode);
    if (isBindingIdentifier && Object.isUndefined(colonNode)) {
      parser.readName(propertyNameNode);
      parser.readEvalOrArgumentsName(propertyNameNode);
      return this.finishElement(startNode, dotDotDotNode, undefined, undefined, propertyNameNode);
    }

    if (Object.isUndefined(colonNode))
      parser.reportExpected(Resources.colon);
    return this.finishElement(startNode, dotDotDotNode, propertyNameNode, colonNode, this.parse());
  }

  private finishElement(
    startNode: Node,
    dotDotDotNode: TypeScriptDotDotDotNode | undefined,
    propertyNameNode: Node | undefined,
    colonNode: TypeScriptColonNode | undefined,
    nameNode: Node): TypeScriptBindingElementNode {
    const equalsNode = this.typescriptParser.tryConsume(TypeScriptEqualsNode);
    const initializerNode = Object.isUndefined(equalsNode) ? undefined : this.typescriptParser.parseAssignmentExpression();

    const endNode: Node = initializerNode ?? equalsNode ?? nameNode;
    const span = this.typescriptParser.typescriptLexer.reader.createSpan(startNode.span, endNode.span);
    return new TypeScriptBindingElementNode(
      span,
      nameNode,
      dotDotDotNode,
      propertyNameNode,
      colonNode,
      equalsNode,
      initializerNode,
      startNode.leadingTrivia,
      endNode.trailingTrivia);
  }
}
