/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Deferred } from "./client/deferred.js";

export class ChannelListener {
  public readonly ended: Deferred<void> = new Deferred<void>();
  public readonly callback: (payload: string) => void;
  public readonly onlisten: (() => void) | null;

  public constructor(callback: (payload: string) => void, onlisten: (() => void) | null) {
    this.callback = callback;
    this.onlisten = onlisten;
    this.ended.promise.catch(() => undefined);
  }
}
