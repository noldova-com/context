/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Node, type SourceSpan } from "@noldova/context.parsers";

import type { RegexDisjunctionNode } from "../regex-disjunction.node.js";

export class RegexModifierGroupNode extends Node {
  public readonly enabledModifiers: string;
  public readonly disabledModifiers: string;
  public readonly disjunctionNode: RegexDisjunctionNode;

  public constructor(enabledModifiers: string, disabledModifiers: string, disjunctionNode: RegexDisjunctionNode, span: SourceSpan) {
    super(span);
    this.enabledModifiers = enabledModifiers;
    this.disabledModifiers = disabledModifiers;
    this.disjunctionNode = disjunctionNode;
  }
}
