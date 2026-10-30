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
import type { TypeScriptQuestionNode } from "../operators/typescript-question.node.js";
import type { TypeScriptTypeParameterListNode } from "../types/typescript-type-parameter-list.node.js";
import type { TypeScriptParameterListNode } from "./typescript-parameter-list.node.js";

export class TypeScriptMethodSignatureNode extends Node {
  public readonly colonNode: TypeScriptColonNode | undefined;
  public readonly modifierNodes: readonly Node[];
  public readonly nameNode: Node;
  public readonly parameterListNode: TypeScriptParameterListNode;
  public readonly questionNode: TypeScriptQuestionNode | undefined;
  public readonly returnTypeNode: Node | undefined;
  public readonly terminatorNode: TypeScriptCommaNode | TypeScriptSemicolonNode | undefined;
  public readonly typeParameterListNode: TypeScriptTypeParameterListNode | undefined;

  public constructor(
    modifierNodes: readonly Node[],
    span: SourceSpan,
    nameNode: Node,
    parameterListNode: TypeScriptParameterListNode,
    questionNode?: TypeScriptQuestionNode,
    typeParameterListNode?: TypeScriptTypeParameterListNode,
    colonNode?: TypeScriptColonNode,
    returnTypeNode?: Node,
    terminatorNode?: TypeScriptCommaNode | TypeScriptSemicolonNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.modifierNodes = modifierNodes;
    this.nameNode = nameNode;
    this.questionNode = questionNode;
    this.typeParameterListNode = typeParameterListNode;
    this.parameterListNode = parameterListNode;
    this.colonNode = colonNode;
    this.returnTypeNode = returnTypeNode;
    this.terminatorNode = terminatorNode;
  }
}
