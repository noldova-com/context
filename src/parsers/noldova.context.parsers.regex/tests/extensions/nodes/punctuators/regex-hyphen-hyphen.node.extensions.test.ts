/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexCharacterNode, RegexClassSubtractionNode, RegexHyphenHyphenNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { RegexParserFixture } from "../../../fixtures/regex-parser.fixture.js";

@TestClass
export class RegexHyphenHyphenNodeExtensionsTests {
  @TestMethod
  public createsItsSetExpression(): void {
    const parser = RegexParserFixture.createSyntaxParser("[a--b]", "v");
    parser.advance();
    const operand = parser.currentNode;
    parser.advance();
    const operatorNode = parser.currentNode;
    Assert.isTrue(operatorNode.isRegexClassSetOperator());
    const expression = operatorNode.createRegexClassSetExpression([operand], operand.span);
    Assert.isInstanceOf(expression, RegexClassSubtractionNode);
    Assert.areEqual(operand, expression.children[0]);
    Assert.areEqual(operand.span, expression.span);
  }

  @TestMethod
  public createsACharacterAtomAndAdvancesOnce(): void {
    const parser = RegexParserFixture.createSyntaxParser("[--a]", "v");
    parser.advance();
    const node = parser.currentNode;
    Assert.isInstanceOf(node, RegexHyphenHyphenNode);

    const atom = node.parseRegexAtom(parser);

    Assert.isInstanceOf(atom, RegexCharacterNode);
    Assert.areEqual("--", atom.value);
    Assert.areEqual(node.span, atom.span);
    Assert.isInstanceOf(parser.currentNode, RegexCharacterNode);
    Assert.areEqual("a", parser.currentNode.value);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }
}
