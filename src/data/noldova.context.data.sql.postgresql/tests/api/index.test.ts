/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { execFile } from "node:child_process";
import { promisify } from "node:util";

import * as api from "@noldova/context.data.sql.postgresql";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class DataSqlPostgreSQLApiTests {
  @TestMethod
  public exportsTheCompleteRuntimeSurface(): void {
    Assert.areEqual("PostgreSQLConnection,PostgreSQLDialect,PostgreSQLProvider", Object.keys(api).sort().join(","));
  }

  @TestMethod
  public async loadsWithoutOpeningAnyResourceAsync(): Promise<void> {
    const entryPoint = JSON.stringify(import.meta.resolve("@noldova/context.data.sql.postgresql"));
    const script = `const before = process.getActiveResourcesInfo();
      await import(${entryPoint});
      process.stdout.write(before.join(",") + "|" + process.getActiveResourcesInfo().join(","));`;

    const { stdout } = await promisify(execFile)(process.execPath, ["--input-type=module", "--eval", script], { windowsHide: true });
    const [before, after] = stdout.split("|");

    Assert.areEqual(before, after);
  }
}
