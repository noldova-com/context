/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { EndOfFileNode, type Node } from "@noldova/context.parsers";

import { CharacterLexer } from "./character.lexer.js";
import { LiteralNodeFixture } from "./literal-node.fixture.js";

export class NonTerminatingLexer extends CharacterLexer {
  protected override lexNode(): Node {
    const node = super.lexNode();

    return node instanceof EndOfFileNode ? new LiteralNodeFixture(String.empty, node.span) : node;
  }
}
