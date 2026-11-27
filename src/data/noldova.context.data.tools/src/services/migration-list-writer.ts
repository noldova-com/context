/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { MigrationFile } from "../models/migrations/migration-file.js";

export class MigrationListWriter {
  public static write(className: string, migrations: readonly MigrationFile[]): string {
    return [
      "import type { SqlMigration } from \"@noldova/context.data.sql\";",
      "",
      ...migrations.map(t => `import { ${t.className} } from ${JSON.stringify(`./${t.moduleName}.js`)};`),
      "",
      `export class ${className} {`,
      "  public static readonly all: readonly SqlMigration[] = [",
      ...migrations.map((t, index) => `    new ${t.className}()${index === migrations.length - 1 ? "" : ","}`),
      "  ];",
      "}",
      ""
    ].join("\n");
  }
}
