/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SchemaOperation, SqlStatementOperation } from "@noldova/context.data.sql";
import { ArgumentException } from "@noldova/context.exceptions";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { TestDialect } from "../../fixtures/test-dialect.fixture.js";

@TestClass
export class SqlStatementOperationTests {
  @TestMethod
  public rendersTheStatementAsWritten(): void {
    const operation = new SqlStatementOperation("UPDATE notes SET text = json_set(text, '$.a', 1)");
    const schemaOperation: SchemaOperation = operation;

    Assert.isInstanceOf(operation, SchemaOperation);
    Assert.areEqual("UPDATE notes SET text = json_set(text, '$.a', 1)", operation.statement);
    Assert.areEqual(operation.statement, operation.render());
    Assert.areEqual(operation.statement, schemaOperation.render(new TestDialect()));
  }

  @TestMethod
  public rejectsABlankStatement(): void {
    const error = Assert.throws(() => new SqlStatementOperation(" "), ArgumentException);

    Assert.areEqual("statement", error.parameterName);
  }
}
