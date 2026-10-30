/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, SourceSpan } from "@noldova/context.parsers";
import { CompositeNode } from "@noldova/context.parsers";

import type { TypeScriptAmpersandNode } from "../operators/typescript-ampersand.node.js";

export class TypeScriptIntersectionTypeNode extends CompositeNode {
  public readonly ampersandNodes: readonly TypeScriptAmpersandNode[];

  public constructor(
    typeNodes: readonly Node[],
    ampersandNodes: readonly TypeScriptAmpersandNode[],
    span: SourceSpan,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(typeNodes, span, leadingTrivia, trailingTrivia);
    this.ampersandNodes = ampersandNodes;
  }
}
