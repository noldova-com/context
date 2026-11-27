/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DbContext, type DbContextOptions, type ModelBuilder } from "@noldova/context.data";

import { Author } from "./author.fixture.js";
import type { MemoryConnection } from "./memory-connection.fixture.js";
import type { NotesMigration } from "./notes-migration.fixture.js";

export class StaleBlogContext extends DbContext<MemoryConnection, NotesMigration> {
  public constructor(options: DbContextOptions<MemoryConnection, NotesMigration>) {
    super(options, []);
  }

  protected override onModelCreating(builder: ModelBuilder): void {
    builder.entity(Author);
  }
}
