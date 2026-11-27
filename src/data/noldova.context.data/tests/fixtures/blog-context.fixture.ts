/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DbContext, type DbContextOptions, type ModelBuilder } from "@noldova/context.data";

import { Author } from "./author.fixture.js";
import { BlogSnapshot } from "./blog-snapshot.fixture.js";
import type { MemoryConnection } from "./memory-connection.fixture.js";
import type { NotesMigration } from "./notes-migration.fixture.js";
import { Post } from "./post.fixture.js";
import { Profile } from "./profile.fixture.js";
import { Tag } from "./tag.fixture.js";

export class BlogContext extends DbContext<MemoryConnection, NotesMigration> {
  private static readonly snapshot: BlogSnapshot = new BlogSnapshot();

  public static modelCreations: number = 0;

  public constructor(options: DbContextOptions<MemoryConnection, NotesMigration>) {
    super(options, [], BlogContext.snapshot);
  }

  protected override onModelCreating(builder: ModelBuilder): void {
    BlogContext.modelCreations++;
    builder.entity(Author).toTable("authors");
    builder.entity(Post).property(t => t.body).hasColumnName("text");
    builder.entity(Profile);
    builder.entity(Tag);
  }
}
