/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Node, type SourceSpan } from "@noldova/context.parsers";

import type { RegexFlagsNode } from "./regex-flags.node.js";
import type { RegexPatternNode } from "./regex-pattern.node.js";

export class RegexNode extends Node {
  public readonly rawValue: string;
  public readonly patternNode: RegexPatternNode;
  public readonly flagsNode: RegexFlagsNode;

  public constructor(rawValue: string, patternNode: RegexPatternNode, flagsNode: RegexFlagsNode, span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.rawValue = rawValue;
    this.patternNode = patternNode;
    this.flagsNode = flagsNode;
  }
}
