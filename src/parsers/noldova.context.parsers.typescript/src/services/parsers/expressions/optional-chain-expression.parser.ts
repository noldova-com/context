/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptOpenParenthesisNode } from "../../../models/nodes/delimiters/typescript-open-parenthesis.node.js";
import { TypeScriptNoSubstitutionTemplateLiteralNode } from "../../../models/nodes/literals/typescript-no-substitution-template-literal.node.js";
import { TypeScriptTemplateHeadNode } from "../../../models/nodes/literals/typescript-template-head.node.js";
import type { TypeScriptQuestionDotNode } from "../../../models/nodes/operators/typescript-question-dot.node.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";
import type { CallExpressionParser } from "./call-expression.parser.js";
import type { PropertyAccessExpressionParser } from "./property-access-expression.parser.js";
import type { TaggedTemplateExpressionParser } from "./tagged-template-expression.parser.js";

export class OptionalChainExpressionParser {
  private readonly callExpressionParser: CallExpressionParser;
  private readonly propertyAccessExpressionParser: PropertyAccessExpressionParser;
  private readonly taggedTemplateExpressionParser: TaggedTemplateExpressionParser;
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(
    typescriptParser: TypeScriptSyntaxParser,
    propertyAccessExpressionParser: PropertyAccessExpressionParser,
    callExpressionParser: CallExpressionParser,
    taggedTemplateExpressionParser: TaggedTemplateExpressionParser) {
    this.typescriptParser = typescriptParser;
    this.propertyAccessExpressionParser = propertyAccessExpressionParser;
    this.callExpressionParser = callExpressionParser;
    this.taggedTemplateExpressionParser = taggedTemplateExpressionParser;
  }

  public parse(expressionNode: Node, questionDotNode: TypeScriptQuestionDotNode): Node {
    this.typescriptParser.advance();
    return this.typescriptParser.currentNode.parseTypeScriptOptionalChainSuffix(this.typescriptParser, expressionNode, questionDotNode);
  }

  public parseTypeArgumentSuffix(
    expressionNode: Node,
    questionDotNode: TypeScriptQuestionDotNode): Node {
    const typeArgumentListNode = this.typescriptParser.tryParseTypeArgumentExpressionSuffix();
    if (Object.isUndefined(typeArgumentListNode))
      return this.propertyAccessExpressionParser.parse(expressionNode, questionDotNode);

    const suffixNode = this.typescriptParser.currentNode;
    if (suffixNode instanceof TypeScriptOpenParenthesisNode)
      return this.callExpressionParser.parse(expressionNode, suffixNode, questionDotNode, typeArgumentListNode);

    if (suffixNode instanceof TypeScriptNoSubstitutionTemplateLiteralNode || suffixNode instanceof TypeScriptTemplateHeadNode)
      return this.taggedTemplateExpressionParser.parse(expressionNode, suffixNode, questionDotNode, typeArgumentListNode);

    return this.callExpressionParser.parse(expressionNode, undefined, questionDotNode, typeArgumentListNode);
  }
}
