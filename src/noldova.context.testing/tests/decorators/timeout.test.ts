/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ArgumentOutOfRangeException } from "@noldova/context.exceptions";
import { Assert, TestClass, TestData, TestDiscovery, TestingException, TestMethod, Timeout } from "@noldova/context.testing";

@TestClass
export class TimeoutDecoratorTests {
  @TestData(0)
  @TestData(-1)
  @TestData(1.5)
  @TestData(2_147_483_398)
  @TestMethod
  public aLimitThatIsNotAPositiveIntegerWithinTheTimerLimitIsRejected(timeoutMilliseconds: number): void {
    Assert.throws(() => {
      Timeout(timeoutMilliseconds);
    }, ArgumentOutOfRangeException);
  }

  @TestMethod
  public aMethodsLimitIsDiscoveredForEachOfItsRowsAndNoOtherMethod(): void {
    @TestClass
    class SampleTests {
      @Timeout(2_147_483_397)
      @TestData(1)
      @TestData(2)
      @TestMethod
      public waits(_value: number): void { }

      @TestMethod
      public passes(): void { }
    }

    const methods = new TestDiscovery().discoverModuleExports({ SampleTests }, "sample.test.js", "Sample")[0]?.methods ?? [];

    Assert.areEqual("passes:undefined,waits[0]:2147483397,waits[1]:2147483397",
      methods.map(t => `${t.displayName}:${String(t.timeoutMilliseconds)}`).join());
  }

  @TestData(true)
  @TestData(false)
  @TestMethod
  public aLimitOnAClassIsRejected(isMarked: boolean): void {
    class SampleTests {
      @TestMethod
      public passes(): void { }
    }
    if (isMarked)
      TestClass(SampleTests);
    Timeout(500)(SampleTests);

    const failure = Assert.throws(() => {
      new TestDiscovery().discoverModuleExports({ SampleTests }, "sample.test.js", "Sample");
    }, TestingException);

    Assert.areEqual('Export "SampleTests" in "sample.test.js" carries @Timeout, which only a method marked with @TestMethod can carry.', failure.message);
  }

  @TestMethod
  public aLimitOnAnUnmarkedMethodIsRejected(): void {
    @TestClass
    class SampleTests {
      @TestMethod
      public passes(): void { }

      @Timeout(500)
      public helps(): void { }
    }

    const failure = Assert.throws(() => {
      new TestDiscovery().discoverModuleExports({ SampleTests }, "sample.test.js", "Sample");
    }, TestingException);

    Assert.areEqual('Method "helps" of "SampleTests" in "sample.test.js" carries @Timeout but is not marked with @TestMethod.', failure.message);
  }

  @TestMethod
  public aLimitOnAStaticMethodIsRejected(): void {
    @TestClass
    class SampleTests {
      @Timeout(500)
      public static helps(): void { }

      @TestMethod
      public passes(): void { }
    }

    const failure = Assert.throws(() => {
      new TestDiscovery().discoverModuleExports({ SampleTests }, "sample.test.js", "Sample");
    }, TestingException);

    Assert.areEqual('Static method "helps" of "SampleTests" in "sample.test.js" cannot carry test metadata; mark instance methods only.', failure.message);
  }

  @TestData("slow")
  @TestData(0)
  @TestMethod
  public aCorruptLimitMarkFailsDiscovery(mark: unknown): void {
    const marked = (): void => { };
    Timeout(500)(marked);
    const timeoutMark = Object.getOwnPropertySymbols(marked)[0];
    Assert.isDefined(timeoutMark);
    @TestClass
    class CorruptTests {
      @TestMethod
      public passes(): void { }
    }
    Object.defineProperty(CorruptTests.prototype.passes, timeoutMark, { value: mark });

    const failure = Assert.throws(() => {
      new TestDiscovery().discoverModuleExports({ CorruptTests }, "sample.test.js", "Sample");
    }, TestingException);

    Assert.areEqual("A timeout mark must carry a positive integer of milliseconds within the timer limit.", failure.message);
  }
}
