/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Index } from "@noldova/context.data";
import { CreateIndexOperation, SchemaOperation } from "@noldova/context.data.sql";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class SchemaOperationTests {
  @TestMethod
  public isTheBaseOfEveryOperation(): void {
    Assert.isInstanceOf(new CreateIndexOperation(new Index("IX_notes_text", "notes", ["text"], false)), SchemaOperation);
  }
}
