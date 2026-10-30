/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptTypeParameterAnnotations } from "../../../enums/typescript-type-parameter-annotations.js";
import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptTypeAliasDeclarationNode } from "../../../models/nodes/declarations/typescript-type-alias-declaration.node.js";
import { TypeScriptDotNode } from "../../../models/nodes/delimiters/typescript-dot.node.js";
import { TypeScriptMissingIdentifierNode } from "../../../models/nodes/identifiers/typescript-missing-identifier.node.js";
import { TypeScriptIntrinsicKeywordNode } from "../../../models/nodes/keywords/typescript-intrinsic-keyword.node.js";
import type { TypeScriptTypeKeywordNode } from "../../../models/nodes/keywords/typescript-type-keyword.node.js";
import { TypeScriptEqualsNode } from "../../../models/nodes/operators/typescript-equals.node.js";
import { Resources } from "../../../resources.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";
import { IdentifierNameParser } from "../names/identifier-name.parser.js";
import { TypeParameterListParser } from "../types/type-parameter-list.parser.js";

export class TypeAliasDeclarationParser {
  private readonly nameParser: IdentifierNameParser;
  private readonly typeParameterListParser: TypeParameterListParser;
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
    this.nameParser = new IdentifierNameParser(typescriptParser);
    this.typeParameterListParser = new TypeParameterListParser(typescriptParser);
  }

  public parse(typeKeywordNode: TypeScriptTypeKeywordNode, modifierNodes: readonly Node[] = []): TypeScriptTypeAliasDeclarationNode {
    const typescriptParser = this.typescriptParser;
    const startNode = modifierNodes[0] ?? typeKeywordNode;
    typescriptParser.advance();
    if (typescriptParser.hasPrecedingLineBreak())
      typescriptParser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1142, typescriptParser.currentNode.span);
    const nameNode = this.nameParser.parseIdentifier()
      ?? new TypeScriptMissingIdentifierNode(typescriptParser.currentNode.getTypeScriptMissingNodeSpan());

    const typeParameterListNode = this.typeParameterListParser.parseAllowingEmptyList(TypeScriptTypeParameterAnnotations.Variance);
    const equalsNode = typescriptParser.tryConsume(TypeScriptEqualsNode);
    if (Object.isUndefined(equalsNode))
      typescriptParser.reportExpected(Resources.equals);

    const typeNode = this.parseType();
    const semicolonNode = typescriptParser.parseStatementTerminator();
    const endNode: Node = semicolonNode ?? typeNode;
    const span = typescriptParser.typescriptLexer.reader.createSpan(startNode.span, endNode.span);
    const resultNode = new TypeScriptTypeAliasDeclarationNode(
      typeKeywordNode,
      span,
      nameNode,
      typeNode,
      typeParameterListNode,
      equalsNode,
      semicolonNode,
      modifierNodes,
      startNode.leadingTrivia,
      endNode.trailingTrivia);

    resultNode.validateTypeScriptGrammar(typescriptParser.context);
    return resultNode;
  }

  private parseType(): Node {
    const parser = this.typescriptParser;
    const node = parser.currentNode;
    if (node instanceof TypeScriptIntrinsicKeywordNode && !this.isFollowedByDot()) {
      parser.advance();
      return node;
    }

    return parser.parseType();
  }

  private isFollowedByDot(): boolean {
    const parser = this.typescriptParser;
    return parser.lookAhead(() => {
      parser.advance();
      return parser.currentNode instanceof TypeScriptDotNode;
    });
  }
}
