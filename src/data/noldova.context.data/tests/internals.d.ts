/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

declare module "@noldova/context.data/models/entities/model-builder.js" {
  import type { EntityClass, EntityTypeBuilder, Model, ModelSnapshot } from "@noldova/context.data";

  export class ModelBuilder {
    public constructor();

    public entity<TEntity extends object>(type: EntityClass<TEntity>): EntityTypeBuilder<TEntity>;

    public build(snapshot: ModelSnapshot | null): Model;
  }
}

declare module "@noldova/context.data/services/entity-names.js" {
  import type { Enumerable } from "@noldova/context.collections";

  export class EntityNames {
    public static find(names: Enumerable<string>, name: string): string | undefined;
  }
}
