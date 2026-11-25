/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import "@noldova/context.core";
import type { IReadOnlyList } from "@noldova/context.collections";
import { ProcessIdentity, ProcessTree } from "@noldova/context.processes";

import { TestingException } from "../../exceptions/testing.exception.js";
import { Resources } from "../../resources.js";

export class RunProcesses {
  public static startLister(): void {
    void Promise.allSettled([ProcessIdentity.readAsync(process.pid)]);
  }

  public static async endDescendantsAsync(): Promise<IReadOnlyList<ProcessIdentity>> {
    return await ProcessTree.endDescendantsAsync(RunProcesses.requireListed(await ProcessIdentity.readAsync(process.pid)));
  }

  public static requireListed(identity: ProcessIdentity | undefined): ProcessIdentity {
    if (Object.isUndefined(identity))
      throw new TestingException(Resources.runProcessNotListed(process.pid));

    return identity;
  }
}
