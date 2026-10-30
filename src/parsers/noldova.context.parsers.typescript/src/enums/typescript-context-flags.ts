/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export enum TypeScriptContextFlags {
  None = 0,
  Await = 1,
  Yield = 2,
  Decorator = 4,
  TopLevelAwait = 8,
  ConditionalTrueBranch = 16,
  DisallowConditionalTypes = 32,
  ClassBodyRecovery = 64,
  DisallowIn = 128
}
