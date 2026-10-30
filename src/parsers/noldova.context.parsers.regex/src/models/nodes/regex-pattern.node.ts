/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Node, type SourceSpan } from "@noldova/context.parsers";

import type { RegexDisjunctionNode } from "./regex-disjunction.node.js";

export class RegexPatternNode extends Node {
  public readonly value: string;
  public readonly disjunctionNode: RegexDisjunctionNode;

  public constructor(value: string, disjunctionNode: RegexDisjunctionNode, span: SourceSpan) {
    super(span);
    this.value = value;
    this.disjunctionNode = disjunctionNode;
  }
}
