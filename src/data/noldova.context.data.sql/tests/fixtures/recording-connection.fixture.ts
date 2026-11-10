/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DataSource } from "@noldova/context.data";
import { SqlConnection, type SqlDialect } from "@noldova/context.data.sql";

import { RecordingSession } from "./recording-session.fixture.js";
import { TestDialect } from "./test-dialect.fixture.js";

export class RecordingConnection extends SqlConnection {
  private readonly testDialect: SqlDialect = new TestDialect();

  public readonly session: RecordingSession;

  public constructor(dataSource: DataSource = new DataSource("recording", ":memory:"), session: RecordingSession = new RecordingSession()) {
    super(dataSource, session);

    this.session = session;
  }

  public override get dialect(): SqlDialect {
    return this.testDialect;
  }

  public get statements(): readonly string[] {
    return this.session.statements;
  }
}
