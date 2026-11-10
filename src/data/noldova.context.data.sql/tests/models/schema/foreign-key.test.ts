/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ForeignKey } from "@noldova/context.data.sql";
import { ArgumentException } from "@noldova/context.exceptions";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class ForeignKeyTests {
  @TestMethod
  public referencesAPrincipalColumn(): void {
    const key = new ForeignKey("projectId", "projects", "id");

    Assert.areEqual("projectId", key.column);
    Assert.areEqual("projects", key.principalTable);
    Assert.areEqual("id", key.principalColumn);
  }

  @TestMethod
  public rejectsBlankParts(): void {
    Assert.areEqual("column", Assert.throws(() => new ForeignKey(" ", "projects", "id"), ArgumentException).parameterName);
    Assert.areEqual("principalTable", Assert.throws(() => new ForeignKey("projectId", "", "id"), ArgumentException).parameterName);
    Assert.areEqual("principalColumn", Assert.throws(() => new ForeignKey("projectId", "projects", " "), ArgumentException).parameterName);
  }
}
