/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Enumerable, type Grouping } from "@noldova/context.collections";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class GroupingTests {
  @TestMethod
  public carriesItsKey(): void {
    Assert.areEqual("a", GroupingTests.groupOf("a", [1, 2]).key);
  }

  @TestMethod
  public enumeratesItsItemsInOrderEachTime(): void {
    const grouping = GroupingTests.groupOf("a", [3, 1, 2]);

    Assert.areEqual("[3,1,2]", JSON.stringify(grouping.toArray()));
    Assert.areEqual("[3,1,2]", JSON.stringify(grouping.toArray()));
  }

  @TestMethod
  public isAnEnumerable(): void {
    const grouping = GroupingTests.groupOf("a", [3, 1, 2]);

    Assert.isInstanceOf(grouping, Enumerable);
    Assert.areEqual(2, grouping.count(t => t > 1));
  }

  private static groupOf(key: string, items: readonly number[]): Grouping<string, number> {
    return Enumerable.from(items).groupBy(() => key).single();
  }
}
