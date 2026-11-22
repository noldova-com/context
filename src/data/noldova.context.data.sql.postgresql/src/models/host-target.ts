/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class HostTarget {
  public readonly host: string;
  public readonly port: number | null;

  public constructor(host: string, port: number | null) {
    this.host = host;
    this.port = port;
  }
}
