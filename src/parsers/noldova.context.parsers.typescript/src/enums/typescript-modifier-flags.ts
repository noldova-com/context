/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export enum TypeScriptModifierFlags {
  None = 0,
  Accessibility = 1 << 0,
  Static = 1 << 1,
  Readonly = 1 << 2,
  Abstract = 1 << 3,
  Async = 1 << 4,
  Declare = 1 << 5,
  Export = 1 << 6,
  Override = 1 << 7,
  Accessor = 1 << 8,
  Private = 1 << 9,
  All = Accessibility | Static | Readonly | Abstract | Async | Declare | Export | Override | Accessor | Private
}
