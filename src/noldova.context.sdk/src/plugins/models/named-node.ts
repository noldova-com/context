/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

export class NamedNode {
  public readonly node: Node;
  public readonly nameNode: Node | undefined;

  public constructor(node: Node, nameNode: Node | undefined) {
    this.node = node;
    this.nameNode = nameNode;
  }
}
