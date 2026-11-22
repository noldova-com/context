/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { Buffer } from "node:buffer";

import { MalformedMessageException } from "@noldova/context.data.sql.postgresql/exceptions/malformed-message.exception.js";
import { Backend } from "@noldova/context.data.sql.postgresql/services/protocol/backend.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { BackendMessages as M } from "../../fixtures/backend-messages.fixture.js";

@TestClass
export class BackendTests {
  @TestMethod
  public readsTheParameterTypes(): void {
    const two = M.parameterDescription([23, 25]);
    const none = M.parameterDescription([]);

    Assert.areEqual("23,25", Backend.readParameterDescription(two, 0, two.length).join(","));
    Assert.areEqual(0, Backend.readParameterDescription(none, 0, none.length).length);
  }

  @TestMethod
  public readsTheColumnsWithTheirTable(): void {
    const data = M.rowDescription([["a", 23], ["b", 25]], 1259);

    const columns = Backend.readColumns(data, 0, data.length, (name, table, number, type) => `${name}:${table}:${number}:${type}`);

    Assert.areEqual("a:1259:1:23,b:1259:2:25", columns.join(","));
    Assert.areEqual("23,25", Backend.readColumnTypes(data, 0, data.length).join(","));
  }

  @TestMethod
  public readsANotificationAndTheBackendKey(): void {
    const notificationData = M.notification(42, "jobs", "go");
    const keyData = M.backendKeyData(7, -9);

    const notification = Backend.readNotification(notificationData, 0, notificationData.length);

    Assert.areEqual(42, notification.pid);
    Assert.areEqual("jobs", notification.channel);
    Assert.areEqual("go", notification.payload);
    const key = Backend.readBackendKeyData(keyData, 0, keyData.length);
    Assert.areEqual(7, key.pid);
    Assert.areEqual(-9, key.secret);
  }

  @TestMethod
  public namesAnUnknownErrorFieldByItsCode(): void {
    const data = M.message("E", "Zzone\0Mx\0\0");

    const fields = Backend.readError(data, 0, data.length);

    Assert.areEqual("zone", fields.get("Z"));
    Assert.areEqual("x", fields.get("message"));
  }

  @TestMethod
  public readsTheAuthenticationType(): void {
    const body = Buffer.alloc(4);
    body.writeInt32BE(10);
    const data = M.message("R", body);

    Assert.areEqual(10, Backend.readAuthenticationType(data, 0, data.length));
  }

  @TestMethod
  public fallsBackToTheLocalSeverity(): void {
    const data = M.message("E", "SFEHLER\0C42601\0Mx\0\0");

    const fields = Backend.readError(data, 0, data.length);

    Assert.areEqual("FEHLER", fields.get("severity"));
    Assert.areEqual("FEHLER", fields.get("severity_local"));
    const both = M.error("42601", "x", "ERROR");
    Assert.areEqual("ERROR", Backend.readError(both, 0, both.length).get("severity"));
    const none = M.message("E", "C42601\0\0");
    Assert.isFalse(Backend.readError(none, 0, none.length).has("severity"));
  }

  @TestMethod
  public refusesAnErrorFieldWithoutItsTerminator(): void {
    const short = M.message("E", "SERROR\0Mx");
    const frames = Buffer.concat([M.message("E", "Mx"), M.message("Z", "I")]);

    Assert.throws(() => Backend.readError(short, 0, short.length), MalformedMessageException);
    Assert.throws(() => Backend.readError(frames, 0, frames.length - 6), MalformedMessageException);
  }

  @TestMethod
  public refusesMessagesWhoseFieldsPassTheirEnd(): void {
    const description = M.rowDescription([["a", 23]]);
    const types = M.parameterDescription([23, 25]);
    const unterminated = M.message("T", Buffer.from("0001616263", "hex"));
    const status = M.message("S", "TimeZone\0UTC");
    const empty = M.message("Z");

    Assert.throws(() => Backend.readFieldCount(M.message("D", Buffer.from("00", "hex")), 0, 6), MalformedMessageException);
    Assert.throws(() => Backend.readFieldLength(Buffer.from("fffffffe", "hex"), 0, 4), MalformedMessageException);
    Assert.throws(() => Backend.readFieldLength(Buffer.from("0000000561", "hex"), 0, 5), MalformedMessageException);
    Assert.throws(() => Backend.readFieldLength(Buffer.from("000000", "hex"), 0, 3), MalformedMessageException);
    Assert.throws(() => Backend.readColumns(description, 0, description.length - 1, name => name), MalformedMessageException);
    Assert.throws(() => Backend.readColumnTypes(description, 0, 8), MalformedMessageException);
    Assert.throws(() => Backend.readColumns(unterminated, 0, unterminated.length, name => name), MalformedMessageException);
    Assert.throws(() => Backend.readParameterDescription(types, 0, types.length - 1), MalformedMessageException);
    Assert.throws(() => Backend.readReadyForQuery(empty, 0, empty.length), MalformedMessageException);
    Assert.throws(() => Backend.readParameterStatus(status, 0, status.length), MalformedMessageException);
    Assert.throws(() => Backend.readNotification(M.message("A", Buffer.alloc(2)), 0, 7), MalformedMessageException);
    Assert.throws(() => Backend.readBackendKeyData(M.message("K", Buffer.alloc(4)), 0, 9), MalformedMessageException);
    Assert.throws(() => Backend.readAuthenticationType(empty, 0, empty.length), MalformedMessageException);
  }
}
