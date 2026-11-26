/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { AsyncResource } from "node:async_hooks";

import { Assert, TestContext } from "@noldova/context.testing";

export class AttachingFixture {
  private static readonly OUTSIDE_TEST_EXECUTION: AsyncResource = new AsyncResource("outside-test-execution");

  public attachesTwoValues(): void {
    TestContext.current.addAttachment("ratio", "1.234");
    TestContext.current.addAttachment("count", "3");
  }

  public async attachesAfterAnAwaitAsync(): Promise<void> {
    await Promise.resolve();
    TestContext.current.addAttachment("ratio", "2.5");
  }

  public attachesThenFails(): void {
    TestContext.current.addAttachment("ratio", "9.9");
    Assert.fail("The ratio is too high.");
  }

  public attachesNothing(): void {
    Assert.areEqual(0, TestContext.current.attachments.count());
  }

  public attachesANameTwice(): void {
    TestContext.current.addAttachment("ratio", "1");
    TestContext.current.addAttachment("ratio", "2");
  }

  public attachesABlankName(): void {
    TestContext.current.addAttachment(" ", "1");
  }

  public readsTheContextOutsideTestExecution(): void {
    AttachingFixture.OUTSIDE_TEST_EXECUTION.runInAsyncScope(() => TestContext.current);
  }

  public keepsItsContext(contexts: TestContext[]): void {
    contexts.push(TestContext.current);
  }
}
