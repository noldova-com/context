/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type MigrationBuilder, SqlMigration } from "@noldova/context.data.sql";

export class ShapeMigration extends SqlMigration {
  private readonly shape: (builder: MigrationBuilder) => void;

  public constructor(id: string, shape: (builder: MigrationBuilder) => void) {
    super(id);
    this.shape = shape;
  }

  public override apply(builder: MigrationBuilder): void {
    this.shape(builder);
  }
}
