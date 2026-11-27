/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IReadOnlyList } from "@noldova/context.collections";
import type { SnapshotEntity, SnapshotProperty } from "@noldova/context.data";

export class SnapshotWriter {
  public static write(className: string, entities: IReadOnlyList<SnapshotEntity>): string {
    const statements = entities.selectMany(t => SnapshotWriter.statementOf(t)).toArray();
    const imports = entities.any(t => t.properties.count() > 0) ? "ModelSnapshot, PropertyType, type SnapshotBuilder" : "ModelSnapshot, type SnapshotBuilder";
    const body = statements.length === 0
      ? ["  protected override buildModel(_builder: SnapshotBuilder): void { }"]
      : ["  protected override buildModel(builder: SnapshotBuilder): void {", ...statements.map(t => `    ${t}`), "  }"];

    return [
      `import { ${imports} } from "@noldova/context.data";`,
      "",
      `export class ${className} extends ModelSnapshot {`,
      ...body,
      "}",
      ""
    ].join("\n");
  }

  private static statementOf(entity: SnapshotEntity): readonly string[] {
    const calls = [
      ...entity.tableName === entity.name ? [] : [`.toTable(${JSON.stringify(entity.tableName)})`],
      ...entity.properties.select(t => SnapshotWriter.propertyOf(t)).toArray(),
      ...entity.key.count() === 0 ? [] : [`.hasKey(${SnapshotWriter.argumentsOf(entity.key.toArray())})`],
      ...entity.foreignKeys.select(t => `.hasForeignKey(${SnapshotWriter.argumentsOf([t.principal, ...t.properties.toArray()])})`).toArray(),
      ...entity.navigations.select(t => `.${t.isCollection ? "collection" : "reference"}(${SnapshotWriter.argumentsOf([t.name, t.target])})`).toArray()
    ];
    const lines = [`builder.entity(${JSON.stringify(entity.name)})`, ...calls.map(t => `  ${t}`)];

    return lines.map((t, index) => index === lines.length - 1 ? `${t};` : t);
  }

  private static propertyOf(property: SnapshotProperty): string {
    const method = property.isOptional ? "optionalProperty" : "property";
    const column = property.columnName === property.name ? "" : `, ${JSON.stringify(property.columnName)}`;

    return `.${method}(${JSON.stringify(property.name)}, PropertyType.${property.type}${column})`;
  }

  private static argumentsOf(values: readonly string[]): string {
    return values.map(t => JSON.stringify(t)).join(", ");
  }
}
