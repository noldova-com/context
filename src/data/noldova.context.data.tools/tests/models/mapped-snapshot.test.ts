/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DbContext, PropertyType } from "@noldova/context.data";
import { EntityShape } from "@noldova/context.data.tools/models/shapes/entity-shape.js";
import { MappedSnapshot } from "@noldova/context.data.tools/models/shapes/mapped-snapshot.js";
import { NavigationShape } from "@noldova/context.data.tools/models/shapes/navigation-shape.js";
import { PropertyShape } from "@noldova/context.data.tools/models/shapes/property-shape.js";
import { ShapeSnapshot } from "@noldova/context.data.tools/models/shapes/shape-snapshot.js";
import { SnapshotWriter } from "@noldova/context.data.tools/services/snapshot-writer.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { BlogContext } from "../fixtures/blog-context.fixture.js";

@TestClass
export class MappedSnapshotTests {
  @TestMethod
  public recordsTheTablesColumnsKeysAndForeignKeysOfTheModelWithTheShapesNavigations(): void {
    const shapes = [
      new EntityShape("Author", [new PropertyShape("id", PropertyType.Integer, false), new PropertyShape("name", PropertyType.String, true)],
        [new NavigationShape("posts", "Post", true)]),
      new EntityShape("Post", [new PropertyShape("id", PropertyType.Integer, true), new PropertyShape("authorId", PropertyType.Integer, false)],
        [new NavigationShape("author", "Author", false)])
    ];
    const model = DbContext.createModelBuilder(BlogContext).build(new ShapeSnapshot(shapes));

    Assert.areEqual([
      "import { ModelSnapshot, PropertyType, type SnapshotBuilder } from \"@noldova/context.data\";",
      "",
      "export class BlogModelSnapshot extends ModelSnapshot {",
      "  protected override buildModel(builder: SnapshotBuilder): void {",
      "    builder.entity(\"Author\")",
      "      .toTable(\"authors\")",
      "      .property(\"id\", PropertyType.Integer)",
      "      .optionalProperty(\"name\", PropertyType.String)",
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
    ].join("\n"), SnapshotWriter.write("BlogModelSnapshot", new MappedSnapshot(model, shapes).toEntities()));
  }
}
