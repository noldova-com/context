/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptContextFlags } from "../../enums/typescript-context-flags.js";
import { TypeScriptTypeParameterAnnotations } from "../../enums/typescript-type-parameter-annotations.js";
import { TypeScriptDiagnosticTemplates } from "../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptFunctionDeclarationNode } from "../../models/nodes/declarations/typescript-function-declaration.node.js";
import { TypeScriptColonNode } from "../../models/nodes/delimiters/typescript-colon.node.js";
import { TypeScriptOpenBraceNode } from "../../models/nodes/delimiters/typescript-open-brace.node.js";
import { TypeScriptFunctionExpressionNode } from "../../models/nodes/expressions/typescript-function-expression.node.js";
import { TypeScriptMissingIdentifierNode } from "../../models/nodes/identifiers/typescript-missing-identifier.node.js";
import { TypeScriptAsyncKeywordNode } from "../../models/nodes/keywords/typescript-async-keyword.node.js";
import { TypeScriptDefaultKeywordNode } from "../../models/nodes/keywords/typescript-default-keyword.node.js";
import { TypeScriptFunctionKeywordNode } from "../../models/nodes/keywords/typescript-function-keyword.node.js";
import { TypeScriptAsteriskNode } from "../../models/nodes/operators/typescript-asterisk.node.js";
import type { TypeScriptFunctionNode } from "../../models/nodes/typescript-function.node.js";
import type { TypeScriptSyntaxParser } from "../typescript-syntax.parser.js";
import { ParameterListParser } from "./declarations/parameter-list.parser.js";
import { IdentifierNameParser } from "./names/identifier-name.parser.js";
import { BlockParser } from "./statements/block.parser.js";
import { TypeParameterListParser } from "./types/type-parameter-list.parser.js";

export class FunctionParser {
  private readonly blockParser: BlockParser;
  private readonly parameterListParser: ParameterListParser;
  private readonly typeParameterListParser: TypeParameterListParser;
  private readonly nameParser: IdentifierNameParser;
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
    this.nameParser = new IdentifierNameParser(typescriptParser);
    this.blockParser = new BlockParser(typescriptParser);
    this.parameterListParser = new ParameterListParser(typescriptParser);
    this.typeParameterListParser = new TypeParameterListParser(typescriptParser);
  }

  public parseDeclaration(modifierNodes: readonly Node[] = []): TypeScriptFunctionDeclarationNode {
    return this.parse(true, modifierNodes);
  }

  public parseExpression(): TypeScriptFunctionExpressionNode {
    const asyncKeywordNode = this.typescriptParser.tryConsume(TypeScriptAsyncKeywordNode);
    return this.parse(false, Object.isUndefined(asyncKeywordNode) ? [] : [asyncKeywordNode]);
  }

  private parse(isDeclaration: true, modifierNodes: readonly Node[]): TypeScriptFunctionDeclarationNode;
  private parse(isDeclaration: false, modifierNodes: readonly Node[]): TypeScriptFunctionExpressionNode;
  private parse(isDeclaration: boolean, modifierNodes: readonly Node[]): TypeScriptFunctionNode {
    const parser = this.typescriptParser;
    const startNode = modifierNodes[0] ?? parser.currentNode;
    const functionKeywordNode = parser.requireCurrentNode(TypeScriptFunctionKeywordNode);
    parser.advance();

    const asteriskNode = parser.tryConsume(TypeScriptAsteriskNode);
    const flags = (modifierNodes.some(t => t instanceof TypeScriptAsyncKeywordNode) ? TypeScriptContextFlags.Await : TypeScriptContextFlags.None)
      | (Object.isUndefined(asteriskNode) ? TypeScriptContextFlags.None : TypeScriptContextFlags.Yield);
    const writtenAwaitCount = parser.context.records.writtenAwaits.length;
    const previousFlags = parser.context.contextFlags;
    const previousFunctionScope = parser.context.isFunctionScope;
    if (!isDeclaration) {
      parser.context.contextFlags = previousFlags | flags;
      parser.context.isFunctionScope = true;
    }
    const nameNode = this.parseName(isDeclaration && !modifierNodes.some(t => t instanceof TypeScriptDefaultKeywordNode));
    parser.context.contextFlags = previousFlags;
    parser.context.isFunctionScope = previousFunctionScope;
    const signatureDiagnosticCount = parser.context.diagnosticCollector.diagnostics.length;
    const typeParameterListNode = this.typeParameterListParser.parse(TypeScriptTypeParameterAnnotations.Const);
    const parameterListNode = this.parameterListParser.parseFunctionParameters(flags, false, true);
    this.parameterListParser.validate(parameterListNode, typeParameterListNode);
    const hasSignatureDiagnostics = parser.context.diagnosticCollector.diagnostics.length !== signatureDiagnosticCount;
    const colonNode = parser.tryConsume(TypeScriptColonNode);
    const returnTypeNode = Object.isUndefined(colonNode) ? undefined : parser.parseReturnType();
    returnTypeNode?.validateTypeScriptPredicateParameter(parser.context, parameterListNode.children);
    const openBraceNode = parser.currentNode;
    const hasTerminator = !(openBraceNode instanceof TypeScriptOpenBraceNode) && isDeclaration && parser.canParseStatementTerminator();
    const bodyNode = openBraceNode instanceof TypeScriptOpenBraceNode ? this.blockParser.parseFunctionBody(openBraceNode, flags, true)
      : hasTerminator ? undefined
      : this.blockParser.reportMissing(isDeclaration ? TypeScriptDiagnosticTemplates.TS1144 : TypeScriptDiagnosticTemplates.TS1005);
    if (!Object.isUndefined(asteriskNode) && (isDeclaration || !hasSignatureDiagnostics))
      if (parser.context.isAmbient)
        parser.context.diagnosticCollector.addTypeScriptGrammarDiagnostic(parser.context.source, TypeScriptDiagnosticTemplates.TS1221, asteriskNode.span);
      else if (Object.isUndefined(bodyNode))
        parser.context.diagnosticCollector.addTypeScriptGrammarDiagnostic(parser.context.source, TypeScriptDiagnosticTemplates.TS1222, asteriskNode.span);
    const semicolonNode = hasTerminator ? parser.parseStatementTerminator() : undefined;

    const endNode = bodyNode ?? semicolonNode ?? returnTypeNode ?? colonNode ?? parameterListNode;
    const span = parser.typescriptLexer.reader.createSpan(startNode.span, endNode.span);

    const resultNode = isDeclaration
      ? new TypeScriptFunctionDeclarationNode(
        functionKeywordNode, span, parameterListNode, modifierNodes, asteriskNode, nameNode, typeParameterListNode,
        colonNode, returnTypeNode, bodyNode, semicolonNode, startNode.leadingTrivia, endNode.trailingTrivia)
      : new TypeScriptFunctionExpressionNode(
        functionKeywordNode, span, parameterListNode, modifierNodes, asteriskNode, nameNode, typeParameterListNode,
        colonNode, returnTypeNode, bodyNode, startNode.leadingTrivia, endNode.trailingTrivia);

    parameterListNode.readTypeScriptHolder(parser.context, resultNode);
    parser.reportWrittenAwaits(writtenAwaitCount, bodyNode, resultNode, false,
      modifierNodes.some(t => t instanceof TypeScriptAsyncKeywordNode));
    return resultNode;
  }

  private parseName(isRequired: boolean): Node | undefined {
    const parser = this.typescriptParser;
    const nameNode = parser.currentNode.isTypeScriptBindingIdentifier() ? parser.consumeBindingName()
      : isRequired ? this.nameParser.parseBindingIdentifier() ?? new TypeScriptMissingIdentifierNode(parser.currentNode.getTypeScriptMissingNodeSpan())
        : undefined;
    if (!Object.isUndefined(nameNode) && !parser.context.isAmbient)
      parser.readEvalOrArgumentsName(nameNode);
    return nameNode;
  }
}
