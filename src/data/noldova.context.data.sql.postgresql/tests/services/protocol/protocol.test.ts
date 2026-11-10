/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { Buffer } from "node:buffer";

import { Backend } from "@noldova/context.data.sql.postgresql/services/protocol/backend.js";
import { FrameReader } from "@noldova/context.data.sql.postgresql/services/protocol/frame.reader.js";
import { Frontend } from "@noldova/context.data.sql.postgresql/services/protocol/frontend.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class ProtocolTests {
  @TestMethod
  public writesTheStartupAndSslRequestMessages(): void {
    const frontend = new Frontend();

    Assert.areEqual("0000000804d2162f", frontend.createSslRequest().toString("hex"));
    const startup = frontend.createStartup(new Map([["user", "app"], ["empty", ""]]));
    Assert.areEqual(startup.length, startup.readInt32BE(0));
    Assert.areEqual(196608, startup.readInt32BE(4));
    Assert.areEqual("user\0app\0\0", startup.toString("utf8", 8));
    Assert.throws(() => frontend.createStartup(new Map([["user", "a\0b"]])), Error);
    Assert.areEqual("5800000004", frontend.terminate().toString("hex"));
  }

  @TestMethod
  public writesOneUnnamedExtendedQuery(): void {
    const message = new Frontend().createExtendedQuery("SELECT $1, $2", ["a", null]);
    const types: string[] = [];
    for (let index = 0; index < message.length; index += 1 + message.readInt32BE(index + 1))
      types.push(String.fromCharCode(message.readUInt8(index)));

    Assert.areEqual("P,B,D,E,S", types.join(","));
    Assert.isTrue(message.includes(Buffer.from("SELECT $1, $2\0")));
    Assert.isTrue(message.includes(Buffer.from("00000001" + "61" + "ffffffff", "hex")));
  }

  @TestMethod
  public framesMessagesSplitAcrossChunks(): void {
    const frames: string[] = [];
    const reader = new FrameReader((type, data, start, end) => frames.push(String.fromCharCode(type) + data.toString("utf8", start + 5, end)), () => undefined);
    const stream = Buffer.concat([ProtocolTests.message("Z", "I"), ProtocolTests.message("C", "SELECT 1\0")]);

    for (const chunk of [stream.subarray(0, 2), stream.subarray(2, 7), stream.subarray(7, 9), stream.subarray(9)])
      reader.push(Buffer.from(chunk));

    Assert.areEqual("ZI|CSELECT 1\0", frames.join("|"));
  }

  @TestMethod
  public refusesAnInvalidLengthOnce(): void {
    const errors: Error[] = [];
    const reader = new FrameReader(() => undefined, error => errors.push(error));

    reader.push(Buffer.from("5a00000001", "hex"));
    reader.push(ProtocolTests.message("Z", "I"));

    Assert.areEqual(1, errors.length);
    Assert.isTrue(errors[0]?.message.includes("(1)") === true);
  }

  @TestMethod
  public parsesRowsCommandsAndErrors(): void {
    const description = ProtocolTests.message("T", Buffer.concat([
      Buffer.from("0002", "hex"),
      Buffer.from("id\0"), Buffer.from("000000000000" + "00000014" + "0008" + "ffffffff" + "0000", "hex"),
      Buffer.from("text\0"), Buffer.from("000000000000" + "00000019" + "ffff" + "ffffffff" + "0000", "hex")]));
    const row = ProtocolTests.message("D", Buffer.from("0002" + "00000001" + "37" + "ffffffff", "hex"));
    const error = ProtocolTests.message("E", "SERROR\0C23505\0Mduplicate key\0nIX_notes\0\0");

    Assert.areEqual("id:20,text:25", Backend.readRowDescription(description, 0).map(t => `${t.name}:${t.type}`).join(","));
    Assert.areEqual("7,null", Backend.readDataRow(row, 0).map(t => t ?? "null").join(","));
    const insert = Backend.readCommandComplete(ProtocolTests.message("C", "INSERT 0 3\0"), 0, 16);
    Assert.areEqual("INSERT", insert.command);
    Assert.areEqual(3, insert.count);
    Assert.isNull(Backend.readCommandComplete(ProtocolTests.message("C", "BEGIN\0"), 0, 11).count);
    Assert.areEqual("T", Backend.readReadyForQuery(ProtocolTests.message("Z", "T"), 0));
    Assert.areEqual("TimeZone=UTC", Backend.readParameterStatus(ProtocolTests.message("S", "TimeZone\0UTC\0"), 0).join("="));
    const fields = Backend.readError(error, 0, error.length);
    Assert.areEqual("23505", fields.get("code"));
    Assert.areEqual("duplicate key", fields.get("message"));
    Assert.areEqual("IX_notes", fields.get("constraint_name"));
  }

  private static message(type: string, body: string | Buffer): Buffer {
    const content = typeof body === "string" ? Buffer.from(body) : body;
    const header = Buffer.alloc(5);
    header.write(type, 0);
    header.writeInt32BE(4 + content.length, 1);
    return Buffer.concat([header, content]);
  }
}
