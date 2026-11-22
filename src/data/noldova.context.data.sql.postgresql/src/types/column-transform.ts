/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export interface ColumnTransform {
  readonly from?: (name: string) => string;
  readonly to?: (name: string) => string;
}
