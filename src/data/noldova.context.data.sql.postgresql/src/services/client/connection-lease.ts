/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { LeaseKind } from "../../enums/lease-kind.js";

export abstract class ConnectionLease {
  public abstract get kind(): LeaseKind;

  public abstract onClose(error: Error): void;
}
