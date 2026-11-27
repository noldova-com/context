import type { SqlMigration } from "@noldova/context.data.sql";

import { AddNotes } from "./20261127120000-add-notes.js";

export class NotesContextMigrations {
  public static readonly all: readonly SqlMigration[] = [
    new AddNotes()
  ];
}
