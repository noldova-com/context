/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptTypeParameterAnnotations } from "../../../enums/typescript-type-parameter-annotations.js";
import { TypeScriptCloseParenthesisNode } from "../../../models/nodes/delimiters/typescript-close-parenthesis.node.js";
import { TypeScriptDotDotDotNode } from "../../../models/nodes/delimiters/typescript-dot-dot-dot.node.js";
import { TypeScriptOpenBraceNode } from "../../../models/nodes/delimiters/typescript-open-brace.node.js";
import { TypeScriptOpenBracketNode } from "../../../models/nodes/delimiters/typescript-open-bracket.node.js";
import { TypeScriptOpenParenthesisNode } from "../../../models/nodes/delimiters/typescript-open-parenthesis.node.js";
import { TypeScriptAbstractKeywordNode } from "../../../models/nodes/keywords/typescript-abstract-keyword.node.js";
import { TypeScriptNewKeywordNode } from "../../../models/nodes/keywords/typescript-new-keyword.node.js";
import { TypeScriptThisKeywordNode } from "../../../models/nodes/keywords/typescript-this-keyword.node.js";
import { TypeScriptArrowNode } from "../../../models/nodes/operators/typescript-arrow.node.js";
import { TypeScriptLessThanNode } from "../../../models/nodes/operators/typescript-less-than.node.js";
import { TypeScriptConstructorTypeNode } from "../../../models/nodes/types/typescript-constructor-type.node.js";
import { TypeScriptFunctionTypeNode } from "../../../models/nodes/types/typescript-function-type.node.js";
import { Resources } from "../../../resources.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";
import { ModifierParser } from "../declarations/modifier.parser.js";
import type { ParameterListParser } from "../declarations/parameter-list.parser.js";
import { BindingNameParser } from "../names/binding-name.parser.js";
import type { TypeParameterListParser } from "./type-parameter-list.parser.js";

export class FunctionTypeParser {
  private readonly bindingNameParser: BindingNameParser;
  private readonly modifierParser: ModifierParser;
  private readonly parameterListParser: ParameterListParser;
  private readonly typeParameterListParser: TypeParameterListParser;
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(
    typescriptParser: TypeScriptSyntaxParser,
    parameterListParser: ParameterListParser,
    typeParameterListParser: TypeParameterListParser) {
    this.typescriptParser = typescriptParser;
    this.bindingNameParser = new BindingNameParser(typescriptParser);
    this.modifierParser = new ModifierParser(typescriptParser);
    this.parameterListParser = parameterListParser;
    this.typeParameterListParser = typeParameterListParser;
  }

  public isStart(): boolean {
    const typescriptParser = this.typescriptParser;
    const node = typescriptParser.currentNode;
    if (node instanceof TypeScriptLessThanNode || node instanceof TypeScriptNewKeywordNode)
      return true;

    if (node instanceof TypeScriptAbstractKeywordNode)
      return typescriptParser.lookAhead(() => {
        typescriptParser.advance();
        return typescriptParser.currentNode instanceof TypeScriptNewKeywordNode;
      });

    if (!(node instanceof TypeScriptOpenParenthesisNode))
      return false;

    return typescriptParser.lookAhead(() => this.isUnambiguousAfterOpenParenthesis());
  }

  public parse(): TypeScriptConstructorTypeNode | TypeScriptFunctionTypeNode {
    const typescriptParser = this.typescriptParser;
    const startNode = typescriptParser.currentNode;
    const abstractKeywordNode = typescriptParser.tryConsume(TypeScriptAbstractKeywordNode);
    const newKeywordNode = typescriptParser.tryConsume(TypeScriptNewKeywordNode);
    const typeParameterListNode = this.typeParameterListParser.parse(TypeScriptTypeParameterAnnotations.Const);
    const parameterListNode = this.parameterListParser.parseSignatureParameters(typeParameterListNode);
    const arrowNode = typescriptParser.tryConsume(TypeScriptArrowNode);
    if (Object.isUndefined(arrowNode))
      typescriptParser.reportExpected(Resources.arrow);

    const returnTypeNode = this.typescriptParser.parseReturnType(Object.isUndefined(newKeywordNode));
    if (Object.isUndefined(newKeywordNode))
      returnTypeNode.validateTypeScriptPredicateParameter(typescriptParser.context, parameterListNode.children);

    const span = typescriptParser.typescriptLexer.reader.createSpan(startNode.span, returnTypeNode.span);
    const resultNode = Object.isUndefined(newKeywordNode)
      ? new TypeScriptFunctionTypeNode(
        span,
        returnTypeNode,
        parameterListNode,
        typeParameterListNode,
        arrowNode,
        startNode.leadingTrivia,
        returnTypeNode.trailingTrivia)
      : new TypeScriptConstructorTypeNode(
        newKeywordNode,
        span,
        returnTypeNode,
        parameterListNode,
        abstractKeywordNode,
        typeParameterListNode,
        arrowNode,
        startNode.leadingTrivia,
        returnTypeNode.trailingTrivia);
    parameterListNode.readTypeScriptHolder(typescriptParser.context, resultNode);
    return resultNode;
  }

  private isUnambiguousAfterOpenParenthesis(): boolean {
    const typescriptParser = this.typescriptParser;
    typescriptParser.advance();
    if (typescriptParser.currentNode instanceof TypeScriptCloseParenthesisNode
      || typescriptParser.currentNode instanceof TypeScriptDotDotDotNode)
      return true;

    this.modifierParser.parseParameterKeywords();

    if (typescriptParser.currentNode instanceof TypeScriptDotDotDotNode)
      typescriptParser.advance();

    if (typescriptParser.currentNode instanceof TypeScriptOpenBracketNode
      || typescriptParser.currentNode instanceof TypeScriptOpenBraceNode) {
      const diagnosticCount = typescriptParser.context.diagnosticCollector.diagnostics.length;
      this.bindingNameParser.parse();
      if (typescriptParser.context.diagnosticCollector.hasTypeScriptParseDiagnosticsSince(diagnosticCount))
        return false;
    }
    else if (typescriptParser.currentNode.isTypeScriptBindingIdentifier() || typescriptParser.currentNode instanceof TypeScriptThisKeywordNode)
      typescriptParser.consumeName();
    else
      return false;
    const followingNode: Node = typescriptParser.currentNode;
    if (followingNode.isTypeScriptFunctionTypeParameterIndicator())
      return true;

    if (!(followingNode instanceof TypeScriptCloseParenthesisNode))
      return false;

    typescriptParser.advance();
    const arrowNode: Node = typescriptParser.currentNode;
    return arrowNode instanceof TypeScriptArrowNode;
  }
}
