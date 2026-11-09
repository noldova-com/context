/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class BackendKey {
  public readonly pid: number;
  public readonly secret: number;

  public constructor(pid: number, secret: number) {
    this.pid = pid;
    this.secret = secret;
  }
}
