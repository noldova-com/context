/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

export class TypeScriptJumpTarget {
  public static readonly ofIteration: TypeScriptJumpTarget = new TypeScriptJumpTarget(undefined, true);
  public static readonly ofSwitch: TypeScriptJumpTarget = new TypeScriptJumpTarget(undefined, false);
  public readonly isIteration: boolean;
  public readonly labelNode: Node | undefined;

  public constructor(labelNode: Node | undefined, isIteration: boolean) {
    this.labelNode = labelNode;
    this.isIteration = isIteration;
  }
}
