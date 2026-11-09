/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { DataSource } from "@noldova/context.data";
import { SqlConnection, type SqlDialect } from "@noldova/context.data.sql";

import { PostgreSQLClient } from "./client/postgresql-client.js";
import { PostgreSQLSession } from "./postgresql-session.js";
import { Resources } from "../resources.js";
import { ConnectionStringParser } from "../services/connection-string.parser.js";
import { PostgreSQLDialect } from "../services/postgresql-dialect.js";

export class PostgreSQLConnection extends SqlConnection {
  private readonly postgresqlDialect: SqlDialect = new PostgreSQLDialect();

  private constructor(dataSource: DataSource, session: PostgreSQLSession) {
    super(dataSource, session);
  }

  public static open(dataSource: DataSource): PostgreSQLConnection {
    ConnectionStringParser.parse(dataSource.location);
    const client = PostgreSQLClient.create(dataSource.location, { max: Resources.sessionPoolSize, maxLifetime: null, onnotice: false });
    return new PostgreSQLConnection(dataSource, new PostgreSQLSession(client));
  }

  public override get dialect(): SqlDialect {
    return this.postgresqlDialect;
  }
}
