/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Node, type SourceSpan } from "@noldova/context.parsers";

export class RegexCharacterClassNode extends Node {
  public readonly expressionNode: Node;
  public readonly mayContainStrings: boolean;
  public readonly negated: boolean;

  public constructor(expressionNode: Node, negated: boolean, mayContainStrings: boolean, span: SourceSpan) {
    super(span);
    this.expressionNode = expressionNode;
    this.negated = negated;
    this.mayContainStrings = mayContainStrings;
  }
}
