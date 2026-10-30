/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, SourceSpan } from "@noldova/context.parsers";
import { CompositeNode } from "@noldova/context.parsers";

import type { TypeScriptBarNode } from "../operators/typescript-bar.node.js";

export class TypeScriptUnionTypeNode extends CompositeNode {
  public readonly barNodes: readonly TypeScriptBarNode[];

  public constructor(
    typeNodes: readonly Node[],
    barNodes: readonly TypeScriptBarNode[],
    span: SourceSpan,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(typeNodes, span, leadingTrivia, trailingTrivia);
    this.barNodes = barNodes;
  }
}
