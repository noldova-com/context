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
    Assert.isFalse(new TestFileTiming("Sample/a.test.js", 1200, 1200, 1200, false).isOver);
    Assert.isTrue(new TestFileTiming("Sample/a.test.js", 1201, 1200, 1200, false).isOver);
  }

  @TestMethod
  public isOverWhenNoRunRanIt(): void {
    const timing = new TestFileTiming("Sample/gone.test.js", undefined, 3000, 1200, true);

    Assert.isTrue(timing.isOver);
    Assert.isTrue(timing.isListed);
    Assert.isFalse(timing.isStale);
    Assert.isUndefined(timing.medianMilliseconds);
    Assert.areEqual("Over: Sample/gone.test.js, median not run, limit 3000 ms.", timing.format());
  }

  @TestMethod
  public isStaleWhenListedButWithinTheTimeAnUnlistedFileMayTake(): void {
    const stale = new TestFileTiming("Sample/fast.test.js", 1200, 3000, 1200, true);
    const slower = new TestFileTiming("Sample/slow.test.js", 1201, 3000, 1200, true);
    const unlisted = new TestFileTiming("Sample/a.test.js", 900, 1200, 1200, false);

    Assert.areEqual("true,false,false", [stale.isStale, slower.isStale, unlisted.isStale].join());
    Assert.areEqual("Stale: Sample/fast.test.js, median 1200 ms, within the 1200 ms an unlisted file may take on this machine; "
      + "the list drops it once it is stale on every machine the list was measured on.", stale.format());
    Assert.areEqual("Within: Sample/slow.test.js, median 1201 ms, limit 3000 ms.", slower.format());
    Assert.areEqual("Within: Sample/a.test.js, median 900 ms, limit 1200 ms.", unlisted.format());
  }
}
