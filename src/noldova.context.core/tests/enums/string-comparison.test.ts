/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { StringComparison } from "@noldova/context.core";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class StringComparisonTests {
  @TestMethod
  public namesTheComparisonsCanonically(): void {
    Assert.areEqual<string>("Ordinal", StringComparison.Ordinal);
    Assert.areEqual<string>("OrdinalIgnoreCase", StringComparison.OrdinalIgnoreCase);
  }
}
