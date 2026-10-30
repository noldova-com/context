/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ArgumentException } from "@noldova/context.exceptions";
import { EndOfFileNode, LiteralNode, ParserException, SourceLine, SourcePosition } from "@noldova/context.parsers";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { CharacterParser } from "./fixtures/character.parser.js";

@TestClass
export class ResourcesTests {
  @TestMethod
  public usesTheCanonicalLineMessages(): void {
    const indexFailure = Assert.throws(() => new SourceLine(-1, 0, 0, 0), ArgumentException);
    const startFailure = Assert.throws(() => new SourceLine(0, -1, 0, 0), ArgumentException);
    const endFailure = Assert.throws(() => new SourceLine(0, 1, 0, 0), ArgumentException);

    Assert.areEqual("The line index must be a non-negative safe integer. (Parameter 'lineIndex')", indexFailure.message);
    Assert.areEqual("The line start offset must be a non-negative safe integer. (Parameter 'startOffset')", startFailure.message);
    Assert.areEqual("The line end offset must be a safe integer greater than or equal to its start offset. (Parameter 'endOffset')", endFailure.message);
  }

  @TestMethod
  public usesTheCanonicalPositionMessage(): void {
    const failure = Assert.throws(() => new SourcePosition(0, -1), ArgumentException);

    Assert.areEqual("The character index must be a non-negative safe integer within the requested line. (Parameter 'characterIndex')", failure.message);
  }

  @TestMethod
  public usesTheCanonicalCurrentNodeMessage(): void {
    const parser = CharacterParser.create("a");
    const failure = Assert.throws(() => parser.requireCurrentNode(EndOfFileNode), ParserException);

    Assert.areEqual("The current node does not match the type required by the recognized grammar branch.", failure.message);
    Assert.isInstanceOf(parser.requireCurrentNode(LiteralNode), LiteralNode);
  }
}
