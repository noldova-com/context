/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DataException } from "@noldova/context.data";
import { SqlQuery } from "@noldova/context.data.sql";
import { SQLiteConnection } from "@noldova/context.data.sql.sqlite";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { TemporaryDirectory } from "./fixtures/temporary-directory.fixture.js";

@TestClass
export class ResourcesTests {
  @TestMethod
  public async reportsTheCanonicalUnsupportedValueMessage(): Promise<void> {
    using directory = new TemporaryDirectory();
    await using connection = SQLiteConnection.open(directory.dataSource("app"));

    const failure = await Assert.throwsAsync(async () => connection.queryAsync(new SqlQuery("SELECT x'00' AS blob")), DataException);

    Assert.areEqual("The row holds a value that is neither text, a number, nor null.", failure.message);
  }
}
