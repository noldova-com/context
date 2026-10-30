/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ValueNode } from "@noldova/context.parsers";
import {
  TypeScriptExportDeclarationNode,
  TypeScriptImportDeclarationNode,
  TypeScriptMissingIdentifierNode,
  TypeScriptNamedExportsNode,
  TypeScriptNamedImportsNode,
  TypeScriptParser
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { ModuleSyntaxFixture } from "../../../fixtures/module-syntax.fixture.js";
import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";

@TestClass
export class ImportExportSpecifierParserTests {
  @TestData("type", false, "type", undefined)
  @TestData("type as", true, "as", undefined)
  @TestData("type as as", false, "type", "as")
  @TestData("type as as as", true, "as", "as")
  @TestData("type T", true, "T", undefined)
  @TestData("type T as U", true, "T", "U")
  @TestData("type as T", false, "type", "T")
  @TestData("value as alias", false, "value", "alias")
  @TestData("class as C", false, "class", "C")
  @TestData('"remote" as local', false, '"remote"', "local")
  @TestMethod
  public preservesEveryRoleInAmbiguousTypeSpecifiers(content: string, isTypeOnly: boolean, name: string, alias: string | undefined): void {
    const imports = ModuleSyntaxFixture.importSpecifier(content);
    const exports = ModuleSyntaxFixture.exportSpecifier(content, name.startsWith("\""));
    for (const node of [imports, exports]) {
      Assert.areEqual(isTypeOnly, !Object.isUndefined(node.typeKeywordNode));
      Assert.isInstanceOf(node.nameNode, ValueNode);
      Assert.areEqual(name, node.nameNode.value);
      if (Object.isUndefined(alias)) {
        Assert.isUndefined(node.aliasNode);
        Assert.isUndefined(node.asKeywordNode);
      }
      else {
        Assert.isInstanceOf(node.aliasNode, ValueNode);
        Assert.areEqual(alias, node.aliasNode.value);
        Assert.isDefined(node.asKeywordNode);
      }
      Assert.areEqual(content.length, node.span.length);
    }
  }

  @TestData('import {class} from "m";', 8, 5)
  @TestData('import {x as class} from "m";', 13, 5)
  @TestData('import { "x" } from "m";', 9, 3)
  @TestData('import {x as "y"} from "m";', 13, 3)
  @TestData('import {a as} from "m";', 12, 1)
  @TestData('import {class as} from "m";', 16, 1)
  @TestData('import {"remote" as} from "m";', 19, 1)
  @TestData('import {type class as} from "m";', 21, 1)
  @TestMethod
  public validatesTheLocalImportNameRatherThanTheRemoteName(content: string, start: number, length: number): void {
    const result = TypeScriptParser.parse(content);
    Assert.isInstanceOf(result.rootNode.children[0], TypeScriptImportDeclarationNode);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS1003", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(start, result.diagnostics[0]?.location?.start);
    Assert.areEqual(length, result.diagnostics[0]?.location?.length);
  }

  @TestMethod
  public allowsStringAndReservedExportNames(): void {
    const node = ModuleSyntaxFixture.exportSpecifier('"remote" as "public"', true);
    Assert.isInstanceOf(node.aliasNode, ValueNode);
    Assert.areEqual('"public"', node.aliasNode.value);
    const keyword = ModuleSyntaxFixture.exportSpecifier("class");
    Assert.isInstanceOf(keyword.nameNode, ValueNode);
    Assert.areEqual("class", keyword.nameNode.value);
  }

  @TestMethod
  public writesAMissingAliasAfterAs(): void {
    const importResult = TypeScriptParser.parse('import { a as } from "m";');
    const exportResult = TypeScriptParser.parse("export { a as };");
    const importNode = importResult.rootNode.children[0];
    const exportNode = exportResult.rootNode.children[0];
    Assert.isInstanceOf(importNode, TypeScriptImportDeclarationNode);
    Assert.isInstanceOf(exportNode, TypeScriptExportDeclarationNode);
    const importsNode = importNode.importClauseNode?.namedBindingsNode;
    Assert.isInstanceOf(importsNode, TypeScriptNamedImportsNode);
    Assert.isInstanceOf(exportNode.exportClauseNode, TypeScriptNamedExportsNode);

    for (const specifierNode of [importsNode.children[0], exportNode.exportClauseNode.children[0]]) {
      Assert.isDefined(specifierNode);
      Assert.isDefined(specifierNode.asKeywordNode);
      Assert.isInstanceOf(specifierNode.aliasNode, TypeScriptMissingIdentifierNode);
      Assert.areEqual(13, specifierNode.aliasNode.span.startOffset);
      Assert.areEqual(0, specifierNode.aliasNode.span.length);
      Assert.areEqual(13, specifierNode.span.endOffset);
    }
    Assert.areEqual("TS1003@14:1", TypeScriptDiagnosticsFixture.project(importResult.diagnostics));
    Assert.areEqual("TS1003@14:1", TypeScriptDiagnosticsFixture.project(exportResult.diagnostics));
  }
}
