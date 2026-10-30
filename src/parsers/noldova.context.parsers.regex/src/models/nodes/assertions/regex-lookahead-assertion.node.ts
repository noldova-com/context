/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Node, type SourceSpan } from "@noldova/context.parsers";

import type { RegexDisjunctionNode } from "../regex-disjunction.node.js";

export class RegexLookaheadAssertionNode extends Node {
  public readonly disjunctionNode: RegexDisjunctionNode;
  public readonly negated: boolean;

  public constructor(disjunctionNode: RegexDisjunctionNode, negated: boolean, span: SourceSpan) {
    super(span);
    this.disjunctionNode = disjunctionNode;
    this.negated = negated;
  }
}
