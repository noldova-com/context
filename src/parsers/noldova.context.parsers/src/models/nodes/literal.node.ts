/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "../sources/source-span.js";
import type { Node } from "./node.js";
import { ValueNode } from "./value.node.js";

export abstract class LiteralNode extends ValueNode {
  protected constructor(value: string, span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node) {
    super(value, span, leadingTrivia, trailingTrivia);
  }
}
