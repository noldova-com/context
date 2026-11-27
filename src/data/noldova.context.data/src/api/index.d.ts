/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IReadOnlyList } from "@noldova/context.collections";
import type { NameofSelector } from "@noldova/context.core";
import type { ExceptionOptions } from "@noldova/context.exceptions";
import { Exception } from "@noldova/context.exceptions";

/**
 * A value a store holds in a field or binds to a query: text, a number, or
 * `null`.
 */
export declare type DataValue = string | number | null;

/**
 * What happened to a record, as a change feed records it.
 */
export declare enum ChangeOperation {
  /**
   * The record was created; the change carries its complete payload.
   */
  Insert = "Insert",
  /**
   * The record was replaced; the change carries its complete new payload.
   */
  Update = "Update",
  /**
   * The record was removed; the change carries its last payload.
   */
  Delete = "Delete"
}

/**
 * Raised by data packages for misuse of a store or an unexpected answer from
 * it: an operation on a closed connection, a completed transaction used
 * again, a record without the requested field, or a migration list out of
 * order.
 */
export declare class DataException extends Exception {
  /**
   * Initializes the exception with a message and optional options carrying
   * the cause.
   */
  public constructor(message: string, options?: ExceptionOptions);
}

/**
 * The identity of one store: a name and where it lives, such as a file path or
 * a server address. A provider opens a connection on a data source.
 */
export declare class DataSource {
  /**
   * The store's name.
   */
  public readonly name: string;

  /**
   * Where the store lives, in the form its provider understands.
   */
  public readonly location: string;

  /**
   * Initializes the identity. A blank name or location throws
   * `ArgumentException`.
   */
  public constructor(name: string, location: string);
}

/**
 * One result of a query, read by field name: a row in a relational store, a
 * flat document elsewhere. Reading a field the record does not have, or one
 * whose value has another type, throws `DataException`.
 */
export declare class DataRecord {
  /**
   * Initializes the record with a copy of the given field values.
   */
  public constructor(values: ReadonlyMap<string, DataValue>);

  /**
   * Returns true when the record has the field, whatever its value.
   */
  public hasField(name: string): boolean;

  /**
   * Reads a text field that is not `null`.
   */
  public readString(name: string): string;

  /**
   * Reads a text field, returning `null` for `null`.
   */
  public readNullableString(name: string): string | null;

  /**
   * Reads an integer field that is not `null`.
   */
  public readInteger(name: string): number;

  /**
   * Reads an integer field, returning `null` for `null`.
   */
  public readNullableInteger(name: string): number | null;

  /**
   * Reads a field's value as it is.
   */
  public readValue(name: string): DataValue;
}

/**
 * One entry of a change feed: what happened to which record, with the
 * record's payload at that moment, as text the application interprets.
 */
export declare class Change {
  /**
   * Position in the feed, a positive integer the store assigns.
   */
  public readonly sequence: number;

  /**
   * The kind of record, the container's name.
   */
  public readonly entity: string;

  /**
   * The record's id.
   */
  public readonly entityId: string;

  /**
   * What happened.
   */
  public readonly operation: ChangeOperation;

  /**
   * The record's payload after the operation, or before it for a delete.
   */
  public readonly payload: string;

  /**
   * ISO 8601 timestamp of the change.
   */
  public readonly createdAt: string;

  /**
   * Initializes the change. A sequence that is not a positive integer throws
   * `ArgumentOutOfRangeException`; a blank entity, id, or timestamp throws
   * `ArgumentException`.
   */
  public constructor(sequence: number, entity: string, entityId: string, operation: ChangeOperation, payload: string, createdAt: string);
}

/**
 * A named index over the fields of a container, a table or a collection,
 * unique or not. Declared by migrations; rendered by the store kind.
 */
export declare class Index {
  /**
   * The index's name.
   */
  public readonly name: string;

  /**
   * The table or collection the index belongs to.
   */
  public readonly container: string;

  /**
   * The indexed fields, in order; a copy.
   */
  public readonly fields: readonly string[];

  /**
   * True when the indexed fields identify one record.
   */
  public readonly isUnique: boolean;

  /**
   * Initializes the index. A blank name or container, or no fields, throws
   * `ArgumentException`.
   */
  public constructor(name: string, container: string, fields: readonly string[], isUnique: boolean);
}

/**
 * One step of a store's schema history, identified by fourteen digits of
 * timestamp, an underscore, and a PascalCase name, such as
 * `20260908120000_Initial`. Migrations apply in id order; what a migration
 * does is declared by the store kind that extends this class.
 */
export declare abstract class Migration {
  /**
   * The id that orders the migration and records it as applied.
   */
  public readonly id: string;

  /**
   * Initializes the migration. An id that does not match the pattern throws
   * `ArgumentException`.
   */
  protected constructor(id: string);

  /**
   * Verifies that migrations are listed once each in ascending id order;
   * otherwise throws `DataException`.
   */
  public static validateOrder(migrations: readonly Migration[]): void;
}

/**
 * What a context needs to open its store: the provider and the data source;
 * built by `DbContextOptionsBuilder`.
 */
export declare class DbContextOptions<TConnection extends Connection, TMigration extends Migration> {
  /**
   * The provider that opens the connection and applies the migrations.
   */
  public readonly provider: DataProvider<TConnection, TMigration>;

  /**
   * The store to open.
   */
  public readonly dataSource: DataSource;

  /**
   * Initializes the options.
   */
  public constructor(provider: DataProvider<TConnection, TMigration>, dataSource: DataSource);
}

/**
 * A unit of work on a connection: committed or rolled back exactly once.
 * Disposing an incomplete transaction rolls it back. Store kinds implement
 * the two core operations and add the operations that run inside it.
 */
export declare abstract class Transaction implements AsyncDisposable {
  /**
   * True once the store successfully committed or rolled back.
   */
  public get isCompleted(): boolean;

  /**
   * True once a nested action, or a statement a store kind runs in it,
   * failed: the transaction can then only roll back, even when its outer
   * action swallowed the failure.
   */
  public get isRollbackOnly(): boolean;

  /**
   * Runs an action as part of this transaction, joining it: nothing is
   * committed until the outermost action, the connection's, ends. A failure
   * marks the transaction rollback-only and is rethrown; the first one is
   * kept as the `cause` of the connection's `DataException` when the outer
   * action swallows it. A completed transaction throws `DataException`.
   */
  public runInTransactionAsync<T>(action: (transaction: this) => Promise<T>): Promise<T>;

  /**
   * Makes the work permanent. A completed transaction throws
   * `DataException`. If the store's commit fails, the transaction remains
   * incomplete so disposal can attempt rollback.
   */
  public commitAsync(): Promise<void>;

  /**
   * Discards the work. A completed transaction throws `DataException`.
   * Completion is recorded only after the store's rollback succeeds.
   */
  public rollbackAsync(): Promise<void>;

  /**
   * Rolls back unless already completed.
   */
  public [Symbol.asyncDispose](): Promise<void>;

  /**
   * Commits in the store.
   */
  protected abstract commitCoreAsync(): Promise<void>;

  /**
   * Rolls back in the store.
   */
  protected abstract rollbackCoreAsync(): Promise<void>;

  /**
   * Throws `DataException` when the transaction is completed.
   */
  protected throwIfCompleted(): void;
}

/**
 * The append-only log of every mutation of a store, read in sequence order:
 * the source of an application's events and of replication between machines.
 * Store kinds implement the two core operations; arguments are validated
 * here. Inside a transaction's action, pass the transaction, so the feed runs
 * its statements in it; without one, the feed takes its turn on the
 * connection.
 */
export declare abstract class ChangeFeed<TTransaction extends Transaction = Transaction> {
  /**
   * Records a change and returns it with the sequence the store assigned. A
   * blank entity or id rejects with `ArgumentException`.
   */
  public appendAsync(entity: string, entityId: string, operation: ChangeOperation, payload: string, transaction?: TTransaction): Promise<Change>;

  /**
   * Reads changes with a sequence greater than the given one, at most
   * `limit` of them, one hundred by default. A negative sequence or a
   * limit that is not positive rejects with `ArgumentOutOfRangeException`.
   */
  public readAfterAsync(sequence: number, limit?: number, transaction?: TTransaction): Promise<readonly Change[]>;

  /**
   * Appends in the store, in the transaction when one is given.
   */
  protected abstract appendCoreAsync(entity: string, entityId: string, operation: ChangeOperation, payload: string, transaction: TTransaction | undefined): Promise<Change>;

  /**
   * Reads from the store, in the transaction when one is given.
   */
  protected abstract readAfterCoreAsync(sequence: number, limit: number, transaction: TTransaction | undefined): Promise<readonly Change[]>;
}

/**
 * One session on a data source. Its operations take turns: a transaction
 * holds the connection from its start until it commits or rolls back, and
 * an operation started meanwhile, from any caller, waits for its turn, so
 * two callers never share a transaction. Store kinds add their operations,
 * each taking its turn through `runExclusiveAsync`, and the same operations
 * on their transaction, which run inside the turn. Opening a connection never
 * waits on a network; disposal closes it.
 */
export declare abstract class Connection<TTransaction extends Transaction = Transaction> implements AsyncDisposable {
  /**
   * The data source the connection was opened on.
   */
  public readonly dataSource: DataSource;

  /**
   * Initializes the connection for a data source.
   */
  protected constructor(dataSource: DataSource);

  /**
   * True until the connection is closed.
   */
  public abstract get isOpen(): boolean;

  /**
   * True while a transaction holds the connection.
   */
  public get isInTransaction(): boolean;

  /**
   * Runs an action inside a transaction, once the connection's earlier
   * operations have ended: committed when its promise fulfills, rolled back
   * when it rejects, and the action's exception is rethrown. The action
   * receives the transaction; nest through its `runInTransactionAsync`. A nested
   * failure, or a statement that failed in the transaction, rolls the
   * transaction back, with `DataException` when the outer action swallowed
   * it, whose `cause` is the first such failure. A failed commit also
   * triggers rollback. If the action or commit and the rollback both fail, a
   * `SuppressedError` retains the original failure in `suppressed` and the
   * rollback failure in `error`.
   * A closed connection rejects with `DataException`.
   *
   * Never call the connection inside an action: use the transaction the
   * action receives. A call on the connection waits for its turn, which
   * comes only after the action ends, so it never settles.
   */
  public runInTransactionAsync<T>(action: (transaction: TTransaction) => Promise<T>): Promise<T>;

  /**
   * Closes the connection once its earlier operations have ended; a second
   * call does nothing.
   */
  public closeAsync(): Promise<void>;

  /**
   * Closes the connection.
   */
  public [Symbol.asyncDispose](): Promise<void>;

  /**
   * Starts a transaction in the store.
   */
  protected abstract beginTransactionCoreAsync(): Promise<TTransaction>;

  /**
   * Closes the connection in the store.
   */
  protected abstract closeCoreAsync(): Promise<void>;

  /**
   * Runs an operation once the connection's earlier operations have ended,
   * and holds the connection until it ends.
   */
  protected runExclusiveAsync<T>(operation: () => Promise<T>): Promise<T>;

  /**
   * Throws `DataException` when the connection is closed.
   */
  protected throwIfClosed(): void;
}

/**
 * Where a store remembers which migrations have been applied. Store kinds
 * implement it over their own storage.
 */
export declare abstract class MigrationHistory {
  /**
   * Returns the applied ids in ascending order, creating the storage when
   * absent.
   */
  public abstract getAppliedAsync(): Promise<readonly string[]>;

  /**
   * Records an id as applied.
   */
  public abstract recordAsync(id: string): Promise<void>;
}

/**
 * Applies the migrations a store has not seen yet, in id order, and records
 * them. Store kinds implement how one migration is
 * applied and recorded, atomically where the store allows.
 */
export declare abstract class Migrator<TMigration extends Migration> {
  /**
   * The history the migrator reads and, through `applyAsync`, writes.
   */
  protected readonly history: MigrationHistory;

  /**
   * Initializes the migrator. Migrations that repeat an id or are not in
   * ascending order throw `DataException`.
   */
  protected constructor(migrations: readonly TMigration[], history: MigrationHistory);

  /**
   * Applies every pending migration and returns the ids applied by this
   * call, in order.
   */
  public migrateAsync(): Promise<readonly string[]>;

  /**
   * Returns the migrations not yet recorded, in id order.
   */
  public getPendingMigrationsAsync(): Promise<readonly TMigration[]>;

  /**
   * Returns the applied ids in ascending order.
   */
  public getAppliedMigrationsAsync(): Promise<readonly string[]>;

  /**
   * Applies one migration and records it in the history, and returns true;
   * returns false, applying nothing, when the history already records it,
   * such as when another process applied it meanwhile.
   */
  protected abstract applyAsync(migration: TMigration): Promise<boolean>;
}

/**
 * One kind of store, such as SQLite: opens connections on its data sources
 * and creates the migrator and the change feed over them. A store kind extends it and a context receives it through its
 * options.
 */
export declare abstract class DataProvider<TConnection extends Connection, TMigration extends Migration> {
  /**
   * Opens a connection on the data source, doing no I/O a store can defer
   * to the connection's first operation.
   */
  public abstract openConnection(dataSource: DataSource): TConnection;

  /**
   * Creates the migrator that applies the migrations over the connection.
   */
  public abstract createMigrator(connection: TConnection, migrations: readonly TMigration[]): Migrator<TMigration>;

  /**
   * Creates the change feed over the connection.
   */
  public abstract createChangeFeed(connection: TConnection): ChangeFeed;
}

/**
 * Builds the options a context is constructed from. Providers add a method per store kind, such as
 * `useSQLite`, beside the general `use`.
 */
export declare class DbContextOptionsBuilder {
  /**
   * Returns options for the provider and data source.
   */
  public use<TConnection extends Connection, TMigration extends Migration>(
    provider: DataProvider<TConnection, TMigration>,
    dataSource: DataSource): DbContextOptions<TConnection, TMigration>;
}

/**
 * A context's `database`: the connection it owns, the migrations it applies
 * to it, and the store's change feed. Opening
 * the connection and creating the migrator and the feed happen here, when
 * the context is constructed.
 */
export declare class DatabaseFacade<TConnection extends Connection, TMigration extends Migration> {
  /**
   * The connection opened on the options' data source.
   */
  public readonly connection: TConnection;

  /**
   * The change feed of the store, over the connection.
   */
  public readonly changeFeed: ChangeFeed;

  /**
   * Opens the connection through the options' provider and creates the
   * migrator over it for the migrations and the change feed. Migrations out
   * of order throw `DataException` before any connection opens. If the
   * provider cannot create the migrator or the change feed, the connection
   * starts closing and the provider's error is rethrown; a failure to close
   * it is dropped.
   */
  public constructor(options: DbContextOptions<TConnection, TMigration>, migrations: readonly TMigration[]);

  /**
   * Applies every pending migration and returns the ids applied by this
   * call, in order.
   */
  public migrateAsync(): Promise<readonly string[]>;

  /**
   * Returns the applied ids in ascending order.
   */
  public getAppliedMigrationsAsync(): Promise<readonly string[]>;

  /**
   * Returns the migrations not yet applied, in id order.
   */
  public getPendingMigrationsAsync(): Promise<readonly TMigration[]>;
}

/**
 * The type of a property's values, as a model snapshot records it: a string or
 * an integer.
 */
export declare enum PropertyType {
  /**
   * A string.
   */
  String = "String",
  /**
   * An integer number.
   */
  Integer = "Integer"
}

/**
 * How many dependents a relation's principal has.
 */
export declare enum RelationKind {
  /**
   * The principal has any number of dependents.
   */
  OneToMany = "OneToMany",
  /**
   * The principal has at most one dependent.
   */
  OneToOne = "OneToOne"
}

/**
 * A data context's class, as `DbContext.createModelBuilder` takes it: every
 * class that extends `DbContext` is one.
 *
 * @typeParam TConnection The connection the context opens.
 * @typeParam TMigration The migrations the context applies.
 */
export declare interface IDbContextClass<TConnection extends Connection, TMigration extends Migration> {
  /**
   * The class's prototype, on which `onModelCreating` runs.
   */
  readonly prototype: DbContext<TConnection, TMigration>;
}

/**
 * An entity class a model maps. The model constructs it without arguments to
 * compare its fields with the model snapshot.
 */
export declare type EntityClass<TEntity extends object> = new () => TEntity;

/**
 * Names one property of an entity, as `t => t.title`; the property's name is
 * read with `nameof`.
 */
export declare type PropertySelector<TEntity> = (t: NameofSelector<TEntity>) => keyof TEntity & string;

/**
 * Raised when two navigations on a relation's principal could each be the way
 * back to its dependent.
 */
export declare class AmbiguousRelationException extends DataException {
  /**
   * The dependent entity's name.
   */
  public readonly entity: string;

  /**
   * The dependent's navigation to its principal.
   */
  public readonly navigation: string;

  /**
   * Initializes the exception for the entity and the navigation.
   */
  public constructor(entity: string, navigation: string);
}

/**
 * Raised when a model maps two properties of one entity to the same column.
 */
export declare class ColumnMappedTwiceException extends DataException {
  /**
   * The entity's table.
   */
  public readonly table: string;

  /**
   * The column both properties map to.
   */
  public readonly column: string;

  /**
   * Initializes the exception for the table and the column.
   */
  public constructor(table: string, column: string);
}

/**
 * Raised when a model's entity has no key: the configuration names none, and
 * the entity has neither an `id` property nor one named after the entity,
 * such as `noteId`, in any letter case.
 */
export declare class EntityKeyMissingException extends DataException {
  /**
   * The entity's name.
   */
  public readonly entity: string;

  /**
   * Initializes the exception for the entity.
   */
  public constructor(entity: string);
}

/**
 * Raised when the configuration or a relation's foreign key names a property
 * the entity doesn't have.
 */
export declare class EntityPropertyMissingException extends DataException {
  /**
   * The entity's name.
   */
  public readonly entity: string;

  /**
   * The property's name.
   */
  public readonly property: string;

  /**
   * Initializes the exception for the entity and the property.
   */
  public constructor(entity: string, property: string);
}

/**
 * Raised when a relation's foreign key differs from its principal's key in
 * the number of properties or in their types.
 */
export declare class ForeignKeyMismatchException extends DataException {
  /**
   * The name of the entity whose navigation the relation follows.
   */
  public readonly entity: string;

  /**
   * The relation's navigation.
   */
  public readonly navigation: string;

  /**
   * Initializes the exception for the entity and the navigation.
   */
  public constructor(entity: string, navigation: string);
}

/**
 * Raised when a foreign key is configured on a navigation the entity's
 * snapshot doesn't record as a reference, such as a collection or a property.
 */
export declare class ReferenceMissingException extends DataException {
  /**
   * The name of the entity the foreign key is configured on.
   */
  public readonly entity: string;

  /**
   * The navigation the foreign key is configured on.
   */
  public readonly navigation: string;

  /**
   * Initializes the exception for the entity and the navigation.
   */
  public constructor(entity: string, navigation: string);
}

/**
 * Raised when a navigation leads to an entity the model doesn't map.
 */
export declare class RelationTargetUnmappedException extends DataException {
  /**
   * The name of the entity the navigation belongs to.
   */
  public readonly entity: string;

  /**
   * The navigation.
   */
  public readonly navigation: string;

  /**
   * The name of the entity the navigation leads to.
   */
  public readonly target: string;

  /**
   * Initializes the exception for the entity, the navigation and the target.
   */
  public constructor(entity: string, navigation: string, target: string);
}

/**
 * Raised when an entity no longer matches the model snapshot: the context
 * maps it and the snapshot doesn't, the snapshot has it and the context
 * doesn't map it, or its fields differ from the snapshot's. Adding a
 * migration writes a new snapshot.
 */
export declare class StaleSnapshotException extends DataException {
  /**
   * The entity's name.
   */
  public readonly entity: string;

  /**
   * Initializes the exception for the entity.
   */
  public constructor(entity: string);
}

/**
 * Raised when a model maps two entities to the same table.
 */
export declare class TableMappedTwiceException extends DataException {
  /**
   * The table both entities map to.
   */
  public readonly table: string;

  /**
   * Initializes the exception for the table.
   */
  public constructor(table: string);
}

/**
 * One property of an entity in a model snapshot.
 */
export declare class SnapshotProperty {
  private constructor();

  /**
   * The property's name.
   */
  public readonly name: string;

  /**
   * The type of the property's values.
   */
  public readonly type: PropertyType;

  /**
   * Whether the property may hold no value.
   */
  public readonly isOptional: boolean;

  /**
   * The column the property maps to.
   */
  public readonly columnName: string;
}

/**
 * One foreign key of an entity in a model snapshot.
 */
export declare class SnapshotForeignKey {
  private constructor();

  /**
   * The name of the entity whose key the foreign key refers to.
   */
  public readonly principal: string;

  /**
   * The dependent's properties that hold the principal's key, in key order.
   */
  public readonly properties: IReadOnlyList<string>;
}

/**
 * One navigation of an entity in a model snapshot.
 */
export declare class SnapshotNavigation {
  private constructor();

  /**
   * The navigation's name.
   */
  public readonly name: string;

  /**
   * The name of the entity it leads to.
   */
  public readonly target: string;

  /**
   * Whether it leads to any number of entities rather than one.
   */
  public readonly isCollection: boolean;
}

/**
 * One entity of a model snapshot, as its last migration left it.
 */
export declare class SnapshotEntity {
  private constructor();

  /**
   * The entity's class name.
   */
  public readonly name: string;

  /**
   * The table the entity maps to.
   */
  public readonly tableName: string;

  /**
   * The entity's properties, in the order recorded.
   */
  public readonly properties: IReadOnlyList<SnapshotProperty>;

  /**
   * The names of the key's properties, in key order; empty when none was recorded.
   */
  public readonly key: IReadOnlyList<string>;

  /**
   * The entity's foreign keys, in the order recorded.
   */
  public readonly foreignKeys: IReadOnlyList<SnapshotForeignKey>;

  /**
   * The entity's navigations, in the order recorded.
   */
  public readonly navigations: IReadOnlyList<SnapshotNavigation>;
}

/**
 * Records one entity in a model snapshot: its table, properties and the
 * columns they map to, key, foreign keys and navigations.
 */
export declare class SnapshotEntityBuilder {
  private constructor();

  /**
   * Records the table the entity maps to; the entity's name when not recorded.
   */
  public toTable(name: string): this;

  /**
   * Records a required property of the type, mapped to the column, which is the property's name when left out.
   */
  public property(name: string, type: PropertyType, columnName?: string): this;

  /**
   * Records a property of the type that may hold no value, mapped to the column, which is the property's name when left out.
   */
  public optionalProperty(name: string, type: PropertyType, columnName?: string): this;

  /**
   * Records the key's properties, in key order.
   */
  public hasKey(...properties: readonly string[]): this;

  /**
   * Records a foreign key: the properties, in the principal's key order, that hold the key of the named principal entity.
   */
  public hasForeignKey(principal: string, ...properties: readonly string[]): this;

  /**
   * Records a navigation to one entity of the named target.
   */
  public reference(name: string, target: string): this;

  /**
   * Records a navigation to any number of entities of the named target.
   */
  public collection(name: string, target: string): this;
}

/**
 * Records the entities of a model snapshot.
 */
export declare class SnapshotBuilder {
  private constructor();

  /**
   * Records an entity by its class's name and returns its builder.
   */
  public entity(name: string): SnapshotEntityBuilder;
}

/**
 * A context's model when its last migration was added: each entity's table,
 * its properties with their types, columns and whether they are optional, its
 * key, foreign keys and navigations. Types are not known at run time, so the
 * model reads them here; tables, columns and keys come from the model's
 * configuration, and the snapshot records them so that the next migration is
 * found by comparing the model with it. `ctx migrations add` writes the
 * snapshot.
 *
 * @example
 * ```ts
 * class BlogModelSnapshot extends ModelSnapshot {
 *   protected override buildModel(builder: SnapshotBuilder): void {
 *     builder.entity("Author").toTable("authors")
 *       .property("id", PropertyType.Integer)
 *       .property("name", PropertyType.String)
 *       .hasKey("id")
 *       .collection("posts", "Post");
 *     builder.entity("Post")
 *       .property("id", PropertyType.Integer)
 *       .optionalProperty("body", PropertyType.String)
 *       .property("authorId", PropertyType.Integer, "author_id")
 *       .hasKey("id")
 *       .hasForeignKey("Author", "authorId")
 *       .reference("author", "Author");
 *   }
 * }
 * ```
 */
export declare abstract class ModelSnapshot {
  /**
   * Records the entities and returns them in the order recorded.
   */
  public toEntities(): IReadOnlyList<SnapshotEntity>;

  /**
   * Records the entities.
   */
  protected abstract buildModel(builder: SnapshotBuilder): void;
}

/**
 * One property of an entity mapped to a column of its table.
 */
export declare class EntityProperty {
  /**
   * The property's name.
   */
  public readonly name: string;

  /**
   * The type of the property's values.
   */
  public readonly type: PropertyType;

  /**
   * The column the property maps to: the property's name unless configured.
   */
  public readonly columnName: string;

  /**
   * False only for an optional property in the snapshot; a key property is
   * always required.
   */
  public readonly isRequired: boolean;

  private constructor();
}

/**
 * A relation from a dependent entity, which holds the foreign key, to its
 * principal.
 */
export declare class EntityRelation {
  /**
   * One to many, or one to one when the principal's navigation back is a
   * reference.
   */
  public readonly kind: RelationKind;

  /**
   * The dependent's navigation to its principal, or `null` when only the
   * principal has a navigation.
   */
  public readonly navigation: string | null;

  /**
   * The principal entity class.
   */
  public readonly principal: EntityClass<object>;

  /**
   * The principal's navigation back to its dependents, or `null` when it has
   * none.
   */
  public readonly inverseNavigation: string | null;

  /**
   * The dependent's foreign key properties, in the order of the principal's
   * key.
   */
  public readonly foreignKey: IReadOnlyList<EntityProperty>;

  private constructor();
}

/**
 * One entity class mapped to a table: its properties, its key and its
 * relations to principals.
 */
export declare class EntityType {
  /**
   * The entity class.
   */
  public readonly type: EntityClass<object>;

  /**
   * The table: the class's name unless configured.
   */
  public readonly tableName: string;

  /**
   * The properties, in the snapshot's order.
   */
  public readonly properties: IReadOnlyList<EntityProperty>;

  /**
   * The key properties, in the order configured; by convention, the `id`
   * property, or the one named after the entity, such as `noteId`, in any
   * letter case.
   */
  public readonly key: IReadOnlyList<EntityProperty>;

  /**
   * The relations in which this entity holds the foreign key.
   */
  public readonly relations: IReadOnlyList<EntityRelation>;

  private constructor();

  /**
   * Returns the property of that name, or `null` when the entity has none.
   */
  public findProperty(name: string): EntityProperty | null;
}

/**
 * The entities a context maps.
 */
export declare class Model {
  /**
   * The mapped entities, in the order first configured.
   */
  public readonly entityTypes: IReadOnlyList<EntityType>;

  private constructor();

  /**
   * Returns the mapping of the entity class, or `null` when the model maps
   * none.
   */
  public findEntityType(type: EntityClass<object>): EntityType | null;
}

/**
 * Configures one property of an entity.
 */
export declare class PropertyBuilder {
  private constructor();

  /**
   * Maps the property to the named column. An empty or whitespace name throws
   * `ArgumentException`.
   */
  public hasColumnName(name: string): this;
}

/**
 * Configures a relation from a dependent entity's navigation to its
 * principal.
 */
export declare class RelationBuilder<TEntity> {
  private constructor();

  /**
   * Names the dependent's foreign key properties, in the order of the
   * principal's key. Without it, each is the navigation's name followed by the
   * principal's key property's name, such as `authorId`, in any letter case.
   * No properties throws `ArgumentException`.
   */
  public hasForeignKey(...properties: readonly PropertySelector<TEntity>[]): this;
}

/**
 * Configures one entity: its table, key, columns and foreign keys. Each
 * builder of the same class configures the same entity.
 */
export declare class EntityTypeBuilder<TEntity> {
  private constructor();

  /**
   * Maps the entity to the named table. An empty or whitespace name throws
   * `ArgumentException`.
   */
  public toTable(name: string): this;

  /**
   * Names the key properties, in order. No properties throws
   * `ArgumentException`.
   */
  public hasKey(...properties: readonly PropertySelector<TEntity>[]): this;

  /**
   * Returns the builder of the property.
   */
  public property(property: PropertySelector<TEntity>): PropertyBuilder;

  /**
   * Returns the builder of the relation the reference navigation follows. A
   * foreign key configured on a navigation the snapshot doesn't record as a
   * reference throws `ReferenceMissingException` when the model is built.
   */
  public hasOne(navigation: PropertySelector<TEntity>): RelationBuilder<TEntity>;
}

/**
 * Configures the entities a context maps. What the configuration leaves out
 * follows conventions: the table is the class's name, a column the
 * property's, the key `id` or the property named after the entity, and a
 * foreign key the navigation's name followed by the principal's key; key and
 * foreign key names match in any letter case, preferring their own. A
 * relation pairs a reference with the one navigation back on its principal;
 * when the principal has only a collection, the dependent's foreign key is
 * named after the principal, such as `authorId`.
 *
 * @example
 * ```ts
 * protected override onModelCreating(builder: ModelBuilder): void {
 *   builder.entity(Author).toTable("authors");
 *   builder.entity(Post).property(t => t.body).hasColumnName("text");
 * }
 * ```
 */
export declare class ModelBuilder {
  private constructor();

  /**
   * The entity classes mapped so far, in the order they were first mapped.
   */
  public get entityClasses(): IReadOnlyList<EntityClass<object>>;

  /**
   * Maps the entity class and returns its builder.
   */
  public entity<TEntity extends object>(type: EntityClass<TEntity>): EntityTypeBuilder<TEntity>;

  /**
   * Builds the model of the mapped entities, their property types taken from
   * the snapshot. An invalid model throws the `DataException` that names its
   * fault, such as `StaleSnapshotException` when an entity and the snapshot
   * differ.
   *
   * @param snapshot The entities' shapes, or `null` for none.
   * @returns The model.
   */
  public build(snapshot: ModelSnapshot | null): Model;
}

/**
 * The one object an application talks to for one store. Constructed from options and its migrations, it opens its
 * connection and exposes it with the migrations as `database`; disposal
 * closes the connection. Applications extend it with their record sets.
 */
export declare abstract class DbContext<TConnection extends Connection, TMigration extends Migration> implements AsyncDisposable {
  /**
   * The connection and the migrations of the store.
   */
  public readonly database: DatabaseFacade<TConnection, TMigration>;

  /**
   * Opens the store the options describe with the migrations, in id order;
   * migrations out of order throw `DataException`. The snapshot holds the
   * entities' shapes; without one, mapping an entity throws
   * `StaleSnapshotException`.
   */
  protected constructor(options: DbContextOptions<TConnection, TMigration>, migrations: readonly TMigration[], snapshot?: ModelSnapshot | null);

  /**
   * The entities the context's class maps, built from `onModelCreating` and
   * the snapshot the first time any instance of the class asks, and shared by
   * all of them. An invalid model throws the `DataException` that names its
   * fault, such as `EntityKeyMissingException`, each time it is asked for.
   */
  public get model(): Model;

  /**
   * Runs a context class's `onModelCreating` on a new model builder, without
   * constructing the context, so no connection opens: a tool reads the
   * entity classes it maps, then builds the model from a snapshot of their
   * shapes. The configuration runs on the class's prototype, so it sees none
   * of the fields the constructor sets.
   *
   * @param contextClass The context's class.
   * @returns The configured builder.
   *
   * @example
   * ```ts
   * import { DbContext } from "@noldova/context.data";
   *
   * const builder = DbContext.createModelBuilder(BlogContext);
   * builder.entityClasses.select(t => t.name).toArray(); // ["Author", "Post"]
   * const model = builder.build(new BlogSnapshot());
   * ```
   */
  public static createModelBuilder<TConnection extends Connection, TMigration extends Migration>(contextClass: IDbContextClass<TConnection, TMigration>): ModelBuilder;

  /**
   * Closes the connection.
   */
  public [Symbol.asyncDispose](): Promise<void>;

  /**
   * Configures the entities the context maps; maps none unless overridden.
   */
  protected onModelCreating(builder: ModelBuilder): void;
}
