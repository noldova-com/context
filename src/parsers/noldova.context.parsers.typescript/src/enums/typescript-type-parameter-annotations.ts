/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export enum TypeScriptTypeParameterAnnotations {
  None = 0,
  Const = 1 << 0,
  In = 1 << 1,
  Out = 1 << 2,
  Variance = In | Out
}
