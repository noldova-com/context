/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

declare module "@noldova/context.data.tools/models/sources/source-property.js" {
  import type { Node } from "@noldova/context.parsers";

  export class SourceProperty {
    public readonly name: string;
    public readonly typeNode: Node | undefined;
    public readonly isOptional: boolean;

    public constructor(name: string, typeNode: Node | undefined, isOptional: boolean);
  }
}

declare module "@noldova/context.data.tools/models/sources/source-class.js" {
  import type { SourceProperty } from "@noldova/context.data.tools/models/sources/source-property.js";

  export class SourceClass {
    public readonly name: string;
    public readonly filePath: string;
    public readonly baseName: string | null;
    public readonly properties: readonly SourceProperty[];

    public constructor(name: string, filePath: string, baseName: string | null, properties: readonly SourceProperty[]);
  }
}

declare module "@noldova/context.data.tools/models/shapes/property-shape.js" {
  import type { PropertyType } from "@noldova/context.data";

  export class PropertyShape {
    public readonly name: string;
    public readonly type: PropertyType;
    public readonly isOptional: boolean;

    public constructor(name: string, type: PropertyType, isOptional: boolean);
  }
}

declare module "@noldova/context.data.tools/models/shapes/navigation-shape.js" {
  export class NavigationShape {
    public readonly name: string;
    public readonly target: string;
    public readonly isCollection: boolean;

    public constructor(name: string, target: string, isCollection: boolean);
  }
}

declare module "@noldova/context.data.tools/models/shapes/entity-shape.js" {
  import type { NavigationShape } from "@noldova/context.data.tools/models/shapes/navigation-shape.js";
  import type { PropertyShape } from "@noldova/context.data.tools/models/shapes/property-shape.js";

  export class EntityShape {
    public readonly name: string;
    public readonly properties: readonly PropertyShape[];
    public readonly navigations: readonly NavigationShape[];

    public constructor(name: string, properties: readonly PropertyShape[], navigations: readonly NavigationShape[]);
  }
}

declare module "@noldova/context.data.tools/models/shapes/shape-snapshot.js" {
  import { ModelSnapshot, type SnapshotBuilder } from "@noldova/context.data";
  import type { EntityShape } from "@noldova/context.data.tools/models/shapes/entity-shape.js";

  export class ShapeSnapshot extends ModelSnapshot {
    public readonly entities: readonly EntityShape[];

    public constructor(entities: readonly EntityShape[]);

    protected override buildModel(builder: SnapshotBuilder): void;
  }
}

declare module "@noldova/context.data.tools/services/source-class.reader.js" {
  import type { SourceClass } from "@noldova/context.data.tools/models/sources/source-class.js";

  export class SourceClassReader {
    public static read(content: string, filePath: string): readonly SourceClass[];
  }
}

declare module "@noldova/context.data.tools/services/entity-type.reader.js" {
  import type { EntityShape } from "@noldova/context.data.tools/models/shapes/entity-shape.js";
  import type { SourceClass } from "@noldova/context.data.tools/models/sources/source-class.js";

  export class EntityTypeReader {
    public static read(classes: readonly SourceClass[], entityNames: readonly string[]): readonly EntityShape[];
  }
}

declare module "@noldova/context.data.tools/models/sources/source-file.js" {
  export class SourceFile {
    public readonly path: string;
    public readonly content: string;

    public constructor(path: string, content: string);
  }
}

declare module "@noldova/context.data.tools/models/shapes/mapped-snapshot.js" {
  import { type Model, ModelSnapshot, type SnapshotBuilder } from "@noldova/context.data";
  import type { EntityShape } from "@noldova/context.data.tools/models/shapes/entity-shape.js";

  export class MappedSnapshot extends ModelSnapshot {
    public constructor(model: Model, shapes: readonly EntityShape[]);

    protected override buildModel(builder: SnapshotBuilder): void;
  }
}

declare module "@noldova/context.data.tools/models/migrations/migration-file.js" {
  export class MigrationFile {
    public readonly moduleName: string;
    public readonly className: string;

    public constructor(moduleName: string, className: string);
  }
}

declare module "@noldova/context.data.tools/models/migrations/add-migration-arguments.js" {
  export class AddMigrationArguments {
    public readonly name: string;
    public readonly provider: string;
    public readonly context: string | null;
    public readonly output: string | null;

    public constructor(name: string, provider: string, context: string | null, output: string | null);

    public get providerName(): string;

    public static parse(arguments_: readonly string[]): AddMigrationArguments;
  }
}

declare module "@noldova/context.data.tools/services/naming.js" {
  export class Naming {
    public static toKebabCase(name: string): string;
  }
}

declare module "@noldova/context.data.tools/services/migration-stamp.js" {
  export class MigrationStamp {
    public static next(now: Date, last: string | null): string;
  }
}

declare module "@noldova/context.data.tools/services/snapshot-writer.js" {
  import type { IReadOnlyList } from "@noldova/context.collections";
  import type { SnapshotEntity } from "@noldova/context.data";

  export class SnapshotWriter {
    public static write(className: string, entities: IReadOnlyList<SnapshotEntity>): string;
  }
}

declare module "@noldova/context.data.tools/services/migration-writer.js" {
  import type { SchemaDifference } from "@noldova/context.data.sql";

  export class MigrationWriter {
    public static write(className: string, id: string, differences: readonly SchemaDifference[]): string;
  }
}

declare module "@noldova/context.data.tools/services/migration-list-writer.js" {
  import type { MigrationFile } from "@noldova/context.data.tools/models/migrations/migration-file.js";

  export class MigrationListWriter {
    public static write(className: string, migrations: readonly MigrationFile[]): string;
  }
}

declare module "@noldova/context.data.tools/services/context-locator.js" {
  import type { SourceClass } from "@noldova/context.data.tools/models/sources/source-class.js";

  export class ContextLocator {
    public static locate(classes: readonly SourceClass[], name: string | null): SourceClass;
  }
}

declare module "@noldova/context.data.tools/services/project-sources.js" {
  import type { SourceFile } from "@noldova/context.data.tools/models/sources/source-file.js";

  export class ProjectSources {
    public readonly projectFilePath: string;
    public readonly rootDirectory: string;
    public readonly outputDirectory: string;

    public static openAsync(projectFilePath: string): Promise<ProjectSources>;

    public resolve(path: string): string;

    public join(folder: string, ...names: readonly string[]): string;

    public folderOf(path: string): string;

    public readSourcesAsync(): Promise<readonly SourceFile[]>;

    public listAsync(folder: string): Promise<readonly string[]>;

    public existsAsync(path: string): Promise<boolean>;

    public readAsync(path: string): Promise<string>;

    public writeAsync(path: string, text: string): Promise<void>;

    public importCompiledAsync(sourcePath: string): Promise<Readonly<Record<string, unknown>>>;

    public importPackageAsync(packageName: string): Promise<Readonly<Record<string, unknown>>>;
  }
}

declare module "@noldova/context.data.tools/services/migration-adder.js" {
  import type { AddMigrationArguments } from "@noldova/context.data.tools/models/migrations/add-migration-arguments.js";
  import type { ProjectSources } from "@noldova/context.data.tools/services/project-sources.js";

  export class MigrationAdder {
    public static addAsync(project: ProjectSources, arguments_: AddMigrationArguments, now: Date): Promise<readonly string[]>;
  }
}
