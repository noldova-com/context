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
import type { TypeScriptIndexParameterListNode } from "./typescript-index-parameter-list.node.js";

export class TypeScriptIndexSignatureNode extends Node {
  public readonly colonNode: TypeScriptColonNode | undefined;
  public readonly indexParameterListNode: TypeScriptIndexParameterListNode;
  public readonly modifierNodes: readonly Node[];
  public readonly terminatorNode: TypeScriptCommaNode | TypeScriptSemicolonNode | undefined;
  public readonly typeNode: Node | undefined;

  public constructor(
    modifierNodes: readonly Node[],
    indexParameterListNode: TypeScriptIndexParameterListNode,
    span: SourceSpan,
    colonNode?: TypeScriptColonNode,
    typeNode?: Node,
    terminatorNode?: TypeScriptCommaNode | TypeScriptSemicolonNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.modifierNodes = modifierNodes;
    this.indexParameterListNode = indexParameterListNode;
    this.colonNode = colonNode;
    this.typeNode = typeNode;
    this.terminatorNode = terminatorNode;
  }
}
