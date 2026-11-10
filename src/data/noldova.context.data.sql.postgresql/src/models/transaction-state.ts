/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { PoolLease } from "./client/pool-lease.js";

export class TransactionState {
  public readonly lease: PoolLease;
  public readonly mode: string;
  public savepoints: number = 0;
  public prepared: string | null = null;

  public constructor(lease: PoolLease, mode: string) {
    this.lease = lease;
    this.mode = mode;
  }
}
