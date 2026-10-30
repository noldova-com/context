/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ValueNode } from "@noldova/context.parsers";
import {
  TypeScriptImportDeclarationNode,
  TypeScriptMissingIdentifierNode,
  TypeScriptNamedImportsNode,
  TypeScriptNamespaceImportNode,
  TypeScriptParser
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { ModuleSyntaxFixture } from "../../../fixtures/module-syntax.fixture.js";
import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";

@TestClass
export class ImportClauseParserTests {
  @TestMethod
  public retainsTheDefaultBindingCommaAndNamespaceRoles(): void {
    const node = ModuleSyntaxFixture.parseImport('import main, * as ns from "m";').importClauseNode;
    Assert.isDefined(node);
    Assert.isInstanceOf(node.defaultNameNode, ValueNode);
    Assert.areEqual("main", node.defaultNameNode.value);
    Assert.isDefined(node.commaNode);
    Assert.isInstanceOf(node.namedBindingsNode, TypeScriptNamespaceImportNode);
    Assert.isDefined(node.namedBindingsNode.asKeywordNode);
    Assert.isInstanceOf(node.namedBindingsNode.nameNode, ValueNode);
    Assert.areEqual("ns", node.namedBindingsNode.nameNode.value);
    Assert.areEqual(7, node.span.startOffset);
    Assert.areEqual(20, node.span.endOffset);
  }

  @TestMethod
  public keepsNamedAndDefaultOnlyImportsDistinct(): void {
    const named = ModuleSyntaxFixture.parseImport('import main, {x} from "m";').importClauseNode;
    const plain = ModuleSyntaxFixture.parseImport('import main from "m";').importClauseNode;
    Assert.isInstanceOf(named?.namedBindingsNode, TypeScriptNamedImportsNode);
    Assert.isDefined(plain?.defaultNameNode);
    Assert.isUndefined(plain?.namedBindingsNode);
    Assert.isUndefined(plain?.commaNode);
  }

  @TestData('import * ns from "m";', "TS1005@9:2 'as' expected.")
  @TestData('import * as from "m";', "TS1005@17:3 'from' expected.")
  @TestData('import * as ns "m";', "TS1005@15:3 'from' expected.")
  @TestData('import *', "TS1005@8:0 'as' expected.")
  @TestData('import * as', "TS1003@11:0 Identifier expected.")
  @TestMethod
  public recoversMissingNamespaceSeparators(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
  }

  @TestMethod
  public writesAMissingNamespaceNameAfterAs(): void {
    const result = TypeScriptParser.parse("import * as ;");
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, TypeScriptImportDeclarationNode);
    const namespaceNode = node.importClauseNode?.namedBindingsNode;

    Assert.isInstanceOf(namespaceNode, TypeScriptNamespaceImportNode);
    Assert.isInstanceOf(namespaceNode.nameNode, TypeScriptMissingIdentifierNode);
    Assert.areEqual(11, namespaceNode.nameNode.span.startOffset);
    Assert.areEqual(0, namespaceNode.nameNode.span.length);
    Assert.areEqual(11, namespaceNode.span.endOffset);
    Assert.areEqual("TS1003@12:1", TypeScriptDiagnosticsFixture.project(result.diagnostics));
  }
}
