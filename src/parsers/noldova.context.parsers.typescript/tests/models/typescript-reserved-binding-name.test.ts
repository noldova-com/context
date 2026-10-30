/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import { TypeScriptIdentifierNode } from "@noldova/context.parsers.typescript";
import { TypeScriptNameReservation } from "@noldova/context.parsers.typescript/enums/typescript-name-reservation.js";
import { TypeScriptReservedBindingName } from "@noldova/context.parsers.typescript/models/typescript-reserved-binding-name.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptReservedBindingNameTests {
  @TestMethod
  public keepsEachFactInItsRole(): void {
    const nameNode = new TypeScriptIdentifierNode("await", new SourceSpan(0, 5));
    const reservedName = new TypeScriptReservedBindingName(nameNode, TypeScriptNameReservation.Await, true, false, true);

    Assert.areEqual(nameNode, reservedName.nameNode);
    Assert.areEqual(TypeScriptNameReservation.Await, reservedName.reservation);
    Assert.isTrue(reservedName.hasEnclosingClass);
    Assert.isFalse(reservedName.isAwaitContext);
    Assert.isTrue(reservedName.isSourceTopLevel);
  }
}
