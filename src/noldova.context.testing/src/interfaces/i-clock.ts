/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export interface IClock {
  now(): number;
  setTimeout(callback: () => void, delayMilliseconds: number): number;
  clearTimeout(timer: number | undefined): void;
}
