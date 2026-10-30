/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { BroadcastChannel, parentPort } from "node:worker_threads";

import { TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class LateRejectionFixtureTests {
  public static readonly CHANNEL_NAME: string = "late-rejection-fixture";

  @TestMethod
  public async rejectsAfterItsTimeoutAsync(): Promise<void> {
    const channel = new BroadcastChannel(LateRejectionFixtureTests.CHANNEL_NAME);
    channel.onmessage = (): void => {
      channel.close();
      void Promise.reject(new Error("The abandoned test rejected after its timeout."));
      setImmediate(() => parentPort?.postMessage("rejectedLate"));
    };
    await new Promise<void>(() => { });
  }
}
