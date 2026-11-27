/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { List } from "@noldova/context.collections";
import "@noldova/context.core";
import { type Connection, DbContext, type IDbContextClass, type Migration, type Model, type ModelBuilder, ModelSnapshot, StaleSnapshotException } from "@noldova/context.data";
import { SchemaDiffer, SqlDialect, SqlSchema } from "@noldova/context.data.sql";
import { ExceptionOptions } from "@noldova/context.exceptions";

import { DataToolsException } from "../exceptions/data-tools.exception.js";
import type { AddMigrationArguments } from "../models/migrations/add-migration-arguments.js";
import { MigrationFile } from "../models/migrations/migration-file.js";
import type { EntityShape } from "../models/shapes/entity-shape.js";
import { MappedSnapshot } from "../models/shapes/mapped-snapshot.js";
import { ShapeSnapshot } from "../models/shapes/shape-snapshot.js";
import { Resources } from "../resources.js";
import type { ModelSnapshotClass } from "../types/model-snapshot-class.js";
import type { SqlDialectClass } from "../types/sql-dialect-class.js";
import { ContextLocator } from "./context-locator.js";
import { EntityTypeReader } from "./entity-type.reader.js";
import { MigrationListWriter } from "./migration-list-writer.js";
import { MigrationStamp } from "./migration-stamp.js";
import { MigrationWriter } from "./migration-writer.js";
import { Naming } from "./naming.js";
import type { ProjectSources } from "./project-sources.js";
import { SnapshotWriter } from "./snapshot-writer.js";
import { SourceClassReader } from "./source-class.reader.js";

export class MigrationAdder {
  public static async addAsync(project: ProjectSources, arguments_: AddMigrationArguments, now: Date): Promise<readonly string[]> {
    const classes = (await project.readSourcesAsync()).flatMap(t => SourceClassReader.read(t.content, t.path));
    const context = ContextLocator.locate(classes, arguments_.context);
    const contextClass = MigrationAdder.exportOf(await project.importCompiledAsync(context.filePath), context.name, MigrationAdder.isContextClass,
      Resources.formatExportMissing(context.filePath, context.name));
    const builder = DbContext.createModelBuilder(contextClass);
    const shapes = EntityTypeReader.read(classes, builder.entityClasses.select(t => t.name).toArray());
    const model = MigrationAdder.buildModel(builder, shapes, context.name);
    const dialectClass = MigrationAdder.exportOf(await project.importPackageAsync(Resources.formatPackageName(arguments_.provider)), null,
      MigrationAdder.isDialectClass, Resources.formatDialectMissing(arguments_.provider));
    const dialect = new dialectClass();

    const folder = Object.isNull(arguments_.output)
      ? project.join(project.folderOf(context.filePath), Resources.migrationsFolderName, arguments_.providerName)
      : project.resolve(arguments_.output);
    const prefix = Naming.toKebabCase(context.name);
    const snapshotClassName = `${context.name}${Resources.snapshotSuffix}`;
    const snapshotPath = project.join(folder, `${prefix}${Resources.snapshotFileSuffix}`);
    const previous = await MigrationAdder.readSnapshotAsync(project, snapshotPath, snapshotClassName);
    const snapshot = SnapshotWriter.write(snapshotClassName, new MappedSnapshot(model, shapes).toEntities());
    if (snapshot === SnapshotWriter.write(snapshotClassName, previous.toEntities()))
      return [];

    const migrations = await MigrationAdder.readMigrationsAsync(project, folder);
    const taken = migrations.find(t => t.className === arguments_.name);
    if (!Object.isUndefined(taken))
      throw new DataToolsException(Resources.formatMigrationNameTaken(arguments_.name, taken.moduleName));

    const stamp = MigrationStamp.next(now, migrations.at(-1)?.moduleName.substring(0, Resources.stampLength) ?? null);
    const migration = new MigrationFile(Resources.formatMigrationModule(stamp, Naming.toKebabCase(arguments_.name)), arguments_.name);
    const differences = SchemaDiffer.diff(SqlSchema.fromSnapshot(previous, dialect), SqlSchema.fromModel(model, dialect));
    const files = new Map([
      [project.join(folder, `${migration.moduleName}${Resources.sourceExtension}`), MigrationWriter.write(migration.className, Resources.formatMigrationId(stamp, migration.className),
        differences)],
      [snapshotPath, snapshot],
      [project.join(folder, `${prefix}${Resources.listFileSuffix}`), MigrationListWriter.write(`${context.name}${Resources.listSuffix}`, [...migrations, migration])]
    ]);
    for (const [path, text] of files)
      await project.writeAsync(path, text);

    return [...files.keys()];
  }

  private static async readSnapshotAsync(project: ProjectSources, path: string, className: string): Promise<ModelSnapshot> {
    if (!await project.existsAsync(path))
      return new ShapeSnapshot([]);

    const snapshot = new (MigrationAdder.exportOf(await project.importCompiledAsync(path), className, MigrationAdder.isSnapshotClass,
      Resources.formatExportMissing(path, className)))();
    const source = (await project.readAsync(path)).replace(Resources.lineBreakPattern, Resources.lineBreak);
    if (SnapshotWriter.write(className, snapshot.toEntities()) !== source)
      throw new DataToolsException(Resources.formatSnapshotStale(path));

    return snapshot;
  }

  private static async readMigrationsAsync(project: ProjectSources, folder: string): Promise<readonly MigrationFile[]> {
    const migrations: MigrationFile[] = [];
    for (const name of (await project.listAsync(folder)).filter(t => Resources.migrationFilePattern.test(t))) {
      const path = project.join(folder, name);
      const classes = new List(SourceClassReader.read(await project.readAsync(path), path)).where(t => t.baseName === Resources.migrationBaseName).toList();
      if (classes.count() !== 1)
        throw new DataToolsException(Resources.formatMigrationClassMissing(path));

      migrations.push(new MigrationFile(name.substring(0, name.length - Resources.sourceExtension.length), classes.get(0).name));
    }

    return migrations;
  }

  private static buildModel(builder: ModelBuilder, shapes: readonly EntityShape[], context: string): Model {
    try {
      return builder.build(new ShapeSnapshot(shapes));
    }
    catch (exception) {
      if (exception instanceof StaleSnapshotException)
        throw new DataToolsException(Resources.formatCompiledStale(exception.entity), new ExceptionOptions(exception));

      throw new DataToolsException(Resources.formatModelInvalid(context, exception), new ExceptionOptions(exception));
    }
  }

  private static exportOf<T>(
    module: Readonly<Record<string, unknown>>,
    name: string | null,
    isWanted: (value: unknown) => value is T,
    missing: string): T {
    for (const [key, value] of Object.entries(module))
      if ((Object.isNull(name) || key === name) && isWanted(value))
        return value;

    throw new DataToolsException(missing);
  }

  private static isContextClass(value: unknown): value is IDbContextClass<Connection, Migration> {
    return Object.isFunction(value) && DbContext.isPrototypeOf(value);
  }

  private static isSnapshotClass(value: unknown): value is ModelSnapshotClass {
    return Object.isFunction(value) && ModelSnapshot.isPrototypeOf(value);
  }

  private static isDialectClass(value: unknown): value is SqlDialectClass {
    return Object.isFunction(value) && SqlDialect.isPrototypeOf(value);
  }
}
