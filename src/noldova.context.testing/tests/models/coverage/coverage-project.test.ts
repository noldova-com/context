/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ArgumentException } from "@noldova/context.exceptions";
import { Assert, CoverageProject, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class CoverageProjectTests {
  @TestMethod
  public storesTheExplicitIdentityAndDirectories(): void {
    const project = new CoverageProject("Sample", "production", "source");

    Assert.areEqual("Sample", project.name);
    Assert.areEqual("production", project.productionDirectory);
    Assert.areEqual("source", project.sourceDirectory);
  }

  @TestMethod
  public rejectsAWhitespaceName(): void {
    Assert.throws(() => new CoverageProject(" ", "production", "source"), ArgumentException);
  }

  @TestMethod
  public rejectsAWhitespaceProductionDirectory(): void {
    Assert.throws(() => new CoverageProject("Sample", " ", "source"), ArgumentException);
  }

  @TestMethod
  public rejectsAWhitespaceSourceDirectory(): void {
    Assert.throws(() => new CoverageProject("Sample", "production", " "), ArgumentException);
  }
}
