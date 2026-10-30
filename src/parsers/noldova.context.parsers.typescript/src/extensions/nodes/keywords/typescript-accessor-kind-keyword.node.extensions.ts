/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, SourceSpan } from "@noldova/context.parsers";

import type { TypeScriptAccessorNode } from "../../../models/nodes/declarations/typescript-accessor.node.js";
import type { TypeScriptParameterListNode } from "../../../models/nodes/declarations/typescript-parameter-list.node.js";
import type { TypeScriptColonNode } from "../../../models/nodes/delimiters/typescript-colon.node.js";
import type { TypeScriptCommaNode } from "../../../models/nodes/delimiters/typescript-comma.node.js";
import type { TypeScriptSemicolonNode } from "../../../models/nodes/delimiters/typescript-semicolon.node.js";
import { TypeScriptAccessorKindKeywordNode } from "../../../models/nodes/keywords/typescript-accessor-kind-keyword.node.js";
import type { TypeScriptBlockNode } from "../../../models/nodes/statements/typescript-block.node.js";
import type { TypeScriptTypeParameterListNode } from "../../../models/nodes/types/typescript-type-parameter-list.node.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

declare module "../../../models/nodes/keywords/typescript-accessor-kind-keyword.node.js" {
  interface TypeScriptAccessorKindKeywordNode {
    createTypeScriptAccessor(
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
      trailingTrivia: Node | undefined): TypeScriptAccessorNode;
  }
}

TypeScriptAccessorKindKeywordNode.prototype.startsTypeScriptAccessor = function (this: TypeScriptAccessorKindKeywordNode,
  parser: TypeScriptSyntaxParser): this is TypeScriptAccessorKindKeywordNode {
  return parser.lookAhead(() => {
    parser.advance();
    return parser.currentNode.canStartTypeScriptPropertyName();
  });
};

TypeScriptAccessorKindKeywordNode.prototype.canStartTypeScriptClassMember = function (this: TypeScriptAccessorKindKeywordNode): boolean {
  return true;
};

TypeScriptAccessorKindKeywordNode.prototype.canStartTypeScriptTypeMember = function (this: TypeScriptAccessorKindKeywordNode): boolean {
  return true;
};
