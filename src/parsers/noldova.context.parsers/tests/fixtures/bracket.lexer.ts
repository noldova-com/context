/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { LiteralNode, type Node } from "@noldova/context.parsers";

import { CharacterLexer } from "./character.lexer.js";
import { LiteralNodeFixture } from "./literal-node.fixture.js";

export class BracketLexer extends CharacterLexer {
  public depth: number = 0;

  protected override lexNode(): Node {
    const node = super.lexNode();
    if (!(node instanceof LiteralNode))
      return node;

    if (node.value === "[") {
      this.depth++;
      return node;
    }

    if (node.value === "]") {
      this.depth--;
      return node;
    }

    return new LiteralNodeFixture(this.depth + ":" + node.value, node.span);
  }
}
