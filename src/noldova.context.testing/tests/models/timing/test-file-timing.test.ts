/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, TestClass, TestFileTiming, TestMethod } from "@noldova/context.testing";

@TestClass
export class TestFileTimingTests {
  @TestMethod
  public isOverOnlyAboveItsLimit(): void {
    Assert.isFalse(new TestFileTiming("Sample/a.test.js", 1200, 1200, false).isOver);
    Assert.isTrue(new TestFileTiming("Sample/a.test.js", 1201, 1200, false).isOver);
  }

  @TestMethod
  public isOverWhenNoRunRanIt(): void {
    const timing = new TestFileTiming("Sample/gone.test.js", undefined, 1200, true);

    Assert.isTrue(timing.isOver);
    Assert.isTrue(timing.isListed);
    Assert.isUndefined(timing.medianMilliseconds);
  }
}
