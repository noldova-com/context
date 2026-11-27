/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { PropertyType } from "@noldova/context.data";
import { SnapshotEntityBuilder } from "@noldova/context.data/models/snapshots/snapshot-entity-builder.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class SnapshotEntityBuilderTests {
  @TestMethod
  public recordsPropertiesInOrderMarkingTheOptionalOnes(): void {
    const entity = new SnapshotEntityBuilder("Post")
      .property("id", PropertyType.Integer)
      .optionalProperty("body", PropertyType.String)
      .toEntity();

    Assert.areEqual("Post", entity.name);
    Assert.areEqual("id:Integer:false,body:String:true", String.join(",", entity.properties.select(t => `${t.name}:${t.type}:${t.isOptional}`)));
  }

  @TestMethod
  public mapsEachPropertyToItsNameUnlessGivenAColumn(): void {
    const entity = new SnapshotEntityBuilder("Post")
      .property("id", PropertyType.Integer)
      .property("authorId", PropertyType.Integer, "author_id")
      .optionalProperty("body", PropertyType.String, "post_body")
      .optionalProperty("title", PropertyType.String)
      .toEntity();

    Assert.areEqual("id,author_id,post_body,title", String.join(",", entity.properties.select(t => t.columnName)));
  }

  @TestMethod
  public mapsToTheTableRecordedOrElseToItsName(): void {
    Assert.areEqual("posts", new SnapshotEntityBuilder("Post").toTable("posts").toEntity().tableName);
    Assert.areEqual("Post", new SnapshotEntityBuilder("Post").toEntity().tableName);
  }

  @TestMethod
  public recordsTheKeyInOrderKeepingOnlyTheLast(): void {
    const entity = new SnapshotEntityBuilder("Visit").hasKey("id").hasKey("siteId", "day").toEntity();

    Assert.areEqual("siteId,day", String.join(",", entity.key));
  }

  @TestMethod
  public recordsForeignKeysInOrder(): void {
    const entity = new SnapshotEntityBuilder("Post")
      .hasForeignKey("Author", "authorId")
      .hasForeignKey("Region", "regionCode", "regionYear")
      .toEntity();

    Assert.areEqual("Author:authorId,Region:regionCode+regionYear", String.join(",", entity.foreignKeys.select(t => `${t.principal}:${String.join("+", t.properties)}`)));
  }

  @TestMethod
  public recordsNavigationsInOrderMarkingTheCollections(): void {
    const entity = new SnapshotEntityBuilder("Post")
      .reference("author", "Author")
      .collection("tags", "Tag")
      .toEntity();

    Assert.areEqual("author:Author:false,tags:Tag:true", String.join(",", entity.navigations.select(t => `${t.name}:${t.target}:${t.isCollection}`)));
  }

  @TestMethod
  public recordsNothingUntilAsked(): void {
    const entity = new SnapshotEntityBuilder("Tag").toEntity();

    Assert.areEqual(0, entity.properties.count());
    Assert.areEqual(0, entity.key.count());
    Assert.areEqual(0, entity.foreignKeys.count());
    Assert.areEqual(0, entity.navigations.count());
  }
}
