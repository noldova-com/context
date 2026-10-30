/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Node, type SourceSpan } from "@noldova/context.parsers";

export class RegexCharacterRangeNode extends Node {
  public readonly startNode: Node;
  public readonly endNode: Node;

  public constructor(startNode: Node, endNode: Node, span: SourceSpan) {
    super(span);
    this.startNode = startNode;
    this.endNode = endNode;
  }
}
