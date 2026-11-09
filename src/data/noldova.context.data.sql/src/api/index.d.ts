/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { NameofSelector } from "@noldova/context.core";
import { type Change, ChangeFeed, type ChangeOperation, Connection, DataProvider, type DataRecord, type DataSource, type DataValue, type Index, Migration, MigrationHistory, Migrator, Transaction } from "@noldova/context.data";

/**
 * The storage classes a migration may declare for a column; the dialect spells
 * them for its database.
 */
export declare enum ColumnType {
  /**
   * Text; also the class for JSON documents and ISO 8601 timestamps.
   */
  Text = "Text",
  /**
   * An integer.
   */
  Integer = "Integer"
}

/**
 * Names a column after a property of the model the table stores, as a
 * `nameof` selector: `t => t.conversationId`. The property's name is the
 * column's name.
 */
export declare type ColumnSelector<TModel> = (t: NameofSelector<TModel>) => keyof TModel & string;

/**
 * A SQL statement with `?` placeholders and the values bound to them, in
 * order. Renders as its text.
 */
export declare class SqlQuery {
  /**
   * The statement text.
   */
  public readonly text: string;

  /**
   * The bound values, in placeholder order; a copy.
   */
  public readonly parameters: readonly DataValue[];

  /**
   * Initializes the query. Blank text throws `ArgumentException`.
   */
  public constructor(text: string, parameters?: readonly DataValue[]);

  /**
   * Returns the statement text.
   */
  public toString(): string;
}

/**
 * One column of a table as a migration declares it: a name, a storage class,
 * and whether `NULL` is allowed. Keys are constraints of the table, not
 * properties of the column.
 */
export declare class Column {
  /**
   * The column's name.
   */
  public readonly name: string;

  /**
   * The storage class.
   */
  public readonly type: ColumnType;

  /**
   * True when `NULL` is allowed; otherwise the column is `NOT NULL`.
   */
  public readonly isNullable: boolean;

  /**
   * Initializes the column. A blank name throws `ArgumentException`.
   */
  public constructor(name: string, type: ColumnType, isNullable: boolean);
}

/**
 * The primary key of a table: one column or several, in order.
 */
export declare class PrimaryKey {
  /**
   * The key columns, in order; a copy.
   */
  public readonly columns: readonly string[];

  /**
   * Initializes the key. No columns throws `ArgumentException`.
   */
  public constructor(columns: readonly string[]);
}

/**
 * A reference from a column of a table to a column of a principal table.
 */
export declare class ForeignKey {
  /**
   * The referencing column.
   */
  public readonly column: string;

  /**
   * The referenced table.
   */
  public readonly principalTable: string;

  /**
   * The referenced column.
   */
  public readonly principalColumn: string;

  /**
   * Initializes the reference. A blank column, table, or principal column
   * throws `ArgumentException`.
   */
  public constructor(column: string, principalTable: string, principalColumn: string);
}

/**
 * One table as a migration declares it: a name, its columns in order, its
 * primary key when it has one, and its foreign keys.
 */
export declare class Table {
  /**
   * The table's name.
   */
  public readonly name: string;

  /**
   * The columns in declaration order; a copy.
   */
  public readonly columns: readonly Column[];

  /**
   * The primary key, or `null` for a table without one.
   */
  public readonly primaryKey: PrimaryKey | null;

  /**
   * The foreign keys in declaration order; a copy.
   */
  public readonly foreignKeys: readonly ForeignKey[];

  /**
   * Initializes the table. A blank name or no columns throws
   * `ArgumentException`.
   */
  public constructor(name: string, columns: readonly Column[], primaryKey: PrimaryKey | null, foreignKeys: readonly ForeignKey[]);
}

/**
 * One step of a migration, rendered to a statement by a dialect.
 */
export declare abstract class SchemaOperation {
  /**
   * Renders the statement in the dialect.
   */
  public abstract render(dialect: SqlDialect): string;
}

/**
 * Creates a table.
 */
export declare class CreateTableOperation extends SchemaOperation {
  /**
   * The table to create.
   */
  public readonly table: Table;

  /**
   * Initializes the operation.
   */
  public constructor(table: Table);

  /**
   * Renders the `CREATE TABLE` statement.
   */
  public override render(dialect: SqlDialect): string;
}

/**
 * Creates an index.
 */
export declare class CreateIndexOperation extends SchemaOperation {
  /**
   * The index to create.
   */
  public readonly index: Index;

  /**
   * Initializes the operation.
   */
  public constructor(index: Index);

  /**
   * Renders the `CREATE INDEX` or `CREATE UNIQUE INDEX` statement.
   */
  public override render(dialect: SqlDialect): string;
}

/**
 * Runs one SQL statement as written, such as a data change that a schema
 * operation can't express. The statement is the
 * migration's own and is never built from input.
 */
export declare class SqlStatementOperation extends SchemaOperation {
  /**
   * The statement to run.
   */
  public readonly statement: string;

  /**
   * Initializes the operation. A blank statement throws `ArgumentException`.
   */
  public constructor(statement: string);

  /**
   * Returns the statement unchanged, in any dialect.
   */
  public override render(): string;
}

/**
 * How one database spells SQL. The shared rendering of tables, constraints,
 * indexes, and columns lives here, with every identifier quoted, so a
 * mixed-case name such as `entityId` keeps its case in every database;
 * providers supply the parts that differ.
 */
export declare abstract class SqlDialect {
  /**
   * Spells the statement that begins a transaction, such as `BEGIN`; a
   * database that would take its write lock only at the first write begins
   * with the form that takes it at once, so concurrent writers wait at the
   * start rather than fail midway.
   */
  public abstract formatBeginTransaction(): string;

  /**
   * Spells a column's storage class, such as `TEXT`.
   */
  public abstract formatColumnType(type: ColumnType): string;

  /**
   * Spells the type and constraints of an integer primary key the database
   * generates, such as `INTEGER PRIMARY KEY AUTOINCREMENT`.
   */
  public abstract formatIdentityColumnType(): string;

  /**
   * Returns the statements that lock a resource, such as `__migrations`,
   * until the transaction they run in ends; none where the database's own
   * write lock already serializes the writers.
   */
  public abstract formatLock(resource: string): readonly string[];

  /**
   * Quotes an identifier with double quotes, doubling any it contains.
   */
  public quoteIdentifier(name: string): string;

  /**
   * Renders `CREATE TABLE` with every column definition, then the primary
   * key and the foreign keys as table constraints.
   */
  public renderCreateTable(table: Table): string;

  /**
   * Renders `CREATE INDEX` or `CREATE UNIQUE INDEX` over the index's fields.
   */
  public renderCreateIndex(index: Index): string;

  /**
   * Renders one column definition, such as `"id" TEXT NOT NULL`.
   */
  public renderColumn(column: Column): string;

  /**
   * Renders the constraint `PRIMARY KEY ("columns")`.
   */
  public renderPrimaryKey(primaryKey: PrimaryKey): string;

  /**
   * Renders the constraint `FOREIGN KEY ("column") REFERENCES "table" ("column")`.
   */
  public renderForeignKey(foreignKey: ForeignKey): string;
}

/**
 * One database session's statements, as a provider runs them: no turns and
 * no transaction of its own. A `SqlConnection` runs them in its turn and a
 * `SqlTransaction` inside its own; nothing else calls them. Queries write
 * their parameters as `?`, and a provider whose database spells them
 * otherwise converts them.
 */
export declare abstract class SqlSession {
  /**
   * True until the session is closed.
   */
  public abstract get isOpen(): boolean;

  /**
   * Runs a query that returns no rows and returns the number of rows it
   * changed.
   */
  public abstract executeAsync(query: SqlQuery): Promise<number>;

  /**
   * Runs an `INSERT` into a table with a generated integer key and returns
   * the key the database assigned.
   */
  public abstract insertAsync(query: SqlQuery): Promise<number>;

  /**
   * Runs a query and returns its rows as records.
   */
  public abstract queryAsync(query: SqlQuery): Promise<readonly DataRecord[]>;

  /**
   * Closes the session; a second call does nothing.
   */
  public abstract closeAsync(): Promise<void>;
}

/**
 * A transaction over a SQL session: begun by its connection, `COMMIT` or
 * `ROLLBACK` on completion. Inside the action it was given to, every
 * statement runs through it.
 */
export declare class SqlTransaction extends Transaction {
  /**
   * Initializes the transaction over a session its connection has already
   * begun it on.
   */
  public constructor(session: SqlSession);

  /**
   * Runs a query that returns no rows in the transaction and returns the
   * number of rows it changed. A completed transaction rejects with
   * `DataException`.
   */
  public executeAsync(query: SqlQuery): Promise<number>;

  /**
   * Runs an `INSERT` in the transaction and returns the generated key. A
   * completed transaction rejects with `DataException`.
   */
  public insertAsync(query: SqlQuery): Promise<number>;

  /**
   * Runs a query in the transaction and returns its rows as records. A
   * completed transaction rejects with `DataException`.
   */
  public queryAsync(query: SqlQuery): Promise<readonly DataRecord[]>;

  /**
   * Executes `COMMIT`.
   */
  protected override commitCoreAsync(): Promise<void>;

  /**
   * Executes `ROLLBACK`.
   */
  protected override rollbackCoreAsync(): Promise<void>;
}

/**
 * A connection to a SQL database over one session: runs statements in its
 * turn and begins SQL transactions. Providers supply the session and the
 * dialect.
 */
export declare abstract class SqlConnection extends Connection<SqlTransaction> {
  /**
   * Initializes the connection over its session.
   */
  protected constructor(dataSource: DataSource, session: SqlSession);

  /**
   * The dialect of the database.
   */
  public abstract get dialect(): SqlDialect;

  /**
   * True until the session is closed.
   */
  public override get isOpen(): boolean;

  /**
   * Runs a query that returns no rows, in the connection's turn, and returns
   * the number of rows it changed. A closed connection rejects with
   * `DataException`.
   *
   * Never call the connection inside a transaction's action: use the
   * transaction's own statements. A call on the connection waits for its turn,
   * which comes only after the action ends, so it never settles.
   */
  public executeAsync(query: SqlQuery): Promise<number>;

  /**
   * Runs an `INSERT`, in the connection's turn, and returns the key the
   * database assigned. A closed connection rejects with `DataException`.
   *
   * Never call the connection inside a transaction's action: use the
   * transaction's own statements. A call on the connection waits for its turn,
   * which comes only after the action ends, so it never settles.
   */
  public insertAsync(query: SqlQuery): Promise<number>;

  /**
   * Runs a query, in the connection's turn, and returns its rows as records.
   * A closed connection rejects with `DataException`.
   *
   * Never call the connection inside a transaction's action: use the
   * transaction's own statements. A call on the connection waits for its turn,
   * which comes only after the action ends, so it never settles.
   */
  public queryAsync(query: SqlQuery): Promise<readonly DataRecord[]>;

  /**
   * Executes the dialect's begin statement and returns the `SqlTransaction`.
   */
  protected override beginTransactionCoreAsync(): Promise<SqlTransaction>;

  /**
   * Closes the session.
   */
  protected override closeCoreAsync(): Promise<void>;
}

/**
 * The change feed in a framework-owned `__changes` table of the connected
 * database, created with its index on first use. The store assigns the
 * sequence; a record whose operation the feed does not know throws
 * `DataException`. Each operation ensures the table and index exist, so
 * initialization rolled back by a transaction is recreated on the next use.
 * An append runs in the transaction it is given, or in one of its own, and
 * first takes the dialect's lock on `__changes`, so sequences become visible
 * in order.
 */
export declare class SqlChangeFeed extends ChangeFeed<SqlTransaction> {
  /**
   * Initializes the feed over the connection.
   */
  public constructor(connection: SqlConnection);

  /**
   * Inserts the change and returns it with the assigned sequence.
   */
  protected override appendCoreAsync(entity: string, entityId: string, operation: ChangeOperation, payload: string, transaction: SqlTransaction | undefined): Promise<Change>;

  /**
   * Selects the changes after the sequence in order, up to the limit.
   */
  protected override readAfterCoreAsync(sequence: number, limit: number, transaction: SqlTransaction | undefined): Promise<readonly Change[]>;
}

/**
 * A migration of a SQL schema: declares its tables and indexes on the
 * builder. There is no `down` until a rollback has a present need.
 */
export declare abstract class SqlMigration extends Migration {
  /**
   * Initializes the migration with its id.
   */
  protected constructor(id: string);

  /**
   * Declares the schema changes.
   */
  public abstract apply(builder: MigrationBuilder): void;
}

/**
 * One column being declared inside `ColumnsBuilder.column`, fluently;
 * `toColumn` produces the model, which validates the declaration.
 */
export declare class ColumnBuilder {
  /**
   * The column's name.
   */
  public readonly name: string;

  /**
   * The storage class.
   */
  public readonly type: ColumnType;

  /**
   * Initializes the builder for a `NOT NULL` column.
   */
  public constructor(name: string, type: ColumnType);

  /**
   * Allows `NULL`.
   */
  public makeNullable(): this;

  /**
   * Produces the column model; a blank name throws `ArgumentException`.
   */
  public toColumn(): Column;
}

/**
 * The columns of one table being declared inside
 * `MigrationBuilder.createTable`, named after the model's properties or by
 * text.
 */
export declare class ColumnsBuilder<TModel> {
  /**
   * Adds a column with the given name.
   */
  public addColumn(name: string, type: ColumnType): ColumnBuilder;

  /**
   * Adds a column named after the selected property of the model.
   */
  public addColumn(selector: ColumnSelector<TModel>, type: ColumnType): ColumnBuilder;

  /**
   * Produces the column models in declaration order.
   */
  public toColumns(): readonly Column[];
}

/**
 * The constraints of one table being declared inside
 * `MigrationBuilder.createTable`, with columns named after the models'
 * properties.
 */
export declare class ConstraintsBuilder<TModel> {
  /**
   * Declares the primary key over the selected properties, in order. No
   * properties throws `ArgumentException`.
   */
  public addPrimaryKey(...columns: readonly ColumnSelector<TModel>[]): this;

  /**
   * Declares a foreign key from the selected property to the selected
   * property of the principal model in the principal table.
   */
  public addForeignKey<TPrincipal>(column: ColumnSelector<TModel>, principalTable: string, principalColumn: ColumnSelector<TPrincipal>): this;

  /**
   * Returns the primary key, or `null` when none was declared.
   */
  public toPrimaryKey(): PrimaryKey | null;

  /**
   * Returns the foreign keys in declaration order; a copy.
   */
  public toForeignKeys(): readonly ForeignKey[];
}

/**
 * Collects the operations of one migration in declaration order. Tables and indexes are declared against the model a
 * table stores, so columns are named by `nameof` selectors.
 */
export declare class MigrationBuilder {
  /**
   * Adds a table whose columns the first callback declares and whose
   * constraints the second, when given, declares. A blank name or no columns
   * throws `ArgumentException`.
   */
  public createTable<TModel>(
    name: string,
    columns: (table: ColumnsBuilder<TModel>) => void,
    constraints?: (table: ConstraintsBuilder<TModel>) => void): void;

  /**
   * Adds an index named `IX_<table>_<columns>` over the selected
   * properties. A blank table or no properties throws `ArgumentException`.
   */
  public createIndex<TModel>(table: string, ...columns: readonly ColumnSelector<TModel>[]): void;

  /**
   * Adds a unique index named `IX_<table>_<columns>` over the selected
   * properties. A blank table or no properties throws `ArgumentException`.
   */
  public createUniqueIndex<TModel>(table: string, ...columns: readonly ColumnSelector<TModel>[]): void;

  /**
   * Adds a statement that runs as written, in declaration order with the
   * other operations. A blank statement throws
   * `ArgumentException`.
   */
  public executeSql(statement: string): void;

  /**
   * Returns the operations in declaration order; a copy.
   */
  public toOperations(): readonly SchemaOperation[];
}

/**
 * The migration history in a `__migrations` table of the connected database,
 * created when first read. Each operation runs in the transaction it is
 * given, or in the connection's turn.
 */
export declare class SqlMigrationHistory extends MigrationHistory {
  /**
   * Initializes the history over the connection.
   */
  public constructor(connection: SqlConnection);

  /**
   * Creates the table when absent and returns the recorded ids in ascending
   * order.
   */
  public override getAppliedAsync(transaction?: SqlTransaction): Promise<readonly string[]>;

  /**
   * Inserts the id with the current time.
   */
  public override recordAsync(id: string, transaction?: SqlTransaction): Promise<void>;
}

/**
 * Applies SQL migrations: each one runs in its own transaction, which takes
 * the dialect's lock on `__migrations`, skips the migration when another
 * process has recorded it meanwhile, and otherwise executes its operations,
 * rendered in the connection's dialect, and records it.
 */
export declare class SqlMigrator extends Migrator<SqlMigration> {
  /**
   * Initializes the migrator over the connection with its
   * `SqlMigrationHistory`. Migrations out of order throw `DataException`.
   */
  public constructor(connection: SqlConnection, migrations: readonly SqlMigration[]);

  /**
   * Applies and records the migration in one locked transaction and returns
   * true, or returns false when the history recorded it before the lock.
   */
  protected override applyAsync(migration: SqlMigration): Promise<boolean>;
}

/**
 * A provider of one SQL database: opens its connections and creates the
 * `SqlMigrator` and the `SqlChangeFeed` over them. Database packages extend it with `openConnection`
 * and add their `use` method to `DbContextOptionsBuilder`.
 */
export declare abstract class SqlProvider extends DataProvider<SqlConnection, SqlMigration> {
  /**
   * Creates a `SqlMigrator` over the connection for the migrations.
   */
  public override createMigrator(connection: SqlConnection, migrations: readonly SqlMigration[]): Migrator<SqlMigration>;

  /**
   * Creates a `SqlChangeFeed` over the connection.
   */
  public override createChangeFeed(connection: SqlConnection): ChangeFeed<SqlTransaction>;
}
