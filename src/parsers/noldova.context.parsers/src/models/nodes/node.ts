/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "../sources/source-span.js";

export abstract class Node {
  public readonly span: SourceSpan;
  public readonly leadingTrivia: Node | undefined;
  public readonly trailingTrivia: Node | undefined;

  protected constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node) {
    this.span = span;
    this.leadingTrivia = leadingTrivia;
    this.trailingTrivia = trailingTrivia;
  }
}
