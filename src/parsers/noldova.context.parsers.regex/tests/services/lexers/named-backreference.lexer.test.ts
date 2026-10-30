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
export class NamedBackreferenceLexerTests {
  @TestMethod
  @TestData(1_000)
  @TestData(4_000)
  public resolvesManyForwardAndBackwardReferences(count: number): void {
    const groups: string[] = [];
    for (let index = 0; index < count; index++)
      groups.push(`(?<group${index}>a)`);

    const name = `group${count - 1}`;
    const references = `\\k<${name}>`.repeat(count);
    const result = RegexParserFixture.parse(references + groups.join(String.empty) + references, "u");
    const nodes = result.rootNode.patternNode.disjunctionNode.children[0].children;

    Assert.areEqual(0, result.diagnostics.length);
    Assert.areEqual(count * 3, nodes.length);

    for (let index = 0; index < count; index++) {
      const forwardReference = nodes[index];
      const group = nodes[count + index];
      const backwardReference = nodes[count * 2 + index];
      Assert.isInstanceOf(forwardReference, RegexNamedBackreferenceNode);
      Assert.isInstanceOf(group, RegexNamedCapturingGroupNode);
      Assert.isInstanceOf(backwardReference, RegexNamedBackreferenceNode);
      Assert.areEqual(name, forwardReference.groupName);
      Assert.areEqual(index + 1, group.groupIndex);
      Assert.areEqual(`group${index}`, group.groupName);
      Assert.areEqual(name, backwardReference.groupName);
    }
  }

  @TestMethod
  @TestData("")
  @TestData("u")
  @TestData("v")
  public resolvesEscapedAndSupplementaryNamesInBothDirections(flags: string): void {
    const result = RegexParserFixture.parse("\\k<\\u{10400}>(?<\\uD801\\uDC00>a)\\k<\u{10400}>", flags);
    const nodes = result.rootNode.patternNode.disjunctionNode.children[0].children;
    const forwardReference = nodes[0];
    const group = nodes[1];
    const backwardReference = nodes[2];

    Assert.areEqual(0, result.diagnostics.length);
    Assert.areEqual(3, nodes.length);
    Assert.isInstanceOf(forwardReference, RegexNamedBackreferenceNode);
    Assert.isInstanceOf(group, RegexNamedCapturingGroupNode);
    Assert.isInstanceOf(backwardReference, RegexNamedBackreferenceNode);
    Assert.areEqual("\u{10400}", forwardReference.groupName);
    Assert.areEqual("\u{10400}", group.groupName);
    Assert.areEqual("\u{10400}", backwardReference.groupName);
  }

  @TestMethod
  @TestData("(?<n>a)[\\k<n>]", "", 8)
  @TestData("(?<n>a)[\\k<n>]", "u", 8)
  @TestData("(?<n>a)[\\k<n>]", "v", 8)
  @TestData("[\\k<n>](?<n>a)", "", 1)
  @TestData("[\\k<n>](?<n>a)", "u", 1)
  @TestData("[\\k<n>](?<n>a)", "v", 1)
  public rejectsNamedBackreferencesInsideCharacterClasses(pattern: string, flags: string, startOffset: number): void {
    const result = RegexParserFixture.parse(pattern, flags);

    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("CTX1014", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(startOffset, result.diagnostics[0]?.location?.start);
    Assert.areEqual(2, result.diagnostics[0]?.location?.length);
  }

  @TestMethod
  @TestData("(?<n>a)\\k<n>", "")
  @TestData("(?<n>a)\\k<n>", "u")
  @TestData("(?<n>a)\\k<n>", "v")
  @TestData("\\k<n>(?<n>a)", "")
  @TestData("\\k<n>(?<n>a)", "u")
  @TestData("\\k<n>(?<n>a)", "v")
  @TestData("[\\k<n>]", "")
  public preservesBackreferencesAndLegacyIdentityEscapes(pattern: string, flags: string): void {
    Assert.areEqual(0, RegexParserFixture.parse(pattern, flags).diagnostics.length);
  }

  @TestMethod
  public lexesNamedBackreferences(): void {
    const node = RegexParserFixture.parseFirstAlternative("\\k<name>(?<name>a)", "u").children[0];

    Assert.isInstanceOf(node, RegexNamedBackreferenceNode);
    Assert.areEqual("name", node.groupName);
  }
}
