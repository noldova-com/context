/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptTaggedTemplateExpressionNode } from "../../../models/nodes/expressions/typescript-tagged-template-expression.node.js";
import type { TypeScriptNoSubstitutionTemplateLiteralNode } from "../../../models/nodes/literals/typescript-no-substitution-template-literal.node.js";
import type { TypeScriptTemplateHeadNode } from "../../../models/nodes/literals/typescript-template-head.node.js";
import type { TypeScriptQuestionDotNode } from "../../../models/nodes/operators/typescript-question-dot.node.js";
import { TypeScriptExpressionWithTypeArgumentsNode } from "../../../models/nodes/types/typescript-expression-with-type-arguments.node.js";
import type { TypeScriptTypeArgumentListNode } from "../../../models/nodes/types/typescript-type-argument-list.node.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";
import { TemplateExpressionParser } from "./template-expression.parser.js";

export class TaggedTemplateExpressionParser {
  private readonly templateExpressionParser: TemplateExpressionParser;
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
    this.templateExpressionParser = new TemplateExpressionParser(typescriptParser);
  }

  public parse(
    tagNode: Node,
    templateStartNode: TypeScriptNoSubstitutionTemplateLiteralNode | TypeScriptTemplateHeadNode,
    questionDotNode?: TypeScriptQuestionDotNode,
    typeArgumentListNode?: TypeScriptTypeArgumentListNode): TypeScriptTaggedTemplateExpressionNode {
    if (Object.isUndefined(questionDotNode) && Object.isUndefined(typeArgumentListNode) && tagNode instanceof TypeScriptExpressionWithTypeArgumentsNode) {
      typeArgumentListNode = tagNode.typeArgumentListNode;
      tagNode = tagNode.expressionNode;
    }
    const templateNode = this.templateExpressionParser.parse(templateStartNode, true);
    const span = this.typescriptParser.typescriptLexer.reader.createSpan(
      tagNode.span,
      templateNode.span);
    const resultNode = new TypeScriptTaggedTemplateExpressionNode(
      tagNode,
      templateNode,
      span,
      questionDotNode,
      typeArgumentListNode,
      tagNode.leadingTrivia,
      templateNode.trailingTrivia);

    resultNode.validateTypeScriptGrammar(this.typescriptParser.context);
    return resultNode;
  }
}
