/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DataSource, DbContext, DbContextOptionsBuilder, type ModelBuilder } from "@noldova/context.data";
import type { SqlConnection, SqlMigration } from "@noldova/context.data.sql";

import { Book } from "./book.fixture.js";
import { LibrarySnapshot } from "./library-snapshot.fixture.js";
import { RecordingProvider } from "./recording-provider.fixture.js";
import { Writer } from "./writer.fixture.js";

export class LibraryContext extends DbContext<SqlConnection, SqlMigration> {
  public constructor() {
    super(new DbContextOptionsBuilder().use(new RecordingProvider(), new DataSource("library", ":memory:")), [], new LibrarySnapshot());
  }

  protected override onModelCreating(builder: ModelBuilder): void {
    builder.entity(Writer);
    builder.entity(Book);
  }
}
