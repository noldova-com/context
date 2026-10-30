/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";
import { Node } from "@noldova/context.parsers";

import type { TypeScriptColonNode } from "../delimiters/typescript-colon.node.js";
import type { TypeScriptExtendsKeywordNode } from "../keywords/typescript-extends-keyword.node.js";
import type { TypeScriptQuestionNode } from "../operators/typescript-question.node.js";

export class TypeScriptConditionalTypeNode extends Node {
  public readonly checkTypeNode: Node;
  public readonly colonNode: TypeScriptColonNode | undefined;
  public readonly extendsKeywordNode: TypeScriptExtendsKeywordNode;
  public readonly extendsTypeNode: Node;
  public readonly falseTypeNode: Node;
  public readonly questionNode: TypeScriptQuestionNode | undefined;
  public readonly trueTypeNode: Node;

  public constructor(
    checkTypeNode: Node,
    extendsKeywordNode: TypeScriptExtendsKeywordNode,
    span: SourceSpan,
    extendsTypeNode: Node,
    trueTypeNode: Node,
    falseTypeNode: Node,
    questionNode?: TypeScriptQuestionNode,
    colonNode?: TypeScriptColonNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.checkTypeNode = checkTypeNode;
    this.extendsKeywordNode = extendsKeywordNode;
    this.extendsTypeNode = extendsTypeNode;
    this.questionNode = questionNode;
    this.trueTypeNode = trueTypeNode;
    this.colonNode = colonNode;
    this.falseTypeNode = falseTypeNode;
  }
}
