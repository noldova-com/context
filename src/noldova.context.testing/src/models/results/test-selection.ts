/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { nameof } from "@noldova/context.core";
import { ArgumentOutOfRangeException } from "@noldova/context.exceptions";

import { Resources } from "../../resources.js";

export class TestSelection {
  public readonly filters: readonly string[];
  public readonly discovered: number;
  public readonly selected: number;
  public readonly unselected: number;
  public readonly isFiltered: boolean;

  public constructor(filters: readonly string[], discovered: number, selected: number) {
    TestSelection.throwIfNotCount(discovered, nameof<TestSelection>(t => t.discovered));
    TestSelection.throwIfNotCount(selected, nameof<TestSelection>(t => t.selected));
    if (selected > discovered)
      throw new ArgumentOutOfRangeException(nameof<TestSelection>(t => t.selected), selected, Resources.selectedCountInvalid);

    this.filters = [...filters];
    this.discovered = discovered;
    this.selected = selected;
    this.unselected = discovered - selected;
    this.isFiltered = filters.length > 0;
  }

  private static throwIfNotCount(count: number, parameterName: string): void {
    if (!Number.isInteger(count) || count < 0)
      throw new ArgumentOutOfRangeException(parameterName, count, Resources.testCountInvalid);
  }
}
