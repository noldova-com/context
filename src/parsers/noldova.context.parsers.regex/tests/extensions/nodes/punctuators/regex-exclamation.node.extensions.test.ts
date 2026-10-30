/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexCharacterNode, RegexExclamationNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { RegexParserFixture } from "../../../fixtures/regex-parser.fixture.js";

@TestClass
export class RegexExclamationNodeExtensionsTests {
  @TestMethod
  @TestData("")
  @TestData("u")
  @TestData("v")
  public createsACharacterAtomAndAdvancesOnce(flags: string): void {
    const parser = RegexParserFixture.createSyntaxParser("!a", flags);
    const node = parser.currentNode;
    Assert.isInstanceOf(node, RegexExclamationNode);

    const atom = node.parseRegexAtom(parser);

    Assert.isInstanceOf(atom, RegexCharacterNode);
    Assert.areEqual("!", atom.value);
    Assert.areEqual(node.span, atom.span);
    Assert.isInstanceOf(parser.currentNode, RegexCharacterNode);
    Assert.areEqual("a", parser.currentNode.value);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }
}
