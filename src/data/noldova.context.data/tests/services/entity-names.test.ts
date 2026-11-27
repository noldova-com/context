/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { List } from "@noldova/context.collections";
import { EntityNames } from "@noldova/context.data/services/entity-names.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class EntityNamesTests {
  @TestMethod
  public findsANameInAnyLetterCasePreferringItsOwn(): void {
    const names = new List(["NoteId", "noteid", "title"]);

    Assert.areEqual("noteid", EntityNames.find(names, "noteid"));
    Assert.areEqual("NoteId", EntityNames.find(names, "NOTEID"));
    Assert.areEqual("title", EntityNames.find(names, "Title"));
    Assert.isUndefined(EntityNames.find(names, "body"));
  }
}
