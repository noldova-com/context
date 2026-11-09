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
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { BackendMessages as M } from "../../fixtures/backend-messages.fixture.js";

@TestClass
export class BackendTests {
  @TestMethod
  public readsTheParameterTypes(): void {
    Assert.areEqual("23,25", Backend.readParameterDescription(M.parameterDescription([23, 25]), 0).join(","));
    Assert.areEqual(0, Backend.readParameterDescription(M.parameterDescription([]), 0).length);
  }

  @TestMethod
  public readsTheColumnsWithTheirTable(): void {
    const data = M.rowDescription([["a", 23], ["b", 25]], 1259);

    const columns = Backend.readColumns(data, 0, (name, table, number, type) => `${name}:${table}:${number}:${type}`);

    Assert.areEqual("a:1259:1:23,b:1259:2:25", columns.join(","));
    Assert.areEqual("23,25", Backend.readColumnTypes(data, 0).join(","));
  }

  @TestMethod
  public readsANotificationAndTheBackendKey(): void {
    const notification = Backend.readNotification(M.notification(42, "jobs", "go"), 0);

    Assert.areEqual(42, notification.pid);
    Assert.areEqual("jobs", notification.channel);
    Assert.areEqual("go", notification.payload);
    const key = Backend.readBackendKeyData(M.backendKeyData(7, -9), 0);
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

    Assert.areEqual(10, Backend.readAuthenticationType(M.message("R", body), 0));
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
}
