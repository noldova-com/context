/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Column } from "../models/column.js";
import type { ColumnTransform } from "./column-transform.js";
import type { RowTransform } from "./row-transform.js";
import type { ValueTransform } from "./value-transform.js";

export interface TransformSettings {
  readonly undefined?: unknown;
  readonly json?: boolean;
  readonly column?: ((name: string) => string) | ColumnTransform;
  readonly value?: ((value: unknown, column: Column) => unknown) | ValueTransform;
  readonly row?: ((row: unknown) => unknown) | RowTransform;
}
