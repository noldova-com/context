/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Node, type SourceSpan } from "@noldova/context.parsers";

import type { RegexDisjunctionNode } from "../regex-disjunction.node.js";

export class RegexNamedCapturingGroupNode extends Node {
  public readonly groupName: string;
  public readonly groupIndex: number;
  public readonly disjunctionNode: RegexDisjunctionNode;

  public constructor(groupIndex: number, groupName: string, disjunctionNode: RegexDisjunctionNode, span: SourceSpan) {
    super(span);
    this.groupIndex = groupIndex;
    this.groupName = groupName;
    this.disjunctionNode = disjunctionNode;
  }
}
