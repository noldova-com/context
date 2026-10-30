/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { RegexCharacterNode, RegexQuantifierNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { RegexParserFixture } from "../../fixtures/regex-parser.fixture.js";

@TestClass
export class RegexQuantifierParserTests {
  @TestMethod
  public parsesSimpleGreedyAndLazyQuantifiers(): void {
    const patterns = ["a*", "a+", "a?", "a*?"];
    const minimums = [0n, 1n, 0n, 0n];
    const maximums: readonly (bigint | undefined)[] = [undefined, undefined, 1n, undefined];

    for (let index = 0; index < patterns.length; index++) {
      const pattern = patterns[index];
      const minimum = minimums[index];
      const maximum = maximums[index];
      Assert.isDefined(pattern);
      Assert.isDefined(minimum);
      const quantifier = this.getQuantifier(pattern);
      Assert.areEqual(minimum, quantifier.minimum);
      Assert.areEqual(maximum, quantifier.maximum);
      Assert.areEqual(index !== patterns.length - 1, quantifier.greedy);
    }
  }

  @TestMethod
  public parsesEveryBracedQuantifierForm(): void {
    const exact = this.getQuantifier("a{2}");
    const unbounded = this.getQuantifier("a{2,}");
    const bounded = this.getQuantifier("a{2,4}?");

    Assert.areEqual(2n, exact.minimum);
    Assert.areEqual(2n, exact.maximum);
    Assert.isUndefined(unbounded.maximum);
    Assert.areEqual(2n, bounded.minimum);
    Assert.areEqual(4n, bounded.maximum);
    Assert.isFalse(bounded.greedy);
    Assert.areEqual("{2,4}?", bounded.value);
  }

  @TestMethod
  public leavesInvalidBracesAsUnrecognizedTerms(): void {
    for (const pattern of ["a{}", "a{,2", "a{2,x}"]) {
      const alternative = RegexParserFixture.parseFirstAlternative(pattern);
      Assert.isInstanceOf(alternative.children[1], RegexCharacterNode);
    }
  }

  @TestMethod
  public parsesBoundsBeyondNumberPrecisionExactly(): void {
    const quantifier = this.getQuantifier("a{9223372036854775807,9223372036854775808}");

    Assert.areEqual(9223372036854775807n, quantifier.minimum);
    Assert.areEqual(9223372036854775808n, quantifier.maximum);
  }

  @TestMethod
  public reportsInvalidBoundsAndMisplacedQuantifiers(): void {
    const reversed = RegexParserFixture.parse("a{8,7}");
    const misplaced = RegexParserFixture.parse("*a");
    const incomplete = RegexParserFixture.parse("a{,2}", "u");

    Assert.isTrue(reversed.diagnostics.some(t => t.code.displayText === "CTX1012"));
    Assert.isTrue(misplaced.diagnostics.some(t => t.code.displayText === "CTX1013"));
    Assert.isTrue(incomplete.diagnostics.some(t => t.code.displayText === "CTX1011"));
  }

  private getQuantifier(pattern: string): RegexQuantifierNode {
    const alternative = RegexParserFixture.parseFirstAlternative(pattern);
    const quantifier = alternative.children[1];
    Assert.isInstanceOf(quantifier, RegexQuantifierNode);
    return quantifier;
  }
}
