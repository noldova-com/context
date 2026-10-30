/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Source, SourceReader, SourceSpan, ValueNode } from "@noldova/context.parsers";
import {
  TypeScriptBlockNode,
  TypeScriptEmptyStatementNode,
  TypeScriptExpressionStatementNode,
  TypeScriptFunctionDeclarationNode,
  TypeScriptMissingIdentifierNode,
  TypeScriptModuleDeclarationNode,
  TypeScriptParser,
  TypeScriptQualifiedNameNode,
  TypeScriptVariableStatementNode
} from "@noldova/context.parsers.typescript";
import { TypeScriptContextFlags } from "@noldova/context.parsers.typescript/enums/typescript-context-flags.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class ModuleDeclarationParserTests {
  @TestMethod
  public doesNotApplyStatementBlockEqualsRecoveryToModuleBodies(): void {
    const result = TypeScriptParser.parse("namespace N {} = value;");
    Assert.isInstanceOf(result.rootNode.children[0], TypeScriptModuleDeclarationNode);
    Assert.isInstanceOf(result.rootNode.children[1], TypeScriptExpressionStatementNode);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS1128", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(15, result.diagnostics[0]?.location?.start);
  }

  @TestData("namespace class {}", 10, 5, "class")
  @TestData("module true;", 7, 4, "true")
  @TestData("namespace 1;", 10, 1, "1")
  @TestData("namespace 1_000;", 10, 5, "1000")
  @TestData("namespace 0xff;", 10, 4, "255")
  @TestData("namespace 1e2;", 10, 3, "100")
  @TestData("namespace 0b11n;", 10, 5, "3n")
  @TestData("namespace 0o7n;", 10, 4, "7n")
  @TestData("namespace @d class C {}", 10, 1, "namespace")
  @TestData("module ]", 7, 1, "module")
  @TestMethod
  public reportsTheReferencesDiagnosticNameText(content: string, start: number, length: number, text: string): void {
    const result = TypeScriptParser.parse(content);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS2819", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(start, result.diagnostics[0]?.location?.start);
    Assert.areEqual(length, result.diagnostics[0]?.location?.length);
    Assert.areEqual("Namespace name cannot be '" + text + "'.", result.diagnostics[0]?.message.text);
  }

  @TestMethod
  public handlesLongDottedNamesWithoutRecursiveNameParsing(): void {
    const content = "namespace " + Array.from({ length: 512 }, (_, index) => "N" + index).join(".") + " {}";
    const result = TypeScriptParser.parse(content);
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, TypeScriptModuleDeclarationNode);
    let name = node.nameNode;
    let segments = 1;
    while (name instanceof TypeScriptQualifiedNameNode) {
      segments++;
      name = name.leftNode;
    }
    Assert.areEqual(512, segments);
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestMethod
  public reportsTheRecursionLimitInNestedModuleBodies(): void {
    const content = "namespace N {".repeat(600) + "const x = 1;" + "}".repeat(600);
    const result = TypeScriptParser.parse(content);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("CTX2000", result.diagnostics[0]?.code.displayText);
  }

  @TestData("namespace A {}", "namespace", 0, true, "")
  @TestData("module A {}", "module", 0, true, "TS1540")
  @TestData("export namespace A {}", "namespace", 1, true, "")
  @TestData("export declare namespace A {}", "namespace", 2, true, "")
  @TestData('declare module "pkg" {}', "module", 1, true, "")
  @TestData("declare global {}", "global", 1, false, "")
  @TestData("global {}", "global", 0, false, "")
  @TestMethod
  public preservesWrittenDeclarationForms(content: string, keyword: string, modifiers: number, hasName: boolean, expectedCode: string): void {
    const result = TypeScriptParser.parse(content);
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, TypeScriptModuleDeclarationNode);
    Assert.areEqual(keyword, node.keywordNode.value);
    Assert.areEqual(modifiers, node.modifierNodes.length);
    Assert.isDefined(node.bodyNode);
    Assert.isUndefined(node.semicolonNode);
    Assert.areEqual(0, node.span.startOffset);
    Assert.areEqual(content.length, node.span.endOffset);
    Assert.areEqual(hasName, !Object.isUndefined(node.nameNode));
    Assert.areEqual(expectedCode, result.diagnostics.map(t => t.code.displayText).join(","));
  }

  @TestMethod
  public retainsQualifiedNamesWithoutSyntheticDeclarationsOrModifiers(): void {
    const result = TypeScriptParser.parse("namespace App.Tools.Parser {}");
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, TypeScriptModuleDeclarationNode);
    Assert.isInstanceOf(node.nameNode, TypeScriptQualifiedNameNode);
    Assert.isInstanceOf(node.nameNode.leftNode, TypeScriptQualifiedNameNode);
    Assert.isInstanceOf(node.nameNode.leftNode.leftNode, ValueNode);
    Assert.isInstanceOf(node.nameNode.leftNode.rightNode, ValueNode);
    Assert.isInstanceOf(node.nameNode.rightNode, ValueNode);
    Assert.areEqual("App", node.nameNode.leftNode.leftNode.value);
    Assert.areEqual("Tools", node.nameNode.leftNode.rightNode.value);
    Assert.areEqual("Parser", node.nameNode.rightNode.value);
    Assert.areEqual(0, node.modifierNodes.length);
    Assert.areEqual(0, node.bodyNode?.children.length);
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestMethod
  public preservesAMissingFirstNameAndLeavesTheInvalidStringForRecovery(): void {
    const result = TypeScriptParser.parse('namespace "pkg" {}');
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, TypeScriptModuleDeclarationNode);
    Assert.isInstanceOf(node.nameNode, TypeScriptMissingIdentifierNode);
    Assert.areEqual(9, node.nameNode.span.startOffset);
    Assert.areEqual(0, node.nameNode.span.length);
    Assert.isInstanceOf(node.bodyNode, TypeScriptBlockNode);
    Assert.isUndefined(node.bodyNode.openBraceNode);
    Assert.areEqual(9, node.bodyNode.span.startOffset);
    Assert.areEqual(0, node.bodyNode.span.length);
    Assert.isInstanceOf(result.rootNode.children[1], TypeScriptExpressionStatementNode);
    Assert.isInstanceOf(result.rootNode.children[2], TypeScriptBlockNode);
    Assert.areEqual(2, result.diagnostics.length);
    Assert.areEqual("TS1003", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(10, result.diagnostics[0]?.location?.start);
    Assert.areEqual(5, result.diagnostics[0]?.location?.length);
    Assert.areEqual("TS1005", result.diagnostics[1]?.code.displayText);
    Assert.areEqual(16, result.diagnostics[1]?.location?.start);
    Assert.areEqual(1, result.diagnostics[1]?.location?.length);
  }

  @TestData("namespace A. {}", 12, 13)
  @TestData("namespace A..B {}", 12, 12)
  @TestMethod
  public preservesDottedNameGapsAsMissingIdentifiers(content: string, start: number, diagnosticStart: number): void {
    const result = TypeScriptParser.parse(content);
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, TypeScriptModuleDeclarationNode);
    Assert.isInstanceOf(node.nameNode, TypeScriptQualifiedNameNode);
    const gap = node.nameNode.leftNode instanceof TypeScriptQualifiedNameNode ? node.nameNode.leftNode.rightNode : node.nameNode.rightNode;
    Assert.isInstanceOf(gap, TypeScriptMissingIdentifierNode);
    Assert.areEqual(start, gap.span.startOffset);
    Assert.areEqual(0, gap.span.length);
    Assert.isDefined(node.bodyNode);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS1003", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(diagnosticStart, result.diagnostics[0]?.location?.start);
    Assert.areEqual(1, result.diagnostics[0]?.location?.length);
  }

  @TestData("namespace A.class {}")
  @TestData("namespace A.\\u0063lass {}")
  @TestData("namespace \\u0041.B {}")
  @TestMethod
  public acceptsIdentifierNamesAndEscapesAfterDots(content: string): void {
    const result = TypeScriptParser.parse(content);
    Assert.isInstanceOf(result.rootNode.children[0], TypeScriptModuleDeclarationNode);
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestData('module "pkg";', true, "TS1035")
  @TestData('declare module "*.txt";', true, "")
  @TestData('module "pkg"', false, "TS1035")
  @TestMethod
  public distinguishesBodylessExternalModulesFromNamespaces(content: string, hasSemicolon: boolean, expectedCode: string): void {
    const result = TypeScriptParser.parse(content);
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, TypeScriptModuleDeclarationNode);
    Assert.isUndefined(node.bodyNode);
    Assert.areEqual(hasSemicolon, !Object.isUndefined(node.semicolonNode));
    Assert.areEqual(expectedCode, result.diagnostics.map(t => t.code.displayText).join(","));
  }

  @TestData("namespace A", 11)
  @TestData("namespace A;", 11)
  @TestData("namespace A\nnext();", 11)
  @TestData("module A", 8)
  @TestData("namespace A.B", 13)
  @TestMethod
  public writesAnEmptyNamespaceBodyWhereItsOpeningBraceIsMissing(content: string, offset: number): void {
    const result = TypeScriptParser.parse(content);
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, TypeScriptModuleDeclarationNode);
    Assert.isInstanceOf(node.bodyNode, TypeScriptBlockNode);
    Assert.isUndefined(node.bodyNode.openBraceNode);
    Assert.areEqual(0, node.bodyNode.children.length);
    Assert.areEqual(offset, node.bodyNode.span.startOffset);
    Assert.areEqual(0, node.bodyNode.span.length);
    Assert.isUndefined(node.semicolonNode);
    Assert.areEqual(offset, node.span.endOffset);
  }

  @TestData("namespace A", "TS1005@11:0 '{' expected.")
  @TestData("module A", "TS1005@8:0 '{' expected.")
  @TestData("namespace A;", "TS1005@11:1 '{' expected.")
  @TestData("namespace A\nnext();", "TS1005@12:4 '{' expected.")
  @TestData("namespace A.B", "TS1005@13:0 '{' expected.")
  @TestData("namespace A {", "TS1005@13:0 '}' expected.")
  @TestData('declare module "pkg" {', "TS1005@22:0 '}' expected.")
  @TestData("declare global {", "TS1005@16:0 '}' expected.")
  @TestData('module "pkg" next();', "TS1005@13:4 ';' expected.")
  @TestData("global foo;", "TS1005@7:3 ';' expected.")
  @TestMethod
  public reportsMissingBodiesAndTerminators(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);
    Assert.isInstanceOf(result.rootNode.children[0], TypeScriptModuleDeclarationNode);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
  }

  @TestData("namespace A {};", "")
  @TestData("global {};", "")
  @TestData('module "pkg" {};', "TS1035")
  @TestMethod
  public leavesSemicolonsAfterBodiesAsEmptyStatements(content: string, expectedCode: string): void {
    const result = TypeScriptParser.parse(content);
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, TypeScriptModuleDeclarationNode);
    Assert.isUndefined(node.semicolonNode);
    Assert.isInstanceOf(result.rootNode.children[1], TypeScriptEmptyStatementNode);
    Assert.areEqual(expectedCode, result.diagnostics.map(t => t.code.displayText).join(","));
  }

  @TestMethod
  public readsNestedNamespacesAndModuleMembersInModuleBodies(): void {
    const result = TypeScriptParser.parse('namespace Outer { export namespace Inner { export const x = 1; } } declare module "pkg" { import {T} from "other"; export {T}; }');
    const outer = result.rootNode.children[0];
    Assert.isInstanceOf(outer, TypeScriptModuleDeclarationNode);
    const inner = outer.bodyNode?.children[0];
    Assert.isInstanceOf(inner, TypeScriptModuleDeclarationNode);
    Assert.isInstanceOf(inner.bodyNode?.children[0], TypeScriptVariableStatementNode);
    const external = result.rootNode.children[1];
    Assert.isInstanceOf(external, TypeScriptModuleDeclarationNode);
    Assert.areEqual(2, external.bodyNode?.children.length);
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestMethod
  public reusesAsyncAndGeneratorFunctionGrammarInsideTheBody(): void {
    const result = TypeScriptParser.parse("namespace A { async function f() { await value; } function* g() { yield value; } }");
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, TypeScriptModuleDeclarationNode);
    const first = node.bodyNode?.children[0];
    const second = node.bodyNode?.children[1];
    Assert.isInstanceOf(first, TypeScriptFunctionDeclarationNode);
    Assert.isInstanceOf(second, TypeScriptFunctionDeclarationNode);
    Assert.areEqual(1, first.modifierNodes.length);
    Assert.isDefined(second.asteriskNode);
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestData("await", TypeScriptContextFlags.Await)
  @TestData("yield", TypeScriptContextFlags.Yield)
  @TestMethod
  public preservesTheCallersGrammarContext(name: string, flags: TypeScriptContextFlags): void {
    const parser = TypeScriptParserFixture.create(`namespace N { const x = ${name} value; }`, flags);
    const node = parser.parseStatement();
    Assert.isInstanceOf(node, TypeScriptModuleDeclarationNode);
    Assert.isInstanceOf(node.bodyNode, TypeScriptBlockNode);
    Assert.areEqual(flags, parser.context.contextFlags);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public retainsLexicalFailuresWithoutBlockingFollowingDeclarations(): void {
    const result = TypeScriptParser.parse("namespace A { §; export const x = 1; }");
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, TypeScriptModuleDeclarationNode);
    Assert.isInstanceOf(node.bodyNode?.children.at(-1), TypeScriptVariableStatementNode);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS1127", result.diagnostics[0]?.code.displayText);
  }

  @TestMethod
  public preservesBoundedCoordinatesAndLeadingTrivia(): void {
    const content = " /* lead */ declare namespace A.B {} /* tail */ ";
    const reader = new SourceReader(new Source("<html>" + content + "</html>"), new SourceSpan(6, content.length));
    const result = new TypeScriptParser(reader).parse();
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, TypeScriptModuleDeclarationNode);
    Assert.areEqual(18, node.span.startOffset);
    Assert.areEqual(node.modifierNodes[0]?.leadingTrivia, node.leadingTrivia);
    Assert.isDefined(node.leadingTrivia);
    Assert.isDefined(result.rootNode.trailingTrivia);
    Assert.areEqual(6 + content.length, reader.currentOffset);
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestMethod
  public restoresTentativeNamesBodiesAndDiagnostics(): void {
    const parser = TypeScriptParserFixture.create("declare namespace A. {} next;");
    const original = parser.currentNode;
    const offset = parser.typescriptLexer.reader.currentOffset;
    parser.lookAhead(() => {
      parser.parseStatement();
      Assert.areEqual(1, parser.context.diagnosticCollector.diagnostics.length);
      return true;
    });
    Assert.areEqual(original, parser.currentNode);
    Assert.areEqual(offset, parser.typescriptLexer.reader.currentOffset);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
    parser.tryParse(() => { parser.parseStatement(); return undefined; });
    Assert.areEqual(original, parser.currentNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
    Assert.isInstanceOf(parser.parseStatement(), TypeScriptModuleDeclarationNode);
    Assert.areEqual(1, parser.context.diagnosticCollector.diagnostics.length);
    Assert.isInstanceOf(parser.parseStatement(), TypeScriptExpressionStatementNode);
  }

  @TestData("module A.B {}", "TS1540,TS1540")
  @TestData("module A.B.C {}", "TS1540,TS1540,TS1540")
  @TestData("namespace A.B {}", "")
  @TestData("declare namespace A { module \"pkg\" {} }", "")
  @TestData("namespace A { module B {} }", "TS1540")
  @TestMethod
  public reportsTheModuleKeywordAndQuotedNamesTheReferenceRefuses(content: string, expectedCodes: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expectedCodes, result.diagnostics.map(t => t.code.displayText).join(","));
  }

  @TestData("function f() { namespace N {} }", "TS1235")
  @TestData("function f() { module A {} }", "TS1235")
  @TestData("{ namespace N {} }", "TS1235")
  @TestData("namespace N { namespace M {} }", "")
  @TestMethod
  public reportsANamespaceWrittenInsideABlock(content: string, expectedCode: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expectedCode, result.diagnostics.map(t => t.code.displayText).join(","));
  }

  @TestData("namespace N { await; }\nexport {};", "")
  @TestData("namespace N { x = await; } f(a if (b) c);\nexport {};", "TS1005@31:2|TS1434@38:1|TS1128@39:1")
  @TestData("namespace await { } f(a if (b) c);\nexport {};", "TS1005@24:2|TS1434@31:1|TS1128@32:1")
  @TestData("declare module \"m\" { x = await }\nexport {};", "TS1036@21:1")
  @TestData("declare namespace N { await /p/; } export {};", "TS1109@31:1")
  @TestMethod
  public forgetsTheAwaitNamesAModuleReads(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }
}
