/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DbContext, type DbContextOptions, type ModelBuilder } from "@noldova/context.data";
import type { SqlConnection, SqlMigration } from "@noldova/context.data.sql";

import { Author, Post } from "./blog.fixture.js";

export class BlogContext extends DbContext<SqlConnection, SqlMigration> {
  public constructor(options: DbContextOptions<SqlConnection, SqlMigration>) {
    super(options, []);
  }

  protected override onModelCreating(builder: ModelBuilder): void {
    builder.entity(Author).toTable("authors");
    builder.entity(Post).property(t => t.authorId).hasColumnName("author_id");
  }
}
