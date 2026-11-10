/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ColumnType, type MigrationBuilder, SqlMigration } from "@noldova/context.data.sql";

import type { Note } from "./note.fixture.js";

export class NotesMigration extends SqlMigration {
  public constructor(id: string = "20260908130000_Notes") {
    super(id);
  }

  public override apply(builder: MigrationBuilder): void {
    builder.createTable<Note>("notes",
      table => {
        table.addColumn(t => t.id, ColumnType.Text);
        table.addColumn(t => t.text, ColumnType.Text);
      },
      constraints => constraints.addPrimaryKey(t => t.id));
    builder.createIndex<Note>("notes", t => t.text);
  }
}
