/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  AmbiguousRelationException, ColumnMappedTwiceException, EntityKeyMissingException, EntityPropertyMissingException, ForeignKeyMismatchException, type Model, PropertyType,
  RelationTargetUnmappedException, StaleSnapshotException, TableMappedTwiceException
} from "@noldova/context.data";
import { ModelBuilder } from "@noldova/context.data/models/entities/model-builder.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { Author } from "../fixtures/author.fixture.js";
import { BlogSnapshot } from "../fixtures/blog-snapshot.fixture.js";
import { Post } from "../fixtures/post.fixture.js";
import { Profile } from "../fixtures/profile.fixture.js";
import { ShapeSnapshot } from "../fixtures/shape-snapshot.fixture.js";
import { Tag } from "../fixtures/tag.fixture.js";

@TestClass
export class ModelFactoryTests {
  @TestMethod
  public mapsEntitiesByConvention(): void {
    const builder = ModelFactoryTests.blogBuilder();

    const model = builder.build(new BlogSnapshot());

    Assert.areEqual([
      "Author(id:Integer, name:String) key id",
      "Post(id:Integer, title:String, body:String?, authorId:Integer) key id; OneToMany author -> Author.posts [authorId]",
      "Profile(profileId:Integer, authorId:Integer) key profileId; OneToOne author -> Author.profile [authorId]",
      "Tag(id:Integer, label:String, postId:Integer) key id; OneToMany null -> Post.tags [postId]"
    ].join("\n"), ModelFactoryTests.describe(model));
  }

  @TestMethod
  public appliesItsConfiguration(): void {
    const builder = ModelFactoryTests.blogBuilder();
    builder.entity(Author).toTable("authors").property(t => t.name).hasColumnName("display_name");
    builder.entity(Tag).hasKey(t => t.label, t => t.id);

    const model = builder.build(new BlogSnapshot());

    Assert.areEqual([
      "authors(id:Integer, display_name:String) key id",
      "Post(id:Integer, title:String, body:String?, authorId:Integer) key id; OneToMany author -> Author.posts [authorId]",
      "Profile(profileId:Integer, authorId:Integer) key profileId; OneToOne author -> Author.profile [authorId]",
      "Tag(id:Integer, label:String, postId:Integer) key label,id; OneToMany null -> Post.tags [postId]"
    ].join("\n"), ModelFactoryTests.describe(model));
  }

  @TestMethod
  public makesAnOptionalKeyPropertyRequired(): void {
    class Code {
      public id: number | null = null;
    }
    const builder = new ModelBuilder();
    builder.entity(Code);

    const model = builder.build(new ShapeSnapshot(t => t.entity("Code").optionalProperty("id", PropertyType.Integer)));

    Assert.areEqual("Code(id:Integer) key id", ModelFactoryTests.describe(model));
  }

  @TestMethod
  public findsConventionalNamesInAnyLetterCase(): void {
    class Owner {
      public OWNERID: number = 0;
    }
    class Pet {
      public Id: number = 0;
      public ownerownerid: number = 0;
      public owner: Owner | null = null;
      public toys: object[] = [];
    }
    class Toy {
      public id: number = 0;
      public PETID: number = 0;
    }
    const builder = new ModelBuilder();
    builder.entity(Owner);
    builder.entity(Pet);
    builder.entity(Toy);

    const model = builder.build(new ShapeSnapshot(t => {
      t.entity("Owner").property("OWNERID", PropertyType.Integer);
      t.entity("Pet").property("Id", PropertyType.Integer).property("ownerownerid", PropertyType.Integer).reference("owner", "Owner").collection("toys", "Toy");
      t.entity("Toy").property("id", PropertyType.Integer).property("PETID", PropertyType.Integer);
    }));

    Assert.areEqual([
      "Owner(OWNERID:Integer) key OWNERID",
      "Pet(Id:Integer, ownerownerid:Integer) key Id; OneToMany owner -> Owner.null [ownerownerid]",
      "Toy(id:Integer, PETID:Integer) key id; OneToMany null -> Pet.toys [PETID]"
    ].join("\n"), ModelFactoryTests.describe(model));
  }

  @TestMethod
  public prefersAKeyInItsOwnLetterCase(): void {
    class Code {
      public ID: number = 0;
      public id: number = 0;
    }
    const builder = new ModelBuilder();
    builder.entity(Code);

    const model = builder.build(new ShapeSnapshot(t => t.entity("Code").property("ID", PropertyType.Integer).property("id", PropertyType.Integer)));

    Assert.areEqual("Code(ID:Integer, id:Integer) key id", ModelFactoryTests.describe(model));
  }

  @TestMethod
  public followsAConfiguredForeignKey(): void {
    class Writer {
      public id: number = 0;
    }
    class Essay {
      public id: number = 0;
      public penId: number = 0;
      public writer: Writer | null = null;
    }
    const builder = new ModelBuilder();
    builder.entity(Writer);
    builder.entity(Essay).hasOne(t => t.writer).hasForeignKey(t => t.penId);

    const model = builder.build(new ShapeSnapshot(t => {
      t.entity("Writer").property("id", PropertyType.Integer);
      t.entity("Essay").property("id", PropertyType.Integer).property("penId", PropertyType.Integer).reference("writer", "Writer");
    }));

    Assert.areEqual("Writer(id:Integer) key id\nEssay(id:Integer, penId:Integer) key id; OneToMany writer -> Writer.null [penId]", ModelFactoryTests.describe(model));
  }

  @TestMethod
  public relatesAnEntityToItself(): void {
    class Employee {
      public id: number = 0;
      public managerId: number | null = null;
      public manager: Employee | null = null;
      public reports: Employee[] = [];
    }
    const builder = new ModelBuilder();
    builder.entity(Employee);

    const model = builder.build(new ShapeSnapshot(t => t.entity("Employee").property("id", PropertyType.Integer).optionalProperty("managerId", PropertyType.Integer)
      .reference("manager", "Employee").collection("reports", "Employee")));

    Assert.areEqual("Employee(id:Integer, managerId:Integer?) key id; OneToMany manager -> Employee.reports [managerId]", ModelFactoryTests.describe(model));
  }

  @TestMethod
  public mapsNothingWithoutEntities(): void {
    Assert.areEqual(0, new ModelBuilder().build(null).entityTypes.count());
  }

  @TestMethod
  public throwsWhenTheSnapshotLacksAMappedEntity(): void {
    const builder = new ModelBuilder();
    builder.entity(Tag);

    const exception = Assert.throws(() => builder.build(null), StaleSnapshotException);

    Assert.areEqual("Tag", exception.entity);
  }

  @TestMethod
  public throwsWhenTheSnapshotHasAnUnmappedEntity(): void {
    const builder = new ModelBuilder();
    builder.entity(Author);
    builder.entity(Post);
    builder.entity(Profile);

    const exception = Assert.throws(() => builder.build(new BlogSnapshot()), StaleSnapshotException);

    Assert.areEqual("Tag", exception.entity);
  }

  @TestMethod
  public throwsWhenAnEntitysFieldsDifferFromTheSnapshot(): void {
    const builder = new ModelBuilder();
    builder.entity(Tag);

    const renamed = Assert.throws(() => builder.build(new ShapeSnapshot(t => t.entity("Tag").property("id", PropertyType.Integer).property("name", PropertyType.String)
      .property("postId", PropertyType.Integer))), StaleSnapshotException);
    const fewer = Assert.throws(() => builder.build(new ShapeSnapshot(t => t.entity("Tag").property("id", PropertyType.Integer).property("label", PropertyType.String))),
      StaleSnapshotException);

    Assert.areEqual("Tag", renamed.entity);
    Assert.areEqual("Tag", fewer.entity);
  }

  @TestMethod
  public throwsWhenTwoEntitiesShareATable(): void {
    const builder = ModelFactoryTests.blogBuilder();
    builder.entity(Profile).toTable("Author");

    const exception = Assert.throws(() => builder.build(new BlogSnapshot()), TableMappedTwiceException);

    Assert.areEqual("Author", exception.table);
  }

  @TestMethod
  public throwsWhenTwoPropertiesShareAColumn(): void {
    const builder = ModelFactoryTests.blogBuilder();
    builder.entity(Post).property(t => t.title).hasColumnName("body");

    const exception = Assert.throws(() => builder.build(new BlogSnapshot()), ColumnMappedTwiceException);

    Assert.areEqual("Post", exception.table);
    Assert.areEqual("body", exception.column);
  }

  @TestMethod
  public throwsWhenAConfiguredColumnNamesNoProperty(): void {
    const builder = ModelFactoryTests.blogBuilder();
    builder.entity(Post).property(t => t.author).hasColumnName("writer");

    const exception = Assert.throws(() => builder.build(new BlogSnapshot()), EntityPropertyMissingException);

    Assert.areEqual("Post", exception.entity);
    Assert.areEqual("author", exception.property);
  }

  @TestMethod
  public throwsWhenAConfiguredKeyNamesNoProperty(): void {
    const builder = ModelFactoryTests.blogBuilder();
    builder.entity(Post).hasKey(t => t.tags);

    const exception = Assert.throws(() => builder.build(new BlogSnapshot()), EntityPropertyMissingException);

    Assert.areEqual("tags", exception.property);
  }

  @TestMethod
  public throwsWhenAnEntityHasNoKey(): void {
    class Label {
      public text: string = "";
    }
    const builder = new ModelBuilder();
    builder.entity(Label);

    const exception = Assert.throws(() => builder.build(new ShapeSnapshot(t => t.entity("Label").property("text", PropertyType.String))), EntityKeyMissingException);

    Assert.areEqual("Label", exception.entity);
  }

  @TestMethod
  public throwsWhenANavigationLeadsToAnUnmappedEntity(): void {
    class Note {
      public id: number = 0;
      public book: object | null = null;
    }
    const builder = new ModelBuilder();
    builder.entity(Note);

    const exception = Assert.throws(() => builder.build(new ShapeSnapshot(t => t.entity("Note").property("id", PropertyType.Integer).reference("book", "Book"))),
      RelationTargetUnmappedException);

    Assert.areEqual("Note", exception.entity);
    Assert.areEqual("book", exception.navigation);
    Assert.areEqual("Book", exception.target);
  }

  @TestMethod
  public throwsWhenAReferenceHasNoForeignKey(): void {
    class Owner {
      public id: number = 0;
    }
    class Pet {
      public id: number = 0;
      public owner: Owner | null = null;
    }
    const builder = new ModelBuilder();
    builder.entity(Owner);
    builder.entity(Pet);

    const exception = Assert.throws(() => builder.build(new ShapeSnapshot(t => {
      t.entity("Owner").property("id", PropertyType.Integer);
      t.entity("Pet").property("id", PropertyType.Integer).reference("owner", "Owner");
    })), EntityPropertyMissingException);

    Assert.areEqual("Pet", exception.entity);
    Assert.areEqual("ownerid", exception.property);
  }

  @TestMethod
  public throwsWhenAConfiguredForeignKeyNamesNoProperty(): void {
    const builder = ModelFactoryTests.blogBuilder();
    builder.entity(Post).hasOne(t => t.author).hasForeignKey(t => t.tags);

    const exception = Assert.throws(() => builder.build(new BlogSnapshot()), EntityPropertyMissingException);

    Assert.areEqual("Post", exception.entity);
    Assert.areEqual("tags", exception.property);
  }

  @TestMethod
  public throwsWhenACollectionsDependentHasNoForeignKey(): void {
    class Shelf {
      public id: number = 0;
      public books: object[] = [];
    }
    class Book {
      public id: number = 0;
    }
    const builder = new ModelBuilder();
    builder.entity(Shelf);
    builder.entity(Book);

    const exception = Assert.throws(() => builder.build(new ShapeSnapshot(t => {
      t.entity("Shelf").property("id", PropertyType.Integer).collection("books", "Book");
      t.entity("Book").property("id", PropertyType.Integer);
    })), EntityPropertyMissingException);

    Assert.areEqual("Book", exception.entity);
    Assert.areEqual("Shelfid", exception.property);
  }

  @TestMethod
  public throwsWhenAForeignKeyDiffersFromItsPrincipalsKey(): void {
    const counted = ModelFactoryTests.blogBuilder();
    counted.entity(Post).hasOne(t => t.author).hasForeignKey(t => t.authorId, t => t.id);
    const typed = ModelFactoryTests.blogBuilder();
    typed.entity(Post).hasOne(t => t.author).hasForeignKey(t => t.title);

    const count = Assert.throws(() => counted.build(new BlogSnapshot()), ForeignKeyMismatchException);
    const type = Assert.throws(() => typed.build(new BlogSnapshot()), ForeignKeyMismatchException);

    Assert.areEqual("Post", count.entity);
    Assert.areEqual("author", count.navigation);
    Assert.areEqual("author", type.navigation);
  }

  @TestMethod
  public throwsWhenACollectionsForeignKeyDiffersFromItsPrincipalsKey(): void {
    class Shelf {
      public id: number = 0;
      public books: object[] = [];
    }
    class Book {
      public id: number = 0;
      public shelfId: string = "";
    }
    const builder = new ModelBuilder();
    builder.entity(Shelf);
    builder.entity(Book);

    const exception = Assert.throws(() => builder.build(new ShapeSnapshot(t => {
      t.entity("Shelf").property("id", PropertyType.Integer).collection("books", "Book");
      t.entity("Book").property("id", PropertyType.Integer).property("shelfId", PropertyType.String);
    })), ForeignKeyMismatchException);

    Assert.areEqual("Shelf", exception.entity);
    Assert.areEqual("books", exception.navigation);
  }

  @TestMethod
  public throwsWhenAPrincipalHasTwoNavigationsBack(): void {
    class Person {
      public id: number = 0;
      public sent: object[] = [];
      public received: object[] = [];
    }
    class Letter {
      public id: number = 0;
      public senderId: number = 0;
      public sender: Person | null = null;
    }
    const builder = new ModelBuilder();
    builder.entity(Person);
    builder.entity(Letter);

    const exception = Assert.throws(() => builder.build(new ShapeSnapshot(t => {
      t.entity("Person").property("id", PropertyType.Integer).collection("sent", "Letter").collection("received", "Letter");
      t.entity("Letter").property("id", PropertyType.Integer).property("senderId", PropertyType.Integer).reference("sender", "Person");
    })), AmbiguousRelationException);

    Assert.areEqual("Letter", exception.entity);
    Assert.areEqual("sender", exception.navigation);
  }

  @TestMethod
  public throwsWhenTwoReferencesShareTheirNavigationBack(): void {
    class Person {
      public id: number = 0;
      public letters: object[] = [];
    }
    class Letter {
      public id: number = 0;
      public senderId: number = 0;
      public recipientId: number = 0;
      public sender: Person | null = null;
      public recipient: Person | null = null;
    }
    const builder = new ModelBuilder();
    builder.entity(Person);
    builder.entity(Letter);

    const exception = Assert.throws(() => builder.build(new ShapeSnapshot(t => {
      t.entity("Person").property("id", PropertyType.Integer).collection("letters", "Letter");
      t.entity("Letter").property("id", PropertyType.Integer).property("senderId", PropertyType.Integer).property("recipientId", PropertyType.Integer)
        .reference("sender", "Person").reference("recipient", "Person");
    })), AmbiguousRelationException);

    Assert.areEqual("recipient", exception.navigation);
  }

  private static blogBuilder(): ModelBuilder {
    const builder = new ModelBuilder();
    builder.entity(Author);
    builder.entity(Post);
    builder.entity(Profile);
    builder.entity(Tag);

    return builder;
  }

  private static describe(model: Model): string {
    return String.join("\n", model.entityTypes.select(entity => {
      const properties = String.join(", ", entity.properties.select(t => `${t.columnName}:${t.type}${t.isRequired ? "" : "?"}`));
      const relations = entity.relations.select(t => `; ${t.kind} ${t.navigation} -> ${t.principal.name}.${t.inverseNavigation} [${String.join(",", t.foreignKey.select(p => p.name))}]`);

      return `${entity.tableName}(${properties}) key ${String.join(",", entity.key.select(t => t.name))}${String.join("", relations)}`;
    }));
  }
}
