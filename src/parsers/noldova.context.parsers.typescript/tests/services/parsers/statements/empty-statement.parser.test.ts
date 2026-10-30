/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptEmptyStatementNode, TypeScriptParser, TypeScriptSemicolonNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class EmptyStatementParserTests {
  @TestMethod
  public preservesLeadingTrivia(): void {
    const result = TypeScriptParser.parse(" ;");
    const statement = result.rootNode.children[0];

    Assert.isInstanceOf(statement, TypeScriptEmptyStatementNode);
    Assert.isDefined(statement.leadingTrivia);
  }

  @TestMethod
  public parsesAStandaloneSemicolon(): void {
    const result = TypeScriptParser.parse(";");
    const statement = result.rootNode.children[0];

    Assert.isInstanceOf(statement, TypeScriptEmptyStatementNode);
    Assert.isInstanceOf(statement.semicolonNode, TypeScriptSemicolonNode);
    Assert.areEqual(1, statement.span.length);
    Assert.areEqual(0, result.diagnostics.length);
  }
}
