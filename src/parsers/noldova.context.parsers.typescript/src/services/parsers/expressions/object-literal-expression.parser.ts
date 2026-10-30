/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type Node } from "@noldova/context.parsers";

import { TypeScriptContextFlags } from "../../../enums/typescript-context-flags.js";
import { TypeScriptListKind } from "../../../enums/typescript-list-kind.js";
import { TypeScriptObjectMemberKind } from "../../../enums/typescript-object-member-kind.js";
import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import type { TypeScriptAccessorNode } from "../../../models/nodes/declarations/typescript-accessor.node.js";
import { TypeScriptDecoratorNode } from "../../../models/nodes/declarations/typescript-decorator.node.js";
import type { TypeScriptMethodDeclarationNode } from "../../../models/nodes/declarations/typescript-method-declaration.node.js";
import { TypeScriptCloseBraceNode } from "../../../models/nodes/delimiters/typescript-close-brace.node.js";
import { TypeScriptColonNode } from "../../../models/nodes/delimiters/typescript-colon.node.js";
import { TypeScriptCommaNode } from "../../../models/nodes/delimiters/typescript-comma.node.js";
import { TypeScriptDotDotDotNode } from "../../../models/nodes/delimiters/typescript-dot-dot-dot.node.js";
import type { TypeScriptOpenBraceNode } from "../../../models/nodes/delimiters/typescript-open-brace.node.js";
import { TypeScriptSemicolonNode } from "../../../models/nodes/delimiters/typescript-semicolon.node.js";
import { TypeScriptObjectLiteralExpressionNode } from "../../../models/nodes/expressions/typescript-object-literal-expression.node.js";
import { TypeScriptPropertyAssignmentNode } from "../../../models/nodes/expressions/typescript-property-assignment.node.js";
import { TypeScriptShorthandPropertyAssignmentNode } from "../../../models/nodes/expressions/typescript-shorthand-property-assignment.node.js";
import { TypeScriptSpreadAssignmentNode } from "../../../models/nodes/expressions/typescript-spread-assignment.node.js";
import { TypeScriptAsyncKeywordNode } from "../../../models/nodes/keywords/typescript-async-keyword.node.js";
import { TypeScriptAsteriskNode } from "../../../models/nodes/operators/typescript-asterisk.node.js";
import { TypeScriptEqualsNode } from "../../../models/nodes/operators/typescript-equals.node.js";
import { TypeScriptExclamationNode } from "../../../models/nodes/operators/typescript-exclamation.node.js";
import { TypeScriptQuestionNode } from "../../../models/nodes/operators/typescript-question.node.js";
import { Resources } from "../../../resources.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";
import { AccessorParser } from "../declarations/accessor.parser.js";
import { MethodDeclarationParser } from "../declarations/method-declaration.parser.js";
import { ModifierParser } from "../declarations/modifier.parser.js";
import { ParameterListParser } from "../declarations/parameter-list.parser.js";
import { PropertyNameParser } from "../names/property-name.parser.js";
import { BlockParser } from "../statements/block.parser.js";
import { TypeParameterListParser } from "../types/type-parameter-list.parser.js";

export class ObjectLiteralExpressionParser {
  private readonly accessorParser: AccessorParser;
  private readonly modifierParser: ModifierParser;
  private readonly methodDeclarationParser: MethodDeclarationParser;
  private readonly propertyNameParser: PropertyNameParser;
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
    const blockParser = new BlockParser(typescriptParser);
    const parameterListParser = new ParameterListParser(typescriptParser);
    const typeParameterListParser = new TypeParameterListParser(typescriptParser);
    this.propertyNameParser = new PropertyNameParser(typescriptParser);
    this.modifierParser = new ModifierParser(typescriptParser);
    this.accessorParser = new AccessorParser(
      typescriptParser,
      this.propertyNameParser,
      parameterListParser,
      typeParameterListParser,
      blockParser);
    this.methodDeclarationParser = new MethodDeclarationParser(
      typescriptParser,
      parameterListParser,
      typeParameterListParser,
      blockParser);
  }

  public parse(openBraceNode: TypeScriptOpenBraceNode): TypeScriptObjectLiteralExpressionNode {
    const context = this.typescriptParser.context;
    const previousFlags = context.contextFlags;
    context.contextFlags &= ~(TypeScriptContextFlags.Decorator | TypeScriptContextFlags.ConditionalTrueBranch);
    this.typescriptParser.context.enterList(TypeScriptListKind.ObjectLiteralMembers);
    try {
      const typescriptParser = this.typescriptParser;
      typescriptParser.advance();
      const propertyNodes: Node[] = [];
      const commaNodes: TypeScriptCommaNode[] = [];
      let endNode: Node = openBraceNode;
      while (!typescriptParser.isEndOfFile && !(typescriptParser.currentNode instanceof TypeScriptCloseBraceNode)) {
        const startNode = typescriptParser.currentNode;
        if (!startNode.isTypeScriptListElement(TypeScriptListKind.ObjectLiteralMembers, typescriptParser)) {
          context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1136, startNode.span);
          if (context.isListBoundary(typescriptParser))
            break;
          endNode = startNode;
          typescriptParser.advance();
          continue;
        }

        const propertyNode = this.parseProperty();
        propertyNodes.push(propertyNode);
        endNode = propertyNode;

        const commaNode = typescriptParser.tryConsume(TypeScriptCommaNode);
        if (Object.isUndefined(commaNode)) {
          if (!typescriptParser.isEndOfFile && !(typescriptParser.currentNode instanceof TypeScriptCloseBraceNode))
            typescriptParser.reportExpected(Resources.comma);

          if (typescriptParser.currentNode instanceof TypeScriptSemicolonNode && !typescriptParser.hasPrecedingLineBreak()
            || typescriptParser.currentNode === startNode) {
            endNode = typescriptParser.currentNode;
            typescriptParser.advance();
          }
          continue;
        }

        commaNodes.push(commaNode);
        endNode = commaNode;
      }

      const closeBraceNode = typescriptParser.tryConsume(TypeScriptCloseBraceNode);
      if (Object.isUndefined(closeBraceNode))
        context.diagnosticCollector.addTypeScriptMissingClosingDelimiterDiagnostic(context.source, typescriptParser.currentNode.span,
          openBraceNode.span, Resources.openBrace, Resources.closeBrace);
      else
        endNode = closeBraceNode;

      const span = typescriptParser.typescriptLexer.reader.createSpan(
        openBraceNode.span,
        endNode.span);
      const resultNode = new TypeScriptObjectLiteralExpressionNode(
        openBraceNode,
        propertyNodes,
        commaNodes,
        span,
        closeBraceNode,
        openBraceNode.leadingTrivia,
        endNode.trailingTrivia);
      typescriptParser.context.records.writtenObjectLiterals.push(resultNode);
      return resultNode;
    }
    finally {
      this.typescriptParser.context.leaveList();
      context.contextFlags = previousFlags;
    }
  }

  private parseProperty(): Node {
    const parser = this.typescriptParser;
    const startNode = parser.currentNode;
    if (startNode instanceof TypeScriptDotDotDotNode)
      return this.parseSpreadAssignment(startNode);

    const modifierNodes = this.modifierParser.parseDeclaration();
    const memberNode = this.parseModifiedProperty(startNode, modifierNodes);
    this.reportModifiers(memberNode, modifierNodes);
    memberNode.reportTypeScriptObjectLiteralMember(this.typescriptParser.context);
    memberNode.reportTypeScriptGrammarAfterModifiers(this.typescriptParser.context, false);
    memberNode.reportTypeScriptCommaComputedName(this.typescriptParser.context);
    return memberNode;
  }

  private reportModifiers(memberNode: Node, modifierNodes: readonly Node[]): void {
    const context = this.typescriptParser.context;
    const keywordNodes = modifierNodes.filter(t => !(t instanceof TypeScriptDecoratorNode));
    const isMethod = memberNode.getTypeScriptObjectMemberKind() === TypeScriptObjectMemberKind.Method;
    const firstNode = keywordNodes[0];
    if (isMethod && !Object.isUndefined(firstNode) && !(keywordNodes.length === 1 && firstNode instanceof TypeScriptAsyncKeywordNode))
      context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1184, firstNode.span);
    for (const keywordNode of keywordNodes)
      if (!(isMethod && keywordNode instanceof TypeScriptAsyncKeywordNode))
        context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1042, keywordNode.span,
          [context.source.getText(keywordNode.span)]);
  }

  private parseModifiedProperty(startNode: Node, modifierNodes: readonly Node[]):
    TypeScriptPropertyAssignmentNode | TypeScriptShorthandPropertyAssignmentNode | TypeScriptMethodDeclarationNode | TypeScriptAccessorNode {
    const parser = this.typescriptParser;
    const node = parser.currentNode;
    if (node.startsTypeScriptAccessor(this.typescriptParser))
      return this.accessorParser.parse(startNode, modifierNodes, node);

    const asteriskNode = parser.tryConsume(TypeScriptAsteriskNode);
    const isIdentifier = parser.currentNode.isTypeScriptIdentifier(parser.context);
    const nameNode = this.propertyNameParser.parse();
    const questionNode = parser.tryConsume(TypeScriptQuestionNode);
    const exclamationNode = parser.tryConsume(TypeScriptExclamationNode);
    if (!Object.isUndefined(asteriskNode) || parser.currentNode.canStartTypeScriptSignature()) {
      return this.methodDeclarationParser.parse(startNode, modifierNodes, nameNode, asteriskNode, questionNode, exclamationNode,
        TypeScriptDiagnosticTemplates.TS1005);
    }

    const colonNode = parser.tryConsume(TypeScriptColonNode);
    if (isIdentifier && Object.isUndefined(colonNode))
      return this.parseShorthandAssignment(startNode, modifierNodes, nameNode, questionNode, exclamationNode);
    if (Object.isUndefined(colonNode))
      parser.reportExpected(Resources.colon);
    return this.parsePropertyAssignment(modifierNodes, nameNode, colonNode, questionNode, exclamationNode);
  }

  private parsePropertyAssignment(
    modifierNodes: readonly Node[],
    nameNode: Node,
    colonNode: TypeScriptColonNode | undefined,
    questionNode?: TypeScriptQuestionNode,
    exclamationNode?: TypeScriptExclamationNode): TypeScriptPropertyAssignmentNode {
    const typescriptParser = this.typescriptParser;
    const node = typescriptParser.currentNode;
    const initializerNode = node instanceof TypeScriptCloseBraceNode || typescriptParser.isEndOfFile
      ? node.reportTypeScriptMissingExpression(typescriptParser)
      : typescriptParser.parseAssignmentExpressionAllowingIn();
    const startNode = modifierNodes[0] ?? nameNode;
    const span = typescriptParser.typescriptLexer.reader.createSpan(
      startNode.span,
      initializerNode.span);
    return new TypeScriptPropertyAssignmentNode(
      span,
      nameNode,
      initializerNode,
      colonNode,
      questionNode,
      exclamationNode,
      modifierNodes,
      startNode.leadingTrivia,
      initializerNode.trailingTrivia);
  }

  private parseShorthandAssignment(
    startNode: Node,
    modifierNodes: readonly Node[],
    nameNode: Node,
    questionNode?: TypeScriptQuestionNode,
    exclamationNode?: TypeScriptExclamationNode): TypeScriptShorthandPropertyAssignmentNode {
    const typescriptParser = this.typescriptParser;
    const equalsNode = typescriptParser.tryConsume(TypeScriptEqualsNode);
    const initializerNode = Object.isUndefined(equalsNode)
      ? undefined
      : typescriptParser.parseAssignmentExpressionAllowingIn();
    const endNode = initializerNode ?? equalsNode ?? exclamationNode ?? questionNode ?? nameNode;
    const span = typescriptParser.typescriptLexer.reader.createSpan(
      startNode.span,
      endNode.span);
    return new TypeScriptShorthandPropertyAssignmentNode(
      nameNode,
      span,
      equalsNode,
      initializerNode,
      questionNode,
      exclamationNode,
      modifierNodes,
      startNode.leadingTrivia,
      endNode.trailingTrivia);
  }

  private parseSpreadAssignment(dotDotDotNode: TypeScriptDotDotDotNode): TypeScriptSpreadAssignmentNode {
    const typescriptParser = this.typescriptParser;
    typescriptParser.advance();
    const expressionNode = typescriptParser.parseAssignmentExpression();
    const span = typescriptParser.typescriptLexer.reader.createSpan(
      dotDotDotNode.span,
      expressionNode.span);
    return new TypeScriptSpreadAssignmentNode(
      dotDotDotNode,
      span,
      expressionNode,
      dotDotDotNode.leadingTrivia,
      expressionNode.trailingTrivia);
  }
}
