/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptArrowFunctionNode, TypeScriptArrowNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptArrowNodeExtensionsTests {
  @TestMethod
  public startsNoStatement(): void {
    const parser = TypeScriptParserFixture.create("=>");
    Assert.isInstanceOf(parser.currentNode, TypeScriptArrowNode);
    Assert.isTrue(parser.currentNode.isTypeScriptUnexpectedStatementToken(parser));
  }

  @TestMethod
  public startsAnArrowWhoseHeadIsMissing(): void {
    const parser = TypeScriptParserFixture.create("=> 1");
    const arrowNode = parser.currentNode;
    Assert.isInstanceOf(arrowNode, TypeScriptArrowNode);
    const functionNode = arrowNode.tryParseTypeScriptAssignmentStart(parser);

    Assert.isInstanceOf(functionNode, TypeScriptArrowFunctionNode);
    Assert.isUndefined(functionNode.parameterListNode);
    Assert.isUndefined(functionNode.parameterNode);
    Assert.areEqual(arrowNode, functionNode.arrowNode);
    Assert.areEqual("TS1005@0:2 '(' expected.", TypeScriptDiagnosticsFixture.projectWithMessages(parser.context.diagnosticCollector.diagnostics));
  }
}
