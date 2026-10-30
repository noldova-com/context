/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptDotNode } from "../../../models/nodes/delimiters/typescript-dot.node.js";
import { TypeScriptOpenBracketNode } from "../../../models/nodes/delimiters/typescript-open-bracket.node.js";
import { TypeScriptOpenParenthesisNode } from "../../../models/nodes/delimiters/typescript-open-parenthesis.node.js";
import { TypeScriptMetaPropertyNode } from "../../../models/nodes/expressions/typescript-meta-property.node.js";
import type { TypeScriptImportKeywordNode } from "../../../models/nodes/keywords/typescript-import-keyword.node.js";
import type { TypeScriptSuperKeywordNode } from "../../../models/nodes/keywords/typescript-super-keyword.node.js";
import { TypeScriptExpressionWithTypeArgumentsNode } from "../../../models/nodes/types/typescript-expression-with-type-arguments.node.js";
import { Resources } from "../../../resources.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";
import type { PropertyNameParser } from "../names/property-name.parser.js";

export class MemberExpressionParser {
  private readonly propertyNameParser: PropertyNameParser;
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser, propertyNameParser: PropertyNameParser) {
    this.typescriptParser = typescriptParser;
    this.propertyNameParser = propertyNameParser;
  }

  public parse(): Node {
    const parser = this.typescriptParser;
    return this.parseRest(parser.currentNode.parseTypeScriptMemberExpression(parser));
  }

  public parseRest(expressionNode: Node): Node {
    const parser = this.typescriptParser;
    while (true) {
      const nextNode = parser.currentNode.parseTypeScriptMemberSuffix(parser, expressionNode);
      if (Object.isUndefined(nextNode))
        return expressionNode;

      expressionNode = nextNode;
    }
  }

  public parseImport(importKeywordNode: TypeScriptImportKeywordNode): Node {
    if (!importKeywordNode.canStartTypeScriptLeftHandSideExpression(this.typescriptParser))
      return importKeywordNode.reportTypeScriptMissingExpression(this.typescriptParser);

    this.typescriptParser.advance();
    const dotNode = this.typescriptParser.currentNode;
    if (!(dotNode instanceof TypeScriptDotNode))
      return importKeywordNode;

    this.typescriptParser.advance();
    const nameNode = this.propertyNameParser.parseAccessName();
    if (this.typescriptParser.context.source.getText(nameNode.span) === Resources.meta)
      this.typescriptParser.context.records.hasImportMeta = true;
    const span = this.typescriptParser.typescriptLexer.reader.createSpan(
      importKeywordNode.span,
      nameNode.span);
    const resultNode = new TypeScriptMetaPropertyNode(
      importKeywordNode,
      span,
      nameNode,
      dotNode,
      importKeywordNode.leadingTrivia,
      nameNode.trailingTrivia);

    importKeywordNode.validateTypeScriptMetaProperty(this.typescriptParser.context, resultNode,
      this.typescriptParser.currentNode instanceof TypeScriptOpenParenthesisNode);
    return resultNode;
  }

  public parseSuper(keywordNode: TypeScriptSuperKeywordNode): Node {
    const parser = this.typescriptParser;
    parser.advance();
    let expressionNode: Node = keywordNode;
    if (parser.currentNode.canStartTypeScriptGenericList()) {
      const typeArguments = parser.tryParseTypeArgumentExpressionSuffix();
      if (!Object.isUndefined(typeArguments)) {
        parser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS2754, typeArguments.span);
        expressionNode = new TypeScriptExpressionWithTypeArgumentsNode(
          keywordNode,
          parser.typescriptLexer.reader.createSpan(keywordNode.span, typeArguments.span),
          typeArguments,
          keywordNode.leadingTrivia,
          typeArguments.trailingTrivia);
      }
    }
    const nextNode = parser.currentNode;
    if (nextNode instanceof TypeScriptOpenParenthesisNode || nextNode instanceof TypeScriptDotNode || nextNode instanceof TypeScriptOpenBracketNode)
      return expressionNode;
    parser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1034, nextNode.span);
    return parser.parsePropertyAccessExpression(expressionNode, undefined);
  }
}
