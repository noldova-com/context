/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, SourceSpan } from "@noldova/context.parsers";

import type { TypeScriptColonNode } from "../delimiters/typescript-colon.node.js";
import type { TypeScriptCommaNode } from "../delimiters/typescript-comma.node.js";
import type { TypeScriptSemicolonNode } from "../delimiters/typescript-semicolon.node.js";
import type { TypeScriptSetKeywordNode } from "../keywords/typescript-set-keyword.node.js";
import type { TypeScriptBlockNode } from "../statements/typescript-block.node.js";
import type { TypeScriptTypeParameterListNode } from "../types/typescript-type-parameter-list.node.js";
import { TypeScriptAccessorNode } from "./typescript-accessor.node.js";
import type { TypeScriptParameterListNode } from "./typescript-parameter-list.node.js";

export class TypeScriptSetAccessorNode extends TypeScriptAccessorNode {
  public readonly setKeywordNode: TypeScriptSetKeywordNode;

  public constructor(
    modifierNodes: readonly Node[],
    setKeywordNode: TypeScriptSetKeywordNode,
    span: SourceSpan,
    nameNode: Node,
    parameterListNode: TypeScriptParameterListNode,
    typeParameterListNode?: TypeScriptTypeParameterListNode,
    colonNode?: TypeScriptColonNode,
    returnTypeNode?: Node,
    bodyNode?: TypeScriptBlockNode,
    terminatorNode?: TypeScriptCommaNode | TypeScriptSemicolonNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(modifierNodes, span, nameNode, parameterListNode, typeParameterListNode, colonNode, returnTypeNode, bodyNode, terminatorNode, leadingTrivia,
      trailingTrivia);
    this.setKeywordNode = setKeywordNode;
  }
}
