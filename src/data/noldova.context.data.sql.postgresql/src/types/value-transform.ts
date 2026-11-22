/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Column } from "../models/column.js";

export interface ValueTransform {
  readonly from?: (value: unknown, column: Column) => unknown;
  readonly to?: (value: unknown) => unknown;
}
