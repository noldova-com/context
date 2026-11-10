/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { TypeRegistry } from "../type-registry.js";
import type { PoolLease } from "./pool-lease.js";
import type { QueryHandler } from "../../services/client/query-handler.js";
import { SqlRunner } from "../../services/client/sql-runner.js";

export class ReservedClient extends SqlRunner implements AsyncDisposable, Disposable {
  private readonly lease: PoolLease;

  public constructor(types: TypeRegistry, lease: PoolLease) {
    super(types);
    this.lease = lease;
  }

  protected override get handler(): QueryHandler {
    return this.lease;
  }

  public release(): void {
    this.lease.release();
  }

  public [Symbol.dispose](): void {
    this.release();
  }

  public [Symbol.asyncDispose](): Promise<void> {
    this.release();
    return Promise.resolve();
  }
}
