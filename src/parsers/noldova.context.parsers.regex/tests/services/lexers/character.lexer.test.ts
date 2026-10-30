/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexCharacterNode, RegexQuantifierNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { RegexParserFixture } from "../../fixtures/regex-parser.fixture.js";

@TestClass
export class CharacterLexerTests {
  @TestMethod
  @TestData("a", "", ["a"])
  @TestData("a", "u", ["a"])
  @TestData("a", "v", ["a"])
  @TestData("π", "", ["π"])
  @TestData("π", "u", ["π"])
  @TestData("π", "v", ["π"])
  @TestData("😀", "", ["\uD83D", "\uDE00"])
  @TestData("😀", "u", ["😀"])
  @TestData("😀", "v", ["😀"])
  @TestData("\uD83D", "", ["\uD83D"])
  @TestData("\uD83D", "u", ["\uD83D"])
  @TestData("\uD83D", "v", ["\uD83D"])
  @TestData("\uDE00", "", ["\uDE00"])
  @TestData("\uDE00", "u", ["\uDE00"])
  @TestData("\uDE00", "v", ["\uDE00"])
  public preservesCharacterAndQuantifierBoundaries(value: string, flags: string, expectedCharacters: readonly string[]): void {
    const result = RegexParserFixture.parse(`${value}+`, flags);
    const nodes = result.rootNode.patternNode.disjunctionNode.children[0].children;

    Assert.areEqual(0, result.diagnostics.length);
    Assert.areEqual(expectedCharacters.length + 1, nodes.length);
    let offset = 0;

    for (let index = 0; index < expectedCharacters.length; index++) {
      const expectedCharacter = expectedCharacters[index];
      const node = nodes[index];
      Assert.isDefined(expectedCharacter);
      Assert.isInstanceOf(node, RegexCharacterNode);
      Assert.areEqual(expectedCharacter, node.value);
      Assert.areEqual(offset, node.span.startOffset);
      Assert.areEqual(expectedCharacter.length, node.span.length);
      offset += expectedCharacter.length;
    }

    const quantifier = nodes[expectedCharacters.length];
    Assert.isInstanceOf(quantifier, RegexQuantifierNode);
    Assert.areEqual(1n, quantifier.minimum);
    Assert.isUndefined(quantifier.maximum);
    Assert.areEqual(value.length, quantifier.span.startOffset);
    Assert.areEqual(1, quantifier.span.length);
  }
}
