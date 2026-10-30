/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";
import { Node } from "@noldova/context.parsers";

import type { TypeScriptImportAttributesNode } from "../declarations/typescript-import-attributes.node.js";
import type { TypeScriptCloseBraceNode } from "../delimiters/typescript-close-brace.node.js";
import type { TypeScriptCloseParenthesisNode } from "../delimiters/typescript-close-parenthesis.node.js";
import type { TypeScriptCommaNode } from "../delimiters/typescript-comma.node.js";
import type { TypeScriptDotNode } from "../delimiters/typescript-dot.node.js";
import type { TypeScriptOpenBraceNode } from "../delimiters/typescript-open-brace.node.js";
import type { TypeScriptOpenParenthesisNode } from "../delimiters/typescript-open-parenthesis.node.js";
import type { TypeScriptImportKeywordNode } from "../keywords/typescript-import-keyword.node.js";
import type { TypeScriptTypeOfKeywordNode } from "../keywords/typescript-type-of-keyword.node.js";
import type { TypeScriptTypeArgumentListNode } from "./typescript-type-argument-list.node.js";

export class TypeScriptImportTypeNode extends Node {
  public readonly argumentNode: Node;
  public readonly attributesCloseBraceNode: TypeScriptCloseBraceNode | undefined;
  public readonly attributesCommaNode: TypeScriptCommaNode | undefined;
  public readonly attributesNode: TypeScriptImportAttributesNode | undefined;
  public readonly attributesOpenBraceNode: TypeScriptOpenBraceNode | undefined;
  public readonly closeParenthesisNode: TypeScriptCloseParenthesisNode | undefined;
  public readonly commaNode: TypeScriptCommaNode | undefined;
  public readonly dotNode: TypeScriptDotNode | undefined;
  public readonly importKeywordNode: TypeScriptImportKeywordNode;
  public readonly openParenthesisNode: TypeScriptOpenParenthesisNode | undefined;
  public readonly qualifierNode: Node | undefined;
  public readonly typeArgumentListNode: TypeScriptTypeArgumentListNode | undefined;
  public readonly typeOfKeywordNode: TypeScriptTypeOfKeywordNode | undefined;

  public constructor(
    importKeywordNode: TypeScriptImportKeywordNode,
    span: SourceSpan,
    argumentNode: Node,
    typeOfKeywordNode?: TypeScriptTypeOfKeywordNode,
    openParenthesisNode?: TypeScriptOpenParenthesisNode,
    commaNode?: TypeScriptCommaNode,
    attributesOpenBraceNode?: TypeScriptOpenBraceNode,
    attributesNode?: TypeScriptImportAttributesNode,
    attributesCommaNode?: TypeScriptCommaNode,
    attributesCloseBraceNode?: TypeScriptCloseBraceNode,
    closeParenthesisNode?: TypeScriptCloseParenthesisNode,
    dotNode?: TypeScriptDotNode,
    qualifierNode?: Node,
    typeArgumentListNode?: TypeScriptTypeArgumentListNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.typeOfKeywordNode = typeOfKeywordNode;
    this.importKeywordNode = importKeywordNode;
    this.openParenthesisNode = openParenthesisNode;
    this.argumentNode = argumentNode;
    this.commaNode = commaNode;
    this.attributesOpenBraceNode = attributesOpenBraceNode;
    this.attributesNode = attributesNode;
    this.attributesCommaNode = attributesCommaNode;
    this.attributesCloseBraceNode = attributesCloseBraceNode;
    this.closeParenthesisNode = closeParenthesisNode;
    this.dotNode = dotNode;
    this.qualifierNode = qualifierNode;
    this.typeArgumentListNode = typeArgumentListNode;
  }
}
