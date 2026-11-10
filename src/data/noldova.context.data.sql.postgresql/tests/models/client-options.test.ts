/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ClientOptions } from "@noldova/context.data.sql.postgresql/models/client-options.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class ClientOptionsTests {
  @TestMethod
  public spreadsTheDefaultLifetimeBetweenHalfAndOneHour(): void {
    const options = new ClientOptions();
    const lifetime = options.maxLifetime;

    Assert.isTrue(Object.isFunction(lifetime));
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const seconds = lifetime();
      Assert.isTrue(seconds >= 1800 && seconds <= 3600);
    }
  }

  @TestMethod
  public backsOffExponentiallyUpToTwentySeconds(): void {
    const backoff = new ClientOptions().backoff;

    Assert.isTrue(Object.isFunction(backoff));
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const first = backoff(0);
      const late = backoff(10);
      Assert.isTrue(first >= 0.005 && first <= 0.01);
      Assert.isTrue(late >= 10 && late <= 20);
    }
  }

  @TestMethod
  public keepsTheValuesItIsGiven(): void {
    const backoff = (retries: number): number => retries;
    const options = new ClientOptions({ max: 1, maxLifetime: null, backoff, scheduler: true });
    const fixed = new ClientOptions({ maxLifetime: 90, scheduler: false, backoff: 2 });

    Assert.isNull(options.maxLifetime);
    Assert.areEqual(backoff, options.backoff);
    Assert.isFalse(options.scheduler);
    Assert.areEqual(90, fixed.maxLifetime);
    Assert.areEqual(2, fixed.backoff);
    Assert.isFalse(fixed.scheduler);
    Assert.isTrue(new ClientOptions().scheduler);
  }
}
