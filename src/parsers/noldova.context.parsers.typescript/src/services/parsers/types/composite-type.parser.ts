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
import { TypeScriptColonNode } from "../../../models/nodes/delimiters/typescript-colon.node.js";
import { TypeScriptExtendsKeywordNode } from "../../../models/nodes/keywords/typescript-extends-keyword.node.js";
import { TypeScriptAmpersandNode } from "../../../models/nodes/operators/typescript-ampersand.node.js";
import { TypeScriptBarNode } from "../../../models/nodes/operators/typescript-bar.node.js";
import { TypeScriptQuestionNode } from "../../../models/nodes/operators/typescript-question.node.js";
import { TypeScriptConditionalTypeNode } from "../../../models/nodes/types/typescript-conditional-type.node.js";
import { TypeScriptConstructorTypeNode } from "../../../models/nodes/types/typescript-constructor-type.node.js";
import { TypeScriptIntersectionTypeNode } from "../../../models/nodes/types/typescript-intersection-type.node.js";
import { TypeScriptUnionTypeNode } from "../../../models/nodes/types/typescript-union-type.node.js";
import { Resources } from "../../../resources.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";
import type { FunctionTypeParser } from "./function-type.parser.js";

export class CompositeTypeParser {
  private readonly functionTypeParser: FunctionTypeParser;
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser, functionTypeParser: FunctionTypeParser) {
    this.typescriptParser = typescriptParser;
    this.functionTypeParser = functionTypeParser;
  }

  public parse(): Node {
    const context = this.typescriptParser.context;
    context.enterRecursion(this.typescriptParser.currentNode.span);
    try {
      const typescriptParser = this.typescriptParser;
      if (this.functionTypeParser.isStart())
        return this.functionTypeParser.parse();

      const checkTypeNode = this.parseUnionType();
      const extendsKeywordNode = typescriptParser.hasPrecedingLineBreak() ? undefined : typescriptParser.tryConsume(TypeScriptExtendsKeywordNode);
      if (Object.isUndefined(extendsKeywordNode))
        return checkTypeNode;

      const extendsTypeNode = this.parseWithoutConditional();
      const questionNode = typescriptParser.tryConsume(TypeScriptQuestionNode);
      if (Object.isUndefined(questionNode))
        this.typescriptParser.reportExpected(Resources.question);

      const trueTypeNode = this.parse();
      const colonNode = typescriptParser.tryConsume(TypeScriptColonNode);
      if (Object.isUndefined(colonNode))
        this.typescriptParser.reportExpected(Resources.colon);

      const falseTypeNode = this.parse();
      const span = typescriptParser.typescriptLexer.reader.createSpan(checkTypeNode.span, falseTypeNode.span);
      return new TypeScriptConditionalTypeNode(
        checkTypeNode,
        extendsKeywordNode,
        span,
        extendsTypeNode,
        trueTypeNode,
        falseTypeNode,
        questionNode,
        colonNode,
        checkTypeNode.leadingTrivia,
        falseTypeNode.trailingTrivia);
    }
    finally {
      context.leaveRecursion();
    }
  }

  public parseWithoutConditional(): Node {
    const context = this.typescriptParser.context;
    const previousFlags = context.contextFlags;
    context.contextFlags |= TypeScriptContextFlags.DisallowConditionalTypes;
    try {
      return this.functionTypeParser.isStart() ? this.functionTypeParser.parse() : this.parseUnionType();
    }
    finally {
      context.contextFlags = previousFlags;
    }
  }

  private parseUnionType(): Node {
    const typescriptParser = this.typescriptParser;
    const barNodes: TypeScriptBarNode[] = [];
    const leadingBarNode = typescriptParser.tryConsume(TypeScriptBarNode);
    if (!Object.isUndefined(leadingBarNode))
      barNodes.push(leadingBarNode);

    const firstTypeNode = Object.isUndefined(leadingBarNode) ? this.parseIntersectionType() : this.parseUnionConstituent();
    const typeNodes: Node[] = [firstTypeNode];
    let endNode = firstTypeNode;
    while (typescriptParser.currentNode instanceof TypeScriptBarNode) {
      const barNode = typescriptParser.currentNode;
      typescriptParser.advance();
      barNodes.push(barNode);
      const typeNode = this.parseUnionConstituent();
      typeNodes.push(typeNode);
      endNode = typeNode;
    }

    if (barNodes.length === 0)
      return firstTypeNode;

    const startNode = leadingBarNode ?? firstTypeNode;
    const span = typescriptParser.typescriptLexer.reader.createSpan(startNode.span, endNode.span);
    return new TypeScriptUnionTypeNode(typeNodes, barNodes, span, startNode.leadingTrivia, endNode.trailingTrivia);
  }

  private parseUnionConstituent(): Node {
    if (!this.functionTypeParser.isStart())
      return this.parseIntersectionType();

    const node = this.functionTypeParser.parse();
    const template = node instanceof TypeScriptConstructorTypeNode
      ? TypeScriptDiagnosticTemplates.TS1386
      : TypeScriptDiagnosticTemplates.TS1385;
    this.typescriptParser.context.diagnosticCollector.addTypeScriptParseDiagnostic(template, node.getTypeScriptFullSpan());
    return node;
  }

  private parseIntersectionType(): Node {
    const typescriptParser = this.typescriptParser;
    const ampersandNodes: TypeScriptAmpersandNode[] = [];
    const leadingAmpersandNode = typescriptParser.tryConsume(TypeScriptAmpersandNode);
    if (!Object.isUndefined(leadingAmpersandNode))
      ampersandNodes.push(leadingAmpersandNode);

    const firstTypeNode = Object.isUndefined(leadingAmpersandNode) ? typescriptParser.parseTypeOperand() : this.parseIntersectionConstituent();
    const typeNodes: Node[] = [firstTypeNode];
    let endNode = firstTypeNode;
    while (typescriptParser.currentNode instanceof TypeScriptAmpersandNode) {
      const ampersandNode = typescriptParser.currentNode;
      typescriptParser.advance();
      ampersandNodes.push(ampersandNode);
      const typeNode = this.parseIntersectionConstituent();
      typeNodes.push(typeNode);
      endNode = typeNode;
    }

    if (ampersandNodes.length === 0)
      return firstTypeNode;

    const startNode = leadingAmpersandNode ?? firstTypeNode;
    const span = typescriptParser.typescriptLexer.reader.createSpan(startNode.span, endNode.span);
    return new TypeScriptIntersectionTypeNode(typeNodes, ampersandNodes, span, startNode.leadingTrivia, endNode.trailingTrivia);
  }

  private parseIntersectionConstituent(): Node {
    if (!this.functionTypeParser.isStart())
      return this.typescriptParser.parseTypeOperand();

    const node = this.functionTypeParser.parse();
    const template = node instanceof TypeScriptConstructorTypeNode
      ? TypeScriptDiagnosticTemplates.TS1388
      : TypeScriptDiagnosticTemplates.TS1387;
    this.typescriptParser.context.diagnosticCollector.addTypeScriptParseDiagnostic(template, node.getTypeScriptFullSpan());
    return node;
  }
}
