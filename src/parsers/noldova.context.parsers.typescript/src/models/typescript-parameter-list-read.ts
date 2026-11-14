/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

export class TypeScriptParameterListRead {
  public readonly endNode: Node;
  public readonly isComplete: boolean;

  public constructor(endNode: Node, isComplete: boolean) {
    this.endNode = endNode;
    this.isComplete = isComplete;
  }
}
