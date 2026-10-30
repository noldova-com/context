/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  TypeScriptExpressionStatementNode,
  TypeScriptImportKeywordNode,
  TypeScriptMetaPropertyNode,
  TypeScriptParser,
  TypeScriptSemicolonNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptImportKeywordNodeExtensionsTests {
  @TestData("import(\"m\");", true, true)
  @TestData("import<T>(\"m\");", true, true)
  @TestData("import.meta;", true, true)
  @TestData("import\n(\"m\");", true, true)
  @TestData("import x from \"m\";", false, true)
  @TestData("import \"m\";", false, true)
  @TestData("import * as x from \"m\";", false, true)
  @TestData("import { x } from \"m\";", false, true)
  @TestData("import import;", false, true)
  @TestData("import;", false, false)
  @TestData("import", false, false)
  @TestData("import?.x;", false, false)
  @TestData("import << x;", false, false)
  @TestData("import + 1;", false, false)
  @TestData("import @dec class C {}", false, false)
  @TestMethod
  public startsAStatementOnlyAsADeclarationACallOrAMetaProperty(content: string, startsExpression: boolean, startsStatement: boolean): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.currentNode;
    Assert.isInstanceOf(node, TypeScriptImportKeywordNode);
    const offset = parser.typescriptLexer.reader.currentOffset;

    Assert.areEqual(startsExpression, node.canStartTypeScriptExpression(parser));
    Assert.areEqual(startsStatement, node.canStartTypeScriptStatement(parser));
    Assert.areEqual(!startsStatement, node.isTypeScriptUnexpectedStatementToken(parser));
    Assert.areEqual(node, parser.currentNode);
    Assert.areEqual(offset, parser.typescriptLexer.reader.currentOffset);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestData("import;", "TS1128@0:6", ";")
  @TestData("import", "TS1128@0:6", "")
  @TestData("import?.x;", "TS1128@0:6|TS1128@6:2", "x;")
  @TestData("import + 1;", "TS1128@0:6", "+ 1;")
  @TestData("import }", "TS1128@0:6|TS1128@7:1", "")
  @TestData("import ;x", "TS1128@0:6", ";|x")
  @TestData("import = 1;", "TS1128@0:6|TS1128@7:1", "1;")
  @TestData("import;import;", "TS1128@0:6|TS1128@7:6", ";|;")
  @TestData("import ) x;", "TS1128@0:6|TS1128@7:1", "x;")
  @TestData("import ?? x;", "TS1128@0:6|TS1109@7:2", " ?? x;")
  @TestData("import!;", "TS1128@0:6|TS1109@7:1", "!;")
  @TestData("import[0];", "TS1128@0:6", "[0];")
  @TestData("import`x`;", "TS1128@0:6", "`x`;")
  @TestData("import << x;", "TS1128@0:6|TS1109@7:2", " << x;")
  @TestData("import @dec class C {}", "TS1128@0:6", "@dec class C {}")
  @TestData("export import;", "TS1128@0:6|TS1128@7:6", ";")
  @TestData("declare import;", "TS1128@8:6", "declare|;")
  @TestData("{ import }", "TS1128@2:6", "{ import }")
  @TestData("function f() { import; }", "TS1128@15:6", "function f() { import; }")
  @TestData("switch (x) { case 1: import; }", "TS1129@21:6", "switch (x) { case 1: import; }")
  @TestData("switch (x) { case 1: import }", "TS1129@21:6", "switch (x) { case 1: import }")
  @TestData("namespace N { import; }", "TS1128@14:6", "namespace N { import; }")
  @TestData("namespace N { import }", "TS1128@14:6", "namespace N { import }")
  @TestData("class C { m() { import } }", "TS1128@16:6|TS1128@25:1", "class C { m() { import }")
  @TestData("class C { m() { import; } }", "TS1128@16:6|TS1128@26:1", "class C { m() { import; }")
  @TestMethod
  public passesOverAnImportThatStartsNoStatement(content: string, expectedDiagnostics: string, expectedStatements: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expectedDiagnostics, TypeScriptDiagnosticsFixture.project(result.diagnostics));
    Assert.areEqual(expectedStatements, result.rootNode.children.map(t => content.slice(t.span.startOffset, t.span.endOffset)).join("|"));
  }

  @TestData("if (x) import;", "TS1109@7:6", "if (x)|;")
  @TestData("l: import;", "TS1109@3:6", "l:|;")
  @TestData("do import; while (x);", "TS1109@3:6", "do|;|while (x);")
  @TestData("while (x) import;", "TS1109@10:6", "while (x)|;")
  @TestData("for (;;) import;", "TS1109@9:6", "for (;;)|;")
  @TestData("if (x) import )", "TS1109@7:6|TS1128@14:1", "if (x)")
  @TestData("if (x) import\nfoo;", "TS1005@17:1", "if (x) import\nfoo;")
  @TestData("class C { m() { if (x) import } }", "TS1109@23:6|TS1128@32:1", "class C { m() { if (x) import }")
  @TestMethod
  public readsAnImportThatStartsNoStatementAsAMissingExpression(content: string, expectedDiagnostics: string, expectedStatements: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expectedDiagnostics, TypeScriptDiagnosticsFixture.project(result.diagnostics));
    Assert.areEqual(expectedStatements, result.rootNode.children.map(t => content.slice(t.span.startOffset, t.span.endOffset)).join("|"));
  }

  @TestMethod
  public readsAStatementStartingWithAnImportThatStartsNothingAsAMissingExpression(): void {
    const parser = TypeScriptParserFixture.create("import;");
    const importNode = parser.currentNode;
    const node = parser.parseStatement();

    Assert.isInstanceOf(node, TypeScriptExpressionStatementNode);
    Assert.areEqual(0, node.span.startOffset);
    Assert.areEqual(0, node.span.endOffset);
    Assert.areEqual(importNode, parser.currentNode);
    Assert.areEqual("TS1109@0:6", TypeScriptDiagnosticsFixture.project(parser.context.diagnosticCollector.diagnostics));
  }

  @TestMethod
  public parsesItsExpressionWithPreservedBoundaries(): void {
    const prefix = " /*leading*/ ";
    const content = "import.meta";
    const parser = TypeScriptParserFixture.create(prefix + content + ";");
    const leadingTrivia = parser.currentNode.leadingTrivia;

    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptMetaPropertyNode);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(prefix.length, node.span.startOffset);
    Assert.areEqual(prefix.length + content.length, node.span.endOffset);
    Assert.isInstanceOf(parser.currentNode, TypeScriptSemicolonNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public startsAType(): void {
    const parser = TypeScriptParserFixture.create("import");
    const node = parser.currentNode;
    Assert.isTrue(node.canStartTypeScriptType(parser));
  }

  @TestData("import()", true)
  @TestData("import<T>()", true)
  @TestData("import.meta", true)
  @TestData("import value", false)
  @TestMethod
  public recognizesOnlyImportExpressionPrefixesInHeritage(content: string, expected: boolean): void {
    const parser = TypeScriptParserFixture.create(content);

    Assert.areEqual(expected, parser.currentNode.canStartTypeScriptLeftHandSideExpression(parser));
    Assert.areEqual(0, parser.currentNode.span.startOffset);
  }

  @TestData("import.meta;", "")
  @TestData("import.foo;", "TS17012@7:3")
  @TestData("import.foo();\nexport {};", "TS18061@7:3")
  @TestData("import.defer;", "TS1005@12:0")
  @TestData('import.defer("m");', "")
  @TestMethod
  public namesOnlyMetaOrADeferCallAfterImport(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }
}
