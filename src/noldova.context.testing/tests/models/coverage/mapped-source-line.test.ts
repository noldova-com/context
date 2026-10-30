/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ArgumentException } from "@noldova/context.exceptions";
import { Assert, MappedSourceLine, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class MappedSourceLineTests {
  @TestMethod
  public carriesTheMappedSourceLine(): void {
    const position = new MappedSourceLine("src/sample.ts", 12);

    Assert.areEqual("src/sample.ts", position.sourcePath);
    Assert.areEqual(12, position.line);
  }

  @TestMethod
  public rejectsANonPositiveLine(): void {
    Assert.throws(() => new MappedSourceLine("src/sample.ts", 0), ArgumentException);
  }
}
