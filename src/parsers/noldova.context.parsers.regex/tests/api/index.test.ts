/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as api from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class RegexParserApiTests {
  private static readonly PUBLIC_EXPORTS: readonly string[] = [
    "RegexAlternativeNode",
    "RegexAmpersandAmpersandNode",
    "RegexAsteriskNode",
    "RegexBackreferenceNode",
    "RegexBackspaceEscapeNode",
    "RegexBarNode",
    "RegexCapturingGroupNode",
    "RegexCarriageReturnEscapeNode",
    "RegexCharacterClassNode",
    "RegexCharacterNode",
    "RegexCharacterRangeNode",
    "RegexClassControlEscapeNode",
    "RegexClassIntersectionNode",
    "RegexClassStringDisjunctionNode",
    "RegexClassStringDisjunctionStartNode",
    "RegexClassStringNode",
    "RegexClassSubtractionNode",
    "RegexClassUnionNode",
    "RegexCloseBraceNode",
    "RegexCloseBracketNode",
    "RegexCloseParenthesisNode",
    "RegexColonNode",
    "RegexCommaNode",
    "RegexControlLetterEscapeNode",
    "RegexDecimalEscapeNode",
    "RegexDigitEscapeNode",
    "RegexDisjunctionNode",
    "RegexDotNode",
    "RegexEndAssertionNode",
    "RegexEqualsNode",
    "RegexExclamationNode",
    "RegexFlagsNode",
    "RegexFormFeedEscapeNode",
    "RegexGreaterThanNode",
    "RegexHexEscapeNode",
    "RegexHyphenHyphenNode",
    "RegexHyphenNode",
    "RegexIdentityEscapeNode",
    "RegexLegacyOctalEscapeNode",
    "RegexLessThanNode",
    "RegexLookaheadAssertionNode",
    "RegexLookbehindAssertionNode",
    "RegexModifierGroupNode",
    "RegexNamedBackreferenceNode",
    "RegexNamedCapturingGroupNode",
    "RegexNewlineEscapeNode",
    "RegexNode",
    "RegexNonCapturingGroupNode",
    "RegexNonDigitEscapeNode",
    "RegexNonWhitespaceEscapeNode",
    "RegexNonWordBoundaryAssertionNode",
    "RegexNonWordEscapeNode",
    "RegexNullEscapeNode",
    "RegexOpenBraceNode",
    "RegexOpenBracketNode",
    "RegexOpenParenthesisNode",
    "RegexParser",
    "RegexPatternNode",
    "RegexPlusNode",
    "RegexQuantifierNode",
    "RegexQuestionNode",
    "RegexStartAssertionNode",
    "RegexTabEscapeNode",
    "RegexUnicodeEscapeNode",
    "RegexUnicodePropertyEscapeNode",
    "RegexUnknownNode",
    "RegexVerticalTabEscapeNode",
    "RegexWhitespaceEscapeNode",
    "RegexWordBoundaryAssertionNode",
    "RegexWordEscapeNode"
  ];

  @TestMethod
  public exposesTheReviewedPublicSurfaceOnly(): void {
    Assert.isDefined(api);
    const exports = Object.keys(api);
    Assert.areEqual(RegexParserApiTests.PUBLIC_EXPORTS.length, exports.length);

    for (const name of RegexParserApiTests.PUBLIC_EXPORTS)
      Assert.isTrue(Object.hasOwn(api, name));
  }
}
