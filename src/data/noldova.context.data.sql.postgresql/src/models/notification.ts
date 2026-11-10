/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class Notification {
  public readonly pid: number;
  public readonly channel: string;
  public readonly payload: string;

  public constructor(pid: number, channel: string, payload: string) {
    this.pid = pid;
    this.channel = channel;
    this.payload = payload;
  }
}
