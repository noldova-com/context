/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  TypeScriptClassDeclarationNode,
  TypeScriptExportKeywordNode,
  TypeScriptExpressionStatementNode,
  TypeScriptParser
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptExportKeywordNodeExtensionsTests {
  @TestData("export class C {}", true)
  @TestData("export default class {}", true)
  @TestData("export type T = string;", true)
  @TestData("export * from 'x';", false)
  @TestData("export { name };", false)
  @TestData("export as namespace N;", false)
  @TestData("export type { name };", false)
  @TestData("export default value;", false)
  @TestData("export;", false)
  @TestMethod
  public recognizesOnlyTheModifierRoleAndRestoresLookahead(content: string, expected: boolean): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.currentNode;
    Assert.isInstanceOf(node, TypeScriptExportKeywordNode);
    const offset = parser.typescriptLexer.reader.currentOffset;

    Assert.isTrue(node.isTypeScriptDeclarationModifier());
    Assert.areEqual(expected, node.canParseTypeScriptDeclarationModifier(parser));
    Assert.areEqual(node, parser.currentNode);
    Assert.areEqual(offset, parser.typescriptLexer.reader.currentOffset);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public dispatchesModifiedDeclarationsWithoutAnExportWrapper(): void {
    const result = TypeScriptParser.parse("export class C {}");

    Assert.isInstanceOf(result.rootNode.children[0], TypeScriptClassDeclarationNode);
    Assert.areEqual(1, result.rootNode.children[0].modifierNodes.length);
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestData("export;")
  @TestData("export readonly x;")
  @TestData("export abstract default class C {}")
  @TestMethod
  public readsAnExportThatBeginsNoDeclarationAsAMissingExpression(content: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const exportNode = parser.currentNode;
    const node = parser.parseStatement();

    Assert.isInstanceOf(node, TypeScriptExpressionStatementNode);
    Assert.areEqual(0, node.span.startOffset);
    Assert.areEqual(0, node.span.endOffset);
    Assert.areEqual(exportNode, parser.currentNode);
    Assert.areEqual("TS1109@0:6", TypeScriptDiagnosticsFixture.project(parser.context.diagnosticCollector.diagnostics));
  }

  @TestData("export class C {}", true)
  @TestData("export default class {}", true)
  @TestData("export default value;", true)
  @TestData("export = value;", true)
  @TestData("export {};", true)
  @TestData("export * from 'x';", true)
  @TestData("export @dec class C {}", true)
  @TestData("export declare abstract class C {}", true)
  @TestData("export readonly x;", false)
  @TestData("export abstract default class C {}", false)
  @TestData("export type\nT = 1;", false)
  @TestData("export;", false)
  @TestMethod
  public startsAStatementOnlyWhereItBeginsADeclaration(content: string, expected: boolean): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.currentNode;
    const offset = parser.typescriptLexer.reader.currentOffset;

    Assert.areEqual(expected, node.canStartTypeScriptStatement(parser));
    Assert.areEqual(!expected, node.isTypeScriptMisplacedModifier(parser));
    Assert.areEqual(node, parser.currentNode);
    Assert.areEqual(offset, parser.typescriptLexer.reader.currentOffset);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestData("export readonly value = 1;", "TS1128@0:6|TS1128@7:8", "value = 1;")
  @TestData("export abstract default class C {}", "TS1128@0:6|TS1434@7:8|TS1005@16:7", "abstract|class C {}")
  @TestData("export public x = 1;", "TS1128@0:6|TS1128@7:6", "x = 1;")
  @TestData("export static x = 1;", "TS1128@0:6|TS1128@7:6", "x = 1;")
  @TestData("export private x;", "TS1128@0:6|TS1128@7:7", "x;")
  @TestData("export accessor x;", "TS1128@0:6|TS1128@7:8", "x;")
  @TestData("export abstract x;", "TS1128@0:6|TS1434@7:8", "abstract|x;")
  @TestData("export async x;", "TS1128@0:6|TS1434@7:5", "async|x;")
  @TestData("export async value = 1;", "TS1128@0:6|TS1434@7:5", "async|value = 1;")
  @TestData("export override value = 1;", "TS1128@0:6|TS1434@7:8", "override|value = 1;")
  @TestData("export override class C {}", "TS1128@0:6|TS1434@7:8", "override|class C {}")
  @TestData("export readonly readonly x;", "TS1128@0:6|TS1128@7:8|TS1128@16:8", "x;")
  @TestData("export static readonly x = 1;", "TS1128@0:6|TS1128@7:6|TS1128@14:8", "x = 1;")
  @TestData("export export value = 1;", "TS1128@0:6|TS1128@7:6", "value = 1;")
  @TestData("export declare value = 1;", "TS1128@0:6", "declare|value = 1;")
  @TestData("export declare readonly x: number;", "TS1128@0:6|TS1128@15:8", "declare|x: number;")
  @TestData("declare export readonly x;", "TS1128@8:6|TS1128@15:8", "declare|x;")
  @TestData("export in x;", "TS1128@0:6|TS1109@7:2", " in x;")
  @TestData("export\nreadonly x = 1", "TS1128@0:6|TS1128@7:8", "x = 1")
  @TestData("export type T = 1;\nexport type\nU = 1;", "TS1128@19:6", "export type T = 1;|type|U = 1;")
  @TestData("export readonly", "TS1128@0:6", "readonly")
  @TestData("export;", "TS1128@0:6", ";")
  @TestData("export }", "TS1128@0:6|TS1128@7:1", "")
  @TestData("export (1);", "TS1128@0:6", "(1);")
  @TestData("{ export readonly x = 1; }", "TS1128@2:6|TS1128@9:8", "{ export readonly x = 1; }")
  @TestData("namespace N { export readonly x = 1; }", "TS1128@14:6|TS1128@21:8", "namespace N { export readonly x = 1; }")
  @TestData("function f() { export readonly x = 1; }", "TS1128@15:6|TS1128@22:8", "function f() { export readonly x = 1; }")
  @TestData("switch (x) { case 1: export readonly y; }", "TS1129@21:6|TS1129@28:8", "switch (x) { case 1: export readonly y; }")
  @TestData("class C { m() { export readonly x } }", "TS1128@16:6|TS1128@36:1", "class C { m() { export readonly x }")
  @TestMethod
  public passesOverAnExportThatBeginsNoDeclaration(content: string, expectedDiagnostics: string, expectedStatements: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expectedDiagnostics, TypeScriptDiagnosticsFixture.project(result.diagnostics));
    Assert.areEqual(expectedStatements, result.rootNode.children.map(t => content.slice(t.span.startOffset, t.span.endOffset)).join("|"));
  }

  @TestData("if (x) export readonly y;", "TS1109@7:6|TS1128@14:8")
  @TestData("if (x) export;", "TS1109@7:6")
  @TestData("l: export readonly y;", "TS1109@3:6|TS1128@10:8")
  @TestData("do export readonly x; while (y)", "TS1109@3:6|TS1128@10:8|TS1109@31:0")
  @TestData("if (x) export default 5;", "TS1258@7:6")
  @TestMethod
  public readsAnExportThatBeginsNoDeclarationAsAMissingStatementBody(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("const export class C {}", "TS1389@6:6")
  @TestData("const export default class {}", "TS1389@6:6")
  @TestData("var export function f() {}", "TS1389@4:6")
  @TestData("function f() { const export enum E {} }", "TS1389@21:6")
  @TestData("function f() { const export declare enum E {} }", "TS1389@21:6")
  @TestData("f(export class C {});", "TS1135@2:6|TS1128@19:1")
  @TestData("var a = [export class C {}];", "TS1137@9:6|TS1128@26:1")
  @TestData("type A = [export class C {}];", "TS1110@10:6|TS1128@27:1")
  @TestData("class C extends export class D {}", "TS1109@16:6")
  @TestData("type T = { a: 1; export class C {} }", "TS1131@17:6|TS1128@35:1")
  @TestData("const export readonly x = 1;", "TS1389@6:6|TS1005@22:1")
  @TestData("f(export readonly x);", "TS1135@2:6|TS1005@18:1")
  @TestData("var a = [export readonly x];", "TS1137@9:6|TS1005@25:1")
  @TestData("let x = { a: 1 export readonly b };", "TS1005@15:6")
  @TestData("enum E { A export readonly B }", "TS1357@11:6|TS1357@18:8|TS1357@27:1")
  @TestData("interface I { a: 1 export readonly b }", "TS1005@19:6")
  @TestMethod
  public endsTheListsItIsWrittenInOnlyWhereItBeginsADeclaration(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestMethod
  public readsAsAModifierInEveryModifierList(): void {
    const node = TypeScriptParserFixture.create("export").currentNode;

    Assert.isTrue(node.isTypeScriptDeclarationModifier());
    Assert.isTrue(node.isTypeScriptClassMemberModifier());
    Assert.isTrue(node.isTypeScriptParameterModifier());
    Assert.isTrue(node.isTypeScriptTypeMemberModifier());
    Assert.isTrue(node.isTypeScriptTypeParameterModifier());
  }

  @TestData("class C { export default m() {} }", "TS1434@10:6|TS1434@17:7")
  @TestData("class C { export *m() {} }", "TS1434@10:6")
  @TestData("class C { export\nx; }", "TS1031@10:6")
  @TestData("class C { export x() {} }", "TS1031@10:6")
  @TestData("function f(export default) {}", "TS1359@11:6|TS1005@18:7")
  @TestData("interface I { export default: 1; }", "TS1005@21:7")
  @TestData("interface I { export\nx: 1 }", "TS1070@14:6")
  @TestData("var o = { export override m() {} };", "TS1042@10:6|TS1184@10:6|TS1042@17:8")
  @TestData("@d export override class C {}", "")
  @TestMethod
  public readsItsOwnFollowerInEveryModifierPosition(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }
}
