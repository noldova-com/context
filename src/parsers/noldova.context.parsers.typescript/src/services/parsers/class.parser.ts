/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptContextFlags } from "../../enums/typescript-context-flags.js";
import { TypeScriptModifierTarget } from "../../enums/typescript-modifier-target.js";
import { TypeScriptTypeParameterAnnotations } from "../../enums/typescript-type-parameter-annotations.js";
import { TypeScriptDiagnosticTemplates } from "../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptClassDeclarationNode } from "../../models/nodes/declarations/typescript-class-declaration.node.js";
import { TypeScriptMissingDeclarationNode } from "../../models/nodes/declarations/typescript-missing-declaration.node.js";
import { TypeScriptOpenBraceNode } from "../../models/nodes/delimiters/typescript-open-brace.node.js";
import { TypeScriptClassExpressionNode } from "../../models/nodes/expressions/typescript-class-expression.node.js";
import { TypeScriptAbstractKeywordNode } from "../../models/nodes/keywords/typescript-abstract-keyword.node.js";
import { TypeScriptClassKeywordNode } from "../../models/nodes/keywords/typescript-class-keyword.node.js";
import { TypeScriptDeclareKeywordNode } from "../../models/nodes/keywords/typescript-declare-keyword.node.js";
import { TypeScriptExportKeywordNode } from "../../models/nodes/keywords/typescript-export-keyword.node.js";
import { TypeScriptImplementsKeywordNode } from "../../models/nodes/keywords/typescript-implements-keyword.node.js";
import type { TypeScriptClassNode } from "../../models/nodes/typescript-class.node.js";
import type { TypeScriptSyntaxParser } from "../typescript-syntax.parser.js";
import { ClassBodyParser } from "./declarations/class-body.parser.js";
import { HeritageClauseParser } from "./declarations/heritage-clause.parser.js";
import { ModifierParser } from "./declarations/modifier.parser.js";
import { TypeParameterListParser } from "./types/type-parameter-list.parser.js";

export class ClassParser {
  private readonly classBodyParser: ClassBodyParser;
  private readonly heritageClauseParser: HeritageClauseParser;
  private readonly modifierParser: ModifierParser;
  private readonly typeParameterListParser: TypeParameterListParser;
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
    this.classBodyParser = new ClassBodyParser(typescriptParser);
    this.heritageClauseParser = new HeritageClauseParser(typescriptParser);
    this.modifierParser = new ModifierParser(typescriptParser);
    this.typeParameterListParser = new TypeParameterListParser(typescriptParser);
  }

  public parseDeclaration(classKeywordNode: TypeScriptClassKeywordNode, modifierNodes: readonly Node[] = []): TypeScriptClassDeclarationNode {
    return this.parse(classKeywordNode, true, modifierNodes);
  }

  public parseExpression(classKeywordNode: TypeScriptClassKeywordNode): TypeScriptClassExpressionNode {
    return this.parse(classKeywordNode, false, []);
  }

  public parseDecoratedExpression(): Node {
    const parser = this.typescriptParser;
    const startNode = parser.currentNode;
    const modifierNodes = this.modifierParser.parseDeclaration();
    const classKeywordNode = parser.currentNode;
    if (classKeywordNode instanceof TypeScriptClassKeywordNode) {
      const expressionNode = this.parse(classKeywordNode, false, modifierNodes);
      this.modifierParser.validate(modifierNodes, TypeScriptModifierTarget.ModuleElement, expressionNode);
      return expressionNode;
    }
    const endNode = modifierNodes.at(-1)!;
    parser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1109,
      parser.typescriptLexer.reader.createSpan(endNode.span.endOffset, 0));
    return new TypeScriptMissingDeclarationNode(modifierNodes, parser.typescriptLexer.reader.createSpan(startNode.span, endNode.span),
      startNode.leadingTrivia, endNode.trailingTrivia);
  }

  private parse(classKeywordNode: TypeScriptClassKeywordNode, isDeclaration: true, modifierNodes: readonly Node[]): TypeScriptClassDeclarationNode;
  private parse(classKeywordNode: TypeScriptClassKeywordNode, isDeclaration: false, modifierNodes: readonly Node[]): TypeScriptClassExpressionNode;
  private parse(classKeywordNode: TypeScriptClassKeywordNode, isDeclaration: boolean, modifierNodes: readonly Node[]): TypeScriptClassNode {
    const parser = this.typescriptParser;
    const context = parser.context;
    const startNode = modifierNodes[0] ?? classKeywordNode;
    const previousFlags = context.contextFlags;
    const previousAbstractClassBody = context.isAbstractClassBody;
    const previousEnclosingClass = context.hasEnclosingClass;
    const previousAwaitNameCount = context.records.awaitNameCount;
    context.hasEnclosingClass = true;
    context.enterRecursion(classKeywordNode.span);
    try {
      parser.advance();
      const nameNode = this.tryParseName();
      const typeParameterListNode = this.typeParameterListParser.parse(TypeScriptTypeParameterAnnotations.Const | TypeScriptTypeParameterAnnotations.Variance);
      if (modifierNodes.some(t => t instanceof TypeScriptExportKeywordNode))
        context.contextFlags |= TypeScriptContextFlags.Await;
      const heritageClauseNodes = this.heritageClauseParser.parseList();

      const openBraceNode = parser.currentNode;
      context.isAbstractClassBody = modifierNodes.some(t => t instanceof TypeScriptAbstractKeywordNode);
      const bodyNode = openBraceNode instanceof TypeScriptOpenBraceNode ? this.classBodyParser.parse(openBraceNode) : this.classBodyParser.reportMissing();
      bodyNode.reportTypeScriptConstructorImplementations(context);
      if (modifierNodes.some(t => t instanceof TypeScriptDeclareKeywordNode))
        context.records.awaitNameCount = previousAwaitNameCount;

      const span = parser.typescriptLexer.reader.createSpan(startNode.span, bodyNode.span);
      if (isDeclaration) {
        const declarationNode = new TypeScriptClassDeclarationNode(
          classKeywordNode,
          heritageClauseNodes,
          span,
          bodyNode,
          nameNode,
          typeParameterListNode,
          modifierNodes,
          startNode.leadingTrivia,
          bodyNode.trailingTrivia);

        declarationNode.validateTypeScriptGrammar(context);
        return declarationNode;
      }

      const expressionNode = new TypeScriptClassExpressionNode(
        classKeywordNode, heritageClauseNodes, span, bodyNode, nameNode, typeParameterListNode, modifierNodes, startNode.leadingTrivia, bodyNode.trailingTrivia);

      expressionNode.validateTypeScriptGrammar(context);
      return expressionNode;
    }
    finally {
      context.contextFlags = previousFlags;
      context.isAbstractClassBody = previousAbstractClassBody;
      context.hasEnclosingClass = previousEnclosingClass;
      context.leaveRecursion();
    }
  }

  private tryParseName(): Node | undefined {
    const parser = this.typescriptParser;
    if (!parser.currentNode.isTypeScriptBindingIdentifier())
      return undefined;

    if (parser.currentNode instanceof TypeScriptImplementsKeywordNode && parser.lookAhead(() => {
      parser.advance();
      return parser.currentNode.isTypeScriptIdentifierName();
    }))
      return undefined;

    return parser.consumeBindingName();
  }
}
