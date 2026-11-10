/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DataException } from "@noldova/context.data";

import { Resources } from "../resources.js";

export class PostgreSQLException extends DataException {
  public override readonly name: string = "PostgreSQLException";
  public readonly sqlState: string;
  public readonly severity: string;
  public readonly detail: string | null;
  public readonly hint: string | null;
  public readonly schemaName: string | null;
  public readonly tableName: string | null;
  public readonly columnName: string | null;
  public readonly constraintName: string | null;

  public constructor(fields: ReadonlyMap<string, string>) {
    super(fields.get(Resources.messageField) ?? Resources.serverError);

    this.sqlState = fields.get(Resources.codeField) ?? "";
    this.severity = fields.get(Resources.severityField) ?? fields.get(Resources.localSeverityField) ?? "";
    this.detail = fields.get(Resources.detailField) ?? null;
    this.hint = fields.get(Resources.hintField) ?? null;
    this.schemaName = fields.get(Resources.schemaNameField) ?? null;
    this.tableName = fields.get(Resources.tableNameField) ?? null;
    this.columnName = fields.get(Resources.columnNameField) ?? null;
    this.constraintName = fields.get(Resources.constraintNameField) ?? null;
  }
}
