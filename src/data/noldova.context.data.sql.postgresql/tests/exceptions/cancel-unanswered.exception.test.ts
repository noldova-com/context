/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { CancelUnansweredException } from "@noldova/context.data.sql.postgresql/exceptions/cancel-unanswered.exception.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class CancelUnansweredExceptionTests {
  @TestMethod
  public saysWhetherTheServerAnsweredNothingOrStayedSilent(): void {
    const unanswered = new CancelUnansweredException(5, false);
    const silent = new CancelUnansweredException(7, true);

    Assert.areEqual(
      "The server did not answer within the cancel timeout (5 seconds) after a query was canceled, so whether it ran is unknown.", unanswered.message);
    Assert.areEqual(5, unanswered.seconds);
    Assert.isFalse(unanswered.silent);
    Assert.areEqual(
      "The server sent nothing within the cancel timeout (7 seconds) while a canceled query waited, so whether it ran is unknown.", silent.message);
    Assert.areEqual(7, silent.seconds);
    Assert.isTrue(silent.silent);
    Assert.areEqual("CancelUnansweredException", silent.name);
  }
}
