/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import type { Node } from "@noldova/context.parsers";
import {
  RegexAlternativeNode,
  RegexCapturingGroupNode,
  RegexLookbehindAssertionNode,
  RegexModifierGroupNode,
  RegexNamedCapturingGroupNode,
  RegexNonCapturingGroupNode
} from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { RegexParserFixture } from "../../fixtures/regex-parser.fixture.js";

@TestClass
export class RegexGroupParserTests {
  @TestMethod
  public parsesCapturingAndNonCapturingGroups(): void {
    const capturing = this.getFirstNode("(a)");
    const nonCapturing = this.getFirstNode("(?:a)");

    Assert.isInstanceOf(capturing, RegexCapturingGroupNode);
    Assert.isInstanceOf(nonCapturing, RegexNonCapturingGroupNode);
    Assert.areEqual(3, capturing.span.length);
    Assert.areEqual(1, capturing.groupIndex);
    Assert.areEqual(5, nonCapturing.span.length);
  }

  @TestMethod
  public parsesNamedGroupsAndDecodedUnicodeNames(): void {
    const named = this.getFirstNode("(?<na\\u006de>a)");
    const recovered = this.getFirstNode("(?<na-me>a)");
    Assert.isInstanceOf(named, RegexNamedCapturingGroupNode);
    Assert.isInstanceOf(recovered, RegexNamedCapturingGroupNode);

    Assert.areEqual("name", named.groupName);
    Assert.areEqual(1, named.groupIndex);
    Assert.areEqual("na-me", recovered.groupName);
    Assert.areEqual(1, named.disjunctionNode.children.length);
  }

  @TestMethod
  public parsesModifierGroupsAndLookbehinds(): void {
    const modifier = this.getFirstNode("(?im-s:a)");
    const lookbehind = this.getFirstNode("(?<!a)");

    Assert.isInstanceOf(modifier, RegexModifierGroupNode);
    Assert.areEqual("im", modifier.enabledModifiers);
    Assert.areEqual("s", modifier.disabledModifiers);
    Assert.isInstanceOf(lookbehind, RegexLookbehindAssertionNode);
    Assert.isTrue(lookbehind.negated);
  }

  @TestMethod
  public recoversAtTheEndOfAnUnclosedGroup(): void {
    const result = RegexParserFixture.parse("(a");
    const alternative = result.rootNode.patternNode.disjunctionNode.children[0];
    Assert.isInstanceOf(alternative, RegexAlternativeNode);
    const group = alternative.children[0];
    Assert.isInstanceOf(group, RegexCapturingGroupNode);
    Assert.areEqual(2, group.span.length);
    Assert.areEqual("CTX1003", result.diagnostics[0]?.code.displayText);
  }

  @TestMethod
  public assignsCaptureIndexesAndValidatesNames(): void {
    const result = RegexParserFixture.parse("(a)(?<name>b)(?<na-me>c)", "u");
    const alternative = result.rootNode.patternNode.disjunctionNode.children[0];
    Assert.isInstanceOf(alternative, RegexAlternativeNode);
    const first = alternative.children[0];
    const second = alternative.children[1];
    Assert.isInstanceOf(first, RegexCapturingGroupNode);
    Assert.isInstanceOf(second, RegexNamedCapturingGroupNode);
    Assert.areEqual(1, first.groupIndex);
    Assert.areEqual(2, second.groupIndex);
    Assert.isTrue(result.diagnostics.some(t => t.code.displayText === "CTX1023"));
  }

  @TestMethod
  public permitsDuplicateNamesOnlyAcrossMutuallyExclusiveAlternatives(): void {
    const valid = RegexParserFixture.parse("(?<value>a)|(?<value>b)", "u");
    const invalid = RegexParserFixture.parse("(?<value>a)(?<value>b)", "u");

    Assert.isFalse(valid.diagnostics.some(t => t.code.displayText === "CTX1024"));
    Assert.isTrue(invalid.diagnostics.some(t => t.code.displayText === "CTX1024"));
  }

  @TestMethod
  public validatesModifierGroupPrefixes(): void {
    Assert.isTrue(this.hasDiagnostic("(?-:a)", "CTX1006"));
    Assert.isTrue(this.hasDiagnostic("(?x:a)", "CTX1007"));
    Assert.isTrue(this.hasDiagnostic("(?ii:a)", "CTX1008"));
    Assert.isTrue(this.hasDiagnostic("(?-ii:a)", "CTX1008"));
    Assert.isTrue(this.hasDiagnostic("(?i-i:a)", "CTX1009"));
    Assert.isTrue(this.hasDiagnostic("(?*:a)", "CTX1005"));
    Assert.isTrue(this.hasDiagnostic("(?i a)", "CTX1010"));
    Assert.isFalse(this.hasDiagnostic("(?-i:a)", "CTX1006"));
  }

  @TestMethod
  public reportsExcessiveNestingWithoutCrashing(): void {
    const nestingDepth = 1_000;
    const pattern = "(".repeat(nestingDepth) + "a" + ")".repeat(nestingDepth);
    const result = RegexParserFixture.parse(pattern);

    Assert.areEqual(1, result.diagnostics.filter(t => t.code.displayText === "CTX1037").length);
  }

  private getFirstNode(pattern: string): Node {
    const alternative = RegexParserFixture.parseFirstAlternative(pattern);
    const node = alternative.children[0];
    Assert.isDefined(node);
    return node;
  }

  private hasDiagnostic(pattern: string, code: string): boolean {
    return RegexParserFixture.parse(pattern, "u").diagnostics.some(t => t.code.displayText === code);
  }
}
