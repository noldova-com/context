/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Resources } from "../../resources.js";

export class TestMarks {
  public static readonly CATEGORY: unique symbol = Symbol(Resources.categoryMarkDescription);
  public static readonly TEST_CLASS: unique symbol = Symbol(Resources.testClassMarkDescription);
  public static readonly TEST_DATA: unique symbol = Symbol(Resources.testDataMarkDescription);
  public static readonly TEST_METHOD: unique symbol = Symbol(Resources.testMethodMarkDescription);
  public static readonly SKIP: unique symbol = Symbol(Resources.skipMarkDescription);
}
