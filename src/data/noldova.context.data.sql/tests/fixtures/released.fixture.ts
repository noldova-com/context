/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import process from "node:process";
import { setImmediate } from "node:timers";

export class Released {
  public static async socketsAsync(): Promise<boolean> {
    for (let turn = 0; turn < 100 && Released.holdsSockets(); turn += 1)
      await new Promise<void>(resolve => setImmediate(resolve));

    return !Released.holdsSockets();
  }

  private static holdsSockets(): boolean {
    const open = process.getActiveResourcesInfo();
    return open.includes("TCPSocketWrap") || open.includes("TCPServerWrap") || open.includes("ConnectWrap");
  }
}
