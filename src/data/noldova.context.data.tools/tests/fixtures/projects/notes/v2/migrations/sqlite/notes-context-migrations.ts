import type { SqlMigration } from "@noldova/context.data.sql";

import { AddNotes } from "./20261127120000-add-notes.js";
import { AddOwners } from "./20261127130000-add-owners.js";

export class NotesContextMigrations {
  public static readonly all: readonly SqlMigration[] = [
    new AddNotes(),
    new AddOwners()
  ];
}
