/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { CompositeNode, type Node, SourceSpan } from "@noldova/context.parsers";

export class CompositeNodeFixture extends CompositeNode {
  public constructor(children: readonly Node[], span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node) {
    super(children, span, leadingTrivia, trailingTrivia);
  }
}
