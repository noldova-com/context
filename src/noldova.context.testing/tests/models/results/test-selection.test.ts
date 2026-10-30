/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ArgumentOutOfRangeException } from "@noldova/context.exceptions";
import { Assert, TestClass, TestData, TestMethod, TestSelection } from "@noldova/context.testing";

@TestClass
export class TestSelectionTests {
  @TestMethod
  public countsWhatTheFiltersLeftOut(): void {
    const selection = new TestSelection(["Alpha", "category:fast"], 120, 8);

    Assert.areEqual(120, selection.discovered);
    Assert.areEqual(8, selection.selected);
    Assert.areEqual(112, selection.unselected);
    Assert.areEqual("Alpha,category:fast", selection.filters.join(","));
    Assert.isTrue(selection.isFiltered);
  }

  @TestMethod
  public isNotFilteredWithoutFilters(): void {
    const selection = new TestSelection([], 5, 5);

    Assert.isFalse(selection.isFiltered);
    Assert.areEqual(0, selection.unselected);
  }

  @TestMethod
  public keepsItsOwnCopyOfTheFilters(): void {
    const filters = ["Alpha"];
    const selection = new TestSelection(filters, 2, 1);
    filters.push("Beta");

    Assert.areEqual(1, selection.filters.length);
  }

  @TestMethod
  @TestData(-1, 0, "discovered")
  @TestData(1.5, 0, "discovered")
  @TestData(2, -1, "selected")
  @TestData(2, 0.5, "selected")
  @TestData(1, 2, "selected")
  public rejectsCountsThatDoNotReconcile(discovered: number, selected: number, parameterName: string): void {
    const exception = Assert.throws(() => new TestSelection([], discovered, selected), ArgumentOutOfRangeException);

    Assert.areEqual(parameterName, exception.parameterName);
  }
}
