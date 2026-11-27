/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IReadOnlyList } from "@noldova/context.collections";
import type { SnapshotEntity, SnapshotProperty } from "@noldova/context.data";

import { Resources } from "../resources.js";

export class SnapshotWriter {
  public static write(className: string, entities: IReadOnlyList<SnapshotEntity>): string {
    const statements = entities.selectMany(t => SnapshotWriter.statementOf(t)).toArray();
    const imports = entities.any(t => t.properties.count() > 0) ? Resources.snapshotImports : Resources.snapshotImportsWithoutTypes;
    const body = statements.length === 0
      ? [Resources.buildModelEmpty]
      : [Resources.buildModelStart, ...statements.map(t => `${Resources.statementIndent}${t}`), Resources.blockEnd];

    return [
      Resources.formatSnapshotImport(imports),
      "",
      Resources.formatSnapshotClass(className),
      ...body,
      Resources.classEnd,
      ""
    ].join(Resources.lineBreak);
  }

  private static statementOf(entity: SnapshotEntity): readonly string[] {
    const calls = [
      ...entity.tableName === entity.name ? [] : [Resources.formatCall(Resources.toTableMethod, JSON.stringify(entity.tableName))],
      ...entity.properties.select(t => SnapshotWriter.propertyOf(t)).toArray(),
      ...entity.key.count() === 0 ? [] : [Resources.formatCall(Resources.hasKeyMethod, SnapshotWriter.argumentsOf(entity.key.toArray()))],
      ...entity.foreignKeys.select(t => Resources.formatCall(Resources.hasForeignKeyMethod,
        SnapshotWriter.argumentsOf([t.principal, ...t.properties.toArray()]))).toArray(),
      ...entity.navigations.select(t => Resources.formatCall(t.isCollection ? Resources.collectionMethod : Resources.referenceMethod,
        SnapshotWriter.argumentsOf([t.name, t.target]))).toArray()
    ];
    const lines = [Resources.formatEntityCall(JSON.stringify(entity.name)), ...calls.map(t => `${Resources.memberIndent}${t}`)];

    return lines.map((t, index) => index === lines.length - 1 ? `${t}${Resources.statementEnd}` : t);
  }

  private static propertyOf(property: SnapshotProperty): string {
    const method = property.isOptional ? Resources.optionalPropertyMethod : Resources.propertyMethod;
    const column = property.columnName === property.name ? [] : [JSON.stringify(property.columnName)];

    return Resources.formatCall(method, [JSON.stringify(property.name), Resources.formatPropertyType(property.type), ...column].join(Resources.argumentSeparator));
  }

  private static argumentsOf(values: readonly string[]): string {
    return values.map(t => JSON.stringify(t)).join(Resources.argumentSeparator);
  }
}
