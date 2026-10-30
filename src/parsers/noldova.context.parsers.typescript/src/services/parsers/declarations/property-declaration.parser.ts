/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptContextFlags } from "../../../enums/typescript-context-flags.js";
import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptPropertyDeclarationNode } from "../../../models/nodes/declarations/typescript-property-declaration.node.js";
import { TypeScriptAtNode } from "../../../models/nodes/delimiters/typescript-at.node.js";
import { TypeScriptColonNode } from "../../../models/nodes/delimiters/typescript-colon.node.js";
import { TypeScriptOpenParenthesisNode } from "../../../models/nodes/delimiters/typescript-open-parenthesis.node.js";
import { TypeScriptSemicolonNode } from "../../../models/nodes/delimiters/typescript-semicolon.node.js";
import { TypeScriptEqualsNode } from "../../../models/nodes/operators/typescript-equals.node.js";
import type { TypeScriptExclamationNode } from "../../../models/nodes/operators/typescript-exclamation.node.js";
import type { TypeScriptQuestionNode } from "../../../models/nodes/operators/typescript-question.node.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";

export class PropertyDeclarationParser {
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
  }

  public parse(
    startNode: Node,
    modifierNodes: readonly Node[],
    nameNode: Node,
    questionNode?: TypeScriptQuestionNode,
    exclamationNode?: TypeScriptExclamationNode): TypeScriptPropertyDeclarationNode {
    const typescriptParser = this.typescriptParser;
    const colonNode = typescriptParser.tryConsume(TypeScriptColonNode);
    const typeNode = Object.isUndefined(colonNode) ? undefined : this.typescriptParser.parseType();
    const equalsNode = typescriptParser.tryConsume(TypeScriptEqualsNode);
    const initializerNode = Object.isUndefined(equalsNode) ? undefined : this.parseInitializer();
    const terminatorNode = this.parseTerminator(nameNode, typeNode, initializerNode);
    let endNode: Node = nameNode;
    if (!Object.isUndefined(questionNode))
      endNode = questionNode;
    if (!Object.isUndefined(exclamationNode))
      endNode = exclamationNode;
    if (!Object.isUndefined(colonNode))
      endNode = colonNode;
    if (!Object.isUndefined(typeNode))
      endNode = typeNode;
    if (!Object.isUndefined(equalsNode))
      endNode = equalsNode;
    if (!Object.isUndefined(initializerNode))
      endNode = initializerNode;
    if (!Object.isUndefined(terminatorNode))
      endNode = terminatorNode;
    const span = typescriptParser.typescriptLexer.reader.createSpan(
      startNode.span,
      endNode.span);
    const propertyNode = new TypeScriptPropertyDeclarationNode(
      modifierNodes,
      span,
      nameNode,
      questionNode,
      exclamationNode,
      colonNode,
      typeNode,
      equalsNode,
      initializerNode,
      terminatorNode,
      startNode.leadingTrivia,
      endNode.trailingTrivia);
    propertyNode.validateTypeScriptGrammar(this.typescriptParser.context);
    return propertyNode;
  }

  private parseTerminator(nameNode: Node, typeNode: Node | undefined, initializerNode: Node | undefined): TypeScriptSemicolonNode | undefined {
    const parser = this.typescriptParser;
    const node = parser.currentNode;
    if (node instanceof TypeScriptAtNode && !parser.hasPrecedingLineBreak()) {
      parser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1436, node.span);
      return undefined;
    }
    if (node instanceof TypeScriptOpenParenthesisNode) {
      parser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1441, node.span);
      parser.advance();
      return undefined;
    }
    if (!Object.isUndefined(typeNode) && Object.isUndefined(initializerNode) && !parser.canParseStatementTerminator()) {
      parser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1442, node.span);
      return undefined;
    }
    return parser.parseStatementTerminator(Object.isUndefined(initializerNode) ? nameNode : undefined);
  }

  private parseInitializer(): Node {
    const context = this.typescriptParser.context;
    const previousFlags = context.contextFlags;
    const previousNewTargetScope = context.isNewTargetScope;
    const previousMemberInitializer = context.isMemberInitializer;
    context.contextFlags = TypeScriptContextFlags.None;
    context.isNewTargetScope = false;
    context.isMemberInitializer = true;
    try {
      return this.typescriptParser.parseAssignmentExpression();
    }
    finally {
      context.contextFlags = previousFlags;
      context.isNewTargetScope = previousNewTargetScope;
      context.isMemberInitializer = previousMemberInitializer;
    }
  }
}
