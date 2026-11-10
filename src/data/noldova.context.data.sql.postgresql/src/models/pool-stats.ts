/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class PoolStats {
  public readonly connections: number;
  public readonly opening: number;
  public readonly idle: number;
  public readonly leased: number;
  public readonly waiting: number;

  public constructor(connections: number, opening: number, idle: number, leased: number, waiting: number) {
    this.connections = connections;
    this.opening = opening;
    this.idle = idle;
    this.leased = leased;
    this.waiting = waiting;
  }
}
