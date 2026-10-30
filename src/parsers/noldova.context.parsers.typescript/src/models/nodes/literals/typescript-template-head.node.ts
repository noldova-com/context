/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, SourceSpan } from "@noldova/context.parsers";
import { LiteralNode } from "@noldova/context.parsers";

export class TypeScriptTemplateHeadNode extends LiteralNode {
  public readonly containsInvalidEscape: boolean;

  public constructor(value: string, span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node, containsInvalidEscape: boolean = false) {
    super(value, span, leadingTrivia, trailingTrivia);
    this.containsInvalidEscape = containsInvalidEscape;
  }
}
