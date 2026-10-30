/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptNameReservation } from "@noldova/context.parsers.typescript/enums/typescript-name-reservation.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptNameReservationTests {
  @TestMethod
  public namesEachWayANameIsReserved(): void {
    Assert.areEqual("None", TypeScriptNameReservation.None);
    Assert.areEqual("Strict", TypeScriptNameReservation.Strict);
    Assert.areEqual("Await", TypeScriptNameReservation.Await);
    Assert.areEqual("EvalOrArguments", TypeScriptNameReservation.EvalOrArguments);
  }
}
