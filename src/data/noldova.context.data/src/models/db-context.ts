/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Connection } from "./connection.js";
import { DatabaseFacade } from "./database-facade.js";
import type { DbContextOptions } from "./db-context-options.js";
import type { IDbContextClass } from "../interfaces/i-db-context-class.js";
import { ModelBuilder } from "./entities/model-builder.js";
import type { Model } from "./entities/model.js";
import type { Migration } from "./migration.js";
import type { ModelSnapshot } from "./snapshots/model-snapshot.js";

export abstract class DbContext<TConnection extends Connection, TMigration extends Migration> implements AsyncDisposable {
  private static readonly models: WeakMap<object, Model> = new WeakMap();

  public readonly database: DatabaseFacade<TConnection, TMigration>;
  private readonly snapshot: ModelSnapshot | null;

  protected constructor(options: DbContextOptions<TConnection, TMigration>, migrations: readonly TMigration[], snapshot: ModelSnapshot | null = null) {
    this.database = new DatabaseFacade(options, migrations);
    this.snapshot = snapshot;
  }

  public get model(): Model {
    let model = DbContext.models.get(this.constructor);
    if (Object.isUndefined(model)) {
      model = DbContext.configure(this).build(this.snapshot);
      DbContext.models.set(this.constructor, model);
    }

    return model;
  }

  public static createModelBuilder<TConnection extends Connection, TMigration extends Migration>(contextClass: IDbContextClass<TConnection, TMigration>): ModelBuilder {
    return DbContext.configure(contextClass.prototype);
  }

  public async [Symbol.asyncDispose](): Promise<void> {
    await this.database.connection.closeAsync();
  }

  protected onModelCreating(_builder: ModelBuilder): void { }

  private static configure<TConnection extends Connection, TMigration extends Migration>(context: DbContext<TConnection, TMigration>): ModelBuilder {
    const builder = new ModelBuilder();
    context.onModelCreating(builder);

    return builder;
  }
}
