/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { DataSource } from "./data-source.js";
import { DbContextOptions } from "./db-context-options.js";
import type { Migration } from "./migration.js";
import type { Connection } from "./connection.js";
import type { DataProvider } from "../services/data-provider.js";

export class DbContextOptionsBuilder {
  public use<TConnection extends Connection, TMigration extends Migration>(
    provider: DataProvider<TConnection, TMigration>,
    dataSource: DataSource): DbContextOptions<TConnection, TMigration> {
    return new DbContextOptions(provider, dataSource);
  }
}
