/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { Buffer } from "node:buffer";

import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { FakeSocket } from "../../fixtures/fake-socket.fixture.js";

@TestClass
export class ConnectionSocketTests {
  @TestMethod
  public ignoresEventsUntilAConnectionListens(): void {
    const socket = new FakeSocket();

    Assert.doesNotThrow(() => {
      socket.onData(Buffer.from("x"));
      socket.onDrain();
      socket.onClose(new Error("closed"));
    });
    socket.receive(Buffer.from("y"));
    socket.close(null);

    Assert.isTrue(socket.isClosed);
    Assert.areEqual(0, socket.written.length);
  }
}
