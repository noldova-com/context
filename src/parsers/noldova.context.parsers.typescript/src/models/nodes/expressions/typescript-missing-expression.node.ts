/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";
import { Node } from "@noldova/context.parsers";

export class TypeScriptMissingExpressionNode extends Node {
  public readonly unexpectedNode: Node | undefined;

  public constructor(span: SourceSpan, unexpectedNode?: Node, leadingTrivia?: Node, trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.unexpectedNode = unexpectedNode;
  }
}
