/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ValueNode } from "@noldova/context.parsers";
import {
  TypeScriptExternalModuleReferenceNode,
  TypeScriptImportEqualsDeclarationNode,
  TypeScriptMissingIdentifierNode,
  TypeScriptParser,
  TypeScriptQualifiedNameNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";

@TestClass
export class ImportEqualsDeclarationParserTests {
  @TestData("import x = await.y;\nexport {};", "TS1262@11:5")
  @TestData("async function f() { import x = await.y; }", "TS1003@32:5|TS1109@37:1")
  @TestMethod
  public readsTheReferenceHeadAsAnIdentifierOfItsContext(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData('import Alias = require("m");', false, 0)
  @TestData('import type Alias = require("m");', true, 0)
  @TestData('export import Alias = require("m");', false, 1)
  @TestMethod
  public retainsExternalReferencesAndTypeOnlyMarkers(content: string, isTypeOnly: boolean, modifiers: number): void {
    const result = TypeScriptParser.parse(content);
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, TypeScriptImportEqualsDeclarationNode);
    Assert.isInstanceOf(node.nameNode, ValueNode);
    Assert.areEqual("Alias", node.nameNode.value);
    Assert.areEqual(isTypeOnly, !Object.isUndefined(node.typeKeywordNode));
    Assert.areEqual(modifiers, node.modifierNodes.length);
    Assert.isInstanceOf(node.moduleReferenceNode, TypeScriptExternalModuleReferenceNode);
    Assert.isDefined(node.moduleReferenceNode.closeParenthesisNode);
    Assert.isInstanceOf(node.moduleReferenceNode.moduleSpecifierNode, ValueNode);
    Assert.areEqual('"m"', node.moduleReferenceNode.moduleSpecifierNode.value);
    Assert.areEqual(isTypeOnly ? "" : "TS1202", result.diagnostics.map(t => t.code.displayText).join(","));
  }

  @TestData("import x = A.;", "TS1003@13:1")
  @TestData("import x = A.#b;", "TS1003@15:0")
  @TestMethod
  public readsTheDottedRestAsAnEntityName(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, TypeScriptImportEqualsDeclarationNode);
    Assert.isInstanceOf(node.moduleReferenceNode, TypeScriptQualifiedNameNode);
    Assert.isInstanceOf(node.moduleReferenceNode.rightNode, TypeScriptMissingIdentifierNode);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(result.diagnostics));
  }

  @TestMethod
  public preservesQualifiedEntityNamesWithoutResolvingThem(): void {
    const result = TypeScriptParser.parse("import Alias = Outer.Inner;");
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, TypeScriptImportEqualsDeclarationNode);
    Assert.isInstanceOf(node.moduleReferenceNode, TypeScriptQualifiedNameNode);
    Assert.isInstanceOf(node.moduleReferenceNode.leftNode, ValueNode);
    Assert.isInstanceOf(node.moduleReferenceNode.rightNode, ValueNode);
    Assert.areEqual("Outer", node.moduleReferenceNode.leftNode.value);
    Assert.areEqual("Inner", node.moduleReferenceNode.rightNode.value);
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestData("import x", "TS1005", 8, 0, "'=' expected.")
  @TestData("import x = require();", "TS1109", 19, 1, "Expression expected.")
  @TestData('import x = require("m";', "TS1005", 22, 1, "')' expected.")
  @TestData("import x = N.;", "TS1003", 13, 1, "Identifier expected.")
  @TestMethod
  public recoversMissingReferenceSyntax(content: string, code: string, start: number, length: number, message: string): void {
    const result = TypeScriptParser.parse(content);
    Assert.isInstanceOf(result.rootNode.children[0], TypeScriptImportEqualsDeclarationNode);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual(code, result.diagnostics[0]?.code.displayText);
    Assert.areEqual(start, result.diagnostics[0]?.location?.start);
    Assert.areEqual(length, result.diagnostics[0]?.location?.length);
    Assert.areEqual(message, result.diagnostics[0]?.message.text);
  }

  @TestData('function f() { import x = require("m"); }', "TS1232")
  @TestData('function f() { import type x = require("m"); }', "TS1232")
  @TestData('namespace N { import x = require("m"); }', "TS1147")
  @TestData('namespace N { import x = other.value; }', "")
  @TestData('namespace N.M { import x = require("m"); }', "TS1147")
  @TestData('export namespace N { import x = require("m"); }', "TS1147")
  @TestData('declare module "pkg" { namespace N { import x = require("m"); } }', "TS1147")
  @TestData('declare module "pkg" { import x = require("m"); }', "")
  @TestData('declare global { import x = require("m"); }', "")
  @TestMethod
  public reportsAnImportAssignmentWrittenOutsideItsTopLevel(content: string, expectedCode: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expectedCode, result.diagnostics.map(t => t.code.displayText).join(","));
  }

  @TestMethod
  public writesAMissingReferenceWhereTheSourceLacksOne(): void {
    const result = TypeScriptParser.parse("import a = ;");
    const node = result.rootNode.children[0];

    Assert.isInstanceOf(node, TypeScriptImportEqualsDeclarationNode);
    Assert.isInstanceOf(node.moduleReferenceNode, TypeScriptMissingIdentifierNode);
    Assert.areEqual(10, node.moduleReferenceNode.span.startOffset);
    Assert.areEqual(0, node.moduleReferenceNode.span.length);
    Assert.areEqual("TS1003@11:1", TypeScriptDiagnosticsFixture.project(result.diagnostics));
  }

  @TestMethod
  public qualifiesAReferenceMissingItsHead(): void {
    const result = TypeScriptParser.parse("import a = .b;");
    const node = result.rootNode.children[0];

    Assert.isInstanceOf(node, TypeScriptImportEqualsDeclarationNode);
    Assert.areEqual(1, result.rootNode.children.length);
    Assert.isInstanceOf(node.moduleReferenceNode, TypeScriptQualifiedNameNode);
    Assert.isInstanceOf(node.moduleReferenceNode.leftNode, TypeScriptMissingIdentifierNode);
    Assert.areEqual(10, node.moduleReferenceNode.leftNode.span.startOffset);
    Assert.isInstanceOf(node.moduleReferenceNode.rightNode, ValueNode);
    Assert.areEqual("b", node.moduleReferenceNode.rightNode.value);
    Assert.areEqual("TS1003@11:1", TypeScriptDiagnosticsFixture.project(result.diagnostics));
  }
}
