/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";
import { Node } from "@noldova/context.parsers";

export class TypeScriptTemplateLiteralTypeSpanNode extends Node {
  public readonly literalNode: Node | undefined;
  public readonly typeNode: Node;

  public constructor(typeNode: Node, literalNode: Node | undefined, span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.typeNode = typeNode;
    this.literalNode = literalNode;
  }
}
