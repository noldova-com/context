/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { CharacterLexer } from "./character.lexer.js";

export class RewindingCharacterLexer extends CharacterLexer {
  protected override lexNode(): Node {
    const startOffset = this.reader.currentOffset;
    const node = super.lexNode();
    if (startOffset > 0)
      this.reader.seek(startOffset - 1);

    return node;
  }
}
