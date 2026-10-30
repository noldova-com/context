/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import type { TypeScriptImportAttributesNode } from "../../../models/nodes/declarations/typescript-import-attributes.node.js";
import { TypeScriptCloseBraceNode } from "../../../models/nodes/delimiters/typescript-close-brace.node.js";
import { TypeScriptCloseParenthesisNode } from "../../../models/nodes/delimiters/typescript-close-parenthesis.node.js";
import { TypeScriptCommaNode } from "../../../models/nodes/delimiters/typescript-comma.node.js";
import { TypeScriptDotNode } from "../../../models/nodes/delimiters/typescript-dot.node.js";
import { TypeScriptOpenBraceNode } from "../../../models/nodes/delimiters/typescript-open-brace.node.js";
import { TypeScriptOpenParenthesisNode } from "../../../models/nodes/delimiters/typescript-open-parenthesis.node.js";
import { TypeScriptMissingIdentifierNode } from "../../../models/nodes/identifiers/typescript-missing-identifier.node.js";
import { TypeScriptImportKeywordNode } from "../../../models/nodes/keywords/typescript-import-keyword.node.js";
import type { TypeScriptTypeOfKeywordNode } from "../../../models/nodes/keywords/typescript-type-of-keyword.node.js";
import { TypeScriptImportTypeNode } from "../../../models/nodes/types/typescript-import-type.node.js";
import { TypeScriptMissingTypeNode } from "../../../models/nodes/types/typescript-missing-type.node.js";
import { TypeScriptTypeQueryNode } from "../../../models/nodes/types/typescript-type-query.node.js";
import { TypeScriptTypeReferenceNode } from "../../../models/nodes/types/typescript-type-reference.node.js";
import { Resources } from "../../../resources.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";
import { ImportAttributesParser } from "../declarations/import-attributes.parser.js";
import { EntityNameParser } from "../names/entity-name.parser.js";

export class TypeReferenceParser {
  private readonly attributesParser: ImportAttributesParser;
  private readonly entityNameParser: EntityNameParser;
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
    this.attributesParser = new ImportAttributesParser(typescriptParser);
    this.entityNameParser = new EntityNameParser(typescriptParser);
  }

  public get isTypeofImportStart(): boolean {
    const typescriptParser = this.typescriptParser;
    return typescriptParser.lookAhead(() => {
      typescriptParser.advance();
      return typescriptParser.currentNode instanceof TypeScriptImportKeywordNode;
    });
  }

  public parseTypeofImport(typeOfKeywordNode: TypeScriptTypeOfKeywordNode): TypeScriptImportTypeNode {
    const typescriptParser = this.typescriptParser;
    typescriptParser.advance();
    const importKeywordNode = typescriptParser.requireCurrentNode(TypeScriptImportKeywordNode);
    return this.parseImport(importKeywordNode, typeOfKeywordNode);
  }

  public parse(): Node {
    const typescriptParser = this.typescriptParser;
    const nameNode = this.entityNameParser.parse();
    if (nameNode instanceof TypeScriptMissingIdentifierNode)
      return new TypeScriptMissingTypeNode(nameNode.span);

    const typeArgumentListNode = typescriptParser.hasPrecedingLineBreak() ? undefined : typescriptParser.parseTypeReferenceArgumentList();
    const endNode = typeArgumentListNode ?? nameNode;
    const span = typescriptParser.typescriptLexer.reader.createSpan(nameNode.span, endNode.span);
    return new TypeScriptTypeReferenceNode(
      nameNode,
      span,
      typeArgumentListNode,
      nameNode.leadingTrivia,
      endNode.trailingTrivia);
  }

  public parseImport(
    importKeywordNode: TypeScriptImportKeywordNode,
    typeOfKeywordNode?: TypeScriptTypeOfKeywordNode): TypeScriptImportTypeNode {
    const typescriptParser = this.typescriptParser;
    const startNode = typeOfKeywordNode ?? importKeywordNode;
    typescriptParser.advance();
    const openParenthesisNode = typescriptParser.tryConsume(TypeScriptOpenParenthesisNode);
    if (Object.isUndefined(openParenthesisNode))
      this.typescriptParser.reportExpected(Resources.openParenthesis);

    const argumentNode = this.typescriptParser.parseType();
    let endNode: Node = argumentNode;

    const commaNode = typescriptParser.tryConsume(TypeScriptCommaNode);
    if (!Object.isUndefined(commaNode))
      endNode = commaNode;

    let attributesOpenBraceNode: TypeScriptOpenBraceNode | undefined;
    let attributesNode: TypeScriptImportAttributesNode | undefined;
    let attributesCommaNode: TypeScriptCommaNode | undefined;
    let attributesCloseBraceNode: TypeScriptCloseBraceNode | undefined;
    if (!Object.isUndefined(commaNode)) {
      attributesOpenBraceNode = typescriptParser.tryConsume(TypeScriptOpenBraceNode);
      if (Object.isUndefined(attributesOpenBraceNode))
        this.typescriptParser.reportExpected(Resources.openBrace);
      const attributesStartNode = typescriptParser.currentNode;
      attributesNode = this.attributesParser.parseTypeAttributes();
      attributesCommaNode = typescriptParser.tryConsume(TypeScriptCommaNode);
      attributesCloseBraceNode = typescriptParser.tryConsume(TypeScriptCloseBraceNode);
      if (Object.isUndefined(attributesCloseBraceNode)) {
        this.typescriptParser.reportExpected(Resources.closeBrace);
        typescriptParser.context.diagnosticCollector.relateTypeScriptOpeningDelimiter(typescriptParser.context.source,
          (attributesOpenBraceNode ?? attributesStartNode).span, Resources.openBrace, Resources.closeBrace);
      }
      endNode = attributesCloseBraceNode ?? attributesCommaNode ?? attributesNode;
    }

    const closeParenthesisNode = typescriptParser.tryConsume(TypeScriptCloseParenthesisNode);
    if (Object.isUndefined(closeParenthesisNode))
      this.typescriptParser.reportExpected(Resources.closeParenthesis);
    else
      endNode = closeParenthesisNode;

    const dotNode = typescriptParser.tryConsume(TypeScriptDotNode);
    if (!Object.isUndefined(dotNode))
      endNode = dotNode;

    const qualifierNode = Object.isUndefined(dotNode) ? undefined : this.entityNameParser.parse();
    if (!Object.isUndefined(qualifierNode))
      endNode = qualifierNode;

    const typeArgumentListNode = typescriptParser.hasPrecedingLineBreak() ? undefined : typescriptParser.parseTypeReferenceArgumentList();
    if (!Object.isUndefined(typeArgumentListNode)) {
      typescriptParser.context.records.uncheckedSpans.push(typeArgumentListNode.span);
      endNode = typeArgumentListNode;
    }

    const span = typescriptParser.typescriptLexer.reader.createSpan(startNode.span, endNode.span);
    const resultNode = new TypeScriptImportTypeNode(
      importKeywordNode,
      span,
      argumentNode,
      typeOfKeywordNode,
      openParenthesisNode,
      commaNode,
      attributesOpenBraceNode,
      attributesNode,
      attributesCommaNode,
      attributesCloseBraceNode,
      closeParenthesisNode,
      dotNode,
      qualifierNode,
      typeArgumentListNode,
      startNode.leadingTrivia,
      endNode.trailingTrivia);

    resultNode.validateTypeScriptGrammar(typescriptParser.context);
    return resultNode;
  }

  public parseQuery(typeOfKeywordNode: TypeScriptTypeOfKeywordNode): TypeScriptTypeQueryNode {
    const typescriptParser = this.typescriptParser;
    typescriptParser.advance();
    const expressionNameNode = this.entityNameParser.parse(TypeScriptDiagnosticTemplates.TS1003);
    const typeArgumentListNode = typescriptParser.hasPrecedingLineBreak() ? undefined : typescriptParser.parseTypeArgumentList();
    const endNode = typeArgumentListNode ?? expressionNameNode;
    const span = typescriptParser.typescriptLexer.reader.createSpan(typeOfKeywordNode.span, endNode.span);
    return new TypeScriptTypeQueryNode(
      typeOfKeywordNode,
      span,
      expressionNameNode,
      typeArgumentListNode,
      typeOfKeywordNode.leadingTrivia,
      endNode.trailingTrivia);
  }
}
