/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TestDialect } from "./test-dialect.fixture.js";

export class CheckingDialect extends TestDialect {
  public override formatMigrationStart(): readonly string[] {
    return ["CHECKS OFF"];
  }

  public override formatMigrationEnd(): readonly string[] {
    return ["CHECKS ON"];
  }

  public override formatForeignKeyCheck(): string {
    return "SELECT VIOLATION";
  }
}
