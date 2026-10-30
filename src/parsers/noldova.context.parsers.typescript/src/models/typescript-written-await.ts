/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

export class TypeScriptWrittenAwait {
  public readonly isForAwait: boolean;
  public readonly isSourceTopLevel: boolean;
  public readonly keywordNode: Node;

  public constructor(keywordNode: Node, isForAwait: boolean, isSourceTopLevel: boolean) {
    this.keywordNode = keywordNode;
    this.isForAwait = isForAwait;
    this.isSourceTopLevel = isSourceTopLevel;
  }
}
