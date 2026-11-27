/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import type { Model, ModelSnapshot } from "@noldova/context.data";

import { SchemaMismatchException } from "../exceptions/schema-mismatch.exception.js";
import { AddColumnOperation } from "../models/operations/add-column-operation.js";
import { AddForeignKeyOperation } from "../models/operations/add-foreign-key-operation.js";
import { AlterColumnOperation } from "../models/operations/alter-column-operation.js";
import { CreateTableOperation } from "../models/operations/create-table-operation.js";
import { DropColumnOperation } from "../models/operations/drop-column-operation.js";
import { DropForeignKeyOperation } from "../models/operations/drop-foreign-key-operation.js";
import { DropTableOperation } from "../models/operations/drop-table-operation.js";
import { Resources } from "../resources.js";
import type { SchemaDifference } from "../types/schema-difference.js";
import { SchemaDiffer } from "./schema-differ.js";
import type { SqlDialect } from "./sql-dialect.js";
import { SqlSchema } from "./sql-schema.js";

export class SqlModelValidator {
  public static validate(model: Model, snapshot: ModelSnapshot, dialect: SqlDialect): void {
    const difference = SchemaDiffer.diff(SqlSchema.fromSnapshot(snapshot, dialect), SqlSchema.fromModel(model, dialect)).at(0);
    if (!Object.isUndefined(difference))
      throw SqlModelValidator.describe(difference);
  }

  private static describe(operation: SchemaDifference): SchemaMismatchException {
    if (operation instanceof CreateTableOperation)
      return new SchemaMismatchException(Resources.formatTableNotInSnapshot(operation.table.name), operation.table.name, null);
    if (operation instanceof DropTableOperation)
      return new SchemaMismatchException(Resources.formatTableNotInModel(operation.table), operation.table, null);
    if (operation instanceof AddColumnOperation)
      return new SchemaMismatchException(Resources.formatColumnNotInSnapshot(operation.table, operation.column.name), operation.table, operation.column.name);
    if (operation instanceof DropColumnOperation)
      return new SchemaMismatchException(Resources.formatColumnNotInModel(operation.table, operation.column), operation.table, operation.column);
    if (operation instanceof AlterColumnOperation)
      return new SchemaMismatchException(Resources.formatColumnChanged(operation.table, operation.column.name), operation.table, operation.column.name);
    if (operation instanceof AddForeignKeyOperation)
      return new SchemaMismatchException(Resources.formatForeignKeyChanged(operation.table, operation.foreignKey.column), operation.table, operation.foreignKey.column);
    if (operation instanceof DropForeignKeyOperation)
      return new SchemaMismatchException(Resources.formatForeignKeyChanged(operation.table, operation.column), operation.table, operation.column);

    return new SchemaMismatchException(Resources.formatPrimaryKeyChanged(operation.table), operation.table, null);
  }
}
