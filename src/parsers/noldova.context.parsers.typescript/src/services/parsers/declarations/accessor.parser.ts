/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptTypeParameterAnnotations } from "../../../enums/typescript-type-parameter-annotations.js";
import type { TypeScriptAccessorNode } from "../../../models/nodes/declarations/typescript-accessor.node.js";
import { TypeScriptColonNode } from "../../../models/nodes/delimiters/typescript-colon.node.js";
import { TypeScriptCommaNode } from "../../../models/nodes/delimiters/typescript-comma.node.js";
import { TypeScriptOpenBraceNode } from "../../../models/nodes/delimiters/typescript-open-brace.node.js";
import { TypeScriptSemicolonNode } from "../../../models/nodes/delimiters/typescript-semicolon.node.js";
import type { TypeScriptAccessorKindKeywordNode } from "../../../models/nodes/keywords/typescript-accessor-kind-keyword.node.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";
import type { PropertyNameParser } from "../names/property-name.parser.js";
import type { BlockParser } from "../statements/block.parser.js";
import type { TypeParameterListParser } from "../types/type-parameter-list.parser.js";
import type { ParameterListParser } from "./parameter-list.parser.js";

export class AccessorParser {
  private readonly blockParser: BlockParser;
  private readonly parameterListParser: ParameterListParser;
  private readonly propertyNameParser: PropertyNameParser;
  private readonly typeParameterListParser: TypeParameterListParser;
  private readonly typescriptParser: TypeScriptSyntaxParser;
  private readonly holdsClassMembers: boolean;

  public constructor(
    typescriptParser: TypeScriptSyntaxParser,
    propertyNameParser: PropertyNameParser,
    parameterListParser: ParameterListParser,
    typeParameterListParser: TypeParameterListParser,
    blockParser: BlockParser,
    holdsClassMembers: boolean = false) {
    this.typescriptParser = typescriptParser;
    this.holdsClassMembers = holdsClassMembers;
    this.propertyNameParser = propertyNameParser;
    this.parameterListParser = parameterListParser;
    this.typeParameterListParser = typeParameterListParser;
    this.blockParser = blockParser;
  }

  public parse(
    startNode: Node,
    modifierNodes: readonly Node[],
    keywordNode: TypeScriptAccessorKindKeywordNode): TypeScriptAccessorNode {
    const typescriptParser = this.typescriptParser;
    const signatureDiagnosticCount = typescriptParser.context.diagnosticCollector.diagnostics.length;
    typescriptParser.advance();
    const writtenAwaitCount = typescriptParser.context.records.writtenAwaits.length;
    const nameNode = this.propertyNameParser.parse();
    const typeParameterListNode = this.typeParameterListParser.parse(TypeScriptTypeParameterAnnotations.Const);
    const parameterListNode = this.parameterListParser.parseFunctionParameters();
    this.parameterListParser.validate(parameterListNode, typeParameterListNode);
    const hasSignatureDiagnostics = typescriptParser.context.diagnosticCollector.diagnostics.length !== signatureDiagnosticCount;
    const colonNode = typescriptParser.tryConsume(TypeScriptColonNode);
    const returnTypeNode = Object.isUndefined(colonNode) ? undefined : this.typescriptParser.parseReturnType(false);

    const openBraceNode = typescriptParser.currentNode;
    const bodyNode = openBraceNode instanceof TypeScriptOpenBraceNode ? this.blockParser.parseFunctionBody(openBraceNode)
      : typescriptParser.context.isTypeMemberContext || typescriptParser.canParseStatementTerminator() ? undefined
      : this.blockParser.reportMissing();

    const terminatorNode = Object.isUndefined(bodyNode)
      ? typescriptParser.tryConsume(TypeScriptSemicolonNode)
        ?? (typescriptParser.context.isTypeMemberContext ? typescriptParser.tryConsume(TypeScriptCommaNode) : undefined)
      : undefined;

    const endNode: Node = terminatorNode ?? bodyNode ?? returnTypeNode ?? colonNode ?? parameterListNode;
    const span = typescriptParser.typescriptLexer.reader.createSpan(
      startNode.span,
      endNode.span);
    const resultNode = keywordNode.createTypeScriptAccessor(
      modifierNodes,
      span,
      nameNode,
      parameterListNode,
      typeParameterListNode,
      colonNode,
      returnTypeNode,
      bodyNode,
      terminatorNode,
      startNode.leadingTrivia,
      endNode.trailingTrivia);

    parameterListNode.readTypeScriptHolder(typescriptParser.context, resultNode);
    if (!hasSignatureDiagnostics) {
      const accessorDiagnosticCount = typescriptParser.context.diagnosticCollector.diagnostics.length;
      resultNode.validateTypeScriptGrammar(typescriptParser.context);
      if (this.holdsClassMembers && typescriptParser.context.diagnosticCollector.diagnostics.length === accessorDiagnosticCount)
        resultNode.reportTypeScriptCommaComputedName(typescriptParser.context);
    }
    typescriptParser.reportWrittenAwaits(writtenAwaitCount, bodyNode, resultNode);
    return resultNode;
  }
}
