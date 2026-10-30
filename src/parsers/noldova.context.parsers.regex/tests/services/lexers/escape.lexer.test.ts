/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type Node, type NodeType, ValueNode } from "@noldova/context.parsers";
import {
  RegexBackreferenceNode,
  RegexBackspaceEscapeNode,
  RegexCarriageReturnEscapeNode,
  RegexCharacterClassNode,
  RegexCharacterNode,
  RegexClassControlEscapeNode,
  RegexClassStringDisjunctionNode,
  RegexClassUnionNode,
  RegexControlLetterEscapeNode,
  RegexDecimalEscapeNode,
  RegexDigitEscapeNode,
  RegexFormFeedEscapeNode,
  RegexHexEscapeNode,
  RegexIdentityEscapeNode,
  RegexLegacyOctalEscapeNode,
  RegexNamedBackreferenceNode,
  RegexNewlineEscapeNode,
  RegexNonDigitEscapeNode,
  RegexNonWhitespaceEscapeNode,
  RegexNonWordBoundaryAssertionNode,
  RegexNonWordEscapeNode,
  RegexNullEscapeNode,
  RegexQuantifierNode,
  RegexTabEscapeNode,
  RegexUnicodeEscapeNode,
  RegexUnicodePropertyEscapeNode,
  RegexUnknownNode,
  RegexVerticalTabEscapeNode,
  RegexWhitespaceEscapeNode,
  RegexWordBoundaryAssertionNode,
  RegexWordEscapeNode
} from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { RegexParserFixture } from "../../fixtures/regex-parser.fixture.js";

@TestClass
export class EscapeLexerTests {
  @TestMethod
  @TestData("")
  @TestData("u")
  @TestData("v")
  public preservesEscapedClassSyntaxCharactersAcrossModes(flags: string): void {
    for (const character of [".", "\\", "]"]) {
      const result = RegexParserFixture.parse(`[\\${character}]`, flags);
      const characterClass = result.rootNode.patternNode.disjunctionNode.children[0].children[0];

      Assert.areEqual(0, result.diagnostics.length);
      Assert.isInstanceOf(characterClass, RegexCharacterClassNode);
      Assert.isInstanceOf(characterClass.expressionNode, RegexClassUnionNode);
      Assert.areEqual(1, characterClass.expressionNode.children.length);

      const identity = characterClass.expressionNode.children[0];
      Assert.isInstanceOf(identity, RegexIdentityEscapeNode);
      Assert.areEqual(`\\${character}`, identity.value);
      Assert.areEqual(character.charCodeAt(0), identity.codePoint);
      Assert.areEqual(1, identity.span.startOffset);
      Assert.areEqual(2, identity.span.length);
    }
  }

  @TestMethod
  @TestData("a", [0x61])
  @TestData("π", [0x3C0])
  @TestData("😀", [0xD83D, 0xDE00])
  @TestData("\uD83D", [0xD83D])
  @TestData("\uDE00", [0xDE00])
  public preservesLegacyIdentityEscapeAndQuantifierBoundaries(value: string, expectedCodeUnits: readonly number[]): void {
    const result = RegexParserFixture.parse(`\\${value}+`);
    const nodes = result.rootNode.patternNode.disjunctionNode.children[0].children;

    Assert.areEqual(0, result.diagnostics.length);
    Assert.areEqual(expectedCodeUnits.length + 1, nodes.length);

    for (let index = 0; index < expectedCodeUnits.length; index++) {
      const codeUnit = expectedCodeUnits[index];
      const node = nodes[index];
      Assert.isDefined(codeUnit);

      if (index === 0) {
        Assert.isInstanceOf(node, RegexIdentityEscapeNode);
        Assert.areEqual(codeUnit, node.codePoint);
        Assert.areEqual(`\\${String.fromCharCode(codeUnit)}`, node.value);
        Assert.areEqual(0, node.span.startOffset);
        Assert.areEqual(2, node.span.length);
      }
      else {
        Assert.isInstanceOf(node, RegexCharacterNode);
        Assert.areEqual(String.fromCharCode(codeUnit), node.value);
        Assert.areEqual(index + 1, node.span.startOffset);
        Assert.areEqual(1, node.span.length);
      }
    }

    const quantifier = nodes[expectedCodeUnits.length];
    Assert.isInstanceOf(quantifier, RegexQuantifierNode);
    Assert.areEqual(1n, quantifier.minimum);
    Assert.isUndefined(quantifier.maximum);
    Assert.areEqual(value.length + 1, quantifier.span.startOffset);
    Assert.areEqual(1, quantifier.span.length);
  }

  @TestMethod
  @TestData("a", "u")
  @TestData("a", "v")
  @TestData("π", "u")
  @TestData("π", "v")
  @TestData("😀", "u")
  @TestData("😀", "v")
  @TestData("\uD83D", "u")
  @TestData("\uD83D", "v")
  @TestData("\uDE00", "u")
  @TestData("\uDE00", "v")
  public rejectsNonSyntaxIdentityEscapesInUnicodeModes(value: string, flags: string): void {
    const result = RegexParserFixture.parse(`\\${value}+`, flags);
    const nodes = result.rootNode.patternNode.disjunctionNode.children[0].children;
    const unknown = nodes[0];

    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("CTX1014", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(0, result.diagnostics[0]?.location?.start);
    Assert.areEqual(value.length + 1, result.diagnostics[0]?.location?.length);
    Assert.areEqual(2, nodes.length);
    Assert.isInstanceOf(unknown, RegexUnknownNode);
    Assert.areEqual(`\\${value}`, unknown.value);
    Assert.areEqual(0, unknown.span.startOffset);
    Assert.areEqual(value.length + 1, unknown.span.length);
    Assert.isInstanceOf(nodes[1], RegexQuantifierNode);
    Assert.areEqual(value.length + 1, nodes[1].span.startOffset);
  }

  @TestMethod
  public lexesEveryFixedSemanticEscape(): void {
    this.assertFirstNode("\\d", RegexDigitEscapeNode);
    this.assertFirstNode("\\D", RegexNonDigitEscapeNode);
    this.assertFirstNode("\\w", RegexWordEscapeNode);
    this.assertFirstNode("\\W", RegexNonWordEscapeNode);
    this.assertFirstNode("\\s", RegexWhitespaceEscapeNode);
    this.assertFirstNode("\\S", RegexNonWhitespaceEscapeNode);
    this.assertFirstNode("\\f", RegexFormFeedEscapeNode);
    this.assertFirstNode("\\n", RegexNewlineEscapeNode);
    this.assertFirstNode("\\r", RegexCarriageReturnEscapeNode);
    this.assertFirstNode("\\t", RegexTabEscapeNode);
    this.assertFirstNode("\\v", RegexVerticalTabEscapeNode);
    this.assertFirstNode("\\b", RegexWordBoundaryAssertionNode);
    this.assertFirstNode("\\B", RegexNonWordBoundaryAssertionNode);
    this.assertFirstNode("\\b", RegexBackspaceEscapeNode, String.empty, true);
    this.assertFirstNode("\\B", RegexIdentityEscapeNode, String.empty, true);
    this.assertFirstNode("\\B", RegexUnknownNode, "u", true);
  }

  @TestMethod
  public lexesControlEscapesAndRecoversInvalidControlPrefix(): void {
    const control = this.getFirstNode("\\cA");
    const classControl = this.getFirstNode("\\c0", String.empty, true);
    const underscoreControl = this.getFirstNode("\\c_", String.empty, true);
    const legacy = this.getFirstNode("\\c!");
    const invalidUnicode = this.getFirstNode("\\c!", "u");

    Assert.isInstanceOf(control, RegexControlLetterEscapeNode);
    Assert.areEqual(1, control.codePoint);
    Assert.isInstanceOf(classControl, RegexClassControlEscapeNode);
    Assert.areEqual(16, classControl.codePoint);
    Assert.isInstanceOf(underscoreControl, RegexClassControlEscapeNode);
    Assert.areEqual(31, underscoreControl.codePoint);
    Assert.isInstanceOf(legacy, RegexCharacterNode);
    Assert.areEqual("\\", legacy.value);
    Assert.isInstanceOf(invalidUnicode, RegexUnknownNode);
    Assert.areEqual("\\c", invalidUnicode.value);
  }

  @TestMethod
  public lexesNullLegacyOctalAndDecimalEscapes(): void {
    this.assertFirstNode("\\0", RegexNullEscapeNode);

    const octal = this.getFirstNode("\\012");
    const shortOctal = this.getFirstNode("\\07");
    const unicodeDecimal = this.getFirstNode("\\12", "u");
    const backreference = this.getFirstNode("\\1(a)");
    const annexB = this.getFirstNode("\\12");
    const annexBIdentity = this.getFirstNode("\\8");
    const highOctal = this.getFirstNode("\\477");
    const classOctal = this.getFirstNode("\\1", String.empty, true);
    const classIdentity = this.getFirstNode("\\8", String.empty, true);
    const legacyNull = this.getFirstNode("\\08");
    const invalidUnicode = this.getFirstNode("\\01", "u");

    Assert.isInstanceOf(octal, RegexLegacyOctalEscapeNode);
    Assert.areEqual(10, octal.codePoint);
    Assert.isInstanceOf(shortOctal, RegexLegacyOctalEscapeNode);
    Assert.areEqual(7, shortOctal.codePoint);
    Assert.isInstanceOf(unicodeDecimal, RegexDecimalEscapeNode);
    Assert.areEqual(12n, unicodeDecimal.decimalValue);
    Assert.isInstanceOf(backreference, RegexBackreferenceNode);
    Assert.areEqual(1, backreference.groupIndex);
    Assert.isInstanceOf(annexB, RegexLegacyOctalEscapeNode);
    Assert.areEqual(10, annexB.codePoint);
    Assert.isInstanceOf(annexBIdentity, RegexIdentityEscapeNode);
    Assert.isInstanceOf(highOctal, RegexLegacyOctalEscapeNode);
    Assert.areEqual(39, highOctal.codePoint);
    Assert.isInstanceOf(classOctal, RegexLegacyOctalEscapeNode);
    Assert.isInstanceOf(classIdentity, RegexIdentityEscapeNode);
    Assert.isInstanceOf(legacyNull, RegexNullEscapeNode);
    Assert.isInstanceOf(invalidUnicode, RegexUnknownNode);

    for (const pattern of ["\\1", "\\8", "\\9", "\\12", "\\477"])
      Assert.areEqual(0, RegexParserFixture.parse(pattern).diagnostics.length);
  }

  @TestMethod
  public lexesHexadecimalAndUnicodeEscapes(): void {
    const hexadecimal = this.getFirstNode("\\x41");
    const fixedUnicode = this.getFirstNode("\\u0041", "u");
    const bracedUnicode = this.getFirstNode("\\u{1F600}", "u");
    const surrogatePair = this.getFirstNode("\\uD83D\\uDE00", "u");

    Assert.isInstanceOf(hexadecimal, RegexHexEscapeNode);
    Assert.areEqual(0x41, hexadecimal.codePoint);
    Assert.isInstanceOf(fixedUnicode, RegexUnicodeEscapeNode);
    Assert.areEqual(0x41, fixedUnicode.codePoint);
    Assert.isInstanceOf(bracedUnicode, RegexUnicodeEscapeNode);
    Assert.areEqual(0x1F600, bracedUnicode.codePoint);
    Assert.isInstanceOf(surrogatePair, RegexUnicodeEscapeNode);
    Assert.areEqual(0x1F600, surrogatePair.codePoint);

    this.assertFirstNode("\\xG", RegexIdentityEscapeNode, String.empty, false, "\\x");
    this.assertFirstNode("\\xG", RegexUnknownNode, "u", false, "\\x");
    this.assertFirstNode("\\uZZZZ", RegexIdentityEscapeNode, String.empty, false, "\\u");
    this.assertFirstNode("\\uZZZZ", RegexUnknownNode, "u", false, "\\u");
  }

  @TestMethod
  public lexesAndValidatesUnicodePropertyEscapes(): void {
    const named = this.getFirstNode("\\p{Script=Greek}", "u");
    const lone = this.getFirstNode("\\P{Letter}", "v", true);
    const stringProperty = this.getFirstNode("\\p{Basic_Emoji}", "v", true);

    Assert.isInstanceOf(named, RegexUnicodePropertyEscapeNode);
    Assert.areEqual("Script", named.propertyName);
    Assert.areEqual("Greek", named.propertyValue);
    Assert.isFalse(named.negated);
    Assert.isFalse(named.mayContainStrings);
    Assert.isInstanceOf(lone, RegexUnicodePropertyEscapeNode);
    Assert.isUndefined(lone.propertyName);
    Assert.areEqual("Letter", lone.propertyValue);
    Assert.isTrue(lone.negated);
    Assert.isInstanceOf(stringProperty, RegexUnicodePropertyEscapeNode);
    Assert.isTrue(stringProperty.mayContainStrings);

    this.assertFirstNode("\\p", RegexIdentityEscapeNode);
    this.assertFirstNode("\\p", RegexUnknownNode, "u");
    this.assertFirstNode("\\p{}", RegexUnknownNode, "u");
    this.assertFirstNode("\\p{Letter", RegexUnknownNode, "u");
    this.assertFirstNode("\\p{Letter}", RegexIdentityEscapeNode, String.empty, false, "\\p");
    this.assertFirstNode("\\P{ASCII}", RegexIdentityEscapeNode, String.empty, false, "\\P");

    Assert.isTrue(this.hasDiagnostic("\\p{script=Latin}", "u", "CTX1019"));
    Assert.isTrue(this.hasDiagnostic("\\p{Script=unknown}", "u", "CTX1020"));
    Assert.isTrue(this.hasDiagnostic("\\p{Unknown}", "u", "CTX1020"));
    Assert.isTrue(this.hasDiagnostic("\\p{Basic_Emoji}", "u", "CTX1021"));
    Assert.isTrue(this.hasDiagnostic("\\P{Basic_Emoji}", "v", "CTX1022"));
  }

  @TestMethod
  public lexesNamedBackreferences(): void {
    const named = this.getFirstNode("\\k<chapter>(?<chapter>a)", "u");
    const escaped = this.getFirstNode("\\k<a\\u0062>(?<ab>a)", "u");

    Assert.isInstanceOf(named, RegexNamedBackreferenceNode);
    Assert.areEqual("chapter", named.groupName);
    Assert.isInstanceOf(escaped, RegexNamedBackreferenceNode);
    Assert.areEqual("ab", escaped.groupName);

    this.assertFirstNode("\\k", RegexIdentityEscapeNode);
    this.assertFirstNode("\\k", RegexUnknownNode, "u");
    this.assertFirstNode("\\kname(?<name>a)", RegexUnknownNode, String.empty, false, "\\k");
    this.assertFirstNode("\\k<name", RegexUnknownNode, "u", false, "\\k");
    Assert.isTrue(this.hasDiagnostic("\\k<missing>(?<other>a)", "u", "CTX1016"));
  }

  @TestMethod
  public lexesClassStringsAndIdentityEscapes(): void {
    const classString = this.getFirstNode("\\q{ab|c}", "v", true);
    Assert.isInstanceOf(classString, RegexClassStringDisjunctionNode);

    this.assertFirstNode("\\q", RegexIdentityEscapeNode);
    this.assertFirstNode("\\q", RegexUnknownNode, "u");
    this.assertFirstNode("\\.", RegexIdentityEscapeNode, "u");
    this.assertFirstNode("\\a", RegexIdentityEscapeNode);
    this.assertFirstNode("\\a", RegexUnknownNode, "u");
    this.assertFirstNode("\\-", RegexIdentityEscapeNode, "u", true);
    this.assertFirstNode("\\&", RegexIdentityEscapeNode, "v", true);
    this.assertFirstNode("\\|", RegexIdentityEscapeNode, "v", true);
  }

  @TestMethod
  @TestData("")
  @TestData("u")
  @TestData("v")
  public preservesTrailingBackslashAsUnknown(flags: string): void {
    const result = RegexParserFixture.parse("\\", flags);
    const node = result.rootNode.patternNode.disjunctionNode.children[0].children[0];

    Assert.isInstanceOf(node, RegexUnknownNode);
    Assert.areEqual("\\", node.value);
    Assert.areEqual(0, node.span.startOffset);
    Assert.areEqual(1, node.span.length);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("CTX1014", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(0, result.diagnostics[0]?.location?.start);
    Assert.areEqual(1, result.diagnostics[0]?.location?.length);
  }

  @TestMethod
  @TestData("", 0)
  @TestData("u", 1)
  @TestData("v", 1)
  public escapesANullCharacterInsteadOfTreatingItAsTheEndOfInput(flags: string, diagnosticCount: number): void {
    const result = RegexParserFixture.parse("\\\0", flags);
    const nodes = result.rootNode.patternNode.disjunctionNode.children[0].children;
    const node = nodes[0];

    Assert.areEqual(1, nodes.length);
    Assert.isDefined(node);
    Assert.areEqual(0, node.span.startOffset);
    Assert.areEqual(2, node.span.length);
    Assert.areEqual(diagnosticCount, result.diagnostics.length);

    if (diagnosticCount === 0) {
      Assert.isInstanceOf(node, RegexIdentityEscapeNode);
      Assert.areEqual(0, node.codePoint);
      Assert.areEqual("\\\0", node.value);
    }
    else {
      Assert.isInstanceOf(node, RegexUnknownNode);
      Assert.areEqual("\\\0", node.value);
      Assert.areEqual("CTX1014", result.diagnostics[0]?.code.displayText);
      Assert.areEqual(0, result.diagnostics[0]?.location?.start);
      Assert.areEqual(2, result.diagnostics[0]?.location?.length);
    }
  }

  private assertFirstNode(
    pattern: string,
    nodeType: Function & NodeType,
    flags: string = String.empty,
    isInCharacterClass: boolean = false,
    expectedValue: string = pattern): void {
    const node = this.getFirstNode(pattern, flags, isInCharacterClass);

    Assert.isInstanceOf(node, nodeType);
    Assert.isInstanceOf(node, ValueNode);
    Assert.areEqual(expectedValue, node.value);
  }

  private getFirstNode(pattern: string, flags: string = String.empty, isInCharacterClass: boolean = false): Node {
    const alternative = RegexParserFixture.parseFirstAlternative(isInCharacterClass ? `[${pattern}]` : pattern, flags);
    const node = alternative.children[0];
    Assert.isDefined(node);

    if (!isInCharacterClass)
      return node;

    Assert.isInstanceOf(node, RegexCharacterClassNode);
    Assert.isInstanceOf(node.expressionNode, RegexClassUnionNode);
    const classNode = node.expressionNode.children[0];
    Assert.isDefined(classNode);
    return classNode;
  }

  private hasDiagnostic(pattern: string, flags: string, code: string): boolean {
    return RegexParserFixture.parse(pattern, flags).diagnostics.some(t => t.code.displayText === code);
  }
}
