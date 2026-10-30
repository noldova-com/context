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
import { TypeScriptPropertyAccessExpressionNode } from "../../../models/nodes/expressions/typescript-property-access-expression.node.js";
import { TypeScriptMissingIdentifierNode } from "../../../models/nodes/identifiers/typescript-missing-identifier.node.js";
import type { TypeScriptQuestionDotNode } from "../../../models/nodes/operators/typescript-question-dot.node.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";
import type { PropertyNameParser } from "../names/property-name.parser.js";

export class PropertyAccessExpressionParser {
  private readonly propertyNameParser: PropertyNameParser;
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser, propertyNameParser: PropertyNameParser) {
    this.typescriptParser = typescriptParser;
    this.propertyNameParser = propertyNameParser;
  }

  public parse(
    expressionNode: Node,
    accessNode: TypeScriptDotNode | TypeScriptQuestionDotNode | undefined): TypeScriptPropertyAccessExpressionNode {
    const parser = this.typescriptParser;
    const startsAStatement = !Object.isUndefined(accessNode) && parser.hasPrecedingLineBreak() && parser.currentNode.isTypeScriptIdentifierName()
      && parser.lookAhead(() => {
        parser.advance();
        return !parser.hasPrecedingLineBreak() && parser.currentNode.isTypeScriptIdentifierName();
      });
    if (startsAStatement)
      parser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1003,
        parser.typescriptLexer.reader.createSpan(accessNode.span.endOffset, 0));
    const shouldReportInstantiation = accessNode instanceof TypeScriptDotNode
      || (!Object.isUndefined(accessNode) && parser.currentNode.isTypeScriptIdentifierName());
    const nameNode = startsAStatement
      ? new TypeScriptMissingIdentifierNode(parser.currentNode.getTypeScriptMissingNodeSpan())
      : this.propertyNameParser.parseAccessName();
    if (shouldReportInstantiation)
      expressionNode.reportTypeScriptInstantiationAccess(parser);
    const span = this.typescriptParser.typescriptLexer.reader.createSpan(
      expressionNode.span,
      nameNode.span);
    return new TypeScriptPropertyAccessExpressionNode(
      expressionNode,
      accessNode,
      span,
      nameNode,
      expressionNode.leadingTrivia,
      nameNode.trailingTrivia);
  }
}
