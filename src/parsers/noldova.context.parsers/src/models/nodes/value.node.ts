/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "../sources/source-span.js";
import { Node } from "./node.js";

export abstract class ValueNode extends Node {
  public readonly value: string;

  protected constructor(value: string, span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.value = value;
  }
}
