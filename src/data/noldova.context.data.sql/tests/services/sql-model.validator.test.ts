/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type Model, PropertyType, type SnapshotBuilder, type SnapshotEntityBuilder } from "@noldova/context.data";
import { SchemaMismatchException, SqlModelValidator } from "@noldova/context.data.sql";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { LibraryContext } from "../fixtures/library-context.fixture.js";
import { ShapeSnapshot } from "../fixtures/shape-snapshot.fixture.js";
import { TestDialect } from "../fixtures/test-dialect.fixture.js";

@TestClass
export class SqlModelValidatorTests {
  @TestMethod
  public async acceptsTheSnapshotOfTheModelAsync(): Promise<void> {
    SqlModelValidator.validate(await SqlModelValidatorTests.modelAsync(), new ShapeSnapshot(t => {
      SqlModelValidatorTests.writer(t);
      SqlModelValidatorTests.book(t);
    }), new TestDialect());
  }

  @TestMethod
  public async throwsNamingATableTheSnapshotLacksAsync(): Promise<void> {
    const exception = await SqlModelValidatorTests.validateAsync(t => SqlModelValidatorTests.writer(t));

    Assert.areEqual("Book", exception.table);
    Assert.isNull(exception.column);
    Assert.areEqual("The model maps an entity to \"Book\", a table the snapshot doesn't have; add a migration for the change.", exception.message);
  }

  @TestMethod
  public async throwsNamingATableTheModelLacksAsync(): Promise<void> {
    const exception = await SqlModelValidatorTests.validateAsync(t => {
      SqlModelValidatorTests.writer(t);
      SqlModelValidatorTests.book(t);
      t.entity("Shelf").property("id", PropertyType.Integer).hasKey("id");
    });

    Assert.areEqual("Shelf", exception.table);
    Assert.isNull(exception.column);
    Assert.areEqual("The snapshot's table \"Shelf\" has no entity in the model; add a migration for the change.", exception.message);
  }

  @TestMethod
  public async throwsNamingAColumnTheSnapshotLacksAsync(): Promise<void> {
    const exception = await SqlModelValidatorTests.validateAsync(t => {
      t.entity("Writer").property("id", PropertyType.Integer).property("name", PropertyType.String).hasKey("id");
      SqlModelValidatorTests.book(t);
    });

    Assert.areEqual("Writer", exception.table);
    Assert.areEqual("bio", exception.column);
    Assert.areEqual("The model maps a property to \"Writer.bio\", a column the snapshot doesn't have; add a migration for the change.", exception.message);
  }

  @TestMethod
  public async throwsNamingAColumnTheModelLacksAsync(): Promise<void> {
    const exception = await SqlModelValidatorTests.validateAsync(t => {
      SqlModelValidatorTests.writer(t).property("born", PropertyType.Integer);
      SqlModelValidatorTests.book(t);
    });

    Assert.areEqual("Writer", exception.table);
    Assert.areEqual("born", exception.column);
    Assert.areEqual("The snapshot's column \"Writer.born\" has no property in the model; add a migration for the change.", exception.message);
  }

  @TestMethod
  public async throwsNamingAColumnOfAnotherTypeOrNullabilityAsync(): Promise<void> {
    const type = await SqlModelValidatorTests.validateAsync(t => {
      t.entity("Writer").property("id", PropertyType.Integer).property("name", PropertyType.Integer).optionalProperty("bio", PropertyType.String).hasKey("id");
      SqlModelValidatorTests.book(t);
    });
    const nullability = await SqlModelValidatorTests.validateAsync(t => {
      t.entity("Writer").property("id", PropertyType.Integer).property("name", PropertyType.String).property("bio", PropertyType.String).hasKey("id");
      SqlModelValidatorTests.book(t);
    });

    Assert.areEqual("name", type.column);
    Assert.areEqual("The column \"Writer.name\" differs from the snapshot in its type or nullability; add a migration for the change.", type.message);
    Assert.areEqual("bio", nullability.column);
  }

  @TestMethod
  public async throwsWhenThePrimaryKeyDiffersAsync(): Promise<void> {
    const other = await SqlModelValidatorTests.validateAsync(t => {
      SqlModelValidatorTests.writer(t).hasKey("id", "name");
      SqlModelValidatorTests.book(t);
    });
    const missing = await SqlModelValidatorTests.validateAsync(t => {
      t.entity("Writer").property("id", PropertyType.Integer).property("name", PropertyType.String).optionalProperty("bio", PropertyType.String);
    });

    Assert.areEqual("Writer", other.table);
    Assert.isNull(other.column);
    Assert.areEqual("The primary key of \"Writer\" differs from the snapshot; add a migration for the change.", other.message);
    Assert.areEqual("The primary key of \"Writer\" differs from the snapshot; add a migration for the change.", missing.message);
  }

  @TestMethod
  public async throwsNamingAForeignKeyTheSnapshotLacksOrHasAsync(): Promise<void> {
    const lacks = await SqlModelValidatorTests.validateAsync(t => {
      SqlModelValidatorTests.writer(t);
      t.entity("Book").property("id", PropertyType.Integer).property("title", PropertyType.String).property("writerId", PropertyType.Integer).hasKey("id");
    });
    const has = await SqlModelValidatorTests.validateAsync(t => {
      SqlModelValidatorTests.writer(t);
      SqlModelValidatorTests.book(t).hasForeignKey("Writer", "id");
    });

    Assert.areEqual("Book", lacks.table);
    Assert.areEqual("writerId", lacks.column);
    Assert.areEqual("The foreign key from \"Book.writerId\" differs from the snapshot; add a migration for the change.", lacks.message);
    Assert.areEqual("id", has.column);
  }

  private static writer(builder: SnapshotBuilder): SnapshotEntityBuilder {
    return builder.entity("Writer").property("id", PropertyType.Integer).property("name", PropertyType.String).optionalProperty("bio", PropertyType.String)
      .hasKey("id");
  }

  private static book(builder: SnapshotBuilder): SnapshotEntityBuilder {
    return builder.entity("Book").property("id", PropertyType.Integer).property("title", PropertyType.String).property("writerId", PropertyType.Integer)
      .hasKey("id").hasForeignKey("Writer", "writerId").reference("writer", "Writer");
  }

  private static async modelAsync(): Promise<Model> {
    await using context = new LibraryContext();

    return context.model;
  }

  private static async validateAsync(shape: (builder: SnapshotBuilder) => void): Promise<SchemaMismatchException> {
    const model = await SqlModelValidatorTests.modelAsync();

    return Assert.throws(() => SqlModelValidator.validate(model, new ShapeSnapshot(shape), new TestDialect()), SchemaMismatchException);
  }
}
