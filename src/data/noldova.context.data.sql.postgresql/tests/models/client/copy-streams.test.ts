/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { Buffer } from "node:buffer";
import { once } from "node:events";

import { ExchangeKind } from "@noldova/context.data.sql.postgresql/enums/exchange-kind.js";
import { WriteOutcome } from "@noldova/context.data.sql.postgresql/enums/write-outcome.js";
import { CopyBothStream } from "@noldova/context.data.sql.postgresql/models/client/copy-both-stream.js";
import { CopyOutStream } from "@noldova/context.data.sql.postgresql/models/client/copy-out-stream.js";
import { Exchange } from "@noldova/context.data.sql.postgresql/models/client/exchange.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { FakeCopyHost } from "../../fixtures/fake-copy-host.fixture.js";

@TestClass
export class CopyStreamsTests {
  @TestMethod
  public async readsCopyOutDataTheHostPushesAsync(): Promise<void> {
    const host = new FakeCopyHost();
    const exchange = CopyStreamsTests.exchange();
    const stream = new CopyOutStream(host, exchange);
    host.onRead = () => {
      stream.push(Buffer.from("1\tone\n"));
      stream.push(null);
    };

    const chunks: string[] = [];
    for await (const chunk of stream)
      chunks.push(Buffer.from(chunk).toString("utf8"));

    Assert.areEqual("1\tone\n", chunks.join(""));
    Assert.areEqual("read", host.calls[0]);
    Assert.areEqual(exchange, host.exchanges[0]);
    Assert.isNull(stream.count);
    Assert.isNull(stream.command);
  }

  @TestMethod
  public async abandonsTheCopyWhenACopyOutStreamIsDestroyedAsync(): Promise<void> {
    const host = new FakeCopyHost();
    const exchange = CopyStreamsTests.exchange();
    const stream = new CopyOutStream(host, exchange);
    const closed = once(stream, "close");

    stream.destroy();
    await closed;

    Assert.areEqual("abandon", host.calls.join(","));
    Assert.areEqual(exchange, host.exchanges[0]);
  }

  @TestMethod
  public async writesReadsAndFinishesThroughTheHostAsync(): Promise<void> {
    const host = new FakeCopyHost();
    const exchange = CopyStreamsTests.exchange();
    const stream = new CopyBothStream(host, exchange);
    host.onRead = () => {
      host.onRead = () => undefined;
      stream.push(Buffer.from("reply"));
    };
    const finished = once(stream, "finish");
    const data = once(stream, "data");

    await new Promise<void>((resolve, reject) => {
      stream.write(Buffer.from("first"), error => Object.isNullOrUndefined(error) ? resolve() : reject(error));
    });
    stream.end(Buffer.from("last"));
    await finished;
    const [received] = await data;

    Assert.areEqual("first,last", host.written.join(","));
    Assert.isTrue(host.calls.includes("finish"));
    Assert.isTrue(host.calls.includes("read"));
    Assert.isTrue(host.exchanges.every(t => t === exchange));
    Assert.isInstanceOf(received, Buffer);
    Assert.areEqual("reply", received.toString("utf8"));
    Assert.isNull(stream.count);
    Assert.isNull(stream.command);
  }

  @TestMethod
  public async failsTheCopyWithTheErrorThatDestroyedItAsync(): Promise<void> {
    const host = new FakeCopyHost();
    const exchange = CopyStreamsTests.exchange();
    const stream = new CopyBothStream(host, exchange);
    const failure = new Error("stop");
    const errored = once(stream, "error");

    stream.destroy(failure);
    const [error] = await errored;

    Assert.areEqual(failure, error);
    Assert.areEqual(failure, host.failure);
    Assert.areEqual("fail", host.calls.join(","));
    Assert.areEqual(exchange, host.exchanges[0]);
  }

  private static exchange(): Exchange {
    return new Exchange(ExchangeKind.Query, null, null, () => WriteOutcome.Written);
  }
}
