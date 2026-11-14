/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, SourceSpan } from "@noldova/context.parsers";

import { TypeScriptContextFlags } from "../../enums/typescript-context-flags.js";
import { TypeScriptModifierTarget } from "../../enums/typescript-modifier-target.js";
import { TypeScriptTypeParameterAnnotations } from "../../enums/typescript-type-parameter-annotations.js";
import { TypeScriptDiagnosticTemplates } from "../../models/diagnostics/typescript-diagnostic-templates.js";
import type { TypeScriptClassBodyNode } from "../../models/nodes/declarations/typescript-class-body.node.js";
import { TypeScriptClassDeclarationNode } from "../../models/nodes/declarations/typescript-class-declaration.node.js";
import type { TypeScriptHeritageClauseNode } from "../../models/nodes/declarations/typescript-heritage-clause.node.js";
import { TypeScriptMissingDeclarationNode } from "../../models/nodes/declarations/typescript-missing-declaration.node.js";
import type { TypeScriptAtNode } from "../../models/nodes/delimiters/typescript-at.node.js";
import { TypeScriptOpenBraceNode } from "../../models/nodes/delimiters/typescript-open-brace.node.js";
import { TypeScriptClassExpressionNode } from "../../models/nodes/expressions/typescript-class-expression.node.js";
import { TypeScriptAbstractKeywordNode } from "../../models/nodes/keywords/typescript-abstract-keyword.node.js";
import { TypeScriptClassKeywordNode } from "../../models/nodes/keywords/typescript-class-keyword.node.js";
import { TypeScriptDeclareKeywordNode } from "../../models/nodes/keywords/typescript-declare-keyword.node.js";
import { TypeScriptExportKeywordNode } from "../../models/nodes/keywords/typescript-export-keyword.node.js";
import { TypeScriptImplementsKeywordNode } from "../../models/nodes/keywords/typescript-implements-keyword.node.js";
import type { TypeScriptTypeParameterListNode } from "../../models/nodes/types/typescript-type-parameter-list.node.js";
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
    return this.parse(classKeywordNode, modifierNodes, TypeScriptClassDeclarationNode);
  }

  public parseExpression(classKeywordNode: TypeScriptClassKeywordNode): TypeScriptClassExpressionNode {
    return this.parse(classKeywordNode, [], TypeScriptClassExpressionNode);
  }

  public parseDecoratedExpression(atNode: TypeScriptAtNode): Node {
    const parser = this.typescriptParser;
    const modifierList = this.modifierParser.parseDecoratedDeclaration(atNode);
    const modifierNodes = modifierList.nodes;
    const classKeywordNode = parser.currentNode;
    if (classKeywordNode instanceof TypeScriptClassKeywordNode) {
      const expressionNode = this.parse(classKeywordNode, modifierNodes, TypeScriptClassExpressionNode);
      this.modifierParser.validate(modifierNodes, TypeScriptModifierTarget.ModuleElement, expressionNode);
      return expressionNode;
    }
    const endNode = modifierList.lastNode;
    parser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1109,
      parser.typescriptLexer.reader.createSpan(endNode.span.endOffset, 0));
    return new TypeScriptMissingDeclarationNode(modifierNodes, parser.typescriptLexer.reader.createSpan(atNode.span, endNode.span),
      atNode.leadingTrivia, endNode.trailingTrivia);
  }

  private parse<TNode extends TypeScriptClassNode>(classKeywordNode: TypeScriptClassKeywordNode, modifierNodes: readonly Node[],
    nodeType: new (classKeywordNode: TypeScriptClassKeywordNode, heritageClauseNodes: readonly TypeScriptHeritageClauseNode[], span: SourceSpan,
      bodyNode: TypeScriptClassBodyNode, nameNode: Node | undefined, typeParameterListNode: TypeScriptTypeParameterListNode | undefined,
      modifierNodes: readonly Node[], leadingTrivia: Node | undefined, trailingTrivia: Node | undefined) => TNode): TNode {
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
      const classNode = new nodeType(
        classKeywordNode, heritageClauseNodes, span, bodyNode, nameNode, typeParameterListNode, modifierNodes, startNode.leadingTrivia, bodyNode.trailingTrivia);

      classNode.validateTypeScriptGrammar(context);
      return classNode;
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
