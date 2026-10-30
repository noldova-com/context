/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptDebuggerStatementNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class DebuggerStatementParserTests {
  @TestMethod
  public preservesAnExplicitSemicolon(): void {
    const node = TypeScriptParserFixture.create("debugger;").parseStatement();
    const unterminatedNode = TypeScriptParserFixture.create("debugger").parseStatement();

    Assert.isInstanceOf(node, TypeScriptDebuggerStatementNode);
    Assert.isDefined(node.semicolonNode);
    Assert.isInstanceOf(unterminatedNode, TypeScriptDebuggerStatementNode);
    Assert.isUndefined(unterminatedNode.semicolonNode);
  }
}
