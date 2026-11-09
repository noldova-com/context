/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

import type { DataSource } from "@noldova/context.data";
import { SqlConnection, type SqlDialect } from "@noldova/context.data.sql";

import { Resources } from "../resources.js";
import { SQLiteDialect } from "../services/sqlite-dialect.js";
import { SQLiteSession } from "./sqlite-session.js";

export class SQLiteConnection extends SqlConnection {
  private readonly sqliteDialect: SqlDialect = new SQLiteDialect();

  private constructor(dataSource: DataSource, session: SQLiteSession) {
    super(dataSource, session);
  }

  public static open(dataSource: DataSource): SQLiteConnection {
    mkdirSync(dirname(dataSource.location), { recursive: true });
    const handle = new DatabaseSync(dataSource.location, { timeout: Resources.busyTimeout });
    handle.exec(Resources.journalModePragma);
    handle.exec(Resources.foreignKeysPragma);
    return new SQLiteConnection(dataSource, new SQLiteSession(handle));
  }

  public override get dialect(): SqlDialect {
    return this.sqliteDialect;
  }
}
