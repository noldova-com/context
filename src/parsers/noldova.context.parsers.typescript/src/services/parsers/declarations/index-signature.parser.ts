/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptIndexParameterListNode } from "../../../models/nodes/declarations/typescript-index-parameter-list.node.js";
import { TypeScriptIndexSignatureNode } from "../../../models/nodes/declarations/typescript-index-signature.node.js";
import { TypeScriptParameterNode } from "../../../models/nodes/declarations/typescript-parameter.node.js";
import { TypeScriptCloseBracketNode } from "../../../models/nodes/delimiters/typescript-close-bracket.node.js";
import { TypeScriptColonNode } from "../../../models/nodes/delimiters/typescript-colon.node.js";
import { TypeScriptCommaNode } from "../../../models/nodes/delimiters/typescript-comma.node.js";
import { TypeScriptDotDotDotNode } from "../../../models/nodes/delimiters/typescript-dot-dot-dot.node.js";
import type { TypeScriptOpenBracketNode } from "../../../models/nodes/delimiters/typescript-open-bracket.node.js";
import { TypeScriptSemicolonNode } from "../../../models/nodes/delimiters/typescript-semicolon.node.js";
import { Resources } from "../../../resources.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";
import type { ParameterListParser } from "./parameter-list.parser.js";

export class IndexSignatureParser {
  private readonly parameterListParser: ParameterListParser;
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser, parameterListParser: ParameterListParser) {
    this.typescriptParser = typescriptParser;
    this.parameterListParser = parameterListParser;
  }

  public get isStart(): boolean {
    const typescriptParser = this.typescriptParser;
    return typescriptParser.lookAhead(() => {
      typescriptParser.advance();
      const node = typescriptParser.currentNode;
      if (node instanceof TypeScriptDotDotDotNode || node instanceof TypeScriptCloseBracketNode)
        return true;

      if (node.isTypeScriptDeclarationModifier() || node.isTypeScriptTypeParameterModifier()) {
        typescriptParser.advance();
        if (typescriptParser.currentNode.isTypeScriptIdentifier(typescriptParser.context))
          return true;
      }
      else if (node.isTypeScriptIdentifier(typescriptParser.context))
        typescriptParser.advance();
      else
        return false;
      return typescriptParser.currentNode.isTypeScriptIndexSignatureParameterIndicator(typescriptParser);
    });
  }

  public parse(
    startNode: Node,
    modifierNodes: readonly Node[],
    openBracketNode: TypeScriptOpenBracketNode): TypeScriptIndexSignatureNode {
    const typescriptParser = this.typescriptParser;
    typescriptParser.advance();
    const parameterNodes: TypeScriptParameterNode[] = [];
    const commaNodes: TypeScriptCommaNode[] = [];
    let listEndNode = this.parameterListParser.parseParameters(openBracketNode, parameterNodes, commaNodes)!;

    const closeBracketNode = typescriptParser.tryConsume(TypeScriptCloseBracketNode);
    if (Object.isUndefined(closeBracketNode))
      typescriptParser.reportExpected(Resources.closeBracket);
    else
      listEndNode = closeBracketNode;

    const listSpan = typescriptParser.typescriptLexer.reader.createSpan(
      openBracketNode.span,
      listEndNode.span);
    const indexParameterListNode = new TypeScriptIndexParameterListNode(
      openBracketNode,
      parameterNodes,
      commaNodes,
      listSpan,
      closeBracketNode,
      openBracketNode.leadingTrivia,
      listEndNode.trailingTrivia);

    const colonNode = typescriptParser.tryConsume(TypeScriptColonNode);
    const typeNode = Object.isUndefined(colonNode) ? undefined : this.typescriptParser.parseType();
    const terminatorNode = typescriptParser.tryConsume(TypeScriptCommaNode)
      ?? typescriptParser.tryConsume(TypeScriptSemicolonNode);
    if (Object.isUndefined(terminatorNode) && !typescriptParser.canParseStatementTerminator())
      typescriptParser.reportExpected(Resources.semicolon);
    const endNode: Node = terminatorNode ?? typeNode ?? colonNode ?? indexParameterListNode;
    const span = typescriptParser.typescriptLexer.reader.createSpan(
      startNode.span,
      endNode.span);
    const resultNode = new TypeScriptIndexSignatureNode(
      modifierNodes,
      indexParameterListNode,
      span,
      colonNode,
      typeNode,
      terminatorNode,
      startNode.leadingTrivia,
      endNode.trailingTrivia);

    return resultNode;
  }
}
