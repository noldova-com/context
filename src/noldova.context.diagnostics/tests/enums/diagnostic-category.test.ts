/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DiagnosticCategory } from "@noldova/context.diagnostics";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class DiagnosticCategoryTests {
  @TestMethod
  public namesTheCategoriesCanonically(): void {
    Assert.areEqual<string>("Error", DiagnosticCategory.Error);
    Assert.areEqual<string>("Warning", DiagnosticCategory.Warning);
    Assert.areEqual<string>("Suggestion", DiagnosticCategory.Suggestion);
    Assert.areEqual<string>("Message", DiagnosticCategory.Message);
  }
}
