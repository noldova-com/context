/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

export class TypeScriptModifierList {
  public readonly nodes: readonly Node[];
  public readonly lastNode: Node;

  public constructor(firstNode: Node, followingNodes: readonly Node[]) {
    this.nodes = [firstNode, ...followingNodes];
    this.lastNode = followingNodes.at(-1) ?? firstNode;
  }
}
