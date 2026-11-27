/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Connection } from "../models/connection.js";
import type { DbContext } from "../models/db-context.js";
import type { Migration } from "../models/migration.js";

export interface IDbContextClass<TConnection extends Connection, TMigration extends Migration> {
  readonly prototype: DbContext<TConnection, TMigration>;
}
