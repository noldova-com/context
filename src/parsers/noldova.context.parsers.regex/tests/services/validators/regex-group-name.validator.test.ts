/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexNamedBackreferenceNode, RegexNamedCapturingGroupNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { RegexParserFixture } from "../../fixtures/regex-parser.fixture.js";

@TestClass
export class RegexGroupNameValidatorTests {
  @TestMethod
  @TestData("")
  @TestData("u")
  @TestData("v")
  public preservesValidIdentifierElementsAcrossDeclarationsAndReferences(flags: string): void {
    for (const spelling of ["𝒜", "\\uD835\\uDC9C", "\\u{1D49C}", "\\u006E"])
      for (const prefix of [String.empty, "name"]) {
        const name = prefix + spelling;
        const expectedName = prefix + (spelling === "\\u006E" ? "n" : "𝒜");
        const result = RegexParserFixture.parse(`\\k<${name}>(?<${name}>a)\\k<${name}>`, flags);
        const nodes = result.rootNode.patternNode.disjunctionNode.children[0].children;

        Assert.areEqual(0, result.diagnostics.length);
        Assert.areEqual(3, nodes.length);
        Assert.isInstanceOf(nodes[0], RegexNamedBackreferenceNode);
        Assert.isInstanceOf(nodes[1], RegexNamedCapturingGroupNode);
        Assert.isInstanceOf(nodes[2], RegexNamedBackreferenceNode);
        Assert.areEqual(expectedName, nodes[0].groupName);
        Assert.areEqual(expectedName, nodes[1].groupName);
        Assert.areEqual(expectedName, nodes[2].groupName);
      }
  }

  @TestMethod
  @TestData("")
  @TestData("u")
  @TestData("v")
  public rejectsSurrogatesThatOnlyFormAnIdentifierAfterConcatenation(flags: string): void {
    for (const spelling of [
      "\\u{D835}\\u{DC9C}", "\\uD835\\u{DC9C}", "\\u{D835}\\uDC9C",
      "\\uD835\uDC9C", "\uD835\\uDC9C", "\\u{D835}\uDC9C", "\uD835\\u{DC9C}"])
      for (const prefix of [String.empty, "name"]) {
        const name = prefix + spelling;
        const declaration = RegexParserFixture.parse(`(?<${name}>a)`, flags);
        const declarationNode = declaration.rootNode.patternNode.disjunctionNode.children[0].children[0];

        Assert.areEqual(1, declaration.diagnostics.length);
        Assert.areEqual("CTX1023", declaration.diagnostics[0]?.code.displayText);
        Assert.areEqual(3, declaration.diagnostics[0]?.location?.start);
        Assert.areEqual(name.length, declaration.diagnostics[0]?.location?.length);
        Assert.isInstanceOf(declarationNode, RegexNamedCapturingGroupNode);
        Assert.areEqual(prefix + "𝒜", declarationNode.groupName);

        const referenceText = `\\k<${name}>`;
        const groupText = `(?<${prefix}𝒜>a)`;
        const references = RegexParserFixture.parse(referenceText + groupText + referenceText, flags);
        const nodes = references.rootNode.patternNode.disjunctionNode.children[0].children;

        Assert.areEqual(2, references.diagnostics.length);
        Assert.areEqual("CTX1032", references.diagnostics[0]?.code.displayText);
        Assert.areEqual("CTX1032", references.diagnostics[1]?.code.displayText);
        Assert.areEqual(0, references.diagnostics[0]?.location?.start);
        Assert.areEqual(referenceText.length, references.diagnostics[0]?.location?.length);
        Assert.areEqual(referenceText.length + groupText.length, references.diagnostics[1]?.location?.start);
        Assert.areEqual(referenceText.length, references.diagnostics[1]?.location?.length);
        Assert.areEqual(3, nodes.length);
        Assert.isInstanceOf(nodes[0], RegexNamedBackreferenceNode);
        Assert.isInstanceOf(nodes[2], RegexNamedBackreferenceNode);
        Assert.areEqual(prefix + "𝒜", nodes[0].groupName);
        Assert.areEqual(prefix + "𝒜", nodes[2].groupName);
      }
  }

  @TestMethod
  public acceptsEcmaScriptIdentifierNames(): void {
    for (const groupName of ["name", "$value", "_value", "π2", "value\u200Cpart", "value\u200Dpart"])
      Assert.areEqual(0, RegexParserFixture.parse(`(?<${groupName}>a)`, "u").diagnostics.length);
  }

  @TestMethod
  public rejectsEmptyAndInvalidIdentifierNames(): void {
    for (const groupName of [String.empty, "2name", "na-me", "\u200Cname", "\u200Dname"])
      Assert.isTrue(RegexParserFixture.parse(`(?<${groupName}>a)`, "u").diagnostics.length > 0);
  }
}
