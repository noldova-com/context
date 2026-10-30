/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ParserContext } from "@noldova/context.parsers";
import { RegexAlternativeNode, RegexNamedCapturingGroupNode } from "@noldova/context.parsers.regex";
import { RegexParserContext } from "@noldova/context.parsers.regex/models/regex-parser-context.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { RegexParserFixture } from "../fixtures/regex-parser.fixture.js";

@TestClass
export class RegexParserContextTests {
  @TestMethod
  @TestData("(?<n>a)|(?<n>b)", 0)
  @TestData("(?:(?<n>a)|(?<n>b))", 0)
  @TestData("(?:(?<n>a)|(?:(?<n>b)|(?<n>c)))", 0)
  @TestData("(?:(?<n>a)|b)|(?:(?<n>c)|d)", 0)
  @TestData("(?<n>a)|(?<n>b)|(?<n>c)", 0)
  @TestData("(?<n>a)(?<m>b)", 0)
  @TestData("(?:(?<n>a)|b)(?:(?<n>c)|d)", 1)
  @TestData("(?<n>a)(?<n>b)", 1)
  @TestData("(?<n>a)(?:(?<n>b)|c)", 1)
  @TestData("(?:(?<n>a)|b)(?<n>c)", 1)
  @TestData("(?<n>a(?<n>b))", 1)
  @TestData("(?:(?<n>a)|(?<n>b))(?<n>c)", 1)
  public distinguishesExclusiveAndCompatibleBranchPaths(pattern: string, diagnosticCount: number): void {
    const result = RegexParserFixture.parse(pattern, "u");

    Assert.areEqual(diagnosticCount, result.diagnostics.length);
    Assert.isTrue(result.diagnostics.every(t => t.code.displayText === "CTX1024"));
  }

  @TestMethod
  public handlesManyDistinctNamesAndStillFindsADuplicate(): void {
    const groups: string[] = [];
    for (let index = 0; index < 4000; index++)
      groups.push(`(?<group${index}>a)`);
    groups.push("(?<group0>b)");

    const result = RegexParserFixture.parse(groups.join(String.empty), "u");
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("CTX1024", result.diagnostics[0]?.code.displayText);
  }

  @TestMethod
  public comparesRepeatedNamesAcrossNestedAndSequentialAlternatives(): void {
    const valid = RegexParserFixture.parse("(?:(?<a>x)|(?:(?<a>y)|(?<a>z)))", "u");
    const invalid = RegexParserFixture.parse("(?:(?<a>x)|y)(?:(?<a>z)|w)", "u");

    Assert.areEqual(0, valid.diagnostics.length);
    Assert.areEqual(1, invalid.diagnostics.length);
    Assert.areEqual("CTX1024", invalid.diagnostics[0]?.code.displayText);
  }

  @TestMethod
  public sharesItsDiagnosticCollectorWithTheLexer(): void {
    const parser = RegexParserFixture.createSyntaxParser("\\qa", "u");

    Assert.isInstanceOf(parser.context, ParserContext);
    Assert.isInstanceOf(parser.context, RegexParserContext);
    Assert.areEqual(parser.regexLexer.diagnosticCollector, parser.context.diagnosticCollector);
    Assert.areEqual("u", parser.regexLexer.flagsNode.value);
    Assert.areEqual(1, parser.context.diagnosticCollector.diagnostics.length);
    Assert.areEqual("CTX1014", parser.context.diagnosticCollector.diagnostics[0]?.code.displayText);
  }

  @TestMethod
  public lookAheadDoesNotRegisterOrNumberCapturingGroups(): void {
    const parser = RegexParserFixture.createSyntaxParser("(?<name>a)(?<name>b)");
    parser.lookAhead(() => {
      while (!parser.isEndOfFile)
        parser.advance();

      return true;
    });

    const result = parser.parse();
    const alternative = result.rootNode.patternNode.disjunctionNode.children[0];
    Assert.isInstanceOf(alternative, RegexAlternativeNode);
    const first = alternative.children[0];
    const second = alternative.children[1];
    Assert.isInstanceOf(first, RegexNamedCapturingGroupNode);
    Assert.isInstanceOf(second, RegexNamedCapturingGroupNode);
    Assert.areEqual(1, first.groupIndex);
    Assert.areEqual(2, second.groupIndex);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("CTX1024", result.diagnostics[0]?.code.displayText);
  }
}
