/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptDeclarationListHolder } from "@noldova/context.parsers.typescript/enums/typescript-declaration-list-holder.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptDeclarationListHolderTests {
  @TestMethod
  public namesEachPlaceADeclarationListIsWritten(): void {
    Assert.areEqual("Statement", TypeScriptDeclarationListHolder.Statement);
    Assert.areEqual("ForHeader", TypeScriptDeclarationListHolder.ForHeader);
    Assert.areEqual("ForInOrOfHeader", TypeScriptDeclarationListHolder.ForInOrOfHeader);
  }
}
