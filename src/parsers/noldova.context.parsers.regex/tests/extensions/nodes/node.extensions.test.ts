/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import { RegexClassUnionNode, RegexDotNode, RegexPlusNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { RegexParserFixture } from "../../fixtures/regex-parser.fixture.js";

@TestClass
export class NodeExtensionsTests {
  @TestMethod
  public suppliesDefaultsForOrdinaryNodes(): void {
    const node = new RegexDotNode(new SourceSpan(0, 1));
    Assert.isUndefined(node.getRegexQuantifierMinimum());
    Assert.isUndefined(node.getRegexQuantifierMaximum());
    Assert.isFalse(node.isSimpleRegexAssertion());
    Assert.isFalse(node.isRegexClassSetOperator());
    Assert.isFalse(node.mayContainRegexStrings());
    const union = node.createRegexClassSetExpression([node], node.span);
    Assert.isInstanceOf(union, RegexClassUnionNode);
    Assert.areEqual(node, union.children[0]);
    Assert.areEqual(node.span, union.span);
  }

  @TestMethod
  public nonCharacterNodesDoNotRepresentRangeEndpoints(): void {
    Assert.isUndefined(new RegexDotNode(new SourceSpan(0, 1)).getRegexCharacterValue());
  }

  @TestMethod
  @TestData("a+b")
  @TestData(".+b")
  @TestData("\\d+b")
  @TestData("\\x41+b")
  public parsingAnAtomPreservesItsIdentityAndAdvancesOnce(pattern: string): void {
    const parser = RegexParserFixture.createSyntaxParser(pattern);
    const node = parser.currentNode;

    const atom = node.parseRegexAtom(parser);

    Assert.areEqual(node, atom);
    Assert.isInstanceOf(parser.currentNode, RegexPlusNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }
}
