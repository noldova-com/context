import type { SqlMigration } from "@noldova/context.data.sql";

import { AddNotes } from "./20261127120000-add-notes.js";
import { AddOwners } from "./20261127130000-add-owners.js";
import { ChangeOwnerKey } from "./20261127140000-change-owner-key.js";

export class NotesContextMigrations {
  public static readonly all: readonly SqlMigration[] = [
    new AddNotes(),
    new AddOwners(),
    new ChangeOwnerKey()
  ];
}
