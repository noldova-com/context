/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import { DataToolsException } from "@noldova/context.data.tools";
import { SourceClass } from "@noldova/context.data.tools/models/sources/source-class.js";
import { ContextLocator } from "@noldova/context.data.tools/services/context-locator.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

@TestClass
export class ContextLocatorTests {
  @TestMethod
  public findsTheOneClassThatExtendsDbContextDirectlyOrThroughASourceClass(): void {
    const through = ContextLocator.locate([ContextLocatorTests.of("Note", null), ContextLocatorTests.of("BaseContext", "Unknown"),
      ContextLocatorTests.of("NotesContext", "AppContext"), ContextLocatorTests.of("AppContext", "Root"), ContextLocatorTests.of("Root", "DbContext")], "NotesContext");
    const direct = ContextLocator.locate([ContextLocatorTests.of("Note", null), ContextLocatorTests.of("NotesContext", "DbContext")], null);

    Assert.areEqual("NotesContext", through.name);
    Assert.areEqual("NotesContext", direct.name);
  }

  @TestMethod
  @TestData(null, "No class in the project's sources extends DbContext.")
  @TestData("Missing", "No class named \"Missing\" in the project's sources extends DbContext.")
  public failsWhenNoClassExtendsDbContext(name: string | null, message: string): void {
    const classes = [ContextLocatorTests.of("Note", null), ContextLocatorTests.of("A", "B"), ContextLocatorTests.of("B", "A"),
      ContextLocatorTests.of("Twice", "Shared"), ContextLocatorTests.of("Shared", null), ContextLocatorTests.of("Shared", null)];

    Assert.areEqual(message, Assert.throws(() => ContextLocator.locate(classes, name), DataToolsException).message);
  }

  @TestMethod
  @TestData(null, "NotesContext (src/NotesContext.ts), TagsContext (src/TagsContext.ts)")
  @TestData("NotesContext", "NotesContext (src/NotesContext.ts), NotesContext (src/NotesContext.ts)")
  public failsWhenMoreThanOneClassExtendsDbContext(name: string | null, contexts: string): void {
    const classes = Object.isNull(name)
      ? [ContextLocatorTests.of("NotesContext", "DbContext"), ContextLocatorTests.of("TagsContext", "DbContext")]
      : [ContextLocatorTests.of("NotesContext", "DbContext"), ContextLocatorTests.of("NotesContext", "DbContext")];

    Assert.areEqual(`More than one class extends DbContext: ${contexts}; name one with --context.`,
      Assert.throws(() => ContextLocator.locate(classes, name), DataToolsException).message);
  }

  private static of(name: string, baseName: string | null): SourceClass {
    return new SourceClass(name, `src/${name}.ts`, baseName, []);
  }
}
