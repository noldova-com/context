/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DbContext, type DbContextOptions, type ModelBuilder } from "@noldova/context.data";

import type { MemoryConnection } from "./memory-connection.fixture.js";
import type { NotesMigration } from "./notes-migration.fixture.js";
import { Tag } from "./tag.fixture.js";

export class TagContext extends DbContext<MemoryConnection, NotesMigration> {
  public static constructions: number = 0;

  public constructor(options: DbContextOptions<MemoryConnection, NotesMigration>) {
    super(options, []);
    TagContext.constructions++;
  }

  protected override onModelCreating(builder: ModelBuilder): void {
    builder.entity(Tag).toTable("tags");
  }
}
