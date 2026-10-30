/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import { RegexCharacterNode, RegexHyphenNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { RegexParserFixture } from "../../../fixtures/regex-parser.fixture.js";

@TestClass
export class RegexHyphenNodeExtensionsTests {
  @TestMethod
  public returnsTheHyphenCodePoint(): void {
    Assert.areEqual(0x2D, new RegexHyphenNode(new SourceSpan(0, 1)).getRegexCharacterValue());
  }

  @TestMethod
  @TestData("")
  @TestData("u")
  @TestData("v")
  public createsACharacterAtomAndAdvancesOnce(flags: string): void {
    const parser = RegexParserFixture.createSyntaxParser("-a", flags);
    const node = parser.currentNode;
    Assert.isInstanceOf(node, RegexHyphenNode);

    const atom = node.parseRegexAtom(parser);

    Assert.isInstanceOf(atom, RegexCharacterNode);
    Assert.areEqual("-", atom.value);
    Assert.areEqual(node.span, atom.span);
    Assert.isInstanceOf(parser.currentNode, RegexCharacterNode);
    Assert.areEqual("a", parser.currentNode.value);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }
}
