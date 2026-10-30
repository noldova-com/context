/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  TypeScriptExpressionStatementNode,
  TypeScriptMissingIdentifierNode,
  TypeScriptParser,
  TypeScriptPropertyAccessExpressionNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class PropertyAccessExpressionParserTests {
  @TestMethod
  public parsesPublicAndPrivatePropertyNames(): void {
    const publicNode = TypeScriptParserFixture.create("target.property").parseExpression();
    const privateNode = TypeScriptParserFixture.create("target.#property").parseExpression();

    Assert.isInstanceOf(publicNode, TypeScriptPropertyAccessExpressionNode);
    Assert.isInstanceOf(privateNode, TypeScriptPropertyAccessExpressionNode);
  }

  @TestMethod
  public reportsMissingAndInvalidPropertyNames(): void {
    const missingParser = TypeScriptParserFixture.create("target.");
    const invalidParser = TypeScriptParserFixture.create("target.@");

    missingParser.parseExpression();
    invalidParser.parseExpression();

    Assert.areEqual("TS1003", missingParser.context.diagnosticCollector.diagnostics[0]?.code.displayText);
    Assert.areEqual("TS1003", invalidParser.context.diagnosticCollector.diagnostics[0]?.code.displayText);
  }

  @TestData("x. \n", "TS1003@2:0 Identifier expected.", 1)
  @TestData("a<T>.;", "TS1477@1:3 An instantiation expression cannot be followed by a property access.|TS1003@5:1 Identifier expected.", 1)
  @TestData("a<T>.\nx y;",
    "TS1477@1:3 An instantiation expression cannot be followed by a property access.|TS1003@5:0 Identifier expected.|TS1434@6:1 Unexpected keyword or identifier.", 3)
  @TestData("a<T>?.class;", "TS1477@1:3 An instantiation expression cannot be followed by a property access.", 1)
  @TestData("a<T>?.\nx y;",
    "TS1477@1:3 An instantiation expression cannot be followed by a property access.|TS1003@6:0 Identifier expected.|TS1434@7:1 Unexpected keyword or identifier.", 3)
  @TestData("a<T>?.;", "TS1003@6:1 Identifier expected.", 1)
  @TestData("a<T>?.\n;", "TS1003@7:1 Identifier expected.", 1)
  @TestData("a<T>?.@;", "TS1003@6:1 Identifier expected.|TS1109@7:1 Expression expected.", 3)
  @TestMethod
  public reportsAMissingPropertyNameAndKeepsStatementBoundaries(content: string, expectedDiagnostics: string, expectedStatements: number): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expectedDiagnostics, TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
    Assert.areEqual(expectedStatements, result.rootNode.children.length);
  }

  @TestData("a. ;", "TS1003@3:1")
  @TestData("a.", "TS1003@2:0")
  @TestData("a.\nb c", "TS1003@2:0|TS1434@3:1")
  @TestMethod
  public writesAMissingNameAtTheEndOfTheDot(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);
    const statement = result.rootNode.children[0];

    Assert.isInstanceOf(statement, TypeScriptExpressionStatementNode);
    const node = statement.expressionNode;
    Assert.isInstanceOf(node, TypeScriptPropertyAccessExpressionNode);
    Assert.isInstanceOf(node.nameNode, TypeScriptMissingIdentifierNode);
    Assert.areEqual(2, node.nameNode.span.startOffset);
    Assert.areEqual(0, node.nameNode.span.length);
    Assert.areEqual(2, node.span.endOffset);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(result.diagnostics));
  }
}
