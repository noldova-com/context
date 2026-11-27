/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import {
  AddColumnOperation,
  AddForeignKeyOperation,
  AddPrimaryKeyOperation,
  AlterColumnOperation,
  type Column,
  CreateTableOperation,
  DropColumnOperation,
  DropForeignKeyOperation,
  DropPrimaryKeyOperation,
  type SchemaDifference,
  type Table
} from "@noldova/context.data.sql";

export class MigrationWriter {
  public static write(className: string, id: string, differences: readonly SchemaDifference[]): string {
    const statements = differences.flatMap(t => MigrationWriter.statementOf(t));
    const body = statements.length === 0
      ? ["  public override apply(_builder: MigrationBuilder): void { }"]
      : ["  public override apply(builder: MigrationBuilder): void {", ...statements.map(t => `    ${t}`), "  }"];

    return [
      "import { type MigrationBuilder, SqlMigration } from \"@noldova/context.data.sql\";",
      "",
      `export class ${className} extends SqlMigration {`,
      "  public constructor() {",
      `    super(${JSON.stringify(id)});`,
      "  }",
      "",
      ...body,
      "}",
      ""
    ].join("\n");
  }

  private static statementOf(difference: SchemaDifference): readonly string[] {
    if (difference instanceof CreateTableOperation)
      return MigrationWriter.createTableOf(difference.table);
    if (difference instanceof AddColumnOperation)
      return [`builder.addColumn${MigrationWriter.columnOf([difference.table], difference.column)};`];
    if (difference instanceof AlterColumnOperation)
      return [`builder.alterColumn${MigrationWriter.columnOf([difference.table], difference.column)};`];
    if (difference instanceof DropColumnOperation)
      return [`builder.dropColumn(${MigrationWriter.argumentsOf([difference.table, difference.column])});`];
    if (difference instanceof AddPrimaryKeyOperation)
      return [`builder.addPrimaryKey(${MigrationWriter.argumentsOf([difference.table, ...difference.primaryKey.columns])});`];
    if (difference instanceof DropPrimaryKeyOperation)
      return [`builder.dropPrimaryKey(${MigrationWriter.argumentsOf([difference.table])});`];
    if (difference instanceof AddForeignKeyOperation)
      return [`builder.addForeignKey(${MigrationWriter.argumentsOf([difference.table, difference.foreignKey.column, difference.foreignKey.principalTable,
        difference.foreignKey.principalColumn])});`];
    if (difference instanceof DropForeignKeyOperation)
      return [`builder.dropForeignKey(${MigrationWriter.argumentsOf([difference.table, difference.column])});`];

    return [`builder.dropTable(${MigrationWriter.argumentsOf([difference.table])});`];
  }

  private static createTableOf(table: Table): readonly string[] {
    const constraints = [
      ...Object.isNull(table.primaryKey) ? [] : [`constraints.addPrimaryKey(${MigrationWriter.argumentsOf(table.primaryKey.columns)});`],
      ...table.foreignKeys.map(t => `constraints.addForeignKey(${MigrationWriter.argumentsOf([t.column, t.principalTable, t.principalColumn])});`)
    ];
    const columns = table.columns.map(t => `    table.addColumn${MigrationWriter.columnOf([], t)};`);
    const callbacks = constraints.length === 0
      ? ["  table => {", ...columns, "  });"]
      : ["  table => {", ...columns, "  },", "  constraints => {", ...constraints.map(t => `    ${t}`), "  });"];

    return [`builder.createTable(${JSON.stringify(table.name)},`, ...callbacks];
  }

  private static columnOf(leading: readonly string[], column: Column): string {
    const nullable = column.isNullable ? ".makeNullable()" : "";
    const defaultValue = Object.isNull(column.defaultValueSql) ? "" : `.hasDefaultValueSql(${JSON.stringify(column.defaultValueSql)})`;

    return `(${MigrationWriter.argumentsOf([...leading, column.name, column.type])})${nullable}${defaultValue}`;
  }

  private static argumentsOf(values: readonly string[]): string {
    return values.map(t => JSON.stringify(t)).join(", ");
  }
}
