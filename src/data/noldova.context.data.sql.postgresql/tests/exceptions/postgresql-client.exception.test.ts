/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DataException } from "@noldova/context.data";
import { BatchSkippedException } from "@noldova/context.data.sql.postgresql/exceptions/batch-skipped.exception.js";
import { BatchException } from "@noldova/context.data.sql.postgresql/exceptions/batch.exception.js";
import { CallbacksFailedException } from "@noldova/context.data.sql.postgresql/exceptions/callbacks-failed.exception.js";
import { CancelUnansweredException } from "@noldova/context.data.sql.postgresql/exceptions/cancel-unanswered.exception.js";
import { ConnectionClosedException } from "@noldova/context.data.sql.postgresql/exceptions/connection-closed.exception.js";
import { ConnectionEndedException } from "@noldova/context.data.sql.postgresql/exceptions/connection-ended.exception.js";
import { MalformedMessageException } from "@noldova/context.data.sql.postgresql/exceptions/malformed-message.exception.js";
import { PostgreSQLClientException } from "@noldova/context.data.sql.postgresql/exceptions/postgresql-client.exception.js";
import { PostgreSQLException } from "@noldova/context.data.sql.postgresql/exceptions/postgresql.exception.js";
import { QueryCanceledException } from "@noldova/context.data.sql.postgresql/exceptions/query-canceled.exception.js";
import { QueryTimeoutException } from "@noldova/context.data.sql.postgresql/exceptions/query-timeout.exception.js";
import { QueueTimeoutException } from "@noldova/context.data.sql.postgresql/exceptions/queue-timeout.exception.js";
import { StrayCancelException } from "@noldova/context.data.sql.postgresql/exceptions/stray-cancel.exception.js";
import { TransactionRolledBackException } from "@noldova/context.data.sql.postgresql/exceptions/transaction-rolled-back.exception.js";
import { TypeNotFoundException } from "@noldova/context.data.sql.postgresql/exceptions/type-not-found.exception.js";
import { UnsafeTransactionException } from "@noldova/context.data.sql.postgresql/exceptions/unsafe-transaction.exception.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class PostgreSQLClientExceptionTests {
  @TestMethod
  public isTheBaseOfEveryExceptionThePackageOwns(): void {
    const exceptions = [
      new BatchException(0, new Error("cause")),
      new BatchSkippedException(1, null),
      new CallbacksFailedException([new Error("callback")]),
      new CancelUnansweredException(5, false),
      new ConnectionClosedException(false, "localhost", 5432, null),
      new ConnectionEndedException("localhost", 5432),
      new MalformedMessageException(),
      new PostgreSQLException(new Map<string, string>()),
      new QueryCanceledException(),
      new QueryTimeoutException(5, null),
      new QueueTimeoutException(5),
      new StrayCancelException(new Error("cancel")),
      new TransactionRolledBackException("rolled back"),
      new TypeNotFoundException(["point"]),
      new UnsafeTransactionException("unsafe"),
    ];

    Assert.areEqual(15, exceptions.length);
    for (const exception of exceptions) {
      Assert.isInstanceOf(exception, PostgreSQLClientException);
      Assert.isInstanceOf(exception, DataException);
    }
  }
}
