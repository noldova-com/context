/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexCharacterNode, RegexCloseBracketNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { RegexParserFixture } from "../../../fixtures/regex-parser.fixture.js";

@TestClass
export class RegexCloseBracketNodeExtensionsTests {
  @TestMethod
  @TestData("", true)
  @TestData("u", false)
  @TestData("v", false)
  public interpretsTheTokenAccordingToUnicodeMode(flags: string, isLiteral: boolean): void {
    const parser = RegexParserFixture.createSyntaxParser("]a", flags);
    const node = parser.currentNode;
    Assert.isInstanceOf(node, RegexCloseBracketNode);
    const offset = parser.regexLexer.reader.currentOffset;

    const atom = node.parseRegexAtom(parser);

    if (isLiteral) {
      Assert.isInstanceOf(atom, RegexCharacterNode);
      Assert.areEqual("]", atom.value);
      Assert.areEqual(node.span, atom.span);
      Assert.isInstanceOf(parser.currentNode, RegexCharacterNode);
      Assert.areEqual("a", parser.currentNode.value);
    }
    else {
      Assert.isUndefined(atom);
      Assert.areEqual(node, parser.currentNode);
      Assert.areEqual(offset, parser.regexLexer.reader.currentOffset);
    }
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }
}
