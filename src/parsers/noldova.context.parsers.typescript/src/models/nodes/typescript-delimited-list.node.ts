/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, SourceSpan } from "@noldova/context.parsers";
import { CompositeNode } from "@noldova/context.parsers";

import type { TypeScriptCommaNode } from "./delimiters/typescript-comma.node.js";

export abstract class TypeScriptDelimitedListNode extends CompositeNode {
  public readonly commaNodes: readonly TypeScriptCommaNode[];

  public constructor(elementNodes: readonly Node[], commaNodes: readonly TypeScriptCommaNode[], span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node) {
    super(elementNodes, span, leadingTrivia, trailingTrivia);
    this.commaNodes = commaNodes;
  }
}
