/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { DataSource } from "@noldova/context.data";
import { SqlProvider } from "@noldova/context.data.sql";

import { PostgreSQLConnection } from "../models/postgresql-connection.js";

export class PostgreSQLProvider extends SqlProvider {
  public override openConnection(dataSource: DataSource): PostgreSQLConnection {
    return PostgreSQLConnection.open(dataSource);
  }
}
