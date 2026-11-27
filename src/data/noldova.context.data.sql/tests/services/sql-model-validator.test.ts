/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Model } from "@noldova/context.data";
import { type MigrationBuilder, SchemaMismatchException, type SqlMigration, SqlModelValidator } from "@noldova/context.data.sql";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import type { Book } from "../fixtures/book.fixture.js";
import { LibraryContext } from "../fixtures/library-context.fixture.js";
import { ShapeMigration } from "../fixtures/shape-migration.fixture.js";
import { TestDialect } from "../fixtures/test-dialect.fixture.js";
import type { Writer } from "../fixtures/writer.fixture.js";

@TestClass
export class SqlModelValidatorTests {
  @TestMethod
  public async acceptsTheSchemaItsMigrationsCreateAsync(): Promise<void> {
    const migrations = [
      new ShapeMigration("20261126120000_Writers", t => {
        SqlModelValidatorTests.createWriter(t, "integer", "TEXT", false, "TEXT", true);
        t.executeSql("UPDATE \"Writer\" SET \"bio\" = NULL");
      }),
      new ShapeMigration("20261126120001_Books", t => {
        SqlModelValidatorTests.createBook(t, true);
        t.createIndex<Book>("Book", b => b.title);
      })
    ];

    SqlModelValidator.validate(await SqlModelValidatorTests.modelAsync(), migrations, new TestDialect());
  }

  @TestMethod
  public async throwsNamingAMissingTableAsync(): Promise<void> {
    const exception = await SqlModelValidatorTests.validateAsync(t => SqlModelValidatorTests.createWriter(t, "INTEGER", "TEXT", false, "TEXT", true));

    Assert.areEqual("Book", exception.table);
    Assert.isNull(exception.column);
    Assert.areEqual("The migrations create no table \"Book\".", exception.message);
  }

  @TestMethod
  public async throwsNamingAMissingColumnAsync(): Promise<void> {
    const exception = await SqlModelValidatorTests.validateAsync(t => {
      t.createTable<Writer>("Writer", c => {
        c.addColumn(w => w.id, "INTEGER");
        c.addColumn(w => w.name, "TEXT");
      }, c => c.addPrimaryKey(w => w.id));
      SqlModelValidatorTests.createBook(t, true);
    });

    Assert.areEqual("Writer", exception.table);
    Assert.areEqual("bio", exception.column);
    Assert.areEqual("The table \"Writer\" has no column \"bio\".", exception.message);
  }

  @TestMethod
  public async throwsNamingAColumnOfAnotherTypeAsync(): Promise<void> {
    const exception = await SqlModelValidatorTests.validateAsync(t => {
      SqlModelValidatorTests.createWriter(t, "INTEGER", "INTEGER", false, "TEXT", true);
      SqlModelValidatorTests.createBook(t, true);
    });

    Assert.areEqual("name", exception.column);
    Assert.areEqual("The column \"Writer.name\" is INTEGER, but its property needs TEXT.", exception.message);
  }

  @TestMethod
  public async throwsWhenARequiredPropertysColumnAllowsNullAsync(): Promise<void> {
    const exception = await SqlModelValidatorTests.validateAsync(t => {
      SqlModelValidatorTests.createWriter(t, "INTEGER", "TEXT", true, "TEXT", true);
      SqlModelValidatorTests.createBook(t, true);
    });

    Assert.areEqual("name", exception.column);
    Assert.areEqual("The column \"Writer.name\" allows NULL, but its property is required.", exception.message);
  }

  @TestMethod
  public async throwsWhenAnOptionalPropertysColumnIsNotNullAsync(): Promise<void> {
    const exception = await SqlModelValidatorTests.validateAsync(t => {
      SqlModelValidatorTests.createWriter(t, "INTEGER", "TEXT", false, "TEXT", false);
      SqlModelValidatorTests.createBook(t, true);
    });

    Assert.areEqual("bio", exception.column);
    Assert.areEqual("The column \"Writer.bio\" is NOT NULL, but its property is optional.", exception.message);
  }

  @TestMethod
  public async throwsWhenThePrimaryKeyDiffersAsync(): Promise<void> {
    const missing = await SqlModelValidatorTests.validateAsync(t => {
      t.createTable<Writer>("Writer", c => {
        c.addColumn(w => w.id, "INTEGER");
        c.addColumn(w => w.name, "TEXT");
        c.addColumn(w => w.bio, "TEXT").makeNullable();
      });
      SqlModelValidatorTests.createBook(t, true);
    });
    const other = await SqlModelValidatorTests.validateAsync(t => {
      t.createTable<Writer>("Writer", c => {
        c.addColumn(w => w.id, "INTEGER");
        c.addColumn(w => w.name, "TEXT");
        c.addColumn(w => w.bio, "TEXT").makeNullable();
      }, c => c.addPrimaryKey(w => w.id, w => w.name));
      SqlModelValidatorTests.createBook(t, true);
    });

    Assert.areEqual("Writer", missing.table);
    Assert.isNull(missing.column);
    Assert.areEqual("The primary key of \"Writer\" is (), but the model's key is (id).", missing.message);
    Assert.areEqual("The primary key of \"Writer\" is (id, name), but the model's key is (id).", other.message);
  }

  @TestMethod
  public async throwsNamingAMissingForeignKeyAsync(): Promise<void> {
    const exception = await SqlModelValidatorTests.validateAsync(t => {
      SqlModelValidatorTests.createWriter(t, "INTEGER", "TEXT", false, "TEXT", true);
      SqlModelValidatorTests.createBook(t, false);
    });

    Assert.areEqual("Book", exception.table);
    Assert.areEqual("writerId", exception.column);
    Assert.areEqual("The table \"Book\" has no foreign key from \"writerId\" to \"Writer.id\".", exception.message);
  }

  private static async modelAsync(): Promise<Model> {
    await using context = new LibraryContext();

    return context.model;
  }

  private static async validateAsync(shape: (builder: MigrationBuilder) => void): Promise<SchemaMismatchException> {
    const model = await SqlModelValidatorTests.modelAsync();
    const migrations: readonly SqlMigration[] = [new ShapeMigration("20261126120000_Library", shape)];

    return Assert.throws(() => SqlModelValidator.validate(model, migrations, new TestDialect()), SchemaMismatchException);
  }

  private static createWriter(builder: MigrationBuilder, idType: string, nameType: string, isNameNullable: boolean, bioType: string, isBioNullable: boolean): void {
    builder.createTable<Writer>("Writer", t => {
      t.addColumn(w => w.id, idType);
      const name = t.addColumn(w => w.name, nameType);
      if (isNameNullable)
        name.makeNullable();
      const bio = t.addColumn(w => w.bio, bioType);
      if (isBioNullable)
        bio.makeNullable();
    }, t => t.addPrimaryKey(w => w.id));
  }

  private static createBook(builder: MigrationBuilder, hasForeignKey: boolean): void {
    builder.createTable<Book>("Book", t => {
      t.addColumn(b => b.id, "INTEGER");
      t.addColumn(b => b.title, "TEXT");
      t.addColumn(b => b.writerId, "INTEGER");
    }, t => {
      t.addPrimaryKey(b => b.id);
      if (hasForeignKey)
        t.addForeignKey<Writer>(b => b.writerId, "Writer", w => w.id);
    });
  }
}
