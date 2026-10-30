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
import type { TypeScriptCommaNode } from "../delimiters/typescript-comma.node.js";
import type { TypeScriptSemicolonNode } from "../delimiters/typescript-semicolon.node.js";
import type { TypeScriptNewKeywordNode } from "../keywords/typescript-new-keyword.node.js";
import type { TypeScriptTypeParameterListNode } from "../types/typescript-type-parameter-list.node.js";
import type { TypeScriptParameterListNode } from "./typescript-parameter-list.node.js";

export class TypeScriptConstructSignatureNode extends Node {
  public readonly colonNode: TypeScriptColonNode | undefined;
  public readonly newKeywordNode: TypeScriptNewKeywordNode;
  public readonly parameterListNode: TypeScriptParameterListNode;
  public readonly returnTypeNode: Node | undefined;
  public readonly terminatorNode: TypeScriptCommaNode | TypeScriptSemicolonNode | undefined;
  public readonly typeParameterListNode: TypeScriptTypeParameterListNode | undefined;

  public constructor(
    newKeywordNode: TypeScriptNewKeywordNode,
    span: SourceSpan,
    parameterListNode: TypeScriptParameterListNode,
    typeParameterListNode?: TypeScriptTypeParameterListNode,
    colonNode?: TypeScriptColonNode,
    returnTypeNode?: Node,
    terminatorNode?: TypeScriptCommaNode | TypeScriptSemicolonNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.newKeywordNode = newKeywordNode;
    this.typeParameterListNode = typeParameterListNode;
    this.parameterListNode = parameterListNode;
    this.colonNode = colonNode;
    this.returnTypeNode = returnTypeNode;
    this.terminatorNode = terminatorNode;
  }
}
