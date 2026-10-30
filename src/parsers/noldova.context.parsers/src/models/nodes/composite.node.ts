/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "../sources/source-span.js";
import { Node } from "./node.js";

export abstract class CompositeNode extends Node {
  public readonly children: readonly Node[];

  protected constructor(children: readonly Node[], span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.children = children;
  }
}
