/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { MigrationFile } from "../models/migrations/migration-file.js";
import { Resources } from "../resources.js";

export class MigrationListWriter {
  public static write(className: string, migrations: readonly MigrationFile[]): string {
    return [
      Resources.migrationListImport,
      "",
      ...migrations.map(t => Resources.formatMigrationImport(t.className, JSON.stringify(Resources.formatModulePath(t.moduleName)))),
      "",
      Resources.formatListClass(className),
      Resources.listStart,
      ...migrations.map((t, index) => `${Resources.formatListItem(t.className)}${index === migrations.length - 1 ? "" : Resources.listItemSeparator}`),
      Resources.listEnd,
      Resources.classEnd,
      ""
    ].join(Resources.lineBreak);
  }
}
