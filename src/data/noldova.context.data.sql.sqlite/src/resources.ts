/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class Resources {
  public static readonly beginTransaction: string = "BEGIN IMMEDIATE";
  public static readonly blockCommentEnd: string = "*/";
  public static readonly blockCommentStart: string = "/*";
  public static readonly busyTimeout: number = 5000;
  public static readonly defaultField: string = "dflt_value";
  public static readonly foreignKeysOffPragma: string = "PRAGMA foreign_keys = OFF";
  public static readonly foreignKeysPragma: string = "PRAGMA foreign_keys = ON";
  public static readonly fromField: string = "from";
  public static readonly identityColumnType: string = "INTEGER PRIMARY KEY AUTOINCREMENT";
  public static readonly integerType: string = "INTEGER";
  public static readonly journalModePragma: string = "PRAGMA journal_mode = WAL";
  public static readonly keyField: string = "pk";
  public static readonly lineCommentStart: string = "--";
  public static readonly lineFeed: string = "\n";
  public static readonly listSeparator: string = ", ";
  public static readonly locationParameterName: string = "location";
  public static readonly multipleStatements: string = "The query holds more than one statement; SQLite runs one statement per query, so send each on its own.";
  public static readonly nameField: string = "name";
  public static readonly notNullField: string = "notnull";
  public static readonly rebuildTablePrefix: string = "__rebuild_";
  public static readonly selectColumns: string = "SELECT \"name\", \"type\", \"notnull\", \"dflt_value\", \"pk\" FROM pragma_table_info(?) ORDER BY \"cid\"";
  public static readonly selectForeignKeys: string = "SELECT \"from\", \"table\", \"to\" FROM pragma_foreign_key_list(?) ORDER BY \"id\", \"seq\"";
  public static readonly selectForeignKeyViolation: string = "SELECT \"table\", \"parent\" FROM pragma_foreign_key_check LIMIT 1";
  public static readonly selectIndexColumns: string = "SELECT \"name\" FROM pragma_index_info(?) ORDER BY \"seqno\"";
  public static readonly selectIndexes: string = "SELECT \"name\", \"sql\" FROM sqlite_master WHERE \"type\" = 'index' AND \"tbl_name\" = ? AND \"sql\" IS NOT NULL ORDER BY \"name\"";
  public static readonly sqlField: string = "sql";
  public static readonly statementSeparator: string = ";";
  public static readonly tableField: string = "table";
  public static readonly textType: string = "TEXT";
  public static readonly toField: string = "to";
  public static readonly typeField: string = "type";
  public static readonly unsupportedValue: string = "The row holds a value that is neither text, a number, nor null.";
  public static readonly whitespace: string = " \t\n\f\r";

  public static formatAlterColumnUnsupported(table: string, column: string): string {
    return `SQLite can't alter the column "${table}.${column}" in place; the migrator rebuilds the table instead.`;
  }

  public static formatCopyRows(target: string, columns: string, source: string): string {
    return `INSERT INTO ${target} (${columns}) SELECT ${columns} FROM ${source}`;
  }

  public static formatRenameTable(table: string, name: string): string {
    return `ALTER TABLE ${table} RENAME TO ${name}`;
  }
}
