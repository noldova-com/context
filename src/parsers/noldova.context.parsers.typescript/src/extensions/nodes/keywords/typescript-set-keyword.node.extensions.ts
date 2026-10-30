/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, SourceSpan } from "@noldova/context.parsers";

import type { TypeScriptParameterListNode } from "../../../models/nodes/declarations/typescript-parameter-list.node.js";
import { TypeScriptSetAccessorNode } from "../../../models/nodes/declarations/typescript-set-accessor.node.js";
import type { TypeScriptColonNode } from "../../../models/nodes/delimiters/typescript-colon.node.js";
import type { TypeScriptCommaNode } from "../../../models/nodes/delimiters/typescript-comma.node.js";
import type { TypeScriptSemicolonNode } from "../../../models/nodes/delimiters/typescript-semicolon.node.js";
import { TypeScriptSetKeywordNode } from "../../../models/nodes/keywords/typescript-set-keyword.node.js";
import type { TypeScriptBlockNode } from "../../../models/nodes/statements/typescript-block.node.js";
import type { TypeScriptTypeParameterListNode } from "../../../models/nodes/types/typescript-type-parameter-list.node.js";

TypeScriptSetKeywordNode.prototype.createTypeScriptAccessor = function (
  this: TypeScriptSetKeywordNode,
  modifierNodes: readonly Node[],
  span: SourceSpan,
  nameNode: Node,
  parameterListNode: TypeScriptParameterListNode,
  typeParameterListNode: TypeScriptTypeParameterListNode | undefined,
  colonNode: TypeScriptColonNode | undefined,
  returnTypeNode: Node | undefined,
  bodyNode: TypeScriptBlockNode | undefined,
  terminatorNode: TypeScriptCommaNode | TypeScriptSemicolonNode | undefined,
  leadingTrivia: Node | undefined,
  trailingTrivia: Node | undefined): TypeScriptSetAccessorNode {
  return new TypeScriptSetAccessorNode(modifierNodes, this, span, nameNode, parameterListNode, typeParameterListNode, colonNode, returnTypeNode, bodyNode,
    terminatorNode, leadingTrivia, trailingTrivia);
};
