/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  TypeScriptBreakStatementNode,
  TypeScriptContinueStatementNode,
  TypeScriptMissingIdentifierNode,
  TypeScriptParser,
  TypeScriptPrivateIdentifierNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class JumpStatementParserTests {
  @TestData("break label;", "label", "break label;")
  @TestData("break type;", "type", "break type;")
  @TestData("break\nlabel;", "", "break")
  @TestData("break;", "", "break;")
  @TestMethod
  public readsABreakLabelOnlyOnTheKeywordsLine(content: string, expectedLabel: string, expectedText: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseStatement();

    Assert.isInstanceOf(node, TypeScriptBreakStatementNode);
    Assert.areEqual(expectedLabel, Object.isUndefined(node.labelNode) ? "" : parser.context.source.getText(node.labelNode.span));
    Assert.areEqual(expectedText, parser.context.source.getText(node.span));
  }

  @TestData("continue label;", "label", "continue label;")
  @TestData("continue type;", "type", "continue type;")
  @TestData("continue\nlabel;", "", "continue")
  @TestData("continue;", "", "continue;")
  @TestMethod
  public readsAContinueLabelOnlyOnTheKeywordsLine(content: string, expectedLabel: string, expectedText: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseStatement();

    Assert.isInstanceOf(node, TypeScriptContinueStatementNode);
    Assert.areEqual(expectedLabel, Object.isUndefined(node.labelNode) ? "" : parser.context.source.getText(node.labelNode.span));
    Assert.areEqual(expectedText, parser.context.source.getText(node.span));
  }

  @TestMethod
  public demandsABreakLabelNameFromWhatFollowsOnTheLine(): void {
    const parser = TypeScriptParserFixture.create("break 1;");
    const node = parser.parseStatement();

    Assert.isInstanceOf(node, TypeScriptBreakStatementNode);
    Assert.isInstanceOf(node.labelNode, TypeScriptMissingIdentifierNode);
    Assert.areEqual(5, node.labelNode.span.startOffset);
    Assert.areEqual(0, node.labelNode.span.length);
    Assert.areEqual("TS1003@6:1|TS1116@0:5", TypeScriptDiagnosticsFixture.project(parser.context.diagnosticCollector.diagnostics));
  }

  @TestData("break if;", "TS1359@6:2 Identifier expected. 'if' is a reserved word that cannot be used here.|TS1005@8:1 '(' expected.")
  @TestData("continue if;", "TS1359@9:2 Identifier expected. 'if' is a reserved word that cannot be used here.|TS1005@11:1 '(' expected.")
  @TestData("l: while (1) break true;", "TS1359@19:4 Identifier expected. 'true' is a reserved word that cannot be used here.")
  @TestData("l: while (1) break \\u0069f;",
    "TS1359@19:7 Identifier expected. '\\u0069f' is a reserved word that cannot be used here.|TS1005@26:1 '(' expected.")
  @TestData("function* g() { l: while (1) break yield; }", "TS1003@35:5 Identifier expected.")
  @TestMethod
  public distinguishesAReservedWordLabelFromOtherNonIdentifiers(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
  }

  @TestData("break #x;", "TS18016@6:2")
  @TestData("continue #x;", "TS18016@9:2")
  @TestMethod
  public readsAPrivateIdentifierLabelAfterReportingIt(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);
    const node = result.rootNode.children[0];

    Assert.areEqual(1, result.rootNode.children.length);
    Assert.isTrue(node instanceof TypeScriptBreakStatementNode || node instanceof TypeScriptContinueStatementNode);
    Assert.isInstanceOf(node.labelNode, TypeScriptPrivateIdentifierNode);
    Assert.areEqual(content.length, node.span.length);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(result.diagnostics));
  }

  @TestMethod
  public demandsAContinueLabelNameFromWhatFollowsOnTheLine(): void {
    const parser = TypeScriptParserFixture.create("continue 1;");
    const node = parser.parseStatement();

    Assert.isInstanceOf(node, TypeScriptContinueStatementNode);
    Assert.isInstanceOf(node.labelNode, TypeScriptMissingIdentifierNode);
    Assert.areEqual(8, node.labelNode.span.startOffset);
    Assert.areEqual(0, node.labelNode.span.length);
    Assert.areEqual("TS1003@9:1|TS1115@0:8", TypeScriptDiagnosticsFixture.project(parser.context.diagnosticCollector.diagnostics));
  }
}
