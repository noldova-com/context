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
  public static readonly foreignKeysPragma: string = "PRAGMA foreign_keys = ON";
  public static readonly identityColumnType: string = "INTEGER PRIMARY KEY AUTOINCREMENT";
  public static readonly integerType: string = "INTEGER";
  public static readonly journalModePragma: string = "PRAGMA journal_mode = WAL";
  public static readonly lineCommentStart: string = "--";
  public static readonly lineFeed: string = "\n";
  public static readonly locationParameterName: string = "location";
  public static readonly multipleStatements: string = "The query holds more than one statement; SQLite runs one statement per query, so send each on its own.";
  public static readonly statementSeparator: string = ";";
  public static readonly textType: string = "TEXT";
  public static readonly unsupportedValue: string = "The row holds a value that is neither text, a number, nor null.";
  public static readonly whitespace: string = " \t\n\f\r";
}
