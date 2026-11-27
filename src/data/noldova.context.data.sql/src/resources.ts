/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class Resources {
  public static readonly addColumn: string = "ADD COLUMN";
  public static readonly addKeyword: string = "ADD";
  public static readonly alterTable: string = "ALTER TABLE";
  public static readonly changesTable: string = "__changes";
  public static readonly closeParenthesis: string = ")";
  public static readonly columnParameterName: string = "column";
  public static readonly columnsParameterName: string = "columns";
  public static readonly commitTransaction: string = "COMMIT";
  public static readonly constraintKeyword: string = "CONSTRAINT";
  public static readonly createChangesIndex: string = "CREATE INDEX IF NOT EXISTS \"IX___changes_entity_entityId\" ON \"__changes\" (\"entity\", \"entityId\")";
  public static readonly createdAtColumn: string = "createdAt";
  public static readonly createIndex: string = "CREATE INDEX";
  public static readonly createMigrationsTable: string = "CREATE TABLE IF NOT EXISTS \"__migrations\" (\"id\" TEXT PRIMARY KEY, \"appliedAt\" TEXT NOT NULL)";
  public static readonly createTable: string = "CREATE TABLE";
  public static readonly createUniqueIndex: string = "CREATE UNIQUE INDEX";
  public static readonly defaultKeyword: string = "DEFAULT";
  public static readonly dropColumn: string = "DROP COLUMN";
  public static readonly dropConstraint: string = "DROP CONSTRAINT";
  public static readonly dropTable: string = "DROP TABLE";
  public static readonly emptyString: string = "''";
  public static readonly entityColumn: string = "entity";
  public static readonly entityIdColumn: string = "entityId";
  public static readonly escapedIdentifierQuote: string = "\"\"";
  public static readonly escapedStringQuote: string = "''";
  public static readonly foreignKeyConstraint: string = "FOREIGN KEY";
  public static readonly foreignKeyNamePrefix: string = "FK";
  public static readonly idColumn: string = "id";
  public static readonly identifierQuote: string = "\"";
  public static readonly indexNamePrefix: string = "IX";
  public static readonly insertChange: string = "INSERT INTO \"__changes\" (\"entity\", \"entityId\", \"operation\", \"payload\", \"createdAt\") VALUES (?, ?, ?, ?, ?)";
  public static readonly insertMigration: string = "INSERT INTO \"__migrations\" (\"id\", \"appliedAt\") VALUES (?, ?)";
  public static readonly keyWithoutColumns: string = "A primary key names at least one column.";
  public static readonly listSeparator: string = ", ";
  public static readonly migrationsTable: string = "__migrations";
  public static readonly nameParameterName: string = "name";
  public static readonly nameSeparator: string = "_";
  public static readonly notNullConstraint: string = "NOT NULL";
  public static readonly onKeyword: string = "ON";
  public static readonly openParenthesis: string = "(";
  public static readonly operationColumn: string = "operation";
  public static readonly parentField: string = "parent";
  public static readonly payloadColumn: string = "payload";
  public static readonly primaryKeyConstraint: string = "PRIMARY KEY";
  public static readonly primaryKeyNamePrefix: string = "PK";
  public static readonly principalColumnParameterName: string = "principalColumn";
  public static readonly principalTableParameterName: string = "principalTable";
  public static readonly referencesConstraint: string = "REFERENCES";
  public static readonly rollbackTransaction: string = "ROLLBACK";
  public static readonly selectAppliedMigrations: string = "SELECT \"id\" FROM \"__migrations\" ORDER BY \"id\"";
  public static readonly selectChangesAfter: string = "SELECT \"sequence\", \"entity\", \"entityId\", \"operation\", \"payload\", \"createdAt\" FROM \"__changes\" WHERE \"sequence\" > ? ORDER BY \"sequence\" LIMIT ?";
  public static readonly sequenceColumn: string = "sequence";
  public static readonly sqlParameterName: string = "sql";
  public static readonly statementParameterName: string = "statement";
  public static readonly stringQuote: string = "'";
  public static readonly tableField: string = "table";
  public static readonly textParameterName: string = "text";
  public static readonly typeParameterName: string = "type";
  public static readonly uniqueIndexNamePrefix: string = "UX";
  public static readonly unknownOperation: string = "The change holds an operation the feed does not know.";
  public static readonly wordSeparator: string = " ";
  public static readonly zeroInteger: string = "0";

  public static formatColumnChanged(table: string, column: string): string {
    return `The column "${table}.${column}" differs from the snapshot in its type or nullability; add a migration for the change.`;
  }

  public static formatColumnNotInModel(table: string, column: string): string {
    return `The snapshot's column "${table}.${column}" has no property in the model; add a migration for the change.`;
  }

  public static formatColumnNotInSnapshot(table: string, column: string): string {
    return `The model maps a property to "${table}.${column}", a column the snapshot doesn't have; add a migration for the change.`;
  }

  public static formatCreateChangesTable(identityColumnType: string): string {
    return `CREATE TABLE IF NOT EXISTS "__changes" ("sequence" ${identityColumnType}, "entity" TEXT NOT NULL, "entityId" TEXT NOT NULL, "operation" TEXT NOT NULL, "payload" TEXT NOT NULL, "createdAt" TEXT NOT NULL)`;
  }

  public static formatColumnMissing(table: string, column: string): string {
    return `The table "${table}" has no column "${column}".`;
  }

  public static formatForeignKeyChanged(table: string, column: string): string {
    return `The foreign key from "${table}.${column}" differs from the snapshot; add a migration for the change.`;
  }

  public static formatForeignKeyViolated(migration: string, table: string, parent: string): string {
    return `The migration "${migration}" leaves rows in "${table}" that refer to no row of "${parent}".`;
  }

  public static formatIndexNameRepeated(name: string, existing: string): string {
    return `The index name "${name}" is the same as "${existing}", which the migration already creates, once ASCII letters are lower-cased and both are cut to 63 bytes.`;
  }

  public static formatPrimaryKeyChanged(table: string): string {
    return `The primary key of "${table}" differs from the snapshot; add a migration for the change.`;
  }

  public static formatTableNotInModel(table: string): string {
    return `The snapshot's table "${table}" has no entity in the model; add a migration for the change.`;
  }

  public static formatTableNotInSnapshot(table: string): string {
    return `The model maps an entity to "${table}", a table the snapshot doesn't have; add a migration for the change.`;
  }

  public static formatTableWithoutColumns(table: string): string {
    return `The table "${table}" defines no columns.`;
  }
}
