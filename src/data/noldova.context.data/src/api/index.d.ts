/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

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
   * True once a nested action failed: the transaction can then only roll
   * back, even when its outer action swallowed the failure.
   */
  public get isRollbackOnly(): boolean;

  /**
   * Runs an action as part of this transaction, joining it: nothing is
   * committed until the outermost action, the connection's, ends. A failure
   * marks the transaction rollback-only and is rethrown. A completed
   * transaction throws `DataException`.
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
   * failure rolls the transaction back, with `DataException` when the outer
   * action swallowed it. A failed commit also triggers rollback. If the
   * action or commit and the rollback both fail, a `SuppressedError` retains
   * the original failure in `suppressed` and the rollback failure in `error`.
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
   * of order throw `DataException` before any connection opens.
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
   * migrations out of order throw `DataException`.
   */
  protected constructor(options: DbContextOptions<TConnection, TMigration>, migrations: readonly TMigration[]);

  /**
   * Closes the connection.
   */
  public [Symbol.asyncDispose](): Promise<void>;
}
