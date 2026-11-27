/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

declare module "@noldova/context.data/models/entities/entity-draft.js" {
  import type { IReadOnlyDictionary, IReadOnlyList, List } from "@noldova/context.collections";
  import type { EntityProperty, EntityRelation } from "@noldova/context.data";
  import type { EntityTypeDefinition } from "@noldova/context.data/models/entities/entity-type-definition.js";
  import type { SnapshotEntity } from "@noldova/context.data/models/snapshots/snapshot-entity.js";

  export class EntityDraft {
    public readonly definition: EntityTypeDefinition;
    public readonly snapshot: SnapshotEntity;
    public readonly properties: IReadOnlyDictionary<string, EntityProperty>;
    public readonly key: IReadOnlyList<EntityProperty>;
    public readonly relations: List<EntityRelation>;

    public constructor(
      definition: EntityTypeDefinition,
      snapshot: SnapshotEntity,
      properties: IReadOnlyDictionary<string, EntityProperty>,
      key: IReadOnlyList<EntityProperty>);

    public get name(): string;
  }
}

declare module "@noldova/context.data/models/entities/entity-property.js" {
  import type { PropertyType } from "@noldova/context.data";

  export class EntityProperty {
    public readonly name: string;
    public readonly type: PropertyType;
    public readonly columnName: string;
    public readonly isRequired: boolean;

    public constructor(name: string, type: PropertyType, columnName: string, isRequired: boolean);
  }
}

declare module "@noldova/context.data/models/entities/entity-relation.js" {
  import type { IReadOnlyList } from "@noldova/context.collections";
  import type { EntityClass, EntityProperty, RelationKind } from "@noldova/context.data";

  export class EntityRelation {
    public readonly kind: RelationKind;
    public readonly navigation: string | null;
    public readonly principal: EntityClass<object>;
    public readonly inverseNavigation: string | null;
    public readonly foreignKey: IReadOnlyList<EntityProperty>;

    public constructor(
      kind: RelationKind,
      navigation: string | null,
      principal: EntityClass<object>,
      inverseNavigation: string | null,
      foreignKey: Iterable<EntityProperty>);
  }
}

declare module "@noldova/context.data/models/entities/entity-type-definition.js" {
  import type { Dictionary, IReadOnlyList } from "@noldova/context.collections";
  import type { EntityClass } from "@noldova/context.data";

  export class EntityTypeDefinition {
    public readonly type: EntityClass<object>;
    public readonly columnNames: Dictionary<string, string>;
    public readonly foreignKeys: Dictionary<string, IReadOnlyList<string>>;
    public tableName: string;
    public key: IReadOnlyList<string> | null;

    public constructor(type: EntityClass<object>);
  }
}

declare module "@noldova/context.data/models/entities/model-builder.js" {
  import type { IReadOnlyList } from "@noldova/context.collections";
  import type { EntityClass, EntityTypeBuilder, Model, ModelSnapshot } from "@noldova/context.data";

  export class ModelBuilder {
    public constructor();

    public get entityClasses(): IReadOnlyList<EntityClass<object>>;

    public entity<TEntity extends object>(type: EntityClass<TEntity>): EntityTypeBuilder<TEntity>;

    public build(snapshot: ModelSnapshot | null): Model;
  }
}

declare module "@noldova/context.data/models/entities/model.js" {
  import type { IReadOnlyList } from "@noldova/context.collections";
  import type { EntityClass, EntityType } from "@noldova/context.data";

  export class Model {
    public readonly entityTypes: IReadOnlyList<EntityType>;

    public constructor(entityTypes: Iterable<EntityType>);

    public findEntityType(type: EntityClass<object>): EntityType | null;
  }
}

declare module "@noldova/context.data/models/snapshots/model-snapshot.js" {
  import type { IReadOnlyList } from "@noldova/context.collections";
  import type { SnapshotBuilder } from "@noldova/context.data/models/snapshots/snapshot-builder.js";
  import type { SnapshotEntity } from "@noldova/context.data/models/snapshots/snapshot-entity.js";

  export abstract class ModelSnapshot {
    public toEntities(): IReadOnlyList<SnapshotEntity>;

    protected abstract buildModel(builder: SnapshotBuilder): void;
  }
}

declare module "@noldova/context.data/models/snapshots/snapshot-builder.js" {
  import type { IReadOnlyList } from "@noldova/context.collections";
  import type { SnapshotEntityBuilder } from "@noldova/context.data/models/snapshots/snapshot-entity-builder.js";
  import type { SnapshotEntity } from "@noldova/context.data/models/snapshots/snapshot-entity.js";

  export class SnapshotBuilder {
    public constructor();

    public entity(name: string): SnapshotEntityBuilder;

    public toEntities(): IReadOnlyList<SnapshotEntity>;
  }
}

declare module "@noldova/context.data/models/snapshots/snapshot-entity-builder.js" {
  import type { PropertyType } from "@noldova/context.data";
  import type { SnapshotEntity } from "@noldova/context.data/models/snapshots/snapshot-entity.js";

  export class SnapshotEntityBuilder {
    public constructor(name: string);

    public toTable(name: string): this;

    public property(name: string, type: PropertyType, columnName?: string): this;

    public optionalProperty(name: string, type: PropertyType, columnName?: string): this;

    public hasKey(...properties: readonly string[]): this;

    public hasForeignKey(principal: string, ...properties: readonly string[]): this;

    public reference(name: string, target: string): this;

    public collection(name: string, target: string): this;

    public toEntity(): SnapshotEntity;
  }
}

declare module "@noldova/context.data/models/snapshots/snapshot-entity.js" {
  import type { IReadOnlyList } from "@noldova/context.collections";
  import type { SnapshotForeignKey } from "@noldova/context.data/models/snapshots/snapshot-foreign-key.js";
  import type { SnapshotNavigation } from "@noldova/context.data/models/snapshots/snapshot-navigation.js";
  import type { SnapshotProperty } from "@noldova/context.data/models/snapshots/snapshot-property.js";

  export class SnapshotEntity {
    public readonly name: string;
    public readonly tableName: string;
    public readonly properties: IReadOnlyList<SnapshotProperty>;
    public readonly key: IReadOnlyList<string>;
    public readonly foreignKeys: IReadOnlyList<SnapshotForeignKey>;
    public readonly navigations: IReadOnlyList<SnapshotNavigation>;

    public constructor(name: string, tableName: string, properties: Iterable<SnapshotProperty>, key: Iterable<string>, foreignKeys: Iterable<SnapshotForeignKey>,
      navigations: Iterable<SnapshotNavigation>);
  }
}

declare module "@noldova/context.data/models/snapshots/snapshot-foreign-key.js" {
  import type { IReadOnlyList } from "@noldova/context.collections";

  export class SnapshotForeignKey {
    public readonly principal: string;
    public readonly properties: IReadOnlyList<string>;

    public constructor(principal: string, properties: Iterable<string>);
  }
}

declare module "@noldova/context.data/models/snapshots/snapshot-navigation.js" {
  export class SnapshotNavigation {
    public readonly name: string;
    public readonly target: string;
    public readonly isCollection: boolean;

    public constructor(name: string, target: string, isCollection: boolean);
  }
}

declare module "@noldova/context.data/models/snapshots/snapshot-property.js" {
  import type { PropertyType } from "@noldova/context.data";

  export class SnapshotProperty {
    public readonly name: string;
    public readonly type: PropertyType;
    public readonly isOptional: boolean;
    public readonly columnName: string;

    public constructor(name: string, type: PropertyType, isOptional: boolean, columnName: string);
  }
}

declare module "@noldova/context.data/services/entity-names.js" {
  import type { Enumerable } from "@noldova/context.collections";

  export class EntityNames {
    public static find(names: Enumerable<string>, name: string): string | undefined;
  }
}
