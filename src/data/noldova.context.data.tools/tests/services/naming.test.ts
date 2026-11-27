/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Naming } from "@noldova/context.data.tools/services/naming.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

@TestClass
export class NamingTests {
  @TestMethod
  @TestData("NotesContext", "notes-context")
  @TestData("AddNotes", "add-notes")
  @TestData("AddHTMLField", "add-html-field")
  @TestData("Add2Tables", "add2-tables")
  @TestData("V2", "v2")
  @TestData("Notes", "notes")
  public writesAPascalCaseNameInKebabCase(name: string, expected: string): void {
    Assert.areEqual(expected, Naming.toKebabCase(name));
  }
}
