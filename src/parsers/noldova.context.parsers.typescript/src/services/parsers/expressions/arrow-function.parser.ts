/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptArrowHeadKind } from "../../../enums/typescript-arrow-head-kind.js";
import { TypeScriptContextFlags } from "../../../enums/typescript-context-flags.js";
import { TypeScriptTypeParameterAnnotations } from "../../../enums/typescript-type-parameter-annotations.js";
import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import type { TypeScriptParameterListNode } from "../../../models/nodes/declarations/typescript-parameter-list.node.js";
import { TypeScriptParameterNode } from "../../../models/nodes/declarations/typescript-parameter.node.js";
import { TypeScriptCloseParenthesisNode } from "../../../models/nodes/delimiters/typescript-close-parenthesis.node.js";
import { TypeScriptColonNode } from "../../../models/nodes/delimiters/typescript-colon.node.js";
import { TypeScriptCommaNode } from "../../../models/nodes/delimiters/typescript-comma.node.js";
import { TypeScriptDotDotDotNode } from "../../../models/nodes/delimiters/typescript-dot-dot-dot.node.js";
import { TypeScriptOpenBraceNode } from "../../../models/nodes/delimiters/typescript-open-brace.node.js";
import { TypeScriptOpenBracketNode } from "../../../models/nodes/delimiters/typescript-open-bracket.node.js";
import { TypeScriptOpenParenthesisNode } from "../../../models/nodes/delimiters/typescript-open-parenthesis.node.js";
import { TypeScriptSemicolonNode } from "../../../models/nodes/delimiters/typescript-semicolon.node.js";
import { TypeScriptArrowFunctionNode } from "../../../models/nodes/expressions/typescript-arrow-function.node.js";
import { TypeScriptMissingIdentifierNode } from "../../../models/nodes/identifiers/typescript-missing-identifier.node.js";
import { TypeScriptAsKeywordNode } from "../../../models/nodes/keywords/typescript-as-keyword.node.js";
import { TypeScriptAsyncKeywordNode } from "../../../models/nodes/keywords/typescript-async-keyword.node.js";
import { TypeScriptConstKeywordNode } from "../../../models/nodes/keywords/typescript-const-keyword.node.js";
import { TypeScriptThisKeywordNode } from "../../../models/nodes/keywords/typescript-this-keyword.node.js";
import { TypeScriptArrowNode } from "../../../models/nodes/operators/typescript-arrow.node.js";
import { TypeScriptEqualsNode } from "../../../models/nodes/operators/typescript-equals.node.js";
import { TypeScriptLessThanNode } from "../../../models/nodes/operators/typescript-less-than.node.js";
import { TypeScriptQuestionNode } from "../../../models/nodes/operators/typescript-question.node.js";
import type { TypeScriptTypeParameterListNode } from "../../../models/nodes/types/typescript-type-parameter-list.node.js";
import { Resources } from "../../../resources.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";
import { ParameterListParser } from "../declarations/parameter-list.parser.js";
import { BlockParser } from "../statements/block.parser.js";
import { TypeParameterListParser } from "../types/type-parameter-list.parser.js";

export class ArrowFunctionParser {
  private readonly blockParser: BlockParser;
  private readonly parameterListParser: ParameterListParser;
  private readonly typeParameterListParser: TypeParameterListParser;
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
    this.blockParser = new BlockParser(typescriptParser);
    this.parameterListParser = new ParameterListParser(typescriptParser);
    this.typeParameterListParser = new TypeParameterListParser(typescriptParser);
  }

  public tryParse(): TypeScriptArrowFunctionNode | undefined {
    const typescriptParser = this.typescriptParser;
    const startOffset = typescriptParser.currentNode.span.startOffset;
    const flags = (typescriptParser.currentNode instanceof TypeScriptAsyncKeywordNode ? TypeScriptContextFlags.Await : TypeScriptContextFlags.None)
      | (typescriptParser.context.contextFlags & TypeScriptContextFlags.ConditionalTrueBranch);
    const rejectedOffsets = typescriptParser.context.getRejectedArrowOffsets(flags);
    const sharedRejectedOffsets = typescriptParser.context.getSharedRejectedArrowOffsets(flags);
    const context = typescriptParser.context;
    const previousBoundaryRead = context.hasReadListBoundary;
    context.hasReadListBoundary = false;
    try {
      if (sharedRejectedOffsets.has(startOffset))
        return undefined;
      if (rejectedOffsets.has(startOffset)) {
        context.hasReadListBoundary = true;
        return undefined;
      }
      if (context.getArrowHeadKinds().get(startOffset) !== TypeScriptArrowHeadKind.Parameters && !typescriptParser.lookAhead(() => this.shouldParseHead(flags)))
        return undefined;
      const node = typescriptParser.tryParse(() => this.parse());
      if (Object.isUndefined(node))
        (context.hasReadListBoundary ? rejectedOffsets : sharedRejectedOffsets).add(startOffset);
      return node;
    }
    finally {
      context.hasReadListBoundary ||= previousBoundaryRead;
    }
  }

  public parseWithParameters(parameterListNode: TypeScriptParameterListNode, parameterAwaitCount: number,
    asyncKeywordNode: TypeScriptAsyncKeywordNode | undefined, hasHeadDiagnostics: boolean): TypeScriptArrowFunctionNode | undefined {
    return this.parseArrow(asyncKeywordNode ?? parameterListNode, asyncKeywordNode, undefined, undefined, parameterListNode,
      parameterAwaitCount, false, hasHeadDiagnostics);
  }

  public parseWithParameter(nameNode: Node): TypeScriptArrowFunctionNode {
    return this.parseArrow(nameNode, undefined, undefined, this.createParameter(nameNode), undefined)!;
  }

  private parse(isAmbiguityAllowed: boolean = false): TypeScriptArrowFunctionNode | undefined {
    const typescriptParser = this.typescriptParser;
    const startNode = typescriptParser.currentNode;
    const diagnosticStart = typescriptParser.context.diagnosticCollector.diagnostics.length;
    let asyncKeywordNode: TypeScriptAsyncKeywordNode | undefined;
    let parameterNode: TypeScriptParameterNode | undefined;
    if (startNode instanceof TypeScriptAsyncKeywordNode) {
      typescriptParser.consumeName();
      if (typescriptParser.currentNode instanceof TypeScriptArrowNode)
        parameterNode = this.createParameter(startNode);
      else
        asyncKeywordNode = startNode;
    }

    const typeParameterListNode = this.typeParameterListParser.parse(TypeScriptTypeParameterAnnotations.Const);
    if (!Object.isUndefined(typeParameterListNode)
      && (Object.isUndefined(typeParameterListNode.greaterThanNode) || typeParameterListNode.children.length === 0))
      return undefined;

    const parameterAwaitCount = typescriptParser.context.records.writtenAwaits.length;
    let parameterListNode: TypeScriptParameterListNode | undefined;
    let hasHeadDiagnostics = false;
    if (Object.isUndefined(parameterNode)) {
      const node = typescriptParser.currentNode;
      if (node instanceof TypeScriptOpenParenthesisNode) {
        const flags = Object.isUndefined(asyncKeywordNode) ? TypeScriptContextFlags.None : TypeScriptContextFlags.Await;
        parameterListNode = this.parameterListParser.parseFunctionParameters(flags, !isAmbiguityAllowed, typescriptParser.context.isNewTargetScope);
        if (Object.isUndefined(parameterListNode))
          return undefined;
        this.parameterListParser.validate(parameterListNode, typeParameterListNode);
        hasHeadDiagnostics = typescriptParser.context.diagnosticCollector.diagnostics.length !== diagnosticStart;
        if (Object.isUndefined(parameterListNode.closeParenthesisNode) && !isAmbiguityAllowed)
          return undefined;
      }
      else if (Object.isUndefined(typeParameterListNode) && node.isTypeScriptBindingIdentifier()) {
        parameterNode = this.createParameter(node);
        typescriptParser.consumeName();
      }
      else if (isAmbiguityAllowed) {
        typescriptParser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1005, node.span, [Resources.openParenthesis]);
        hasHeadDiagnostics = true;
      }
      else
        return undefined;
    }

    return this.parseArrow(startNode, asyncKeywordNode, typeParameterListNode, parameterNode, parameterListNode,
      parameterAwaitCount, isAmbiguityAllowed, hasHeadDiagnostics);
  }

  private parseArrow(
    startNode: Node,
    asyncKeywordNode: TypeScriptAsyncKeywordNode | undefined,
    typeParameterListNode: TypeScriptTypeParameterListNode | undefined,
    parameterNode: TypeScriptParameterNode | undefined,
    parameterListNode: TypeScriptParameterListNode | undefined,
    parameterAwaitCount?: number,
    isAmbiguityAllowed: boolean = false,
    hasHeadDiagnostics: boolean = false): TypeScriptArrowFunctionNode | undefined {
    const context = this.typescriptParser.context;
    context.enterRecursion(this.typescriptParser.currentNode.span);
    const previousFlags = context.contextFlags;
    const previousFunctionScope = context.isFunctionScope;
    const previousClassStaticBlock = context.isClassStaticBlock;
    const writtenAwaitCount = parameterAwaitCount ?? context.records.writtenAwaits.length;
    try {
      const typescriptParser = this.typescriptParser;
      const colonNode = typescriptParser.tryConsume(TypeScriptColonNode);
      const returnTypeNode = Object.isUndefined(colonNode) ? undefined : this.typescriptParser.parseReturnType();
      if (!isAmbiguityAllowed && returnTypeNode?.hasTypeScriptArrowFunctionBlockingParseError() === true)
        return undefined;
      if (!Object.isUndefined(parameterListNode))
        returnTypeNode?.validateTypeScriptPredicateParameter(context, parameterListNode.children);

      if (!hasHeadDiagnostics && typescriptParser.currentNode instanceof TypeScriptArrowNode && typescriptParser.hasPrecedingLineBreak())
        context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1200, typescriptParser.currentNode.span);
      const arrowNode = typescriptParser.tryConsume(TypeScriptArrowNode);
      if (Object.isUndefined(arrowNode)) {
        if (!isAmbiguityAllowed && !(typescriptParser.currentNode instanceof TypeScriptOpenBraceNode))
          return undefined;
        typescriptParser.reportExpected(Resources.arrow);
      }

      if (asyncKeywordNode?.hasTypeScriptKeywordEscape())
        context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1260, asyncKeywordNode.span);

      const functionFlags = Object.isUndefined(asyncKeywordNode) ? TypeScriptContextFlags.None : TypeScriptContextFlags.Await;
      context.contextFlags = functionFlags
        | (previousFlags & (TypeScriptContextFlags.ConditionalTrueBranch | TypeScriptContextFlags.DisallowIn));
      context.isFunctionScope = true;
      context.isClassStaticBlock = false;
      const bodyStartNode = typescriptParser.currentNode;
      let bodyNode: Node;
      if (bodyStartNode instanceof TypeScriptOpenBraceNode)
        bodyNode = this.blockParser.parseFunctionBody(bodyStartNode, functionFlags, context.isNewTargetScope);
      else if (!Object.isUndefined(arrowNode) && !(bodyStartNode instanceof TypeScriptSemicolonNode)
        && bodyStartNode.canStartTypeScriptStatement(typescriptParser) && !bodyStartNode.canStartTypeScriptExpression(typescriptParser))
        bodyNode = this.blockParser.parseFunctionBody(undefined, functionFlags, context.isNewTargetScope);
      else if (!Object.isUndefined(arrowNode))
        bodyNode = typescriptParser.parseAssignmentExpression();
      else if (typescriptParser.currentNode.isTypeScriptBindingIdentifier())
        bodyNode = typescriptParser.consumeName();
      else
        bodyNode = new TypeScriptMissingIdentifierNode(typescriptParser.currentNode.getTypeScriptMissingNodeSpan());
      if (!isAmbiguityAllowed && !Object.isUndefined(colonNode) && (previousFlags & TypeScriptContextFlags.ConditionalTrueBranch) !== 0
        && !(typescriptParser.currentNode instanceof TypeScriptColonNode))
        return undefined;
      const span = typescriptParser.typescriptLexer.reader.createSpan(startNode.span, bodyNode.span);
      const resultNode = new TypeScriptArrowFunctionNode(
        span,
        arrowNode,
        bodyNode,
        Object.isUndefined(asyncKeywordNode) ? [] : [asyncKeywordNode],
        typeParameterListNode,
        parameterNode,
        parameterListNode,
        colonNode,
        returnTypeNode,
        startNode.leadingTrivia,
        bodyNode.trailingTrivia);

      parameterListNode?.readTypeScriptHolder(context, resultNode);
      typescriptParser.reportWrittenAwaits(writtenAwaitCount, bodyNode, resultNode, false, !Object.isUndefined(asyncKeywordNode));
      return resultNode;
    }
    finally {
      context.contextFlags = previousFlags;
      context.isFunctionScope = previousFunctionScope;
      context.isClassStaticBlock = previousClassStaticBlock;
      context.leaveRecursion();
    }
  }

  private createParameter(nameNode: Node): TypeScriptParameterNode {
    this.typescriptParser.readEvalOrArgumentsName(nameNode);
    return new TypeScriptParameterNode(
      [],
      nameNode.span,
      nameNode,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      nameNode.leadingTrivia,
      nameNode.trailingTrivia);
  }

  private shouldParseHead(flags: TypeScriptContextFlags): boolean {
    const typescriptParser = this.typescriptParser;
    if (typescriptParser.currentNode instanceof TypeScriptAsyncKeywordNode) {
      typescriptParser.advance();
      if (typescriptParser.hasPrecedingLineBreak())
        return false;
    }

    const headNode = typescriptParser.currentNode;
    const kind = this.recognizeHead();
    return kind === TypeScriptArrowHeadKind.Arrow
      || kind === TypeScriptArrowHeadKind.Ambiguous
        && (headNode instanceof TypeScriptLessThanNode || flags !== typescriptParser.context.contextFlags);
  }

  private recognizeHead(): TypeScriptArrowHeadKind {
    const typescriptParser = this.typescriptParser;
    const node = typescriptParser.currentNode;
    if (node.isTypeScriptBindingIdentifier()) {
      typescriptParser.advance();
      return typescriptParser.currentNode instanceof TypeScriptArrowNode ? TypeScriptArrowHeadKind.Arrow : TypeScriptArrowHeadKind.NotArrow;
    }

    if (node instanceof TypeScriptLessThanNode) {
      typescriptParser.advance();
      const parameterNode = typescriptParser.currentNode;
      return parameterNode.isTypeScriptIdentifier(typescriptParser.context) || parameterNode instanceof TypeScriptConstKeywordNode
        ? TypeScriptArrowHeadKind.Ambiguous : TypeScriptArrowHeadKind.NotArrow;
    }
    if (!(node instanceof TypeScriptOpenParenthesisNode))
      return TypeScriptArrowHeadKind.NotArrow;

    typescriptParser.advance();
    const parameterNode = typescriptParser.currentNode;
    if (parameterNode instanceof TypeScriptCloseParenthesisNode) {
      typescriptParser.advance();
      const followingNode = typescriptParser.currentNode;
      return followingNode instanceof TypeScriptArrowNode || followingNode instanceof TypeScriptColonNode || followingNode instanceof TypeScriptOpenBraceNode
        ? TypeScriptArrowHeadKind.Arrow : TypeScriptArrowHeadKind.NotArrow;
    }

    if (parameterNode instanceof TypeScriptOpenBracketNode || parameterNode instanceof TypeScriptOpenBraceNode)
      return TypeScriptArrowHeadKind.Ambiguous;
    if (parameterNode instanceof TypeScriptDotDotDotNode)
      return TypeScriptArrowHeadKind.Arrow;

    const isModifier = (parameterNode.isTypeScriptDeclarationModifier() || parameterNode.isTypeScriptClassMemberModifier())
      && !(parameterNode instanceof TypeScriptAsyncKeywordNode);
    if (isModifier && typescriptParser.lookAhead(() => {
      typescriptParser.advance();
      return typescriptParser.currentNode.isTypeScriptIdentifier(typescriptParser.context);
    })) {
      typescriptParser.advance();
      return typescriptParser.currentNode instanceof TypeScriptAsKeywordNode ? TypeScriptArrowHeadKind.NotArrow : TypeScriptArrowHeadKind.Arrow;
    }
    if (!parameterNode.isTypeScriptIdentifier(typescriptParser.context) && !(parameterNode instanceof TypeScriptThisKeywordNode))
      return TypeScriptArrowHeadKind.NotArrow;
    typescriptParser.advance();
    const followingNode = typescriptParser.currentNode;
    if (followingNode instanceof TypeScriptColonNode)
      return TypeScriptArrowHeadKind.Arrow;
    if (followingNode instanceof TypeScriptQuestionNode) {
      typescriptParser.advance();
      const afterQuestionNode = typescriptParser.currentNode;
      return afterQuestionNode instanceof TypeScriptColonNode || afterQuestionNode instanceof TypeScriptCommaNode
        || afterQuestionNode instanceof TypeScriptEqualsNode || afterQuestionNode instanceof TypeScriptCloseParenthesisNode
        ? TypeScriptArrowHeadKind.Arrow : TypeScriptArrowHeadKind.NotArrow;
    }
    return followingNode instanceof TypeScriptCommaNode || followingNode instanceof TypeScriptEqualsNode
      || followingNode instanceof TypeScriptCloseParenthesisNode
      ? TypeScriptArrowHeadKind.Ambiguous : TypeScriptArrowHeadKind.NotArrow;
  }

  public recognizeHeadKind(): TypeScriptArrowHeadKind {
    const typescriptParser = this.typescriptParser;
    const kinds = typescriptParser.context.getArrowHeadKinds();
    const startOffset = typescriptParser.currentNode.span.startOffset;
    const recognizedKind = kinds.get(startOffset);
    if (!Object.isUndefined(recognizedKind))
      return recognizedKind;

    let kind = TypeScriptArrowHeadKind.NotArrow;
    typescriptParser.lookAhead(() => {
      if (typescriptParser.currentNode instanceof TypeScriptAsyncKeywordNode) {
        typescriptParser.advance();
        if (typescriptParser.hasPrecedingLineBreak())
          return false;
        if (typescriptParser.currentNode instanceof TypeScriptArrowNode) {
          kind = TypeScriptArrowHeadKind.Arrow;
          return false;
        }
      }
      kind = this.recognizeHead();
      return false;
    });
    kinds.set(startOffset, kind);
    return kind;
  }

  public parseDefinite(): TypeScriptArrowFunctionNode | undefined {
    return this.parse(true);
  }
}
