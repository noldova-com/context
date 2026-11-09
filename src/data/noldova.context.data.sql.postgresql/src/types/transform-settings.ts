/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Column } from "../models/column.js";

export type TransformSettings = {
  readonly undefined?: unknown;
  readonly json?: boolean;
  readonly column?: ((name: string) => string) | { readonly from?: (name: string) => string; readonly to?: (name: string) => string };
  readonly value?: ((value: unknown, column: Column) => unknown) | { readonly from?: (value: unknown, column: Column) => unknown; readonly to?: (value: unknown) => unknown };
  readonly row?: ((row: unknown) => unknown) | { readonly from?: (row: unknown) => unknown; readonly to?: (row: unknown) => unknown };
};
