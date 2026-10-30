/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";
import { Node } from "@noldova/context.parsers";

import type { TypeScriptSemicolonNode } from "../delimiters/typescript-semicolon.node.js";

export class TypeScriptSemicolonClassElementNode extends Node {
  public readonly modifierNodes: readonly Node[];
  public readonly semicolonNode: TypeScriptSemicolonNode;

  public constructor(
    modifierNodes: readonly Node[],
    semicolonNode: TypeScriptSemicolonNode,
    span: SourceSpan,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.modifierNodes = modifierNodes;
    this.semicolonNode = semicolonNode;
  }
}
