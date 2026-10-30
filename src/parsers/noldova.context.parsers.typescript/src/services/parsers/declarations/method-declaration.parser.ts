/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { DiagnosticTemplate } from "@noldova/context.diagnostics";
import type { Node } from "@noldova/context.parsers";

import { TypeScriptContextFlags } from "../../../enums/typescript-context-flags.js";
import { TypeScriptTypeParameterAnnotations } from "../../../enums/typescript-type-parameter-annotations.js";
import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptMethodDeclarationNode } from "../../../models/nodes/declarations/typescript-method-declaration.node.js";
import { TypeScriptColonNode } from "../../../models/nodes/delimiters/typescript-colon.node.js";
import { TypeScriptOpenBraceNode } from "../../../models/nodes/delimiters/typescript-open-brace.node.js";
import { TypeScriptSemicolonNode } from "../../../models/nodes/delimiters/typescript-semicolon.node.js";
import { TypeScriptAbstractKeywordNode } from "../../../models/nodes/keywords/typescript-abstract-keyword.node.js";
import { TypeScriptAsyncKeywordNode } from "../../../models/nodes/keywords/typescript-async-keyword.node.js";
import { TypeScriptDeclareKeywordNode } from "../../../models/nodes/keywords/typescript-declare-keyword.node.js";
import type { TypeScriptAsteriskNode } from "../../../models/nodes/operators/typescript-asterisk.node.js";
import type { TypeScriptExclamationNode } from "../../../models/nodes/operators/typescript-exclamation.node.js";
import type { TypeScriptQuestionNode } from "../../../models/nodes/operators/typescript-question.node.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";
import type { BlockParser } from "../statements/block.parser.js";
import type { TypeParameterListParser } from "../types/type-parameter-list.parser.js";
import type { ParameterListParser } from "./parameter-list.parser.js";

export class MethodDeclarationParser {
  private readonly blockParser: BlockParser;
  private readonly parameterListParser: ParameterListParser;
  private readonly typeParameterListParser: TypeParameterListParser;
  private readonly typescriptParser: TypeScriptSyntaxParser;
  private readonly holdsClassMembers: boolean;

  public constructor(
    typescriptParser: TypeScriptSyntaxParser,
    parameterListParser: ParameterListParser,
    typeParameterListParser: TypeParameterListParser,
    blockParser: BlockParser,
    holdsClassMembers: boolean = false) {
    this.typescriptParser = typescriptParser;
    this.holdsClassMembers = holdsClassMembers;
    this.parameterListParser = parameterListParser;
    this.typeParameterListParser = typeParameterListParser;
    this.blockParser = blockParser;
  }

  public parse(
    startNode: Node,
    modifierNodes: readonly Node[],
    nameNode: Node,
    asteriskNode?: TypeScriptAsteriskNode,
    questionNode?: TypeScriptQuestionNode,
    exclamationNode?: TypeScriptExclamationNode,
    missingBodyDiagnostic: DiagnosticTemplate = TypeScriptDiagnosticTemplates.TS1144): TypeScriptMethodDeclarationNode {
    const typescriptParser = this.typescriptParser;
    const flags = (modifierNodes.some(t => t instanceof TypeScriptAsyncKeywordNode) ? TypeScriptContextFlags.Await : TypeScriptContextFlags.None)
      | (Object.isUndefined(asteriskNode) ? TypeScriptContextFlags.None : TypeScriptContextFlags.Yield);
    const writtenAwaitCount = typescriptParser.context.records.writtenAwaits.length;
    const signatureDiagnosticCount = typescriptParser.context.diagnosticCollector.diagnostics.length;
    const typeParameterListNode = this.typeParameterListParser.parse(TypeScriptTypeParameterAnnotations.Const);
    const parameterListNode = this.parameterListParser.parseFunctionParameters(flags);
    this.parameterListParser.validate(parameterListNode, typeParameterListNode);
    const hasSignatureDiagnostics = typescriptParser.context.diagnosticCollector.diagnostics.length !== signatureDiagnosticCount;
    const colonNode = typescriptParser.tryConsume(TypeScriptColonNode);
    const returnTypeNode = Object.isUndefined(colonNode) ? undefined : this.typescriptParser.parseReturnType();
    returnTypeNode?.validateTypeScriptPredicateParameter(typescriptParser.context, parameterListNode.children);

    const openBraceNode = typescriptParser.currentNode;
    if (!typescriptParser.context.isAmbient && openBraceNode instanceof TypeScriptOpenBraceNode
      && modifierNodes.some(t => t instanceof TypeScriptDeclareKeywordNode))
      typescriptParser.context.diagnosticCollector.addTypeScriptGrammarDiagnostic(typescriptParser.context.source, TypeScriptDiagnosticTemplates.TS1183, openBraceNode.span);
    const bodyNode = openBraceNode instanceof TypeScriptOpenBraceNode ? this.blockParser.parseFunctionBody(openBraceNode, flags)
      : typescriptParser.canParseStatementTerminator() ? undefined
      : this.blockParser.reportMissing(missingBodyDiagnostic);
    if (!Object.isUndefined(asteriskNode) && !hasSignatureDiagnostics)
      if (typescriptParser.context.isAmbient)
        typescriptParser.context.diagnosticCollector.addTypeScriptGrammarDiagnostic(typescriptParser.context.source, TypeScriptDiagnosticTemplates.TS1221, asteriskNode.span);
      else if (Object.isUndefined(bodyNode))
        typescriptParser.context.diagnosticCollector.addTypeScriptGrammarDiagnostic(typescriptParser.context.source, TypeScriptDiagnosticTemplates.TS1222, asteriskNode.span);
    if (this.holdsClassMembers) {
      if (!hasSignatureDiagnostics)
        nameNode.reportTypeScriptCommaComputedName(typescriptParser.context);
      if (!Object.isUndefined(bodyNode) && modifierNodes.some(t => t instanceof TypeScriptAbstractKeywordNode))
        typescriptParser.context.diagnosticCollector.addTypeScriptGrammarDiagnostic(typescriptParser.context.source, TypeScriptDiagnosticTemplates.TS1245,
          nameNode.span, [typescriptParser.context.source.getText(nameNode.span)]);
    }

    const terminatorNode = Object.isUndefined(bodyNode)
      ? typescriptParser.tryConsume(TypeScriptSemicolonNode)
      : undefined;

    const endNode: Node = terminatorNode ?? bodyNode ?? returnTypeNode ?? colonNode ?? parameterListNode;
    const span = typescriptParser.typescriptLexer.reader.createSpan(
      startNode.span,
      endNode.span);
    const resultNode = new TypeScriptMethodDeclarationNode(
      modifierNodes,
      span,
      nameNode,
      parameterListNode,
      asteriskNode,
      questionNode,
      typeParameterListNode,
      colonNode,
      returnTypeNode,
      bodyNode,
      terminatorNode,
      exclamationNode,
      startNode.leadingTrivia,
      endNode.trailingTrivia);

    parameterListNode.readTypeScriptHolder(typescriptParser.context, resultNode);
    typescriptParser.reportWrittenAwaits(writtenAwaitCount, bodyNode, resultNode, false,
      modifierNodes.some(t => t instanceof TypeScriptAsyncKeywordNode));
    return resultNode;
  }
}
