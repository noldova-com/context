/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as api from "@noldova/context";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class ContextApiTests {
  @TestMethod
  public exportsTheCompleteCatalog(): void {
    Assert.areEqual("Command,CommandCollisionException,CommandContext,CommandHost,CommandHostException,CommandOutput,CommandUnknownException,ConsoleOutput," +
      "Project,ProjectEntryPoint,ProjectFileException,ProjectKind,ProviderException", Object.keys(api).sort().join(","));
  }
}
