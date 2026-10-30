/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptConditionalTypeNode, TypeScriptInferTypeNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class InferTypeParserTests {
  @TestData("infer Value", false)
  @TestData("infer Value extends string", true)
  @TestMethod
  public preservesTheInferredParameterAndItsConstraint(content: string, hasConstraint: boolean): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseType();
    Assert.isInstanceOf(node, TypeScriptInferTypeNode);
    Assert.areEqual(hasConstraint, !Object.isUndefined(node.typeParameterNode.constraintNode));
    Assert.isTrue(parser.isEndOfFile);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public leavesAConditionalExtendsOutsideTheInferParameter(): void {
    const parser = TypeScriptParserFixture.create("infer Value extends string ? Yes : No");
    const node = parser.parseType();
    Assert.isInstanceOf(node, TypeScriptConditionalTypeNode);
    Assert.isInstanceOf(node.checkTypeNode, TypeScriptInferTypeNode);
    Assert.isUndefined(node.checkTypeNode.typeParameterNode.constraintNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public keepsTheConstraintInsideAnOuterConditional(): void {
    const parser = TypeScriptParserFixture.create("Input extends infer Value extends string ? Yes : No");
    const node = parser.parseType();
    Assert.isInstanceOf(node, TypeScriptConditionalTypeNode);
    Assert.isInstanceOf(node.extendsTypeNode, TypeScriptInferTypeNode);
    Assert.isDefined(node.extendsTypeNode.typeParameterNode.constraintNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public reportsAMissingInferredName(): void {
    const parser = TypeScriptParserFixture.create("infer");
    const node = parser.parseType();
    Assert.isInstanceOf(node, TypeScriptInferTypeNode);
    Assert.areEqual(0, node.typeParameterNode.nameNode.span.length);
    Assert.areEqual("TS1003@5:0 Identifier expected.", TypeScriptDiagnosticsFixture.projectWithMessages(parser.context.diagnosticCollector.diagnostics));
  }

  @TestData("type T<U> = U extends [infer await, 1 if] ? 1 : 0;\nexport {};", "TS1005@38:2")
  @TestData("type T<U> = U extends [infer V, 1 if] ? 1 : 0;\nexport {};", "TS1005@34:2|TS1005@36:1|TS1128@38:1|TS1005@42:1")
  @TestMethod
  public readsAnInferredAwaitAsAName(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }
}
