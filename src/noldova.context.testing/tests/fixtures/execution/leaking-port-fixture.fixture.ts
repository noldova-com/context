/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { MessageChannel, type MessagePort } from "node:worker_threads";

import { TestClass, TestMethod } from "@noldova/context.testing";

process.stdout.write("\n");

@TestClass
export class LeakingPortFixtureTests {
  private static readonly PORTS: MessagePort[] = [];

  @TestMethod
  public leavesAPortListening(): void {
    const channel = new MessageChannel();
    channel.port1.on("message", () => undefined);
    LeakingPortFixtureTests.PORTS.push(channel.port1, channel.port2);
  }
}
