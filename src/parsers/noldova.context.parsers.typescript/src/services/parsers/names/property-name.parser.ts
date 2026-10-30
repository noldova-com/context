/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptComputedPropertyNameNode } from "../../../models/nodes/declarations/typescript-computed-property-name.node.js";
import { TypeScriptCloseBracketNode } from "../../../models/nodes/delimiters/typescript-close-bracket.node.js";
import { TypeScriptOpenBracketNode } from "../../../models/nodes/delimiters/typescript-open-bracket.node.js";
import { TypeScriptMissingIdentifierNode } from "../../../models/nodes/identifiers/typescript-missing-identifier.node.js";
import { Resources } from "../../../resources.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";

export class PropertyNameParser {
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
  }

  public parse(): Node {
    const context = this.typescriptParser.context;
    const awaitNameCount = context.records.awaitNameCount;
    const nameNode = this.parseName();
    context.records.awaitNameCount = awaitNameCount;
    return nameNode;
  }

  private parseName(): Node {
    const node = this.typescriptParser.currentNode;
    if (node instanceof TypeScriptOpenBracketNode)
      return this.parseComputedName(node);

    if (node.canStartTypeScriptPropertyName())
      return this.typescriptParser.consumeIdentifierName();

    return this.reportMissingName(node);
  }

  public parseAccessName(): Node {
    const node = this.typescriptParser.currentNode;
    if (node.isTypeScriptAccessName())
      return this.typescriptParser.consumeIdentifierName();

    return this.reportMissingName(node);
  }

  private reportMissingName(node: Node): TypeScriptMissingIdentifierNode {
    this.typescriptParser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1003, node.getTypeScriptMissingNodeDiagnosticSpan());
    return new TypeScriptMissingIdentifierNode(node.getTypeScriptMissingNodeSpan());
  }

  private parseComputedName(openBracketNode: TypeScriptOpenBracketNode): TypeScriptComputedPropertyNameNode {
    this.typescriptParser.advance();
    const expressionNode = this.typescriptParser.parseExpressionAllowingIn();
    const closeBracketNode = this.typescriptParser.tryConsume(TypeScriptCloseBracketNode);
    if (Object.isUndefined(closeBracketNode))
      this.typescriptParser.reportExpected(Resources.closeBracket);

    const endNode = closeBracketNode ?? expressionNode;
    const span = this.typescriptParser.typescriptLexer.reader.createSpan(openBracketNode.span, endNode.span);

    return new TypeScriptComputedPropertyNameNode(
      openBracketNode,
      span,
      expressionNode,
      closeBracketNode,
      openBracketNode.leadingTrivia,
      endNode.trailingTrivia);
  }
}
