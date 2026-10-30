/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexCapturingGroupNode, RegexCharacterNode, RegexOpenParenthesisNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { RegexParserFixture } from "../../../fixtures/regex-parser.fixture.js";

@TestClass
export class RegexOpenParenthesisNodeExtensionsTests {
  @TestMethod
  @TestData("")
  @TestData("u")
  @TestData("v")
  public parsesTheGrammarAndAdvancesPastItsClosingToken(flags: string): void {
    const parser = RegexParserFixture.createSyntaxParser("(a)b", flags);
    const node = parser.currentNode;
    Assert.isInstanceOf(node, RegexOpenParenthesisNode);

    const atom = node.parseRegexAtom(parser);

    Assert.isInstanceOf(atom, RegexCapturingGroupNode);
    Assert.areEqual("(a)", parser.regexLexer.reader.source.getText(atom.span));
    Assert.isInstanceOf(parser.currentNode, RegexCharacterNode);
    Assert.areEqual("b", parser.currentNode.value);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }
}
