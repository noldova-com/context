/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Dictionary, List } from "@noldova/context.collections";
import { PropertyType } from "@noldova/context.data";
import { EntityDraft } from "@noldova/context.data/models/entities/entity-draft.js";
import { EntityProperty } from "@noldova/context.data/models/entities/entity-property.js";
import { EntityTypeDefinition } from "@noldova/context.data/models/entities/entity-type-definition.js";
import { SnapshotEntity } from "@noldova/context.data/models/snapshots/snapshot-entity.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { Tag } from "../../fixtures/tag.fixture.js";

@TestClass
export class EntityDraftTests {
  @TestMethod
  public keepsWhatItWasGivenAndTakesItsNameFromItsSnapshot(): void {
    const definition = new EntityTypeDefinition(Tag);
    const snapshot = new SnapshotEntity("Tag", "Tag", [], [], [], []);
    const id = new EntityProperty("id", PropertyType.Integer, "id", true);
    const properties = new Dictionary<string, EntityProperty>();
    properties.set("id", id);
    const key = new List([id]).asReadOnly();

    const draft = new EntityDraft(definition, snapshot, properties.asReadOnly(), key);

    Assert.areEqual(definition, draft.definition);
    Assert.areEqual(snapshot, draft.snapshot);
    Assert.areEqual(id, draft.properties.tryGet("id"));
    Assert.areEqual(key, draft.key);
    Assert.areEqual("Tag", draft.name);
  }

  @TestMethod
  public startsWithNoRelations(): void {
    const draft = new EntityDraft(new EntityTypeDefinition(Tag), new SnapshotEntity("Tag", "Tag", [], [], [], []), new Dictionary<string, EntityProperty>().asReadOnly(),
      new List<EntityProperty>().asReadOnly());

    Assert.areEqual(0, draft.relations.count());
  }
}
