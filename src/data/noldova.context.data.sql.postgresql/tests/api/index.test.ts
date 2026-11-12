/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { spawnSync } from "node:child_process";

import * as api from "@noldova/context.data.sql.postgresql";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class DataSqlPostgreSQLApiTests {
  @TestMethod
  public exportsTheCompleteRuntimeSurface(): void {
    Assert.areEqual("PostgreSQLConnection,PostgreSQLDialect,PostgreSQLProvider", Object.keys(api).sort().join(","));
  }

  @TestMethod
  public loadsWithoutOpeningAnyResource(): void {
    const entryPoint = JSON.stringify(import.meta.resolve("@noldova/context.data.sql.postgresql"));
    const script = `const before = process.getActiveResourcesInfo();
      await import(${entryPoint});
      const after = process.getActiveResourcesInfo();
      process.stdout.write(before.join(",") + "|" + after.join(","));`;

    const loaded = spawnSync(process.execPath, ["--input-type=module", "--eval", script], { encoding: "utf8", windowsHide: true });
    const [before, after] = loaded.stdout.split("|");

    Assert.areEqual(0, loaded.status, loaded.stderr);
    Assert.areEqual(before, after);
  }
}
