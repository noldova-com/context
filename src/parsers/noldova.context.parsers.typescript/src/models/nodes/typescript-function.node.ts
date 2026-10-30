/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";
import { Node } from "@noldova/context.parsers";

import type { TypeScriptParameterListNode } from "./declarations/typescript-parameter-list.node.js";
import type { TypeScriptColonNode } from "./delimiters/typescript-colon.node.js";
import type { TypeScriptFunctionKeywordNode } from "./keywords/typescript-function-keyword.node.js";
import type { TypeScriptAsteriskNode } from "./operators/typescript-asterisk.node.js";
import type { TypeScriptBlockNode } from "./statements/typescript-block.node.js";
import type { TypeScriptTypeParameterListNode } from "./types/typescript-type-parameter-list.node.js";

export abstract class TypeScriptFunctionNode extends Node {
  public readonly asteriskNode: TypeScriptAsteriskNode | undefined;
  public readonly modifierNodes: readonly Node[];
  public readonly bodyNode: TypeScriptBlockNode | undefined;
  public readonly colonNode: TypeScriptColonNode | undefined;
  public readonly functionKeywordNode: TypeScriptFunctionKeywordNode;
  public readonly nameNode: Node | undefined;
  public readonly parameterListNode: TypeScriptParameterListNode;
  public readonly returnTypeNode: Node | undefined;
  public readonly typeParameterListNode: TypeScriptTypeParameterListNode | undefined;

  public constructor(
    functionKeywordNode: TypeScriptFunctionKeywordNode,
    span: SourceSpan,
    parameterListNode: TypeScriptParameterListNode,
    modifierNodes: readonly Node[] = [],
    asteriskNode?: TypeScriptAsteriskNode,
    nameNode?: Node,
    typeParameterListNode?: TypeScriptTypeParameterListNode,
    colonNode?: TypeScriptColonNode,
    returnTypeNode?: Node,
    bodyNode?: TypeScriptBlockNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.functionKeywordNode = functionKeywordNode;
    this.modifierNodes = modifierNodes;
    this.asteriskNode = asteriskNode;
    this.nameNode = nameNode;
    this.typeParameterListNode = typeParameterListNode;
    this.parameterListNode = parameterListNode;
    this.colonNode = colonNode;
    this.returnTypeNode = returnTypeNode;
    this.bodyNode = bodyNode;
  }
}
