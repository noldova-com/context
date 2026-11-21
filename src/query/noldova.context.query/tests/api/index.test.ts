/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as api from "@noldova/context.query";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class QueryApiTests {
  @TestMethod
  public exportsTheCompleteCatalog(): void {
    Assert.areEqual("InMemoryQueryProvider,OrderedQueryable,QueryProvider,Queryable", Object.keys(api).sort().join(","));
  }
}
