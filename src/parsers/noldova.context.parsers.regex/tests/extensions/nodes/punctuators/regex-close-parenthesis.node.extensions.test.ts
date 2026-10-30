/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexCloseParenthesisNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { RegexParserFixture } from "../../../fixtures/regex-parser.fixture.js";

@TestClass
export class RegexCloseParenthesisNodeExtensionsTests {
  @TestMethod
  @TestData("")
  @TestData("u")
  @TestData("v")
  public doesNotConsumeANonAtom(flags: string): void {
    const parser = RegexParserFixture.createSyntaxParser(")a", flags);
    const node = parser.currentNode;
    Assert.isInstanceOf(node, RegexCloseParenthesisNode);
    const offset = parser.regexLexer.reader.currentOffset;

    const atom = node.parseRegexAtom(parser);

    Assert.isUndefined(atom);
    Assert.areEqual(node, parser.currentNode);
    Assert.areEqual(offset, parser.regexLexer.reader.currentOffset);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }
}
