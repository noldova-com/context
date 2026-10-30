/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptAwaitExpressionNode, TypeScriptPlusNode } from "@noldova/context.parsers.typescript";
import { TypeScriptContextFlags } from "@noldova/context.parsers.typescript/enums/typescript-context-flags.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptAwaitKeywordNodeExtensionsTests {
  @TestData("await using value = resource;", true)
  @TestData("await\nusing value = resource;", true)
  @TestData("await /*\n*/ using value = resource;", true)
  @TestData("await using {value} = resource;", true)
  @TestData("await using [value]", false)
  @TestData("await using\nvalue = resource;", false)
  @TestData("await using(resource);", false)
  @TestData("await using", false)
  @TestData("await value;", false)
  @TestData("await using of resources", true)
  @TestMethod
  public recognizesAwaitedDeclarationsWithoutChangingTheSession(content: string, expected: boolean): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.currentNode;
    const offset = parser.typescriptLexer.reader.currentOffset;
    Assert.areEqual(expected, node.isTypeScriptVariableStatementStart(parser));
    Assert.areEqual(expected, node.isTypeScriptForVariableDeclarationStart(parser));
    Assert.areEqual(expected, node.isTypeScriptDeclarationStart(parser));
    Assert.areEqual(node, parser.currentNode);
    Assert.areEqual(offset, parser.typescriptLexer.reader.currentOffset);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestData("await")
  @TestData("await(value)")
  @TestMethod
  public retainsOrdinaryIdentifierAndCallUses(content: string): void {
    const parser = TypeScriptParserFixture.create(content);

    const node = parser.currentNode.parseTypeScriptUnaryExpression(parser);

    Assert.isFalse(node instanceof TypeScriptAwaitExpressionNode);
    Assert.areEqual(1, parser.context.records.awaitNameCount);
    Assert.areEqual(content.length, node.span.endOffset);
    Assert.isTrue(parser.isEndOfFile);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestData("await", TypeScriptContextFlags.None, false)
  @TestData("await value", TypeScriptContextFlags.None, true)
  @TestData("await 1", TypeScriptContextFlags.None, true)
  @TestData("await 1n", TypeScriptContextFlags.None, true)
  @TestData("await 'value'", TypeScriptContextFlags.None, true)
  @TestData("await true", TypeScriptContextFlags.None, true)
  @TestData("await(value)", TypeScriptContextFlags.None, false)
  @TestData("await\nvalue", TypeScriptContextFlags.None, false)
  @TestData("await", TypeScriptContextFlags.Await, true)
  @TestMethod
  public recognizesContextWithoutChangingTheParser(content: string, flags: TypeScriptContextFlags, expected: boolean): void {
    const parser = TypeScriptParserFixture.create(content, flags);
    const node = parser.currentNode;
    const offset = parser.typescriptLexer.reader.currentOffset;

    Assert.areEqual(expected, node.isTypeScriptAwaitExpressionStart(parser));
    Assert.areEqual(node, parser.currentNode);
    Assert.areEqual(offset, parser.typescriptLexer.reader.currentOffset);
    Assert.areEqual(flags, parser.context.contextFlags);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public distinguishesBindingNamesFromExpressionIdentifiers(): void {
    const parser = TypeScriptParserFixture.create("await");
    const node = parser.currentNode;

    Assert.isTrue(node.isTypeScriptBindingIdentifier());
    Assert.isTrue(node.isTypeScriptIdentifier(parser.context));
    parser.context.contextFlags = TypeScriptContextFlags.Await;
    Assert.isFalse(node.isTypeScriptIdentifier(parser.context));
    Assert.isTrue(node.isTypeScriptBindingIdentifier());
  }

  @TestMethod
  public parsesItsUnaryExpressionBeforeABinaryOperator(): void {
    const prefix = " /*leading*/ ";
    const content = "await value";
    const parser = TypeScriptParserFixture.create(prefix + content + " + following");
    const leadingTrivia = parser.currentNode.leadingTrivia;

    const node = parser.currentNode.parseTypeScriptUnaryExpression(parser);

    Assert.isInstanceOf(node, TypeScriptAwaitExpressionNode);
    Assert.areEqual(0, parser.context.records.awaitNameCount);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(prefix.length, node.span.startOffset);
    Assert.areEqual(prefix.length + content.length, node.span.endOffset);
    Assert.isInstanceOf(parser.currentNode, TypeScriptPlusNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestData("f(await x, a if (b) c);\nexport {};", "TS1005@13:2|TS1434@20:1|TS1128@21:1")
  @TestData("label: f(await x, a if (b) c);\nexport {};", "TS1005@20:2|TS1434@27:1|TS1128@28:1")
  @TestData("await x; public y = 1; export {};", "TS1128@9:6")
  @TestData("await x; ) y; export {};", "TS1128@9:1")
  @TestData("await x; readonly y; export {};", "TS1128@9:8")
  @TestData("await x; export readonly y = 1; export {};", "TS1128@9:6|TS1128@16:8")
  @TestData("f(await x, export class C {}); export {};", "TS1135@11:6|TS1128@28:1")
  @TestData("l: f(await x, export class C {}); export {};", "TS1135@14:6|TS1128@31:1")
  @TestData("() => f(await x, a if (b) c);\nexport {};", "TS1005@19:2|TS1434@26:1|TS1128@27:1")
  @TestData("for await (const x of y) f(a if (b) c);\nexport {};", "TS1005@29:2|TS1434@36:1|TS1128@37:1")
  @TestData("for (await of x) f(a if (b) c);\nexport {};", "TS1005@14:1|TS1005@15:1|TS1005@21:2|TS1434@28:1|TS1128@29:1")
  @TestData("await x;\nexport {};", "")
  @TestData("f(await (x), a if (b) c);\nexport {};", "TS1005@15:2|TS1005@22:1")
  @TestData("await;\nexport {};", "TS1109@5:1")
  @TestData("l: await;\nexport {};", "TS1109@8:1")
  @TestMethod
  public readsAStatementHoldingAnAwaitExpressionOnce(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }
}
