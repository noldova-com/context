/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { AddColumnOperation } from "../models/operations/add-column-operation.js";
import { AddForeignKeyOperation } from "../models/operations/add-foreign-key-operation.js";
import { AddPrimaryKeyOperation } from "../models/operations/add-primary-key-operation.js";
import { AlterColumnOperation } from "../models/operations/alter-column-operation.js";
import { CreateTableOperation } from "../models/operations/create-table-operation.js";
import { DropColumnOperation } from "../models/operations/drop-column-operation.js";
import { DropForeignKeyOperation } from "../models/operations/drop-foreign-key-operation.js";
import { DropPrimaryKeyOperation } from "../models/operations/drop-primary-key-operation.js";
import { DropTableOperation } from "../models/operations/drop-table-operation.js";
import { Column } from "../models/schema/column.js";
import type { ForeignKey } from "../models/schema/foreign-key.js";
import type { PrimaryKey } from "../models/schema/primary-key.js";
import { TablePair } from "../models/schema/table-pair.js";
import { Table } from "../models/schema/table.js";
import { Resources } from "../resources.js";
import type { SchemaDifference } from "../types/schema-difference.js";

export class SchemaDiffer {
  public static diff(source: readonly Table[], target: readonly Table[]): readonly SchemaDifference[] {
    const pairs = target.flatMap(table => source.filter(t => t.name === table.name).map(t => new TablePair(t, table)));
    const operations: SchemaDifference[] = [];
    for (const pair of pairs)
      for (const foreignKey of pair.source.foreignKeys)
        if (!pair.target.foreignKeys.some(t => SchemaDiffer.sameForeignKey(t, foreignKey)))
          operations.push(new DropForeignKeyOperation(pair.target.name, foreignKey.column));
    const dropped = source.filter(table => !target.some(t => t.name === table.name));
    for (const table of SchemaDiffer.order(dropped, (table, remaining) => !remaining.some(t => t !== table && t.foreignKeys.some(s => s.principalTable === table.name))))
      operations.push(new DropTableOperation(table.name));
    for (const pair of pairs)
      operations.push(...SchemaDiffer.diffTable(pair.source, pair.target));
    const created = target.filter(table => !source.some(t => t.name === table.name));
    for (const table of SchemaDiffer.order(created, (table, remaining) => table.foreignKeys.every(t => t.principalTable === table.name
      || !remaining.some(s => s.name === t.principalTable))))
      operations.push(new CreateTableOperation(new Table(table.name, table.columns.map(t => new Column(t.name, t.type, t.isNullable)), table.primaryKey,
        table.foreignKeys)));
    for (const pair of pairs)
      for (const foreignKey of pair.target.foreignKeys)
        if (!pair.source.foreignKeys.some(t => SchemaDiffer.sameForeignKey(t, foreignKey)))
          operations.push(new AddForeignKeyOperation(pair.target.name, foreignKey));

    return operations;
  }

  private static diffTable(source: Table, target: Table): readonly SchemaDifference[] {
    const operations: SchemaDifference[] = [];
    const keyChanged = SchemaDiffer.keyText(source.primaryKey) !== SchemaDiffer.keyText(target.primaryKey);
    if (keyChanged && !Object.isNull(source.primaryKey))
      operations.push(new DropPrimaryKeyOperation(source.name));
    for (const column of source.columns)
      if (!target.columns.some(t => t.name === column.name))
        operations.push(new DropColumnOperation(source.name, column.name));
    for (const column of target.columns) {
      const existing = source.columns.find(t => t.name === column.name);
      if (Object.isUndefined(existing)) {
        operations.push(new AddColumnOperation(target.name, column.isNullable ? new Column(column.name, column.type, true) : column));
        continue;
      }
      const retyped = existing.type.toUpperCase() !== column.type.toUpperCase();
      if (retyped || existing.isNullable !== column.isNullable)
        operations.push(new AlterColumnOperation(target.name, new Column(column.name, column.type, column.isNullable,
          retyped || (existing.isNullable && !column.isNullable) ? column.defaultValueSql : null)));
    }
    if (keyChanged && !Object.isNull(target.primaryKey))
      operations.push(new AddPrimaryKeyOperation(target.name, target.primaryKey));

    return operations;
  }

  private static order(tables: readonly Table[], isReady: (table: Table, remaining: readonly Table[]) => boolean): readonly Table[] {
    const ordered: Table[] = [];
    const remaining = [...tables];
    while (remaining.length > 0)
      ordered.push(...remaining.splice(Math.max(0, remaining.findIndex(t => isReady(t, remaining))), 1));

    return ordered;
  }

  private static keyText(key: PrimaryKey | null): string {
    return Object.isNull(key) ? "" : key.columns.join(Resources.listSeparator);
  }

  private static sameForeignKey(left: ForeignKey, right: ForeignKey): boolean {
    return left.column === right.column && left.principalTable === right.principalTable && left.principalColumn === right.principalColumn;
  }
}
