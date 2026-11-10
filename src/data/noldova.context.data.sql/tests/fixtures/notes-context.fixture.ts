/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DbContext, type DbContextOptions } from "@noldova/context.data";
import type { SqlConnection, SqlMigration } from "@noldova/context.data.sql";

import { NotesMigration } from "./notes-migration.fixture.js";

export class NotesContext extends DbContext<SqlConnection, SqlMigration> {
  private static readonly all: readonly SqlMigration[] = [new NotesMigration()];

  public constructor(options: DbContextOptions<SqlConnection, SqlMigration>) {
    super(options, NotesContext.all);
  }
}
