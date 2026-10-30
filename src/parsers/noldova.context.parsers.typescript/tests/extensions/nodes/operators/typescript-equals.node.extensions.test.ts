/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import { TypeScriptEqualsNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";

@TestClass
export class TypeScriptEqualsNodeExtensionsTests {
  @TestMethod
  public isAnAssignmentOperator(): void {
    Assert.isTrue(new TypeScriptEqualsNode(new SourceSpan(0, 1)).isTypeScriptAssignmentOperator());
  }

  @TestMethod
  public canFollowAnOptionalParameterMarker(): void {
    Assert.isTrue(new TypeScriptEqualsNode(new SourceSpan(0, 1)).canFollowTypeScriptOptionalParameterMarker());
  }

  @TestMethod
  public indicatesAFunctionTypeParameter(): void {
    Assert.isTrue(new TypeScriptEqualsNode(new SourceSpan(0, 1)).isTypeScriptFunctionTypeParameterIndicator());
  }

  @TestData("export = a;", "TS1203@0:11")
  @TestMethod
  public startsAnExportAssignment(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }
}
