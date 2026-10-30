/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptContextFlags } from "../../../enums/typescript-context-flags.js";
import { TypeScriptTypeParameterAnnotations } from "../../../enums/typescript-type-parameter-annotations.js";
import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptConstructorDeclarationNode } from "../../../models/nodes/declarations/typescript-constructor-declaration.node.js";
import { TypeScriptColonNode } from "../../../models/nodes/delimiters/typescript-colon.node.js";
import { TypeScriptOpenBraceNode } from "../../../models/nodes/delimiters/typescript-open-brace.node.js";
import { TypeScriptSemicolonNode } from "../../../models/nodes/delimiters/typescript-semicolon.node.js";
import type { TypeScriptConstructorKeywordNode } from "../../../models/nodes/keywords/typescript-constructor-keyword.node.js";
import type { TypeScriptStringLiteralNode } from "../../../models/nodes/literals/typescript-string-literal.node.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";
import type { BlockParser } from "../statements/block.parser.js";
import type { TypeParameterListParser } from "../types/type-parameter-list.parser.js";
import type { ParameterListParser } from "./parameter-list.parser.js";

export class ConstructorDeclarationParser {
  private readonly blockParser: BlockParser;
  private readonly parameterListParser: ParameterListParser;
  private readonly typeParameterListParser: TypeParameterListParser;
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(
    typescriptParser: TypeScriptSyntaxParser,
    parameterListParser: ParameterListParser,
    typeParameterListParser: TypeParameterListParser,
    blockParser: BlockParser) {
    this.typescriptParser = typescriptParser;
    this.parameterListParser = parameterListParser;
    this.typeParameterListParser = typeParameterListParser;
    this.blockParser = blockParser;
  }

  public parse(startNode: Node, modifierNodes: readonly Node[], nameNode: TypeScriptConstructorKeywordNode | TypeScriptStringLiteralNode): TypeScriptConstructorDeclarationNode {
    const parser = this.typescriptParser;
    parser.consumeName();
    const context = parser.context;
    const previousFlags = context.contextFlags;
    const previousNewTargetScope = context.isNewTargetScope;
    const previousFunctionScope = context.isFunctionScope;
    const previousClassStaticBlock = context.isClassStaticBlock;
    const previousJumpTargets = context.jumpTargets;
    const writtenAwaitCount = context.records.writtenAwaits.length;
    context.contextFlags = previousFlags & TypeScriptContextFlags.DisallowIn;
    context.isNewTargetScope = true;
    context.isFunctionScope = true;
    context.isClassStaticBlock = false;
    context.jumpTargets = [];
    try {
      const typeParameterListNode = this.typeParameterListParser.parse(TypeScriptTypeParameterAnnotations.Const);
      const parameterListNode = this.parameterListParser.parseConstructorParameters();
      this.parameterListParser.validate(parameterListNode, typeParameterListNode);
      const colonNode = parser.tryConsume(TypeScriptColonNode);
      const returnTypeNode = Object.isUndefined(colonNode) ? undefined : parser.parseReturnType(false);
      const openBraceNode = parser.currentNode;
      if (context.isAmbient && openBraceNode instanceof TypeScriptOpenBraceNode)
        context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1183, openBraceNode.span);
      const bodyNode = openBraceNode instanceof TypeScriptOpenBraceNode ? this.blockParser.parse(openBraceNode, context.isAmbient)
        : parser.canParseStatementTerminator() ? undefined
        : this.blockParser.reportMissing(TypeScriptDiagnosticTemplates.TS1144);
      const terminatorNode = Object.isUndefined(bodyNode) ? parser.tryConsume(TypeScriptSemicolonNode) : undefined;
      const endNode = terminatorNode ?? bodyNode ?? returnTypeNode ?? colonNode ?? parameterListNode;
      const span = parser.typescriptLexer.reader.createSpan(startNode.span, endNode.span);
      const resultNode = new TypeScriptConstructorDeclarationNode(modifierNodes, nameNode, span, parameterListNode, bodyNode, terminatorNode,
        typeParameterListNode, colonNode, returnTypeNode, startNode.leadingTrivia, endNode.trailingTrivia);

      if (!resultNode.hasTypeScriptBody())
        for (const parameterNode of parameterListNode.children)
          parameterNode.recordTypeScriptMisplacedParameterProperty(context);
      parameterListNode.readTypeScriptHolder(context, resultNode);
      resultNode.validateTypeScriptGrammar(context);
      parser.reportWrittenAwaits(writtenAwaitCount, bodyNode, resultNode, true);
      return resultNode;
    }
    finally {
      context.contextFlags = previousFlags;
      context.isNewTargetScope = previousNewTargetScope;
      context.isFunctionScope = previousFunctionScope;
      context.isClassStaticBlock = previousClassStaticBlock;
      context.jumpTargets = previousJumpTargets;
    }
  }
}
