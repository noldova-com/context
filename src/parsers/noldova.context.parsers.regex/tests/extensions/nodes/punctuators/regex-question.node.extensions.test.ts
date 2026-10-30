/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexQuestionNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { RegexParserFixture } from "../../../fixtures/regex-parser.fixture.js";

@TestClass
export class RegexQuestionNodeExtensionsTests {
  @TestMethod
  public suppliesItsSimpleQuantifierBounds(): void {
    const parser = RegexParserFixture.createSyntaxParser("?");
    Assert.areEqual(0n, parser.currentNode.getRegexQuantifierMinimum());
    Assert.areEqual(1n, parser.currentNode.getRegexQuantifierMaximum());
  }

  @TestMethod
  @TestData("")
  @TestData("u")
  @TestData("v")
  public doesNotConsumeANonAtom(flags: string): void {
    const parser = RegexParserFixture.createSyntaxParser("?a", flags);
    const node = parser.currentNode;
    Assert.isInstanceOf(node, RegexQuestionNode);
    const offset = parser.regexLexer.reader.currentOffset;

    const atom = node.parseRegexAtom(parser);

    Assert.isUndefined(atom);
    Assert.areEqual(node, parser.currentNode);
    Assert.areEqual(offset, parser.regexLexer.reader.currentOffset);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }
}
