/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptExpressionStatementNode, TypeScriptParser, TypeScriptVariableStatementNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptUsingKeywordNodeExtensionsTests {
  @TestData("using value = resource;", true, true)
  @TestData("using {value} = resource;", true, true)
  @TestData("using [value] = resource;", false, false)
  @TestData("using(value);", false, false)
  @TestData("using.value;", false, false)
  @TestData("using\nvalue = resource;", false, false)
  @TestData("using /*\n*/ value = resource;", false, false)
  @TestData("using /*same*/ value = resource;", true, true)
  @TestData("using of resources", true, false)
  @TestData("using of = resource", true, true)
  @TestData("using of; ;", true, true)
  @TestData("using of: T = resource", true, true)
  @TestData("using of", true, false)
  @TestData("using\nof = resource", false, true)
  @TestMethod
  public distinguishesDeclarationAndForInitializerRecognition(content: string, startsStatement: boolean, startsForInitializer: boolean): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.currentNode;
    const offset = parser.typescriptLexer.reader.currentOffset;
    Assert.isTrue(node.isTypeScriptVariableDeclarationKeyword());
    Assert.areEqual(startsStatement, node.isTypeScriptVariableStatementStart(parser));
    Assert.areEqual(startsStatement, node.isTypeScriptDeclarationStart(parser));
    Assert.areEqual(startsForInitializer, node.isTypeScriptForVariableDeclarationStart(parser));
    Assert.areEqual(node, parser.currentNode);
    Assert.areEqual(offset, parser.typescriptLexer.reader.currentOffset);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public dispatchesDeclarationsAndPreservesOrdinaryIdentifierUses(): void {
    const declaration = TypeScriptParser.parse("using value = resource;");
    Assert.isInstanceOf(declaration.rootNode.children[0], TypeScriptVariableStatementNode);
    const expression = TypeScriptParser.parse("using(resource);");
    Assert.isInstanceOf(expression.rootNode.children[0], TypeScriptExpressionStatementNode);
    Assert.areEqual(0, declaration.diagnostics.length);
    Assert.areEqual(0, expression.diagnostics.length);
  }
}
