/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { PropertyType } from "@noldova/context.data";
import { DataToolsException, EntityPropertyTypeException } from "@noldova/context.data.tools";
import { EntityTypeReader } from "@noldova/context.data.tools/services/entity-type.reader.js";
import { SourceClassReader } from "@noldova/context.data.tools/services/source-class.reader.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

@TestClass
export class EntityTypeReaderTests {
  @TestMethod
  public mapsPropertiesAndNavigationsIncludingTheBaseClasses(): void {
    const classes = SourceClassReader.read([
      "class Root { public id: number = 0; }",
      "class Entry extends Root { public createdAt: string = \"\"; }",
      "class Note extends Entry {",
      "  public title: string = \"\";",
      "  public rank: number | null = null;",
      "  public body: (null | string) = null;",
      "  public owner: Owner | null = null;",
      "  public tags: Tag[] = [];",
      "}",
      "class Owner extends Missing { public id: number = 0; public notes: (Note)[] = []; }",
      "class Tag { public id: number = 0; }"
    ].join("\n"), "src/model.ts");

    const entities = EntityTypeReader.read(classes, ["Note", "Owner", "Tag"]);

    Assert.areEqual("Note,Owner,Tag", entities.map(t => t.name).join(","));
    Assert.areEqual(`id:${PropertyType.Integer}:false,createdAt:${PropertyType.String}:false,title:${PropertyType.String}:false,`
      + `rank:${PropertyType.Integer}:true,body:${PropertyType.String}:true`,
      entities[0]?.properties.map(t => `${t.name}:${t.type}:${t.isOptional}`).join(","));
    Assert.areEqual("owner>Owner,tags>Tag[]", entities[0]?.navigations.map(t => `${t.name}>${t.target}${t.isCollection ? "[]" : ""}`).join(","));
    Assert.areEqual("notes>Note[]", entities[1]?.navigations.map(t => `${t.name}>${t.target}${t.isCollection ? "[]" : ""}`).join(","));
  }

  @TestMethod
  @TestData("public value;")
  @TestData("public value?: string;")
  @TestData("public value: boolean = false;")
  @TestData("public value: string | number = 0;")
  @TestData("public value: Tag = new Tag();")
  @TestData("public value: Tag[] | null = null;")
  @TestData("public value: Unmapped | null = null;")
  @TestData("public value: Unmapped[] = [];")
  @TestData("public value: Map<string, Tag> | null = null;")
  @TestData("public value: Tag.Part | null = null;")
  @TestData("public value: null = null;")
  public failsForAPropertyTypeItCannotMap(declaration: string): void {
    const classes = SourceClassReader.read(`class Note { public id: number = 0; ${declaration} }\nclass Tag { public id: number = 0; }`, "src/model.ts");

    const exception = Assert.throws(() => EntityTypeReader.read(classes, ["Note", "Tag"]), EntityPropertyTypeException);

    Assert.areEqual("Note", exception.entity);
    Assert.areEqual("value", exception.property);
  }

  @TestMethod
  public failsForAnEntityWithNoSourceClass(): void {
    const exception = Assert.throws(() => EntityTypeReader.read([], ["Note"]), DataToolsException);

    Assert.areEqual("The context maps \"Note\", but no class of that name is in the project's sources.", exception.message);
  }

  @TestMethod
  public failsForAnEntityWithSeveralSourceClasses(): void {
    const classes = [...SourceClassReader.read("class Note { }", "src/a.ts"), ...SourceClassReader.read("class Note { }", "src/b.ts")];

    const exception = Assert.throws(() => EntityTypeReader.read(classes, ["Note"]), DataToolsException);

    Assert.areEqual("The context maps \"Note\", and more than one source class has that name: src/a.ts, src/b.ts.", exception.message);
  }
}
