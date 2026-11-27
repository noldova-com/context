/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { NameofSelector } from "@noldova/context.core";
import { type Change, ChangeFeed, type ChangeOperation, Connection, DataException, DataProvider, type DataRecord, type DataSource, type DataValue, type Index, Migration, MigrationHistory, Migrator, type Model, type ModelSnapshot,
  type PropertyType, Transaction } from "@noldova/context.data";

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
 * One column of a table as a migration declares it: a name, its provider's
 * column type, whether `NULL` is allowed, and the value a row takes when none
 * is given. Keys are constraints of the table, not properties of the column.
 */
export declare class Column {
  /**
   * The column's name.
   */
  public readonly name: string;

  /**
   * The column type in the provider's own words, such as `TEXT` or `BIGINT`.
   */
  public readonly type: string;

  /**
   * True when `NULL` is allowed; otherwise the column is `NOT NULL`.
   */
  public readonly isNullable: boolean;

  /**
   * The default value as SQL, such as `''` or `0`, or `null` for none.
   */
  public readonly defaultValueSql: string | null;

  /**
   * Initializes the column, with no default when `defaultValueSql` is left
   * out. A blank name or type throws `ArgumentException`.
   */
  public constructor(name: string, type: string, isNullable: boolean, defaultValueSql?: string | null);
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
 * Changes an existing table in a way a database may not support in place;
 * SQLite applies each one by rebuilding the table.
 */
export declare abstract class TableChangeOperation extends SchemaOperation {
  /**
   * The name of the table it changes.
   */
  public readonly table: string;

  /**
   * Initializes the operation for the table.
   */
  protected constructor(table: string);

  /**
   * Returns the table as the operation leaves it.
   */
  public abstract applyTo(table: Table): Table;
}

/**
 * Drops a table.
 */
export declare class DropTableOperation extends SchemaOperation {
  /**
   * The table's name.
   */
  public readonly table: string;

  /**
   * Initializes the operation for the table.
   */
  public constructor(table: string);

  /**
   * Renders `DROP TABLE`.
   */
  public override render(dialect: SqlDialect): string;
}

/**
 * Adds a column to an existing table; a column that is `NOT NULL` needs a
 * default when the table has rows.
 */
export declare class AddColumnOperation extends SchemaOperation {
  /**
   * The table's name.
   */
  public readonly table: string;

  /**
   * The column it adds.
   */
  public readonly column: Column;

  /**
   * Initializes the operation for the table and column.
   */
  public constructor(table: string, column: Column);

  /**
   * Renders `ALTER TABLE ... ADD COLUMN`.
   */
  public override render(dialect: SqlDialect): string;
}

/**
 * Drops a column, with the foreign keys from it and its place in the primary key.
 */
export declare class DropColumnOperation extends TableChangeOperation {
  /**
   * The column's name.
   */
  public readonly column: string;

  /**
   * Initializes the operation for the table and column.
   */
  public constructor(table: string, column: string);

  /**
   * Renders `ALTER TABLE ... DROP COLUMN`.
   */
  public override render(dialect: SqlDialect): string;

  /**
   * Returns the table without the column. A table without it throws `InvalidOperationException`.
   */
  public override applyTo(table: Table): Table;
}

/**
 * Changes a column's type and whether it allows `NULL`; its default stays.
 */
export declare class AlterColumnOperation extends TableChangeOperation {
  /**
   * The column as it becomes.
   */
  public readonly column: Column;

  /**
   * Initializes the operation for the table and column.
   */
  public constructor(table: string, column: Column);

  /**
   * Renders the dialect's `ALTER COLUMN`.
   */
  public override render(dialect: SqlDialect): string;

  /**
   * Returns the table with the column changed. A table without it throws `InvalidOperationException`.
   */
  public override applyTo(table: Table): Table;
}

/**
 * Adds a primary key, named `PK_<table>`, to a table that has none.
 */
export declare class AddPrimaryKeyOperation extends TableChangeOperation {
  /**
   * The key it adds.
   */
  public readonly primaryKey: PrimaryKey;

  /**
   * Initializes the operation for the table and key.
   */
  public constructor(table: string, primaryKey: PrimaryKey);

  /**
   * Renders `ALTER TABLE ... ADD CONSTRAINT ... PRIMARY KEY`.
   */
  public override render(dialect: SqlDialect): string;

  /**
   * Returns the table with the key.
   */
  public override applyTo(table: Table): Table;
}

/**
 * Drops a table's primary key, `PK_<table>`.
 */
export declare class DropPrimaryKeyOperation extends TableChangeOperation {
  /**
   * Initializes the operation for the table.
   */
  public constructor(table: string);

  /**
   * Renders `ALTER TABLE ... DROP CONSTRAINT`.
   */
  public override render(dialect: SqlDialect): string;

  /**
   * Returns the table without a key.
   */
  public override applyTo(table: Table): Table;
}

/**
 * Adds a foreign key, named `FK_<table>_<column>`.
 */
export declare class AddForeignKeyOperation extends TableChangeOperation {
  /**
   * The foreign key it adds.
   */
  public readonly foreignKey: ForeignKey;

  /**
   * Initializes the operation for the table and foreign key.
   */
  public constructor(table: string, foreignKey: ForeignKey);

  /**
   * Renders `ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY`.
   */
  public override render(dialect: SqlDialect): string;

  /**
   * Returns the table with the foreign key added.
   */
  public override applyTo(table: Table): Table;
}

/**
 * Drops the foreign key from a column, `FK_<table>_<column>`.
 */
export declare class DropForeignKeyOperation extends TableChangeOperation {
  /**
   * The column the foreign key is from.
   */
  public readonly column: string;

  /**
   * Initializes the operation for the table and column.
   */
  public constructor(table: string, column: string);

  /**
   * Renders `ALTER TABLE ... DROP CONSTRAINT`.
   */
  public override render(dialect: SqlDialect): string;

  /**
   * Returns the table without the foreign keys from the column.
   */
  public override applyTo(table: Table): Table;
}

/**
 * The operations `SchemaDiffer` finds between two schemas.
 */
export declare type SchemaDifference = AddColumnOperation | AddForeignKeyOperation | AddPrimaryKeyOperation | AlterColumnOperation | CreateTableOperation
  | DropColumnOperation | DropForeignKeyOperation | DropPrimaryKeyOperation | DropTableOperation;

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
   * Spells the column type that holds a property of the type, such as `TEXT`
   * for `PropertyType.String`.
   */
  public abstract formatColumnType(type: PropertyType): string;

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
   * Renders the database's statement that changes a column's type and
   * whether it allows `NULL`; a database that can't throws
   * `InvalidOperationException` and applies the change otherwise.
   */
  public abstract renderAlterColumn(table: string, column: Column): string;

  /**
   * Returns the statements the migrator runs before each migration's
   * transaction begins; none by default.
   */
  public formatMigrationStart(): readonly string[];

  /**
   * Returns the statements the migrator runs after each migration's
   * transaction ends, whether it committed or not; none by default.
   */
  public formatMigrationEnd(): readonly string[];

  /**
   * Returns the query that finds a row breaking a foreign key, with its
   * `table` and `parent`, which the migrator runs before each migration
   * commits; `null` by default, where the database checks every statement.
   */
  public formatForeignKeyCheck(): string | null;

  /**
   * Spells the value a new required column of the type takes in rows that
   * exist: `0` for integers and `''` for text.
   */
  public formatDefaultValue(type: PropertyType): string;

  /**
   * Applies one migration operation in the transaction; by default it runs
   * the statement the operation renders.
   */
  public applyAsync(operation: SchemaOperation, transaction: SqlTransaction): Promise<void>;

  /**
   * Quotes an identifier with double quotes, doubling any it contains.
   */
  public quoteIdentifier(name: string): string;

  /**
   * Renders `CREATE TABLE` with every column definition, then the primary
   * key and the foreign keys as table constraints named after the table.
   * The table is created as `name` when given, such as a temporary name
   * for a rebuild, with its constraints still named after `table`.
   */
  public renderCreateTable(table: Table, name?: string): string;

  /**
   * Renders `DROP TABLE`.
   */
  public renderDropTable(table: string): string;

  /**
   * Renders `CREATE INDEX` or `CREATE UNIQUE INDEX` over the index's fields.
   */
  public renderCreateIndex(index: Index): string;

  /**
   * Renders one column definition, such as `"id" TEXT NOT NULL DEFAULT ''`.
   */
  public renderColumn(column: Column): string;

  /**
   * Renders `ALTER TABLE "table" ADD COLUMN` with the column's definition.
   */
  public renderAddColumn(table: string, column: Column): string;

  /**
   * Renders `ALTER TABLE "table" DROP COLUMN "column"`.
   */
  public renderDropColumn(table: string, column: string): string;

  /**
   * Renders the constraint `CONSTRAINT "PK_table" PRIMARY KEY ("columns")`.
   */
  public renderPrimaryKey(table: string, primaryKey: PrimaryKey): string;

  /**
   * Renders `ALTER TABLE "table" ADD` with the primary key constraint.
   */
  public renderAddPrimaryKey(table: string, primaryKey: PrimaryKey): string;

  /**
   * Renders `ALTER TABLE "table" DROP CONSTRAINT "PK_table"`.
   */
  public renderDropPrimaryKey(table: string): string;

  /**
   * Renders the constraint `CONSTRAINT "FK_table_column" FOREIGN KEY ("column") REFERENCES "principal" ("column")`.
   */
  public renderForeignKey(table: string, foreignKey: ForeignKey): string;

  /**
   * Renders `ALTER TABLE "table" ADD` with the foreign key constraint.
   */
  public renderAddForeignKey(table: string, foreignKey: ForeignKey): string;

  /**
   * Renders `ALTER TABLE "table" DROP CONSTRAINT "FK_table_column"`.
   */
  public renderDropForeignKey(table: string, column: string): string;

  /**
   * Renders `ALTER TABLE "table"`, the start of every statement that changes a table.
   */
  protected renderAlterTable(table: string): string;
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
   * A failure marks the transaction rollback-only, so the connection rolls it
   * back even when the action catches it, with the first such failure as the
   * `cause` of its `DataException`.
   */
  public executeAsync(query: SqlQuery): Promise<number>;

  /**
   * Runs an `INSERT` in the transaction and returns the generated key. A
   * completed transaction rejects with `DataException`.
   * A failure marks the transaction rollback-only, so the connection rolls it
   * back even when the action catches it, with the first such failure as the
   * `cause` of its `DataException`.
   */
  public insertAsync(query: SqlQuery): Promise<number>;

  /**
   * Runs a query in the transaction and returns its rows as records. A
   * completed transaction rejects with `DataException`.
   * A failure marks the transaction rollback-only, so the connection rolls it
   * back even when the action catches it, with the first such failure as the
   * `cause` of its `DataException`.
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
   * Inserts the change under the feed's lock and returns it with the
   * assigned sequence.
   */
  protected override appendCoreAsync(entity: string, entityId: string, operation: ChangeOperation, payload: string, transaction: SqlTransaction | undefined): Promise<Change>;

  /**
   * Selects the changes after the sequence in order, up to the limit, under
   * the feed's lock, in a transaction of its own when none is given.
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
   * The column type in the provider's own words, such as `TEXT` or `BIGINT`.
   */
  public readonly type: string;

  /**
   * Initializes the builder for a `NOT NULL` column.
   */
  public constructor(name: string, type: string);

  /**
   * Allows `NULL`.
   */
  public makeNullable(): this;

  /**
   * Gives the column a default: text quoted with its quotes doubled, a number as written.
   */
  public hasDefaultValue(value: string | number): this;

  /**
   * Gives the column a default written as SQL, as it is, such as `0` or
   * `CURRENT_TIMESTAMP`. Blank SQL throws `ArgumentException`.
   */
  public hasDefaultValueSql(sql: string): this;

  /**
   * Produces the column model; a blank name or type throws `ArgumentException`.
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
  public addColumn(name: string, type: string): ColumnBuilder;

  /**
   * Adds a column named after the selected property of the model.
   */
  public addColumn(selector: ColumnSelector<TModel>, type: string): ColumnBuilder;

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
   * Declares the primary key over the columns, each a name or a selected
   * property, in order. No columns throws `ArgumentException`.
   */
  public addPrimaryKey(...columns: readonly (string | ColumnSelector<TModel>)[]): this;

  /**
   * Declares a foreign key from the column to the principal column in the
   * principal table, each a name or a selected property.
   */
  public addForeignKey<TPrincipal>(column: string | ColumnSelector<TModel>, principalTable: string, principalColumn: string | ColumnSelector<TPrincipal>): this;

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
   * properties, its parts joined by `_`. A blank table or no properties
   * throws `ArgumentException`. Because the parts are joined by `_`, another
   * table and columns can give the same name, such as table `notes_id` with
   * column `text` and table `notes` with columns `id` and `text`.
   *
   * Two names are the same when they match once their ASCII letters are
   * lower-cased and both are cut to their first 63 UTF-8 bytes, without
   * splitting a character, since SQLite compares names regardless of ASCII
   * case and PostgreSQL keeps only their first 63 bytes. A name the same as
   * one this builder already creates throws `InvalidOperationException`. The
   * builder sees only its own `createIndex` and `createUniqueIndex` calls, so
   * a name the same as an index created through
   * {@link MigrationBuilder.executeSql} or by an earlier migration fails when
   * this migration runs.
   */
  public createIndex<TModel>(table: string, ...columns: readonly ColumnSelector<TModel>[]): void;

  /**
   * Adds a unique index named `UX_<table>_<columns>` over the selected
   * properties, so it never shares its name with a plain index on the same
   * columns. A blank table or no properties throws `ArgumentException`, and a
   * repeated name is handled as {@link MigrationBuilder.createIndex} describes.
   * A unique index created by a migration that already ran keeps the
   * `IX_<table>_<columns>` name it was created with, since an applied
   * migration doesn't run again.
   */
  public createUniqueIndex<TModel>(table: string, ...columns: readonly ColumnSelector<TModel>[]): void;

  /**
   * Adds dropping the table.
   */
  public dropTable(name: string): void;

  /**
   * Adds a column to an existing table and returns its builder, which may
   * still make it nullable or give it a default; a `NOT NULL` column added to
   * a table with rows needs one.
   */
  public addColumn(table: string, name: string, type: string): ColumnBuilder;

  /**
   * Changes a column's type and returns its builder, which may make it
   * nullable; otherwise it becomes `NOT NULL`. The column's default becomes
   * the one given to the builder, and without one the column has none; the
   * old default is dropped before the column is converted, so a default of
   * the old type doesn't fail the change. A `NOT NULL` column takes the
   * default in each row that holds `NULL`; without one, such a row fails the
   * change.
   */
  public alterColumn(table: string, name: string, type: string): ColumnBuilder;

  /**
   * Adds dropping the column.
   */
  public dropColumn(table: string, name: string): void;

  /**
   * Adds a primary key over the columns, in order. No columns throws `ArgumentException`.
   */
  public addPrimaryKey(table: string, ...columns: readonly string[]): void;

  /**
   * Adds dropping the table's primary key.
   */
  public dropPrimaryKey(table: string): void;

  /**
   * Adds a foreign key from the column to the principal table's column.
   */
  public addForeignKey(table: string, column: string, principalTable: string, principalColumn: string): void;

  /**
   * Adds dropping the foreign key from the column.
   */
  public dropForeignKey(table: string, column: string): void;

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
   * order; without a transaction, it does so in one of its own under the
   * migration lock, and a given transaction's owner holds that lock.
   */
  public override getAppliedAsync(transaction?: SqlTransaction): Promise<readonly string[]>;

  /**
   * Inserts the id with the current time.
   */
  public override recordAsync(id: string, transaction?: SqlTransaction): Promise<void>;
}

/**
 * Raised when a context's model and its snapshot disagree, naming the table
 * and, when the difference is in one, the column.
 */
export declare class SchemaMismatchException extends DataException {
  /**
   * The table that differs.
   */
  public readonly table: string;

  /**
   * The column that differs, or `null` when the table is missing or its
   * primary key differs.
   */
  public readonly column: string | null;

  /**
   * Initializes the exception with its message, the table and the column.
   */
  public constructor(message: string, table: string, column: string | null);
}

/**
 * The tables a model or a model snapshot maps to, with each column's type in
 * the dialect's words.
 */
export declare class SqlSchema {
  private constructor();

  /**
   * Returns a table for each entity of the model, in the model's order; each
   * column carries the dialect's default for its type, for a migration that
   * adds it to rows that exist.
   */
  public static fromModel(model: Model, dialect: SqlDialect): readonly Table[];

  /**
   * Returns a table for each entity of the snapshot, in the snapshot's order,
   * with no defaults.
   */
  public static fromSnapshot(snapshot: ModelSnapshot, dialect: SqlDialect): readonly Table[];
}

/**
 * Finds the operations that turn one schema into another, in an order a
 * database accepts: foreign keys that go, tables that go (dependents first),
 * each kept table's primary key, dropped, altered and added columns, new
 * tables (principals first) and foreign keys that come. Tables and columns
 * match by name, so a renamed one is dropped and added.
 */
export declare class SchemaDiffer {
  private constructor();

  /**
   * Returns the operations that turn `source` into `target`; none when they
   * match. Column types compare without regard to letter case, and defaults
   * are not compared.
   */
  public static diff(source: readonly Table[], target: readonly Table[]): readonly SchemaDifference[];
}

/**
 * Checks a context's model against its snapshot, the model its migrations
 * were written for, without reading a migration.
 *
 * @example
 * ```ts
 * SqlModelValidator.validate(context.model, new BlogModelSnapshot(), context.database.connection.dialect);
 * ```
 */
export declare class SqlModelValidator {
  private constructor();

  /**
   * Compares the tables of the snapshot with those of the model. The first
   * difference throws `SchemaMismatchException`, naming the table and,
   * where the difference is in one, the column: a migration is missing.
   */
  public static validate(model: Model, snapshot: ModelSnapshot, dialect: SqlDialect): void;
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
