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
import type { TypeScriptEqualsNode } from "../operators/typescript-equals.node.js";
import type { TypeScriptExclamationNode } from "../operators/typescript-exclamation.node.js";
import type { TypeScriptQuestionNode } from "../operators/typescript-question.node.js";

export class TypeScriptPropertyDeclarationNode extends Node {
  public readonly colonNode: TypeScriptColonNode | undefined;
  public readonly equalsNode: TypeScriptEqualsNode | undefined;
  public readonly exclamationNode: TypeScriptExclamationNode | undefined;
  public readonly initializerNode: Node | undefined;
  public readonly modifierNodes: readonly Node[];
  public readonly nameNode: Node;
  public readonly questionNode: TypeScriptQuestionNode | undefined;
  public readonly terminatorNode: TypeScriptSemicolonNode | undefined;
  public readonly typeNode: Node | undefined;

  public constructor(
    modifierNodes: readonly Node[],
    span: SourceSpan,
    nameNode: Node,
    questionNode?: TypeScriptQuestionNode,
    exclamationNode?: TypeScriptExclamationNode,
    colonNode?: TypeScriptColonNode,
    typeNode?: Node,
    equalsNode?: TypeScriptEqualsNode,
    initializerNode?: Node,
    terminatorNode?: TypeScriptSemicolonNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.modifierNodes = modifierNodes;
    this.nameNode = nameNode;
    this.questionNode = questionNode;
    this.exclamationNode = exclamationNode;
    this.colonNode = colonNode;
    this.typeNode = typeNode;
    this.equalsNode = equalsNode;
    this.initializerNode = initializerNode;
    this.terminatorNode = terminatorNode;
  }
}
