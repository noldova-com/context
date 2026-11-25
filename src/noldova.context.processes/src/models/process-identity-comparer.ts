/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IEqualityComparer } from "@noldova/context.collections";

import type { IProcessIdentity } from "../interfaces/i-process-identity.js";

export class ProcessIdentityComparer implements IEqualityComparer<IProcessIdentity> {
  public static readonly instance: ProcessIdentityComparer = new ProcessIdentityComparer();

  public equals(left: IProcessIdentity, right: IProcessIdentity): boolean {
    return left.processId === right.processId && left.startTime === right.startTime;
  }

  public hash(value: IProcessIdentity): number {
    return value.processId;
  }
}
