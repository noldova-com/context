/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptContextFlags } from "../../../enums/typescript-context-flags.js";
import { TypeScriptMissingIdentifierNode } from "../../../models/nodes/identifiers/typescript-missing-identifier.node.js";
import { TypeScriptExtendsKeywordNode } from "../../../models/nodes/keywords/typescript-extends-keyword.node.js";
import type { TypeScriptInferKeywordNode } from "../../../models/nodes/keywords/typescript-infer-keyword.node.js";
import { TypeScriptQuestionNode } from "../../../models/nodes/operators/typescript-question.node.js";
import { TypeScriptInferTypeNode } from "../../../models/nodes/types/typescript-infer-type.node.js";
import { TypeScriptTypeParameterNode } from "../../../models/nodes/types/typescript-type-parameter.node.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";
import { IdentifierNameParser } from "../names/identifier-name.parser.js";

export class InferTypeParser {
  private readonly nameParser: IdentifierNameParser;
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
    this.nameParser = new IdentifierNameParser(typescriptParser);
  }

  public parse(inferKeywordNode: TypeScriptInferKeywordNode): TypeScriptInferTypeNode {
    const parser = this.typescriptParser;
    parser.advance();
    const nameNode = (parser.currentNode.isTypeScriptBindingIdentifier() ? parser.consumeName() : this.nameParser.parseBindingIdentifier())
      ?? new TypeScriptMissingIdentifierNode(parser.currentNode.getTypeScriptMissingNodeSpan());
    const parameterNode = parser.tryParse(() => {
      const extendsNode = parser.tryConsume(TypeScriptExtendsKeywordNode);
      if (Object.isUndefined(extendsNode))
        return undefined;
      const constraintNode = parser.parseTypeWithoutConditional();
      if ((parser.context.contextFlags & TypeScriptContextFlags.DisallowConditionalTypes) === 0 && parser.currentNode instanceof TypeScriptQuestionNode)
        return undefined;
      const span = parser.typescriptLexer.reader.createSpan(nameNode.span, constraintNode.span);
      return new TypeScriptTypeParameterNode([], nameNode, span, extendsNode, constraintNode, undefined, undefined,
        nameNode.leadingTrivia, constraintNode.trailingTrivia);
    }) ?? new TypeScriptTypeParameterNode([], nameNode, nameNode.span, undefined, undefined, undefined, undefined,
      nameNode.leadingTrivia, nameNode.trailingTrivia);
    return new TypeScriptInferTypeNode(
      inferKeywordNode,
      parser.typescriptLexer.reader.createSpan(inferKeywordNode.span, parameterNode.span),
      parameterNode,
      inferKeywordNode.leadingTrivia,
      parameterNode.trailingTrivia);
  }
}
