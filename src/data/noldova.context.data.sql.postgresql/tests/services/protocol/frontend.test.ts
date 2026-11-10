/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { MessageTarget } from "@noldova/context.data.sql.postgresql/enums/message-target.js";
import { Frontend } from "@noldova/context.data.sql.postgresql/services/protocol/frontend.js";
import { ProtocolWriter } from "@noldova/context.data.sql.postgresql/services/protocol/protocol-writer.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class FrontendTests {
  @TestMethod
  public writesTheBareMessages(): void {
    const frontend = new Frontend();

    Assert.areEqual("5300000004", frontend.sync().toString("hex"));
    Assert.areEqual("4800000004", frontend.flush().toString("hex"));
    Assert.areEqual("6300000004", frontend.copyDone().toString("hex"));
  }

  @TestMethod
  public writesTheTextMessages(): void {
    const frontend = new Frontend();

    Assert.areEqual("51000000067800", frontend.query("x").toString("hex"));
    Assert.areEqual("64000000066162", frontend.copyData("ab").toString("hex"));
    Assert.areEqual("6400000005ff", frontend.copyData(new Uint8Array([255])).toString("hex"));
    Assert.areEqual("66000000066500", frontend.copyFail("e").toString("hex"));
  }

  @TestMethod
  public writesDescribeCloseAndExecute(): void {
    const frontend = new Frontend();

    Assert.areEqual("4400000007537300", frontend.describe(MessageTarget.Statement, "s").toString("hex"));
    Assert.areEqual("43000000065000", frontend.close(MessageTarget.Portal, "").toString("hex"));
    Assert.areEqual("45000000090000000005", frontend.execute("", 5).toString("hex"));
    Assert.areEqual("45000000090000000000", frontend.execute("").toString("hex"));
  }

  @TestMethod
  public writesACancelRequest(): void {
    Assert.areEqual("0000001004d2162e0000000100000002", new Frontend().cancel(1, 2).toString("hex"));
  }

  @TestMethod
  public writesParseWithItsTypes(): void {
    const frontend = new Frontend();

    Assert.areEqual("500000000e73007800000100000017", frontend.parse("s", "x", [23]).toString("hex"));
    Assert.areEqual("500000000a730078000000", frontend.parse("s", "x").toString("hex"));
  }

  @TestMethod
  public writesBindWithFormatsAndBinaryValues(): void {
    const frontend = new Frontend();

    Assert.areEqual(
      "4200000023" + "00" + "7300" + "0003" + "0000" + "0000" + "0001" + "0003" + "0000000161" + "ffffffff" + "00000001ff" + "0001" + "0001",
      frontend.bind("", "s", ["a", null, new Uint8Array([255])], [0, 0, 1], [1]).toString("hex"));
    Assert.areEqual("420000000d007300000000000000", frontend.bind("", "s").toString("hex"));
  }

  @TestMethod
  public runsAPortalWithFlushOrSync(): void {
    const frontend = new Frontend();
    const bind = "420000000d007300000000000000";
    const execute = "45000000090000000000";

    Assert.areEqual(bind + execute + "4800000004", frontend.run("", "s", [], 0, true, null).toString("hex"));
    Assert.areEqual(bind + execute + "5300000004", frontend.run("", "s", [], 0, false, null).toString("hex"));
    Assert.areEqual("420000000f0073000000000000010001" + execute + "4800000004", frontend.run("", "s", [], 0, true, [1]).toString("hex"));
  }

  @TestMethod
  public appendsSeveralMessagesToOneWriter(): void {
    const writer = new ProtocolWriter();

    Frontend.writeSync(Frontend.writeFlush(Frontend.writeTerminate(Frontend.writeCopyDone(writer))));

    Assert.areEqual("6300000004580000000448000000045300000004", writer.take().toString("hex"));
  }
}
