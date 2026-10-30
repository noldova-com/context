/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Source, SourceReader, SourceSpan, ValueNode } from "@noldova/context.parsers";
import {
  TypeScriptImportDeclarationNode,
  TypeScriptImportEqualsDeclarationNode,
  TypeScriptParser,
  TypeScriptStringLiteralNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class ImportDeclarationParserTests {
  @TestData("async function f() { import * as await from \"m\"; }", "TS1003@33:5|TS1005@44:3")
  @TestData("async function f() { import await from \"m\"; }", "TS1005@39:3")
  @TestData("function* g() { import * as yield from \"m\"; }", "TS1003@28:5|TS1005@39:3")
  @TestData("function* g() { import yield = require(\"m\"); }", "TS1005@29:1")
  @TestMethod
  public readsNoImportNameThatItsContextReserves(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestMethod
  public keepsModuleSyntaxInsideABoundedEmbeddedReader(): void {
    const content = ' /* lead */ import {a} from "m"; export default a; /* tail */ ';
    const reader = new SourceReader(new Source("<html>" + content + "</html>"), new SourceSpan(6, content.length));
    const result = new TypeScriptParser(reader).parse();
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, TypeScriptImportDeclarationNode);
    Assert.areEqual(18, node.span.startOffset);
    Assert.isDefined(node.leadingTrivia);
    Assert.isDefined(result.rootNode.trailingTrivia);
    Assert.areEqual(2, result.rootNode.children.length);
    Assert.areEqual(6 + content.length, reader.currentOffset);
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestData('import {a as} from "m";')
  @TestData('export default ;')
  @TestData('import "m" with { type')
  @TestMethod
  public rollsBackModuleSyntaxAndItsDiagnostics(content: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const initial = parser.currentNode;
    const offset = parser.typescriptLexer.reader.currentOffset;
    parser.lookAhead(() => {
      parser.parseStatement();
      Assert.areEqual(1, parser.context.diagnosticCollector.diagnostics.length);
      return true;
    });
    Assert.areEqual(initial, parser.currentNode);
    Assert.areEqual(offset, parser.typescriptLexer.reader.currentOffset);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
    parser.tryParse(() => {
      parser.parseStatement();
      return undefined;
    });
    Assert.areEqual(initial, parser.currentNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
    parser.parseStatement();
    Assert.areEqual(1, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestData('import "m";', undefined, undefined, false, "")
  @TestData('import main from "m";', undefined, "main", true, "")
  @TestData('import * as ns from "m";', undefined, undefined, true, "")
  @TestData('import {a, b as c} from "m";', undefined, undefined, true, "")
  @TestData('import main, {a} from "m";', undefined, "main", true, "")
  @TestData('import main, * as ns from "m";', undefined, "main", true, "")
  @TestData('import type T from "m";', "type", "T", true, "")
  @TestData('import type {T} from "m";', "type", undefined, true, "")
  @TestData('import type * as ns from "m";', "type", undefined, true, "")
  @TestData('import type from "m";', undefined, "type", true, "")
  @TestData('import type, {x} from "m";', undefined, "type", true, "")
  @TestData('import type from from "m";', "type", "from", true, "")
  @TestData('import type T, {x} from "m";', "type", "T", true, "TS1363")
  @TestData('import type T, * as ns from "m";', "type", "T", true, "TS1363")
  @TestData('import defer * as ns from "m";', "defer", undefined, true, "")
  @TestData('import defer from "m";', undefined, "defer", true, "")
  @TestData('import defer, {x} from "m";', undefined, "defer", true, "")
  @TestData('import defer from from "m";', "defer", "from", true, "TS18058")
  @TestData('import defer ns from "m";', "defer", "ns", true, "TS18058")
  @TestData('import defer {} from "m";', "defer", undefined, true, "TS18059")
  @TestData('import defer {x} from "m";', "defer", undefined, true, "TS18059")
  @TestMethod
  public distinguishesPhasesFromBindings(content: string, phase: string | undefined, name: string | undefined, hasClause: boolean,
    expectedCodes: string): void {
    const result = TypeScriptParser.parse(content);
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, TypeScriptImportDeclarationNode);
    Assert.areEqual(phase, node.phaseKeywordNode?.value);
    Assert.areEqual(hasClause, !Object.isUndefined(node.importClauseNode));
    const nameNode = node.importClauseNode?.defaultNameNode;
    if (Object.isUndefined(name))
      Assert.isUndefined(nameNode);
    else {
      Assert.isInstanceOf(nameNode, ValueNode);
      Assert.areEqual(name, nameNode.value);
    }
    Assert.isInstanceOf(node.moduleSpecifierNode, TypeScriptStringLiteralNode);
    Assert.areEqual('"m"', node.moduleSpecifierNode.value);
    Assert.areEqual(0, node.span.startOffset);
    Assert.areEqual(content.length, node.span.endOffset);
    Assert.areEqual(expectedCodes, result.diagnostics.map(t => t.code.displayText).join(","));
  }

  @TestData('import type = require("m");', "TS1202")
  @TestData('import defer = require("m");', "TS1202")
  @TestData('import type from = N.X;', "TS1392")
  @TestData('import from = N.X;', "")
  @TestMethod
  public routesImportEqualsWithoutLosingContextualBindingNames(content: string, expectedCode: string): void {
    const result = TypeScriptParser.parse(content);
    Assert.isInstanceOf(result.rootNode.children[0], TypeScriptImportEqualsDeclarationNode);
    Assert.areEqual(expectedCode, result.diagnostics.map(t => t.code.displayText).join(","));
  }

  @TestData('import main "m";', "TS1005", 12, 3, "'=' expected.")
  @TestData('import {}', "TS1005", 9, 0, "'from' expected.")
  @TestData('import "m" next();', "TS1005", 11, 4, "';' expected.")
  @TestData('import', "TS1128", 0, 6, "Declaration or statement expected.")
  @TestMethod
  public reportsMalformedImportBoundaries(content: string, code: string, start: number, length: number, message: string): void {
    const result = TypeScriptParser.parse(content);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual(code, result.diagnostics[0]?.code.displayText);
    Assert.areEqual(start, result.diagnostics[0]?.location?.start);
    Assert.areEqual(length, result.diagnostics[0]?.location?.length);
    Assert.areEqual(message, result.diagnostics[0]?.message.text);
  }

  @TestData("{ import 'm'; }", "TS1232@2:6")
  @TestData("function f() { import 'm'; }", "TS1232@15:6")
  @TestData("if (x) import 'm';", "TS1232@7:6")
  @TestData("namespace N { import 'm'; }", "TS1147@21:3")
  @TestData("namespace N { import defer * as x from 'm'; }", "TS1147@39:3")
  @TestData("declare module 'pkg' { import 'm'; }", "")
  @TestData("import 'm';", "")
  @TestMethod
  public readsWhereAnImportIsWrittenAndWhatItNames(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("import { await as x, 1 } from \"m\";\nexport {};", "TS1003@21:1|TS1128@23:1|TS1434@25:4")
  @TestData("import x = A.await; f(a if (b) c);\nexport {};", "TS1005@24:2|TS1434@31:1|TS1128@32:1")
  @TestData("export import x = A.await;\nf(a if (b) c);", "TS1005@31:2|TS1434@38:1|TS1128@39:1")
  @TestData("import x from \"m\" with { await: \"a\", 1 };\nexport {};", "TS1478@37:1")
  @TestMethod
  public forgetsTheAwaitNamesItsClauseReads(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }
}
