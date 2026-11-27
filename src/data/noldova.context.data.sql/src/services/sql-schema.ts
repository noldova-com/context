/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import type { EntityType, Model, ModelSnapshot, SnapshotEntity } from "@noldova/context.data";

import { Column } from "../models/schema/column.js";
import { ForeignKey } from "../models/schema/foreign-key.js";
import { PrimaryKey } from "../models/schema/primary-key.js";
import { Table } from "../models/schema/table.js";
import type { SqlDialect } from "./sql-dialect.js";

export class SqlSchema {
  public static fromModel(model: Model, dialect: SqlDialect): readonly Table[] {
    return model.entityTypes.select(t => SqlSchema.tableOf(model, t, dialect)).toArray();
  }

  public static fromSnapshot(snapshot: ModelSnapshot, dialect: SqlDialect): readonly Table[] {
    const entities = snapshot.toEntities();

    return entities.select(entity => {
      const columns = entity.properties.select(t => new Column(t.columnName, dialect.formatColumnType(t.type), t.isOptional && !entity.key.contains(t.name)));
      const foreignKeys = entity.foreignKeys.selectMany(foreignKey => {
        const principal = entities.first(t => t.name === foreignKey.principal);

        return foreignKey.properties.select((name, index) => new ForeignKey(SqlSchema.columnOf(entity, name), principal.tableName,
          SqlSchema.columnOf(principal, principal.key.get(index))));
      });
      const key = entity.key.select(t => SqlSchema.columnOf(entity, t)).toArray();

      return new Table(entity.tableName, columns.toArray(), key.length === 0 ? null : new PrimaryKey(key), foreignKeys.toArray());
    }).toArray();
  }

  private static tableOf(model: Model, entity: EntityType, dialect: SqlDialect): Table {
    const columns = entity.properties.select(t => new Column(t.columnName, dialect.formatColumnType(t.type), !t.isRequired, dialect.formatDefaultValue(t.type)));
    const foreignKeys = entity.relations.selectMany(relation => {
      const principal = model.entityTypes.first(t => t.type === relation.principal);

      return relation.foreignKey.select((property, index) => new ForeignKey(property.columnName, principal.tableName,
        principal.key.get(index).columnName));
    });

    return new Table(entity.tableName, columns.toArray(), new PrimaryKey(entity.key.select(t => t.columnName).toArray()), foreignKeys.toArray());
  }

  private static columnOf(entity: SnapshotEntity, property: string): string {
    return entity.properties.first(t => t.name === property).columnName;
  }
}
