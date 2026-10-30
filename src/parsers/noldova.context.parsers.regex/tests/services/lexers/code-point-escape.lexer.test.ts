/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexQuantifierNode, RegexUnicodeEscapeNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { RegexParserFixture } from "../../fixtures/regex-parser.fixture.js";

@TestClass
export class CodePointEscapeLexerTests {
  @TestMethod
  @TestData("\\uD83D\\uDE00", "", [0xD83D, 0xDE00])
  @TestData("\\uD83D\\uDE00", "u", [0x1F600])
  @TestData("\\uD83D\\uDE00", "v", [0x1F600])
  @TestData("\\uD83D", "", [0xD83D])
  @TestData("\\uD83D", "u", [0xD83D])
  @TestData("\\uD83D", "v", [0xD83D])
  @TestData("\\uDE00", "", [0xDE00])
  @TestData("\\uDE00", "u", [0xDE00])
  @TestData("\\uDE00", "v", [0xDE00])
  public preservesUnicodeEscapeAndQuantifierBoundaries(value: string, flags: string, expectedCodePoints: readonly number[]): void {
    const result = RegexParserFixture.parse(`${value}+`, flags);
    const nodes = result.rootNode.patternNode.disjunctionNode.children[0].children;
    const escapeLength = value.length / expectedCodePoints.length;

    Assert.areEqual(0, result.diagnostics.length);
    Assert.areEqual(expectedCodePoints.length + 1, nodes.length);

    for (let index = 0; index < expectedCodePoints.length; index++) {
      const node = nodes[index];
      Assert.isInstanceOf(node, RegexUnicodeEscapeNode);
      Assert.areEqual(expectedCodePoints[index], node.codePoint);
      Assert.areEqual(index * escapeLength, node.span.startOffset);
      Assert.areEqual(escapeLength, node.span.length);
      Assert.areEqual(value.substring(index * escapeLength, (index + 1) * escapeLength), node.value);
    }

    const quantifier = nodes[expectedCodePoints.length];
    Assert.isInstanceOf(quantifier, RegexQuantifierNode);
    Assert.areEqual(1n, quantifier.minimum);
    Assert.isUndefined(quantifier.maximum);
    Assert.areEqual(value.length, quantifier.span.startOffset);
    Assert.areEqual(1, quantifier.span.length);
  }

  @TestMethod
  public lexesBracedUnicodeCodePoints(): void {
    const node = RegexParserFixture.parseFirstAlternative("\\u{1F600}", "u").children[0];

    Assert.isInstanceOf(node, RegexUnicodeEscapeNode);
    Assert.areEqual(0x1F600, node.codePoint);
  }
}
