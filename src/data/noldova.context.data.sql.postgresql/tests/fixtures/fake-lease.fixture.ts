/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { LeaseKind } from "@noldova/context.data.sql.postgresql/enums/lease-kind.js";
import { ConnectionLease } from "@noldova/context.data.sql.postgresql/services/client/connection-lease.js";

export class FakeLease extends ConnectionLease {
  public readonly closes: Error[] = [];
  private readonly leaseKind: LeaseKind;

  public constructor(kind: LeaseKind) {
    super();
    this.leaseKind = kind;
  }

  public override get kind(): LeaseKind {
    return this.leaseKind;
  }

  public override onClose(error: Error): void {
    this.closes.push(error);
  }
}
