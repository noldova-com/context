/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptContextFlags } from "../../../enums/typescript-context-flags.js";
import { TypeScriptCloseBracketNode } from "../../../models/nodes/delimiters/typescript-close-bracket.node.js";
import { TypeScriptCloseParenthesisNode } from "../../../models/nodes/delimiters/typescript-close-parenthesis.node.js";
import { TypeScriptDotNode } from "../../../models/nodes/delimiters/typescript-dot.node.js";
import { TypeScriptOpenBraceNode } from "../../../models/nodes/delimiters/typescript-open-brace.node.js";
import { TypeScriptOpenBracketNode } from "../../../models/nodes/delimiters/typescript-open-bracket.node.js";
import { TypeScriptOpenParenthesisNode } from "../../../models/nodes/delimiters/typescript-open-parenthesis.node.js";
import { TypeScriptPrefixUnaryExpressionNode } from "../../../models/nodes/expressions/typescript-prefix-unary-expression.node.js";
import { TypeScriptAssertsKeywordNode } from "../../../models/nodes/keywords/typescript-asserts-keyword.node.js";
import { TypeScriptImportKeywordNode } from "../../../models/nodes/keywords/typescript-import-keyword.node.js";
import { TypeScriptInferKeywordNode } from "../../../models/nodes/keywords/typescript-infer-keyword.node.js";
import { TypeScriptIsKeywordNode } from "../../../models/nodes/keywords/typescript-is-keyword.node.js";
import { TypeScriptThisKeywordNode } from "../../../models/nodes/keywords/typescript-this-keyword.node.js";
import { TypeScriptTypeOfKeywordNode } from "../../../models/nodes/keywords/typescript-type-of-keyword.node.js";
import { TypeScriptVoidKeywordNode } from "../../../models/nodes/keywords/typescript-void-keyword.node.js";
import { TypeScriptTemplateHeadNode } from "../../../models/nodes/literals/typescript-template-head.node.js";
import { TypeScriptAsteriskNode } from "../../../models/nodes/operators/typescript-asterisk.node.js";
import { TypeScriptExclamationNode } from "../../../models/nodes/operators/typescript-exclamation.node.js";
import { TypeScriptMinusNode } from "../../../models/nodes/operators/typescript-minus.node.js";
import { TypeScriptQuestionNode } from "../../../models/nodes/operators/typescript-question.node.js";
import { TypeScriptArrayTypeNode } from "../../../models/nodes/types/typescript-array-type.node.js";
import { TypeScriptIndexedAccessTypeNode } from "../../../models/nodes/types/typescript-indexed-access-type.node.js";
import { TypeScriptLiteralTypeNode } from "../../../models/nodes/types/typescript-literal-type.node.js";
import { TypeScriptParenthesizedTypeNode } from "../../../models/nodes/types/typescript-parenthesized-type.node.js";
import { TypeScriptThisTypeNode } from "../../../models/nodes/types/typescript-this-type.node.js";
import { TypeScriptTypeOperatorNode } from "../../../models/nodes/types/typescript-type-operator.node.js";
import { Resources } from "../../../resources.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";
import { ParameterListParser } from "../declarations/parameter-list.parser.js";
import { CompositeTypeParser } from "./composite-type.parser.js";
import { FunctionTypeParser } from "./function-type.parser.js";
import { InferTypeParser } from "./infer-type.parser.js";
import { TemplateLiteralTypeParser } from "./template-literal-type.parser.js";
import { TupleTypeParser } from "./tuple-type.parser.js";
import { TypeLiteralParser } from "./type-literal.parser.js";
import { TypeMemberParser } from "./type-member.parser.js";
import { TypeParameterListParser } from "./type-parameter-list.parser.js";
import { TypePredicateParser } from "./type-predicate.parser.js";
import { TypeReferenceParser } from "./type-reference.parser.js";

export class TypeParser {
  private readonly inferTypeParser: InferTypeParser;
  private readonly compositeTypeParser: CompositeTypeParser;
  private readonly templateLiteralTypeParser: TemplateLiteralTypeParser;
  private readonly tupleTypeParser: TupleTypeParser;
  private readonly typeLiteralParser: TypeLiteralParser;
  private readonly typeParameterListParser: TypeParameterListParser;
  private readonly typePredicateParser: TypePredicateParser;
  private readonly typeReferenceParser: TypeReferenceParser;

  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
    this.inferTypeParser = new InferTypeParser(typescriptParser);
    this.typeParameterListParser = new TypeParameterListParser(typescriptParser);
    this.typeReferenceParser = new TypeReferenceParser(typescriptParser);
    this.typePredicateParser = new TypePredicateParser(typescriptParser);
    const parameterListParser = new ParameterListParser(typescriptParser);
    const functionTypeParser = new FunctionTypeParser(typescriptParser, parameterListParser, this.typeParameterListParser);
    this.compositeTypeParser = new CompositeTypeParser(typescriptParser, functionTypeParser);
    this.tupleTypeParser = new TupleTypeParser(typescriptParser);
    this.templateLiteralTypeParser = new TemplateLiteralTypeParser(typescriptParser);
    const typeMemberParser = new TypeMemberParser(typescriptParser, parameterListParser, this.typeParameterListParser);
    this.typeLiteralParser = new TypeLiteralParser(typescriptParser, typeMemberParser, this.typeParameterListParser);
  }

  public parse(): Node {
    const context = this.typescriptParser.context;
    const previousFlags = context.contextFlags;
    context.contextFlags = previousFlags & TypeScriptContextFlags.DisallowIn;
    try {
      return this.compositeTypeParser.parse();
    }
    finally {
      context.contextFlags = previousFlags;
    }
  }

  public parseReturnType(allowsPredicate: boolean = true): Node {
    const node = this.typePredicateParser.tryParse() ?? this.parse();
    const predicates = this.typescriptParser.context.records.writtenTypePredicates;
    if (allowsPredicate && predicates[predicates.length - 1] === node)
      predicates.pop();

    return node;
  }

  public parseTypeWithoutConditional(): Node {
    const context = this.typescriptParser.context;
    const previousFlags = context.contextFlags;
    context.contextFlags = previousFlags & TypeScriptContextFlags.DisallowIn;
    try {
      return this.compositeTypeParser.parseWithoutConditional();
    }
    finally {
      context.contextFlags = previousFlags;
    }
  }

  public parseTypeOperand(): Node {
    const context = this.typescriptParser.context;
    context.enterRecursion(this.typescriptParser.currentNode.span);
    try {
      const operatorNode = this.typescriptParser.currentNode;
      if (operatorNode.isTypeScriptTypeOperator()) {
        this.typescriptParser.advance();
        const typeNode = this.parseTypeOperand();
        const span = this.typescriptParser.typescriptLexer.reader.createSpan(
          operatorNode.span,
          typeNode.span);
        const operatorTypeNode = new TypeScriptTypeOperatorNode(
          operatorNode,
          span,
          typeNode,
          operatorNode.leadingTrivia,
          typeNode.trailingTrivia);
        operatorTypeNode.validateTypeScriptGrammar(this.typescriptParser.context);
        return operatorTypeNode;
      }

      if (operatorNode instanceof TypeScriptInferKeywordNode)
        return this.inferTypeParser.parse(operatorNode);

      return this.parsePostfixType();
    }
    finally {
      context.leaveRecursion();
    }
  }

  private parsePostfixType(): Node {
    let typeNode = this.parsePrimaryType();
    while (!this.typescriptParser.hasPrecedingLineBreak()) {
      const node = this.typescriptParser.currentNode;
      if (node instanceof TypeScriptExclamationNode || node instanceof TypeScriptQuestionNode) {
        if (node instanceof TypeScriptQuestionNode && this.typescriptParser.lookAhead(() => {
          this.typescriptParser.advance();
          return this.typescriptParser.currentNode.canStartTypeScriptType(this.typescriptParser);
        }))
          break;
        this.typescriptParser.advance();
        typeNode = new TypeScriptTypeOperatorNode(node,
          this.typescriptParser.typescriptLexer.reader.createSpan(typeNode.span, node.span), typeNode, typeNode.leadingTrivia, node.trailingTrivia);
        continue;
      }
      if (!(node instanceof TypeScriptOpenBracketNode))
        break;
      const openBracketNode = node;
      this.typescriptParser.advance();
      if (!this.typescriptParser.currentNode.canStartTypeScriptType(this.typescriptParser)) {
        const closeBracketNode = this.typescriptParser.tryConsume(TypeScriptCloseBracketNode);
        if (Object.isUndefined(closeBracketNode))
          this.typescriptParser.reportExpected(Resources.closeBracket);
        const endNode = closeBracketNode ?? openBracketNode;
        const span = this.typescriptParser.typescriptLexer.reader.createSpan(
          typeNode.span,
          endNode.span);
        typeNode = new TypeScriptArrayTypeNode(
          typeNode,
          openBracketNode,
          closeBracketNode,
          span,
          typeNode.leadingTrivia,
          endNode.trailingTrivia);
        continue;
      }

      const indexTypeNode = this.parse();
      const closeBracketNode = this.typescriptParser.tryConsume(TypeScriptCloseBracketNode);
      if (Object.isUndefined(closeBracketNode))
        this.typescriptParser.reportExpected(Resources.closeBracket);

      const endNode = closeBracketNode ?? indexTypeNode;
      const span = this.typescriptParser.typescriptLexer.reader.createSpan(
        typeNode.span,
        endNode.span);
      typeNode = new TypeScriptIndexedAccessTypeNode(
        typeNode,
        openBracketNode,
        span,
        indexTypeNode,
        closeBracketNode,
        typeNode.leadingTrivia,
        endNode.trailingTrivia);
    }

    return typeNode;
  }

  private parsePrimaryType(): Node {
    return this.typescriptParser.currentNode.parseTypeScriptPrimaryType(this);
  }

  public parseReferenceType(): Node {
    return this.typeReferenceParser.parse();
  }

  public parsePredefinedType(node: Node): Node {
    if (!(node instanceof TypeScriptVoidKeywordNode) && this.isFollowedByDot())
      return this.typeReferenceParser.parse();
    this.typescriptParser.advance();
    return node;
  }

  public parseNullableType(node: TypeScriptQuestionNode): Node {
    this.typescriptParser.advance();
    const typeNode = this.parseTypeOperand();
    return new TypeScriptTypeOperatorNode(node, this.typescriptParser.typescriptLexer.reader.createSpan(node.span, typeNode.span),
      typeNode, node.leadingTrivia, typeNode.trailingTrivia);
  }

  public parseNonNullableType(): Node {
    const operators: TypeScriptExclamationNode[] = [];
    while (this.typescriptParser.currentNode instanceof TypeScriptExclamationNode) {
      operators.push(this.typescriptParser.currentNode);
      this.typescriptParser.advance();
    }
    let typeNode = this.parsePrimaryType();
    for (let index = operators.length - 1; index >= 0; index--) {
      const operator = operators[index]!;
      typeNode = new TypeScriptTypeOperatorNode(operator, this.typescriptParser.typescriptLexer.reader.createSpan(operator.span, typeNode.span),
        typeNode, operator.leadingTrivia, typeNode.trailingTrivia);
    }
    return typeNode;
  }

  public parseWildcardType(node: TypeScriptAsteriskNode): Node {
    this.typescriptParser.advance();
    return new TypeScriptTypeOperatorNode(node, node.span, undefined, node.leadingTrivia, node.trailingTrivia);
  }

  public parseWildcardTypeBeforeEquals(): Node {
    this.typescriptParser.reLexAsterisk();
    return this.parsePrimaryType();
  }

  public parseNestedNullableType(): Node {
    this.typescriptParser.reLexQuestion();
    return this.parsePrimaryType();
  }

  public parseAssertionOrReferenceType(node: TypeScriptAssertsKeywordNode): Node {
    return this.typePredicateParser.isAssertionStart() ? this.typePredicateParser.parseAssertion(node) : this.typeReferenceParser.parse();
  }

  public parseQueryOrImportType(node: TypeScriptTypeOfKeywordNode): Node {
    return this.typeReferenceParser.isTypeofImportStart
      ? this.typeReferenceParser.parseTypeofImport(node)
      : this.typeReferenceParser.parseQuery(node);
  }

  public parseImportType(node: TypeScriptImportKeywordNode): Node {
    return this.typeReferenceParser.parseImport(node);
  }

  public parseTypeLiteral(node: TypeScriptOpenBraceNode): Node {
    return this.typeLiteralParser.parse(node);
  }

  public parseTupleType(node: TypeScriptOpenBracketNode): Node {
    return this.tupleTypeParser.parse(node);
  }

  public parseTemplateLiteralType(node: TypeScriptTemplateHeadNode): Node {
    return this.templateLiteralTypeParser.parse(node);
  }

  public parseLiteralType(): TypeScriptLiteralTypeNode {
    const literalNode = this.typescriptParser.currentNode;
    this.typescriptParser.advance();
    return new TypeScriptLiteralTypeNode(
      literalNode,
      literalNode.span,
      literalNode.leadingTrivia,
      literalNode.trailingTrivia);
  }

  public parseNegativeLiteralType(minusNode: TypeScriptMinusNode): Node {
    const typescriptParser = this.typescriptParser;
    if (!minusNode.canStartTypeScriptType(typescriptParser))
      return this.parseReferenceType();

    typescriptParser.advance();
    const literalNode = typescriptParser.currentNode;
    typescriptParser.advance();
    const span = this.typescriptParser.typescriptLexer.reader.createSpan(
      minusNode.span,
      literalNode.span);
    const expressionNode = new TypeScriptPrefixUnaryExpressionNode(
      minusNode,
      span,
      literalNode,
      minusNode.leadingTrivia,
      literalNode.trailingTrivia);
    return new TypeScriptLiteralTypeNode(
      expressionNode,
      span,
      minusNode.leadingTrivia,
      literalNode.trailingTrivia);
  }

  public parseThisType(thisKeywordNode: TypeScriptThisKeywordNode): Node {
    this.typescriptParser.advance();
    const thisTypeNode = new TypeScriptThisTypeNode(
      thisKeywordNode,
      thisKeywordNode.span,
      thisKeywordNode.leadingTrivia,
      thisKeywordNode.trailingTrivia);
    const currentNode = this.typescriptParser.currentNode;
    if (this.typescriptParser.hasPrecedingLineBreak() || !(currentNode instanceof TypeScriptIsKeywordNode))
      return thisTypeNode;

    return this.typePredicateParser.parse(thisTypeNode, currentNode);
  }

  public parseParenthesizedType(openParenthesisNode: TypeScriptOpenParenthesisNode): TypeScriptParenthesizedTypeNode {
    this.typescriptParser.advance();
    const typeNode = this.parse();
    const closeParenthesisNode = this.typescriptParser.tryConsume(TypeScriptCloseParenthesisNode);
    if (Object.isUndefined(closeParenthesisNode))
      this.typescriptParser.reportExpected(Resources.closeParenthesis);

    const endNode = closeParenthesisNode ?? typeNode;
    const span = this.typescriptParser.typescriptLexer.reader.createSpan(
      openParenthesisNode.span,
      endNode.span);
    return new TypeScriptParenthesizedTypeNode(
      openParenthesisNode,
      span,
      typeNode,
      closeParenthesisNode,
      openParenthesisNode.leadingTrivia,
      endNode.trailingTrivia);
  }

  private isFollowedByDot(): boolean {
    return this.typescriptParser.lookAhead(() => {
      this.typescriptParser.advance();
      return this.typescriptParser.currentNode instanceof TypeScriptDotNode;
    });
  }
}
