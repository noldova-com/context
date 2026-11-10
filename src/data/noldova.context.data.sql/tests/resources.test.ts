/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { PrimaryKey, Table } from "@noldova/context.data.sql";
import { ArgumentException } from "@noldova/context.exceptions";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class ResourcesTests {
  @TestMethod
  public reportsTheCanonicalMessages(): void {
    const noColumns = Assert.throws(() => new Table("notes", [], null, []), ArgumentException);
    const noKeyColumns = Assert.throws(() => new PrimaryKey([]), ArgumentException);

    Assert.isTrue(noColumns.message.startsWith("The table \"notes\" defines no columns."));
    Assert.isTrue(noKeyColumns.message.startsWith("A primary key names at least one column."));
  }
}
