/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export type TransactionResult<T> = T extends readonly unknown[] ? { -readonly [K in keyof T]: Awaited<T[K]> } : Awaited<T>;
