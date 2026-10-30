/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";

@TestClass
export class TypeScriptFunctionTypeNodeExtensionsTests {
  @TestData("x = (a): () => T => a;", "")
  @TestData("x = (a): <T> => T => a;", "TS1005@7:1|TS1109@13:2")
  @TestData("x = (a): (<T> => T) => a;", "TS1005@7:1|TS1109@14:2|TS1434@17:1|TS1128@18:1|TS1128@20:2")
  @TestData("x = (a): () => => a;", "TS1005@7:1|TS1005@15:2")
  @TestData("(a): <T> => T => a;", "TS1005@3:1|TS1109@9:2")
  @TestMethod
  public blocksAnAmbiguousArrowHeadWhereItsParametersOrReturnTypeAreMissing(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }
}
