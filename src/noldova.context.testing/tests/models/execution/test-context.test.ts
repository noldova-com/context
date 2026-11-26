/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ArgumentException, InvalidOperationException } from "@noldova/context.exceptions";
import {
  Assert,
  DiscoveredTestClass,
  DiscoveredTestMethod,
  TestContext,
  TestClass,
  TestExecutor,
  TestingException,
  TestMethod,
  TestMethodResult,
  TestOutcome
} from "@noldova/context.testing";

import { AttachingFixture } from "../../fixtures/execution/attaching-fixture.fixture.js";

@TestClass
export class TestContextTests {
  @TestMethod
  public async carriesEachAttachmentInTheOrderAttachedAsync(): Promise<void> {
    const result = await TestContextTests.executeAsync("attachesTwoValues");

    Assert.areEqual(TestOutcome.Passed, result.outcome);
    Assert.areEqual("ratio=1.234,count=3", [...result.attachments].map(t => `${t.key}=${t.value}`).join());
  }

  @TestMethod
  public async followsTheTestAcrossItsAwaitsAsync(): Promise<void> {
    const result = await TestContextTests.executeAsync("attachesAfterAnAwaitAsync");

    Assert.areEqual("2.5", result.attachments.get("ratio"));
  }

  @TestMethod
  public async keepsTheAttachmentsOfAFailedTestAsync(): Promise<void> {
    const result = await TestContextTests.executeAsync("attachesThenFails");

    Assert.areEqual(TestOutcome.Failed, result.outcome);
    Assert.areEqual("9.9", result.attachments.get("ratio"));
  }

  @TestMethod
  public async givesEachTestAContextOfItsOwnAsync(): Promise<void> {
    const testClass = new DiscoveredTestClass("TestPackage", "AttachingFixtureTests", "inline://attaching", AttachingFixture, undefined, [
      new DiscoveredTestMethod("attachesTwoValues", undefined, [], undefined),
      new DiscoveredTestMethod("attachesNothing", undefined, [], undefined),
    ]);

    const [, second] = (await new TestExecutor(5000).executeAsync([testClass]))[0]?.methodResults ?? [];

    Assert.areEqual(TestOutcome.Passed, second?.outcome);
    Assert.areEqual(0, second?.attachments.count());
  }

  @TestMethod
  public async rejectsANameAttachedTwiceAsync(): Promise<void> {
    const result = await TestContextTests.executeAsync("attachesANameTwice");

    Assert.isInstanceOf(result.failure, ArgumentException);
    Assert.areEqual("The test already has an attachment named \"ratio\". (Parameter 'name')", result.failure.message);
    Assert.areEqual("1", result.attachments.get("ratio"));
  }

  @TestMethod
  public async rejectsABlankNameAsync(): Promise<void> {
    const result = await TestContextTests.executeAsync("attachesABlankName");

    Assert.isInstanceOf(result.failure, ArgumentException);
    Assert.areEqual(0, result.attachments.count());
  }

  @TestMethod
  public async rejectsAValueThatIsNotTextAsync(): Promise<void> {
    const result = await TestContextTests.executeAsync("attachesItsValue", [1.234]);

    Assert.isInstanceOf(result.failure, ArgumentException);
    Assert.areEqual("An attachment's value must be text. (Parameter 'value')", result.failure.message);
    Assert.areEqual(0, result.attachments.count());
  }

  @TestMethod
  public async rejectsReadingTheContextOutsideATestAsync(): Promise<void> {
    const result = await TestContextTests.executeAsync("readsTheContextOutsideTestExecution");

    Assert.isInstanceOf(result.failure, TestingException);
    Assert.areEqual("No test is running here, so there is no test context.", result.failure.message);
  }

  @TestMethod
  public async rejectsAnAttachmentOnceTheTestEndedAsync(): Promise<void> {
    const contexts: TestContext[] = [];
    await TestContextTests.executeAsync("keepsItsContext", [contexts]);
    const [context] = contexts;
    Assert.isDefined(context);

    const failure = Assert.throws(() => context.addAttachment("late", "1"), InvalidOperationException);

    Assert.areEqual("The test already ended, so it takes no more attachments.", failure.message);
    Assert.areEqual(0, context.attachments.count());
  }

  private static async executeAsync(methodName: string, testData: unknown[] = []): Promise<TestMethodResult> {
    const testClass = new DiscoveredTestClass("TestPackage", "AttachingFixtureTests", "inline://attaching", AttachingFixture, undefined,
      [new DiscoveredTestMethod(methodName, testData.length > 0 ? 0 : undefined, testData, undefined)]);
    const result = (await new TestExecutor(5000).executeAsync([testClass]))[0]?.methodResults[0];
    Assert.isDefined(result);

    return result;
  }
}
