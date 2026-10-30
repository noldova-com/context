/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { once } from "node:events";
import { MessageChannel } from "node:worker_threads";

import { TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class ClosingPortFixtureTests {
  @TestMethod
  public async closesItsPortBeforeItEndsAsync(): Promise<void> {
    const { port1 } = new MessageChannel();
    port1.on("message", () => undefined);
    const closed = once(port1, "close");
    port1.close();
    await closed;
  }
}
