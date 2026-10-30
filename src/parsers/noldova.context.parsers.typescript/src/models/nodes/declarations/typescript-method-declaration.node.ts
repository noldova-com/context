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
import type { TypeScriptSemicolonNode } from "../delimiters/typescript-semicolon.node.js";
import type { TypeScriptAsteriskNode } from "../operators/typescript-asterisk.node.js";
import type { TypeScriptExclamationNode } from "../operators/typescript-exclamation.node.js";
import type { TypeScriptQuestionNode } from "../operators/typescript-question.node.js";
import type { TypeScriptBlockNode } from "../statements/typescript-block.node.js";
import type { TypeScriptTypeParameterListNode } from "../types/typescript-type-parameter-list.node.js";
import type { TypeScriptParameterListNode } from "./typescript-parameter-list.node.js";

export class TypeScriptMethodDeclarationNode extends Node {
  public readonly asteriskNode: TypeScriptAsteriskNode | undefined;
  public readonly bodyNode: TypeScriptBlockNode | undefined;
  public readonly colonNode: TypeScriptColonNode | undefined;
  public readonly modifierNodes: readonly Node[];
  public readonly nameNode: Node;
  public readonly parameterListNode: TypeScriptParameterListNode;
  public readonly questionNode: TypeScriptQuestionNode | undefined;
  public readonly exclamationNode: TypeScriptExclamationNode | undefined;
  public readonly returnTypeNode: Node | undefined;
  public readonly terminatorNode: TypeScriptSemicolonNode | undefined;
  public readonly typeParameterListNode: TypeScriptTypeParameterListNode | undefined;

  public constructor(
    modifierNodes: readonly Node[],
    span: SourceSpan,
    nameNode: Node,
    parameterListNode: TypeScriptParameterListNode,
    asteriskNode?: TypeScriptAsteriskNode,
    questionNode?: TypeScriptQuestionNode,
    typeParameterListNode?: TypeScriptTypeParameterListNode,
    colonNode?: TypeScriptColonNode,
    returnTypeNode?: Node,
    bodyNode?: TypeScriptBlockNode,
    terminatorNode?: TypeScriptSemicolonNode,
    exclamationNode?: TypeScriptExclamationNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.modifierNodes = modifierNodes;
    this.asteriskNode = asteriskNode;
    this.nameNode = nameNode;
    this.questionNode = questionNode;
    this.exclamationNode = exclamationNode;
    this.typeParameterListNode = typeParameterListNode;
    this.parameterListNode = parameterListNode;
    this.colonNode = colonNode;
    this.returnTypeNode = returnTypeNode;
    this.bodyNode = bodyNode;
    this.terminatorNode = terminatorNode;
  }
}
