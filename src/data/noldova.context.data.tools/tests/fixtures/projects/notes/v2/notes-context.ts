/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DbContext, type DbContextOptions, type ModelBuilder, type ModelSnapshot } from "@noldova/context.data";
import type { SqlConnection, SqlMigration } from "@noldova/context.data.sql";

import { Note, Owner } from "./entities.js";

export class NotesContext extends DbContext<SqlConnection, SqlMigration> {
  public constructor(options: DbContextOptions<SqlConnection, SqlMigration>, migrations: readonly SqlMigration[], snapshot: ModelSnapshot) {
    super(options, migrations, snapshot);
  }

  protected override onModelCreating(builder: ModelBuilder): void {
    builder.entity(Note).toTable("notes").property(t => t.text).hasColumnName("body");
    builder.entity(Owner).toTable("owners");
  }
}
