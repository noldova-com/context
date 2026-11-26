/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { InvalidOperationException } from "@noldova/context.exceptions";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";
import { CancellationCallbacksFailedException, CancellationTokenSource } from "@noldova/context.threading";

@TestClass
export class CancellationTokenSourceTests {
  @TestMethod
  public runsItsCallbacksLastRegisteredFirstOnce(): void {
    const source = new CancellationTokenSource();
    const ran: number[] = [];
    source.token.register(() => ran.push(1));
    source.token.register(() => ran.push(2));

    Assert.isFalse(source.isCancellationRequested);
    source.cancel();
    source.cancel();

    Assert.isTrue(source.isCancellationRequested);
    Assert.areEqual("2,1", ran.join(","));
  }

  @TestMethod
  public runsACallbackRegisteredAfterTheCancellationAtOnce(): void {
    const source = new CancellationTokenSource();
    source.cancel();
    let ran = false;

    const registration = source.token.register(() => {
      ran = true;
    });

    Assert.isTrue(ran);
    Assert.isFalse(registration.unregister());
  }

  @TestMethod
  public ignoresACancelFromItsOwnCallback(): void {
    const source = new CancellationTokenSource();
    let runs = 0;
    source.token.register(() => {
      runs++;
      source.cancel();
    });

    source.cancel();

    Assert.areEqual(1, runs);
  }

  @TestMethod
  public wrapsWhatItsOneFailingCallbackThrewAfterRunningTheRest(): void {
    const source = new CancellationTokenSource();
    const failure = new RangeError("failed");
    let ran = false;
    source.token.register(() => {
      ran = true;
    });
    source.token.register(() => {
      throw failure;
    });

    const exception = Assert.throws(() => source.cancel(), CancellationCallbacksFailedException);

    Assert.areEqual(1, exception.errors.length);
    Assert.areEqual(failure, exception.errors[0]);
    Assert.isTrue(ran);
  }

  @TestMethod
  public wrapsEachErrorInTheOrderTheCallbacksRan(): void {
    const source = new CancellationTokenSource();
    const failure = new RangeError("failed");
    source.token.register(() => {
      throw failure;
    });
    source.token.register(() => {
      throw "text";
    });

    const exception = Assert.throws(() => source.cancel(), CancellationCallbacksFailedException);

    Assert.areEqual(2, exception.errors.length);
    Assert.areEqual("text", exception.errors[0]);
    Assert.areEqual(failure, exception.errors[1]);
  }

  @TestMethod
  public skipsACallbackThatAnEarlierOneTookBack(): void {
    const source = new CancellationTokenSource();
    let ran = false;
    let tookBack = false;
    const later = source.token.register(() => {
      ran = true;
    });
    source.token.register(() => {
      tookBack = later.unregister();
    });

    source.cancel();

    Assert.isTrue(tookBack);
    Assert.isFalse(ran);
  }

  @TestMethod
  public skipsALinkedSourceThatAnEarlierCallbackDisposed(): void {
    const source = new CancellationTokenSource();
    const linked = CancellationTokenSource.createLinkedTokenSource(source.token);
    source.token.register(() => linked[Symbol.dispose]());

    Assert.doesNotThrow(() => source.cancel());
    Assert.isFalse(linked.isCancellationRequested);
  }

  @TestMethod
  public runsALateCallbackAtOnceWhenCanceledThenDisposed(): void {
    const source = new CancellationTokenSource();
    let ran = false;
    source.cancel();
    source[Symbol.dispose]();

    source.token.register(() => {
      ran = true;
    });

    Assert.isTrue(ran);
  }

  @TestMethod
  public dropsItsCallbacksAndRefusesToCancelOnceDisposed(): void {
    const source = new CancellationTokenSource();
    let ran = false;
    source.token.register(() => {
      ran = true;
    });

    source[Symbol.dispose]();
    source[Symbol.dispose]();
    const registration = source.token.register(() => {
      ran = true;
    });
    const exception = Assert.throws(() => source.cancel(), InvalidOperationException);

    Assert.areEqual("The cancellation token source was disposed, so it cancels no more.", exception.message);
    Assert.isFalse(registration.unregister());
    Assert.isFalse(source.isCancellationRequested);
    Assert.isFalse(ran);
  }

  @TestMethod
  public cancelsALinkedSourceWhenAnyOfItsTokensIsCanceled(): void {
    const first = new CancellationTokenSource();
    const second = new CancellationTokenSource();
    using linked = CancellationTokenSource.createLinkedTokenSource(first.token, second.token);

    second.cancel();

    Assert.isTrue(linked.isCancellationRequested);
    Assert.isFalse(first.isCancellationRequested);
  }

  @TestMethod
  public cancelsALinkedSourceAtOnceWhenATokenAlreadyIs(): void {
    const canceled = new CancellationTokenSource();
    canceled.cancel();

    using linked = CancellationTokenSource.createLinkedTokenSource(new CancellationTokenSource().token, canceled.token);

    Assert.isTrue(linked.isCancellationRequested);
  }

  @TestMethod
  public stopsALinkedSourceWatchingItsTokensOnceDisposed(): void {
    const source = new CancellationTokenSource();
    const linked = CancellationTokenSource.createLinkedTokenSource(source.token);

    linked[Symbol.dispose]();
    source.cancel();

    Assert.isFalse(linked.isCancellationRequested);
  }
}
