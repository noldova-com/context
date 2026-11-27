/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { List } from "@noldova/context.collections";
import { PropertyType, type SnapshotEntity } from "@noldova/context.data";
import { SnapshotWriter } from "@noldova/context.data.tools/services/snapshot-writer.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { RecordedSnapshot } from "../fixtures/recorded-snapshot.fixture.js";

@TestClass
export class SnapshotWriterTests {
  @TestMethod
  public writesEachEntityWithOnlyTheNamesThatDifferFromItsDefaults(): void {
    const snapshot = new RecordedSnapshot(builder => {
      builder.entity("Author").toTable("authors")
        .property("id", PropertyType.Integer)
        .optionalProperty("name", PropertyType.String, "full_name")
        .hasKey("id")
        .collection("posts", "Post");
      builder.entity("Post")
        .property("id", PropertyType.Integer)
        .property("authorId", PropertyType.Integer, "author_id")
        .hasKey("id")
        .hasForeignKey("Author", "authorId")
        .reference("author", "Author");
    });

    Assert.areEqual([
      "import { ModelSnapshot, PropertyType, type SnapshotBuilder } from \"@noldova/context.data\";",
      "",
      "export class BlogContextModelSnapshot extends ModelSnapshot {",
      "  protected override buildModel(builder: SnapshotBuilder): void {",
      "    builder.entity(\"Author\")",
      "      .toTable(\"authors\")",
      "      .property(\"id\", PropertyType.Integer)",
      "      .optionalProperty(\"name\", PropertyType.String, \"full_name\")",
      "      .hasKey(\"id\")",
      "      .collection(\"posts\", \"Post\");",
      "    builder.entity(\"Post\")",
      "      .property(\"id\", PropertyType.Integer)",
      "      .property(\"authorId\", PropertyType.Integer, \"author_id\")",
      "      .hasKey(\"id\")",
      "      .hasForeignKey(\"Author\", \"authorId\")",
      "      .reference(\"author\", \"Author\");",
      "  }",
      "}",
      ""
    ].join("\n"), SnapshotWriter.write("BlogContextModelSnapshot", snapshot.toEntities()));
  }

  @TestMethod
  public importsNoPropertyTypeWhenNoEntityHasAProperty(): void {
    const snapshot = new RecordedSnapshot(builder => builder.entity("Marker"));

    Assert.areEqual([
      "import { ModelSnapshot, type SnapshotBuilder } from \"@noldova/context.data\";",
      "",
      "export class MarkerModelSnapshot extends ModelSnapshot {",
      "  protected override buildModel(builder: SnapshotBuilder): void {",
      "    builder.entity(\"Marker\");",
      "  }",
      "}",
      ""
    ].join("\n"), SnapshotWriter.write("MarkerModelSnapshot", snapshot.toEntities()));
  }

  @TestMethod
  public writesAnEmptyModelWithAnUnusedBuilder(): void {
    Assert.areEqual([
      "import { ModelSnapshot, type SnapshotBuilder } from \"@noldova/context.data\";",
      "",
      "export class EmptyModelSnapshot extends ModelSnapshot {",
      "  protected override buildModel(_builder: SnapshotBuilder): void { }",
      "}",
      ""
    ].join("\n"), SnapshotWriter.write("EmptyModelSnapshot", new List<SnapshotEntity>().asReadOnly()));
  }
}
