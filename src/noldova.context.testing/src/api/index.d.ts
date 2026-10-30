/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import type { Exception, ExceptionOptions } from "@noldova/context.exceptions";
import "@noldova/context.text";

/**
 * Adds a repeatable category name to a test class or method. Method categories
 * combine with categories inherited from their declaring test class. Category
 * metadata supports explicit selection and does not control execution order or
 * concurrency.
 *
 * @param name The non-whitespace, case-sensitive category identity. Repeated decorators preserve their written order.
 * @returns The decorator that attaches the category to a test class or public instance test method.
 * @throws ArgumentException if name is empty or whitespace.
 * @throws TestingException if applying the decorator encounters corrupt existing category metadata.
 *
 * @example
 * ```ts
 * import { Assert, Category, TestClass, TestData, TestMethod } from "@noldova/context.testing";
 *
 * @Category("Unit")
 * @TestClass
 * export class AdditionTests {
 *   @Category("Arithmetic")
 *   @TestData(2, 3, 5)
 *   @TestData(-1, 1, 0)
 *   @TestMethod
 *   public adds(left: number, right: number, expected: number): void {
 *     Assert.areEqual(expected, left + right);
 *   }
 * }
 * // Select with category:Unit or category:Arithmetic; each row remains a separate test.
 * ```
 */
export declare function Category(name: string): (value: Function) => void;

/**
 * Marks a class as a test class. Discovery accepts only exported classes
 * whose name ends in `Tests` and which carry this mark.
 *
 * @param value The exported class constructor to mark. Its export name must end in Tests and its instances must be constructible without arguments.
 *
 * @example
 * ```ts
 * import { Assert, TestClass, TestMethod } from "@noldova/context.testing";
 *
 * @TestClass
 * export class CounterTests {
 *   private count: number = 0;
 *
 *   @TestMethod
 *   public startsWithFreshState(): void {
 *     Assert.areEqual(0, this.count);
 *     this.count++;
 *   }
 * }
 * // Save as counter.test.ts and export the marked class.
 * ```
 */
export declare function TestClass(value: Function): void;

/**
 * Adds one inline argument row to a test method. Each repeated `TestData`
 * decorator is discovered, executed, timed, and reported as an independent
 * test in written order.
 *
 * @param values The non-empty inline argument row for TArguments. Its array is copied, but referenced values are shared; discovery requires the fixed
 *   runtime arity to match.
 * @returns The decorator for an instance method accepting the TArguments tuple and also marked with TestMethod.
 * @throws ArgumentException if the row is empty.
 * @throws TestingException if applying the decorator encounters corrupt existing data metadata.
 *
 * @example
 * ```ts
 * import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";
 *
 * @TestClass
 * export class LengthTests {
 *   @TestData("", 0)
 *   @TestData("abc", 3)
 *   @TestMethod
 *   public measures(value: string, expected: number): void {
 *     Assert.areEqual(expected, value.length);
 *   }
 * }
 * // Reports measures[0] and measures[1] independently, in this written order.
 * ```
 */
export declare function TestData<TArguments extends unknown[]>(...values: TArguments): (value: (...testArguments: TArguments) => unknown) => void;

/**
 * Marks a public instance method of a test class as a test method.
 *
 * @param value The synchronous or promise-returning public instance method to mark. Static, symbol-named, and generator tests are rejected by discovery.
 *
 * @example
 * ```ts
 * import { Assert, TestClass, TestMethod } from "@noldova/context.testing";
 *
 * @TestClass
 * export class AsyncTests {
 *   @TestMethod
 *   public async awaitsWorkAsync(): Promise<void> {
 *     Assert.areEqual(42, await Promise.resolve(42));
 *   }
 * }
 * ```
 */
export declare function TestMethod(value: Function): void;

/**
 * Marks a test class or test method as skipped for the given reason. The
 * reason is required and is reported with the skipped result.
 * Discovery rejects a skip mark without the corresponding TestClass or
 * TestMethod mark; Skip does not turn an otherwise unmarked target into a test.
 *
 * @param reason The non-whitespace reason reported for every affected invocation. A method reason takes precedence over a class reason.
 * @returns The decorator that skips a marked test class or method.
 * @throws ArgumentException if reason is empty or whitespace.
 *
 * @example
 * ```ts
 * import { Skip, TestClass, TestMethod } from "@noldova/context.testing";
 *
 * @TestClass
 * export class StorageTests {
 *   @Skip("Requires the integration test server.")
 *   @TestMethod
 *   public connects(): void { }
 * }
 * // The skipped invocation and its reason remain visible in reduced-detail reports.
 * ```
 */
export declare function Skip(reason: string): (value: Function) => void;

/**
 * The exception that is thrown when a test assertion fails. Carries the
 * expected and actual values beside the message.
 *
 * @example
 * ```ts
 * import { Assert, AssertFailedException } from "@noldova/context.testing";
 *
 * const failure = Assert.throws(() => Assert.areEqual(1, 2), AssertFailedException);
 * Assert.areEqual(1, failure.expected);
 * Assert.areEqual(2, failure.actual);
 * const explicitFailure = new AssertFailedException();
 * Assert.areEqual("Assertion failed.", explicitFailure.message);
 * ```
 */
export declare class AssertFailedException extends TestingException {
  /**
   * The value the assertion expected, when applicable.
   */
  public readonly expected: unknown;

  /**
   * The value the assertion observed, when applicable.
   */
  public readonly actual: unknown;

  /**
   * Initializes the exception. A missing message defaults to the canonical
   * assertion-failure text.
   *
   * @param message Optional failure text. Omission selects the operation's canonical message; an empty string is preserved.
   * @param expected The expected value, retained by reference rather than deep-copied.
   * @param actual The observed value, retained by reference rather than deep-copied.
   * @param options Optional exception context. Its cause is retained without cloning.
   *
   * See {@link AssertFailedException} for usage examples.
   */
  public constructor(message?: string, expected?: unknown, actual?: unknown, options?: ExceptionOptions);
}

/**
 * The base exception for failures owned by the Testing package. It is thrown
 * directly when discovery or execution violates the testing contract.
 *
 * @example
 * ```ts
 * import { ExceptionOptions } from "@noldova/context.exceptions";
 * import { Assert, TestingException } from "@noldova/context.testing";
 *
 * const cause = new Error("module loading failed");
 * const failure = new TestingException("Cannot discover the test project.", new ExceptionOptions(cause));
 * Assert.areEqual(cause, failure.cause);
 * ```
 */
export declare class TestingException extends Exception {
  /**
   * Initializes the exception with the violation description.
   *
   * @param message The description of the testing failure, preserved as supplied.
   * @param options Optional exception context. Its cause is retained without cloning.
   *
   * See {@link TestingException} for usage examples.
   */
  public constructor(message: string, options?: ExceptionOptions);
}

/**
 * The exception that fails a test which did not settle within the executor's
 * timeout.
 *
 * @example
 * ```ts
 * import { Assert, TestTimeoutException } from "@noldova/context.testing";
 *
 * const failure = new TestTimeoutException(500);
 * Assert.areEqual(500, failure.timeoutMilliseconds);
 * // This describes a failure; constructing it does not start a timer.
 * ```
 */
export declare class TestTimeoutException extends TestingException {
  /**
   * The timeout that elapsed, in milliseconds.
   */
  public readonly timeoutMilliseconds: number;

  /**
   * Initializes the exception with a positive integer timeout. Invalid values
   * throw `ArgumentOutOfRangeException`.
   *
   * @param timeoutMilliseconds A positive integer duration in milliseconds.
   * @param options Optional exception context. Its cause is retained without cloning.
   * @throws ArgumentOutOfRangeException if the timeout is not a positive integer.
   *
   * See {@link TestTimeoutException} for usage examples.
   */
  public constructor(timeoutMilliseconds: number, options?: ExceptionOptions);
}

/**
 * The assertion vocabulary. Every failure throws `AssertFailedException`.
 *
 * @example
 * ```ts
 * import { Assert } from "@noldova/context.testing";
 *
 * Assert.isTrue(3 > 2);
 * Assert.isFalse(3 < 2);
 * Assert.areEqual(Number.NaN, Number.NaN);
 * Assert.areNotEqual(0, -0);
 * Assert.isNull(null);
 * Assert.isUndefined(undefined);
 * Assert.isNotNull(undefined); // Excludes null only.
 * Assert.isDefined(null); // Excludes undefined only.
 * const value: unknown = new Error("sample");
 * Assert.isInstanceOf(value, Error);
 * Assert.areEqual("sample", value.message);
 *
 * const caught = Assert.throws(() => { throw new Error("expected"); }, Error);
 * Assert.areEqual("expected", caught.message);
 * await Assert.throwsAsync(async () => { throw new Error("rejected"); }, Error);
 * Assert.doesNotThrow(() => Assert.areEqual(2, 1 + 1));
 * Assert.throws(() => Assert.fail("deliberate failure"), Error);
 * ```
 */
export declare class Assert {
  /**
   * Fails unless the condition is true; a passing call narrows the condition.
   *
   * @param condition The boolean condition that must be true. Success narrows it to true.
   * @param message Optional failure text. Omission selects the operation's canonical message; an empty string is preserved.
   * @throws AssertFailedException if the asserted condition is not satisfied.
   *
   * See {@link Assert} for usage examples.
   */
  public static isTrue(condition: boolean, message?: string): asserts condition;

  /**
   * Fails unless the condition is false; a passing call narrows to `false`.
   *
   * @param condition The boolean condition that must be false. Success narrows it to false.
   * @param message Optional failure text. Omission selects the operation's canonical message; an empty string is preserved.
   * @throws AssertFailedException if the asserted condition is not satisfied.
   *
   * See {@link Assert} for usage examples.
   */
  public static isFalse(condition: boolean, message?: string): asserts condition is false;

  /**
   * Fails unless the values are equal by SameValue semantics.
   *
   * @param expected The expected T value; equality uses Object.is, not structural comparison.
   * @param actual The observed T value. NaN equals NaN; positive and negative zero differ; objects compare by identity.
   * @param message Optional failure text. Omission selects the operation's canonical message; an empty string is preserved.
   * @throws AssertFailedException if the asserted condition is not satisfied.
   *
   * See {@link Assert} for usage examples.
   */
  public static areEqual<T>(expected: T, actual: T, message?: string): void;

  /**
   * Fails when the values are equal by SameValue semantics.
   *
   * @param notExpected The T value that the actual value must differ from under Object.is.
   * @param actual The observed T value, compared by SameValue rather than deep equality.
   * @param message Optional failure text. Omission selects the operation's canonical message; an empty string is preserved.
   * @throws AssertFailedException if the asserted condition is not satisfied.
   *
   * See {@link Assert} for usage examples.
   */
  public static areNotEqual<T>(notExpected: T, actual: T, message?: string): void;

  /**
   * Fails unless the value is exactly null; a passing call narrows to `null`.
   *
   * @param value The value that must be exactly null, not undefined. Success narrows it to null.
   * @param message Optional failure text. Omission selects the operation's canonical message; an empty string is preserved.
   * @throws AssertFailedException if the asserted condition is not satisfied.
   *
   * See {@link Assert} for usage examples.
   */
  public static isNull(value: unknown, message?: string): asserts value is null;

  /**
   * Fails when the value is exactly null; a passing call excludes `null`.
   *
   * @param value The T value that must not be null. Undefined remains valid; success narrows to Exclude<T, null>.
   * @param message Optional failure text. Omission selects the operation's canonical message; an empty string is preserved.
   * @throws AssertFailedException if the asserted condition is not satisfied.
   *
   * See {@link Assert} for usage examples.
   */
  public static isNotNull<T>(value: T, message?: string): asserts value is Exclude<T, null>;

  /**
   * Fails unless the value is exactly undefined; a passing call narrows to
   * `undefined`.
   *
   * @param value The value that must be exactly undefined, not null. Success narrows it to undefined.
   * @param message Optional failure text. Omission selects the operation's canonical message; an empty string is preserved.
   * @throws AssertFailedException if the asserted condition is not satisfied.
   *
   * See {@link Assert} for usage examples.
   */
  public static isUndefined(value: unknown, message?: string): asserts value is undefined;

  /**
   * Fails when the value is undefined; a passing call excludes `undefined`
   * from the type.
   *
   * @param value The T value that must not be undefined. Null remains valid; success narrows to Exclude<T, undefined>.
   * @param message Optional failure text. Omission selects the operation's canonical message; an empty string is preserved.
   * @throws AssertFailedException if the asserted condition is not satisfied.
   *
   * See {@link Assert} for usage examples.
   */
  public static isDefined<T>(value: T, message?: string): asserts value is Exclude<T, undefined>;

  /**
   * Fails unless the value is an instance of the type; a passing call narrows
   * to that type.
   *
   * @param value The value to test and narrow to T on success.
   * @param type The runtime constructor whose prototype defines T. Derived instances also satisfy the assertion.
   * @param message Optional failure text. Omission selects the operation's canonical message; an empty string is preserved.
   * @throws AssertFailedException if the asserted condition is not satisfied.
   *
   * See {@link Assert} for usage examples.
   */
  public static isInstanceOf<T>(value: unknown, type: Function & { readonly prototype: T }, message?: string): asserts value is T;

  /**
   * Fails unless the action throws an instance of the exception type; returns
   * the caught exception for further assertions.
   *
   * @param action The synchronous action to invoke once. Use throwsAsync for promise-returning work.
   * @param exceptionType The expected TException constructor; derived exceptions also match.
   * @param message Optional failure text. Omission selects the operation's canonical message; an empty string is preserved.
   * @returns The original matching exception, retaining identity and custom fields.
   * @throws AssertFailedException if the action does not throw or throws a different exception type.
   *
   * See {@link Assert} for usage examples.
   */
  public static throws<TException extends Error>(
    action: () => void,
    exceptionType: Function & (abstract new (...arguments_: never[]) => TException),
    message?: string): TException;

  /**
   * Fails unless the awaited action rejects with an instance of the exception
   * type; returns the caught exception for further assertions.
   *
   * @param action The action invoked once and awaited. Either a synchronous throw or a promise rejection is examined.
   * @param exceptionType The expected TException constructor; derived exceptions also match.
   * @param message Optional failure text. Omission selects the operation's canonical message; an empty string is preserved.
   * @returns A promise resolving to the original matching exception.
   * @throws AssertFailedException via promise rejection if the action succeeds or fails with a different exception type.
   *
   * See {@link Assert} for usage examples.
   */
  public static throwsAsync<TException extends Error>(
    action: () => Promise<unknown>,
    exceptionType: Function & (abstract new (...arguments_: never[]) => TException),
    message?: string): Promise<TException>;

  /**
   * Fails when the action throws.
   *
   * @param action The synchronous action to invoke once. This assertion does not await asynchronous work.
   * @param message Optional failure text. Omission selects the operation's canonical message; an empty string is preserved.
   * @throws AssertFailedException if the action throws.
   *
   * See {@link Assert} for usage examples.
   */
  public static doesNotThrow(action: () => void, message?: string): void;

  /**
   * Fails unconditionally.
   *
   * @param message Optional failure text. Omission selects the operation's canonical message; an empty string is preserved.
   * @returns Never returns; it always throws AssertFailedException.
   * @throws AssertFailedException always.
   *
   * See {@link Assert} for usage examples.
   */
  public static fail(message?: string): never;
}

/**
 * The outcome of one executed or skipped test invocation.
 */
export declare enum TestOutcome {
  /**
   * The test executed without a failure.
   */
  Passed = "Passed",

  /**
   * The test executed and produced a failure.
   */
  Failed = "Failed",

  /**
   * The test did not execute because it carries an explicit skip reason.
   */
  Skipped = "Skipped",
}

/**
 * The result snapshot of one test-method invocation. The constructor rejects
 * contradictory outcome, failure, skip, and test-data states.
 *
 * @example
 * ```ts
 * import { Assert, TestMethodResult, TestOutcome } from "@noldova/context.testing";
 *
 * const row = new TestMethodResult("Sample", "LengthTests", "measures", 0, ["abc", 3],
 *   TestOutcome.Passed, 1.5, undefined, undefined);
 * Assert.areEqual("LengthTests.measures[0]", row.displayName);
 * const skipped = new TestMethodResult("Sample", "StorageTests", "connects", undefined, [],
 *   TestOutcome.Skipped, 0, undefined, "Server unavailable.");
 * Assert.areEqual("Server unavailable.", skipped.skipReason);
 * ```
 */
export declare class TestMethodResult {
  /**
   * The canonical package identity of the test.
   */
  public readonly packageName: string;

  /**
   * The discovered test-class name.
   */
  public readonly className: string;

  /**
   * The discovered test-method name.
   */
  public readonly methodName: string;

  /**
   * The zero-based inline-data index, or undefined for a method without test
   * data.
   */
  public readonly testDataIndex: number | undefined;

  /**
   * The inline arguments supplied to this invocation. Empty for a method
   * without test data.
   */
  public readonly testData: readonly unknown[];

  /**
   * The final classified outcome.
   */
  public readonly outcome: TestOutcome;

  /**
   * The measured execution duration in milliseconds.
   */
  public readonly durationMilliseconds: number;

  /**
   * The original failure when the outcome is Failed. It may itself be undefined
   * when the test threw undefined; the outcome, not this value, identifies failure.
   */
  public readonly failure: unknown;

  /**
   * The declared skip reason when the outcome is Skipped; undefined
   * otherwise.
   */
  public readonly skipReason: string | undefined;

  /**
   * The `ClassName.methodName` identity, followed by `[index]` for a
   * parameterized invocation.
   */
  public readonly displayName: string;

  /**
   * Initializes the complete result snapshot; fails on contradictory data,
   * outcome, failure, or skip state.
   *
   * @param packageName The explicit, non-whitespace package identity; it is never inferred from a path.
   * @param className The non-whitespace discovered class identity.
   * @param methodName The non-whitespace public instance-method name, without a data-row suffix.
   * @param testDataIndex The non-negative integer, zero-based row index; undefined for a non-parameterized invocation.
   * @param testData The row's arguments. Non-empty exactly when testDataIndex is present. The array is copied; its values remain shared.
   * @param outcome The final Passed, Failed, or Skipped outcome; failure and skipReason must agree with it.
   * @param durationMilliseconds The non-negative finite elapsed duration for this invocation, in milliseconds.
   * @param failure The original thrown or rejected value for a failed outcome, including undefined when that was thrown. Must be undefined otherwise.
   * @param skipReason A non-whitespace reason when skipped, or undefined otherwise.
   * @throws ArgumentException if an identity or required skip reason is blank, data identity is inconsistent, or failure/skip state contradicts the outcome.
   * @throws ArgumentOutOfRangeException if the row index is negative or fractional, or duration is negative or non-finite.
   *
   * See {@link TestMethodResult} for usage examples.
   */
  public constructor(
    packageName: string,
    className: string,
    methodName: string,
    testDataIndex: number | undefined,
    testData: readonly unknown[],
    outcome: TestOutcome,
    durationMilliseconds: number,
    failure: unknown,
    skipReason: string | undefined);
}

/**
 * The result snapshots of one test class.
 *
 * @example
 * ```ts
 * import { Assert, TestClassResult, TestMethodResult, TestOutcome } from "@noldova/context.testing";
 *
 * const method = new TestMethodResult("Sample", "SampleTests", "passes", undefined, [],
 *   TestOutcome.Passed, 2, undefined, undefined);
 * const result = new TestClassResult("Sample", "SampleTests", "sample.test.js", [method]);
 * Assert.areEqual(method, result.methodResults[0]);
 * ```
 */
export declare class TestClassResult {
  /**
   * The canonical package identity shared by every contained method result.
   */
  public readonly packageName: string;

  /**
   * The discovered test-class name.
   */
  public readonly className: string;

  /**
   * The package-relative path of the compiled test file, using `/` separators.
   */
  public readonly filePath: string;

  /**
   * The method results in deterministic execution order.
   */
  public readonly methodResults: readonly TestMethodResult[];

  /**
   * Initializes the complete result snapshot. At least one method result is
   * required, and every method must carry this package and class identity.
   *
   * @param packageName The explicit, non-whitespace package identity; it is never inferred from a path.
   * @param className The non-whitespace discovered class identity.
   * @param filePath The non-whitespace compiled test-file identity, normally package-relative with forward slashes.
   * @param methodResults A non-empty collection whose results all match this package and class. The array is copied; results are shared.
   * @throws ArgumentException if an identity is blank, the collection is empty, or a method belongs to another package or class.
   *
   * See {@link TestClassResult} for usage examples.
   */
  public constructor(packageName: string, className: string, filePath: string, methodResults: readonly TestMethodResult[]);
}

/**
 * The filters of a run and how many tests they discovered, selected and left out.
 *
 * @example
 * ```ts
 * import { Assert, TestSelection } from "@noldova/context.testing";
 *
 * const selection = new TestSelection(["category:fast"], 120, 8);
 * Assert.areEqual(112, selection.unselected);
 * Assert.isTrue(selection.isFiltered);
 * ```
 */
export declare class TestSelection {
  /**
   * The filters, in the order given; none when the run was not filtered.
   */
  public readonly filters: readonly string[];

  /**
   * How many tests discovery found.
   */
  public readonly discovered: number;

  /**
   * How many of them the filters selected.
   */
  public readonly selected: number;

  /**
   * How many the filters left out: discovered minus selected.
   */
  public readonly unselected: number;

  /**
   * True when the run had at least one filter.
   */
  public readonly isFiltered: boolean;

  /**
   * Creates the selection and computes the number left out.
   *
   * @param filters The filters, in the order given. The selection keeps its own copy.
   * @param discovered How many tests discovery found.
   * @param selected How many of them the filters selected.
   * @throws ArgumentOutOfRangeException if a count is negative or fractional, or selected exceeds discovered.
   *
   * See {@link TestSelection} for usage examples.
   */
  public constructor(filters: readonly string[], discovered: number, selected: number);
}

/**
 * The reconciled counts of a run: what passed, failed, and was skipped, and how long the tests took.
 *
 * @example
 * ```ts
 * import { Assert, TestRunTotals } from "@noldova/context.testing";
 *
 * const totals = new TestRunTotals(3, 1, 2, 12.5);
 * Assert.areEqual(4, totals.executed);
 * Assert.areEqual(6, totals.total);
 * ```
 */
export declare class TestRunTotals {
  /**
   * The measured duration in milliseconds: the sum of the tests' durations for a {@link TestRunResult}, or the elapsed time of a run
   * whose tests ran in parallel.
   */
  public readonly durationMilliseconds: number;

  /**
   * The number of passed tests.
   */
  public readonly passed: number;

  /**
   * The number of failed tests.
   */
  public readonly failed: number;

  /**
   * The number of explicitly skipped tests.
   */
  public readonly skipped: number;

  /**
   * The number of tests that actually ran: passed plus failed.
   */
  public readonly executed: number;

  /**
   * Executed plus skipped; must reconcile exactly with discovery.
   */
  public readonly total: number;

  /**
   * Initializes the counts and derives the executed and total counts from them.
   *
   * @param passed The number of passed tests, a non-negative integer.
   * @param failed The number of failed tests, a non-negative integer.
   * @param skipped The number of skipped tests, a non-negative integer.
   * @param durationMilliseconds The measured duration in milliseconds, a non-negative finite number.
   * @throws ArgumentOutOfRangeException if a count is negative or fractional, or the duration is negative or not finite.
   *
   * See {@link TestRunTotals} for usage examples.
   */
  public constructor(passed: number, failed: number, skipped: number, durationMilliseconds: number);
}

/**
 * The reconciled result snapshot of one complete run: its class results and the totals they add up to.
 *
 * @example
 * ```ts
 * import { Assert, TestClassResult, TestMethodResult, TestOutcome, TestRunResult } from "@noldova/context.testing";
 *
 * const method = new TestMethodResult("Sample", "SampleTests", "passes", undefined, [],
 *   TestOutcome.Passed, 2, undefined, undefined);
 * const result = new TestRunResult([new TestClassResult("Sample", "SampleTests", "sample.test.js", [method])]);
 * Assert.areEqual(1, result.passed);
 * Assert.areEqual(2, result.durationMilliseconds);
 * Assert.areEqual(0, new TestRunResult([]).total);
 * ```
 */
export declare class TestRunResult extends TestRunTotals {
  /**
   * The class results in deterministic execution order.
   */
  public readonly classResults: readonly TestClassResult[];

  /**
   * What the run selected out of what it discovered.
   */
  public readonly selection: TestSelection;

  /**
   * Initializes the result and computes the totals from the class results.
   *
   * @param classResults Class results in execution order. May be empty. The array is copied; result objects are shared.
   * @param selection What the run discovered and selected; every test counts as selected, with no filters, when absent.
   *
   * See {@link TestRunResult} for usage examples.
   */
  public constructor(classResults: readonly TestClassResult[], selection?: TestSelection);
}

/**
 * One independently executable invocation of a discovered test method.
 *
 * @example
 * ```ts
 * import { Assert, DiscoveredTestMethod } from "@noldova/context.testing";
 *
 * const ordinary = new DiscoveredTestMethod("passes", undefined, [], undefined);
 * const row = new DiscoveredTestMethod("measures", 0, ["abc", 3], undefined, ["Unit"]);
 * Assert.areEqual("passes", ordinary.displayName);
 * Assert.areEqual("measures[0]", row.displayName);
 * ```
 */
export declare class DiscoveredTestMethod {
  /**
   * The marked public instance-method name.
   */
  public readonly methodName: string;

  /**
   * The zero-based inline-data index, or undefined for a method without test
   * data.
   */
  public readonly testDataIndex: number | undefined;

  /**
   * The inline arguments supplied to this invocation. Empty for a method
   * without test data.
   */
  public readonly testData: readonly unknown[];

  /**
   * The explicit skip reason, when the method is skipped.
   */
  public readonly skipReason: string | undefined;

  /**
   * The distinct category names declared by the method and inherited from its
   * test class, in written order.
   */
  public readonly categories: readonly string[];

  /**
   * The method name followed by its data index when this is a parameterized
   * invocation.
   */
  public readonly displayName: string;

  /**
   * Initializes one discovered invocation and validates its data identity and
   * optional skip reason and categories.
   *
   * @param methodName The non-whitespace public instance-method name, without a data-row suffix.
   * @param testDataIndex The non-negative integer, zero-based row index; undefined for a non-parameterized invocation.
   * @param testData The row's arguments. Non-empty exactly when testDataIndex is present. The array is copied; its values remain shared.
   * @param skipReason A non-whitespace reason when skipped, or undefined otherwise.
   * @param categories Optional non-whitespace category names. Defaults to empty; duplicates are removed in first-occurrence order and the array is copied.
   * @throws ArgumentException if the name, reason, or categories are blank, or the row data and index disagree.
   * @throws ArgumentOutOfRangeException if the data index is negative or fractional.
   *
   * See {@link DiscoveredTestMethod} for usage examples.
   */
  public constructor(
    methodName: string,
    testDataIndex: number | undefined,
    testData: readonly unknown[],
    skipReason: string | undefined,
    categories?: readonly string[]);
}

/**
 * One discovered test class, its constructor, and its test methods.
 *
 * @example
 * ```ts
 * import { Assert, DiscoveredTestClass, DiscoveredTestMethod } from "@noldova/context.testing";
 *
 * class SampleTests {
 *   public passes(): void { }
 * }
 * const method = new DiscoveredTestMethod("passes", undefined, [], undefined);
 * const discovered = new DiscoveredTestClass("Sample", "SampleTests", "sample.test.js",
 *   SampleTests, undefined, [method], ["Unit"]);
 * Assert.areEqual(SampleTests, discovered.testClassConstructor);
 * // Normally obtain this model from TestDiscovery rather than assemble it.
 * ```
 */
export declare class DiscoveredTestClass {
  /**
   * The canonical package identity supplied by the test project.
   */
  public readonly packageName: string;

  /**
   * The exported marked class name.
   */
  public readonly className: string;

  /**
   * The package-relative path of the compiled test file, using `/` separators.
   */
  public readonly filePath: string;

  /**
   * The constructor used to create a fresh instance for each test invocation.
   */
  public readonly testClassConstructor: new () => object;

  /**
   * The explicit class-level skip reason, when the complete class is skipped.
   */
  public readonly skipReason: string | undefined;

  /**
   * The discovered method invocations in deterministic method and data order.
   */
  public readonly methods: readonly DiscoveredTestMethod[];

  /**
   * The distinct category names declared by the test class, in written order.
   */
  public readonly categories: readonly string[];

  /**
   * Initializes the discovered class with at least one method and an immutable
   * copy of the method and category collections.
   *
   * @param packageName The explicit, non-whitespace package identity; it is never inferred from a path.
   * @param className The non-whitespace discovered class identity.
   * @param filePath The non-whitespace compiled test-file identity, normally package-relative with forward slashes.
   * @param testClassConstructor The parameterless constructor used for a fresh instance per invocation. It must create the discovered public instance
   *   methods.
   * @param skipReason A non-whitespace reason when skipped, or undefined otherwise.
   * @param methods The non-empty, ordered discovered invocations. The array is copied; method objects are shared.
   * @param categories Optional non-whitespace category names. Defaults to empty; duplicates are removed in first-occurrence order and the array is copied.
   * @throws ArgumentException if an identity, reason, or category is blank, or no methods are supplied.
   *
   * See {@link DiscoveredTestClass} for usage examples.
   */
  public constructor(
    packageName: string,
    className: string,
    filePath: string,
    testClassConstructor: new () => object,
    skipReason: string | undefined,
    methods: readonly DiscoveredTestMethod[],
    categories?: readonly string[]);
}

/**
 * One test project's explicit package identity and compiled test root.
 *
 * @example
 * ```ts
 * import { Assert, TestProject } from "@noldova/context.testing";
 *
 * const project = new TestProject("Sample", "./compiled/tests");
 * Assert.areEqual("Sample", project.packageName);
 * // The build supplies the compiled root explicitly; identity is not inferred from its path.
 * ```
 */
export declare class TestProject {
  /**
   * The canonical package identity assigned to discovered tests.
   */
  public readonly packageName: string;

  /**
   * The root directory containing the compiled test project.
   */
  public readonly rootDirectory: string;

  /**
   * Initializes the project identity used by discovery and reporting.
   *
   * @param packageName The explicit, non-whitespace package identity; it is never inferred from a path.
   * @param rootDirectory The non-whitespace compiled test root. Discovery resolves filesystem access using the host working directory for relative paths.
   * @throws ArgumentException if the package identity or root is blank.
   *
   * See {@link TestProject} for usage examples.
   */
  public constructor(packageName: string, rootDirectory: string);
}

/**
 * Deterministic discovery of test classes from compiled test output.
 * Violations of the testing contract fail with `TestingException`.
 *
 * @example
 * ```ts
 * import { Assert, TestClass, TestDiscovery, TestMethod } from "@noldova/context.testing";
 *
 * @TestClass
 * class SampleTests {
 *   @TestMethod
 *   public passes(): void { }
 * }
 * const classes = new TestDiscovery().discoverModuleExports({ SampleTests }, "sample.test.js", "Sample");
 * Assert.areEqual("passes", classes[0]?.methods[0]?.methodName);
 * ```
 */
export declare class TestDiscovery {
  /**
   * Discovers every test class beneath the explicitly identified projects:
   * `*.test.js` files in sorted order, exports in sorted order, methods in
   * sorted order.
   *
   * @param testProjects Explicit project identities and compiled roots. An empty collection discovers no tests.
   * @param onFileImported Optional callback given each test file's path, relative to its project root with `/` separators, once the file is
   * imported and before its classes are discovered. Defaults to none.
   * @returns A promise resolving to discovered classes in code-unit order by package, root, file, export, then method; rows preserve written order.
   * @throws ArgumentException via promise rejection if a supplied root is blank.
   * @throws TestingException via promise rejection for invalid test declarations or metadata, including a test file with no marked class.
   * @throws Error via promise rejection when host filesystem access or module loading fails.
   *
   * See {@link TestDiscovery} for usage examples.
   */
  public discoverAsync(testProjects: readonly TestProject[], onFileImported?: (filePath: string) => void): Promise<DiscoveredTestClass[]>;

  /**
   * Discovers the test classes of one loaded module under the given package
   * name. Exposed for programmatic and framework self-verification use.
   *
   * @param moduleExports The loaded module's exports. Discovery reads own data properties without invoking export getters.
   * @param filePath The non-whitespace compiled test-file identity, normally package-relative with forward slashes.
   * @param packageName The explicit, non-whitespace package identity; it is never inferred from a path.
   * @returns The discovered classes in export-name code-unit order, with methods in name order and data rows in written order.
   * @throws ArgumentException if filePath or packageName is blank.
   * @throws TestingException if a declaration or mark is invalid, or the module yields no marked test class.
   *
   * See {@link TestDiscovery} for usage examples.
   */
  public discoverModuleExports(moduleExports: object, filePath: string, packageName: string): DiscoveredTestClass[];
}

/**
 * Receives a run's progress while it executes. {@link TestConsoleReporter} implements it to write each class's
 * results as soon as they are known.
 *
 * @example
 * ```ts
 * import { Assert, type ITestProgressListener, TestClass, TestClassResult, TestDiscovery, TestExecutor, TestMethod } from "@noldova/context.testing";
 *
 * class CompletedClassNames implements ITestProgressListener {
 *   public readonly names: string[] = [];
 *
 *   public onClassCompleted(classResult: TestClassResult): void {
 *     this.names.push(classResult.className);
 *   }
 * }
 *
 * @TestClass
 * class SampleTests {
 *   @TestMethod
 *   public passes(): void {
 *     Assert.isTrue(true);
 *   }
 * }
 * const listener = new CompletedClassNames();
 * await new TestExecutor(1000).executeAsync(new TestDiscovery().discoverModuleExports({ SampleTests }, "sample.test.js", "Sample"), listener);
 * Assert.areEqual("SampleTests", listener.names.join(","));
 * ```
 */
export declare interface ITestProgressListener {
  /**
   * Receives each method invocation just before it runs, in execution order, including invocations that are skipped or recorded as stopped.
   *
   * @param testClass The class the invocation belongs to.
   * @param method The invocation about to run.
   * @throws Error of any kind; the throw ends the run by rejecting the executing promise.
   *
   * See {@link ITestProgressListener} for usage examples.
   */
  onMethodStarted?(testClass: DiscoveredTestClass, method: DiscoveredTestMethod): void;

  /**
   * Receives each invocation's result as soon as it is known, before the next invocation starts.
   *
   * @param methodResult The invocation's result, the same object its class result later holds.
   * @throws Error of any kind; the throw ends the run by rejecting the executing promise.
   *
   * See {@link ITestProgressListener} for usage examples.
   */
  onMethodCompleted?(methodResult: TestMethodResult): void;

  /**
   * Receives a class's result as soon as every invocation of that class has finished, before the next class starts.
   *
   * @param classResult The finished class's result, the same object the run later returns.
   * @throws Error of any kind; the throw ends the run by rejecting the executing promise.
   *
   * See {@link ITestProgressListener} for usage examples.
   */
  onClassCompleted(classResult: TestClassResult): void;
}

/**
 * The clock a test executor reads its durations from and arms its per-test
 * timeout on, a parallel runner times its workers on, and a console reporter
 * animates its progress line on. Each uses the system clock by default; a test
 * of a runner may pass its own to force a time without waiting for it.
 *
 * @example
 * ```ts
 * import { Assert, type IClock, TestClass, TestDiscovery, TestExecutor, TestMethod, TestOutcome } from "@noldova/context.testing";
 *
 * class FixedClock implements IClock {
 *   public now(): number {
 *     return 0;
 *   }
 *
 *   public setTimeout(callback: () => void, delayMilliseconds: number): number {
 *     return Number(setTimeout(callback, delayMilliseconds));
 *   }
 *
 *   public clearTimeout(timer: number | undefined): void {
 *     clearTimeout(timer);
 *   }
 * }
 *
 * @TestClass
 * class SampleTests {
 *   @TestMethod
 *   public passes(): void {
 *     Assert.isTrue(true);
 *   }
 * }
 * const classes = new TestDiscovery().discoverModuleExports({ SampleTests }, "sample.test.js", "Sample");
 * const results = await new TestExecutor(1000, new FixedClock()).executeAsync(classes);
 * Assert.areEqual(TestOutcome.Passed, results[0]?.methodResults[0]?.outcome);
 * Assert.areEqual(0, results[0]?.methodResults[0]?.durationMilliseconds);
 * ```
 */
export declare interface IClock {
  /**
   * Reads the current time in milliseconds, from an arbitrary origin that never moves backwards.
   *
   * @returns The current time in milliseconds.
   *
   * See {@link IClock} for usage examples.
   */
  now(): number;

  /**
   * Arms a timer that calls the callback once, after the delay.
   *
   * @param callback The function to call when the timer fires.
   * @param delayMilliseconds The delay in milliseconds before the callback runs.
   * @returns The timer's id, which `clearTimeout` takes.
   *
   * See {@link IClock} for usage examples.
   */
  setTimeout(callback: () => void, delayMilliseconds: number): number;

  /**
   * Disarms a timer so its callback never runs; an id that is `undefined`, already fired or already cleared is ignored.
   *
   * @param timer The id `setTimeout` returned, or `undefined`.
   *
   * See {@link IClock} for usage examples.
   */
  clearTimeout(timer: number | undefined): void;
}

/**
 * Executes discovered tests: a fresh instance per method invocation, awaited
 * asynchronous work, a loud timeout, and unhandled-rejection attribution.
 * During bootstrap, calls must not overlap. A timeout cannot interrupt running
 * work or synchronous runaway code; the caller must not treat it as isolation.
 * The command-line run and {@link ParallelTestRunner} supply that isolation:
 * they run the executor in parallel worker threads they time per invocation
 * and stop a worker when an invocation overruns. A fresh worker keeps every result already reported and
 * resumes after an invocation whose timeout the worker reported, or records an
 * invocation the main thread had to stop as timed out without running it again.
 * The first invocation failure is preserved when a pending stray rejection also occurs.
 *
 * @example
 * ```ts
 * import { Assert, TestClass, TestDiscovery, TestExecutor, TestMethod, TestOutcome } from "@noldova/context.testing";
 *
 * @TestClass
 * class SampleTests {
 *   @TestMethod
 *   public async passesAsync(): Promise<void> {
 *     Assert.areEqual(1, await Promise.resolve(1));
 *   }
 * }
 * const classes = new TestDiscovery().discoverModuleExports({ SampleTests }, "sample.test.js", "Sample");
 * const results = await new TestExecutor(1000).executeAsync(classes);
 * Assert.areEqual(TestOutcome.Passed, results[0]?.methodResults[0]?.outcome);
 * ```
 */
export declare class TestExecutor {
  /**
   * Initializes the executor with a positive integer per-test timeout in
   * milliseconds. Invalid values throw `ArgumentOutOfRangeException`.
   *
   * @param timeoutMilliseconds The per-test positive integer timeout in milliseconds, at most 2147483647 in the Node bootstrap.
   * @param clock The clock that times each invocation and arms its timeout. Defaults to the system clock.
   * @throws ArgumentOutOfRangeException if the timeout is non-positive, fractional, or exceeds the Node timer limit.
   *
   * See {@link TestExecutor} for usage examples.
   */
  public constructor(timeoutMilliseconds: number, clock?: IClock);

  /**
   * Executes every method invocation of every class in order and returns its
   * independent result.
   *
   * @param testClasses The already discovered, validated classes in execution order. May be empty.
   * @param progressListener Optional listener told of each invocation as it starts and finishes and of each class's result as soon as that class
   *   finishes, in execution order and before the next class starts.
   * @param stoppedMethods Invocations a supervisor stopped because they overran the timeout; each is recorded as a Failed result carrying a
   *   {@link TestTimeoutException} and a duration of the timeout, without running it again. Defaults to none.
   * @param isStopping Optional check that stops the run: the executor calls it before each invocation, and once it returns `true` the
   *   executor starts no further invocation, completes a class only when its last invocation has finished, and returns the results of the
   *   classes that completed. The listener's `onMethodCompleted` may make it return `true` to stop after that invocation.
   * @returns A promise resolving to one result per supplied class and invocation. Test failures become Failed results, not rejection of this promise.
   *   Empty input returns an empty array; a stopped run returns only the classes that completed before it stopped.
   * @throws Error via promise rejection with the listener's own exception when the listener throws; the executor's unhandled-rejection listener is
   *   removed either way.
   * @example
   * ```ts
   * import { Assert, TestClass, TestDiscovery, TestExecutor, TestMethod } from "@noldova/context.testing";
   *
   * @TestClass
   * class FirstTests {
   *   @TestMethod
   *   public passes(): void { }
   * }
   *
   * @TestClass
   * class SecondTests {
   *   @TestMethod
   *   public passes(): void { }
   * }
   * const classes = new TestDiscovery().discoverModuleExports({ FirstTests, SecondTests }, "sample.test.js", "Sample");
   * let completedClasses = 0;
   * const listener = { onClassCompleted: (): void => { completedClasses++; } };
   * const results = await new TestExecutor(1000).executeAsync(classes, listener, undefined, () => completedClasses > 0);
   * Assert.areEqual(1, results.length); // Stopped after the first class.
   * ```
   */
  public executeAsync(testClasses: readonly DiscoveredTestClass[], progressListener?: ITestProgressListener,
    stoppedMethods?: ReadonlySet<DiscoveredTestMethod>, isStopping?: () => boolean): Promise<TestClassResult[]>;
}

/**
 * Orchestrates discovery, selection, execution, and reconciliation.
 *
 * @example
 * ```ts
 * import { TestDiscovery, TestExecutor, TestProject, TestRunner, TestRunResult } from "@noldova/context.testing";
 *
 * export async function runUnitTestsAsync(compiledTestDirectory: string): Promise<TestRunResult> {
 *   const runner = new TestRunner(new TestDiscovery(), new TestExecutor(5000));
 *   return runner.runAsync([new TestProject("Sample", compiledTestDirectory)], ["category:Unit"]);
 * }
 * // Pass an existing compiled test root. Omitting filters selects every discovered test.
 * ```
 */
export declare class TestRunner {
  /**
   * Initializes the runner with its discovery and executor.
   *
   * @param discovery The discovery service used for the supplied compiled projects.
   * @param executor The execution service used for selected invocations.
   *
   * See {@link TestRunner} for usage examples.
   */
  public constructor(discovery: TestDiscovery, executor: TestExecutor);

  /**
   * Runs the explicitly identified test projects. Optional filters select by
   * package name, file path, class name, `ClassName.methodName`, indexed
   * data-case substring, or exact `category:name` identity and are combined
   * with OR semantics. Fails when result totals do not reconcile with discovery.
   *
   * @param testProjects Explicit project identities and compiled roots. An empty collection discovers no tests.
   * @param filters Optional case-sensitive identity substrings or exact category:name selectors, combined with OR. Defaults to no filtering.
   * @param progressListener Optional listener told of each selected class's result as soon as that class finishes, before the totals are
   *   reconciled; see {@link TestExecutor.executeAsync}.
   * @returns A promise resolving to the reconciled result. No matches produce a zero-test result; the command-line entry treats it as failure.
   * @throws TestingException via promise rejection if execution totals do not match the selected invocations.
   * @throws Error via promise rejection when discovery fails; the original discovery failure is preserved.
   *
   * See {@link TestRunner} for usage examples.
   */
  public runAsync(testProjects: readonly TestProject[], filters?: readonly string[], progressListener?: ITestProgressListener): Promise<TestRunResult>;

  /**
   * Discovers the explicitly identified test projects and returns the classes the filters select, in execution order, without running them.
   * Filters select as {@link TestRunner.runAsync} describes; a class selected only through some of its methods holds just those methods.
   *
   * @param testProjects Explicit project identities and compiled roots. An empty collection discovers no tests.
   * @param filters Optional case-sensitive identity substrings or exact category:name selectors, combined with OR. Defaults to no filtering.
   * @returns A promise resolving to the selected classes in execution order.
   * @throws Error via promise rejection when discovery fails; the original discovery failure is preserved.
   *
   * See {@link TestRunner} for usage examples.
   */
  public selectAsync(testProjects: readonly TestProject[], filters?: readonly string[]): Promise<DiscoveredTestClass[]>;

  /**
   * Returns the already discovered classes the filters select, in execution order, without running them.
   * Filters select as {@link TestRunner.runAsync} describes; a class selected only through some of its methods holds just those methods.
   *
   * @param testClasses Discovered classes in execution order; the collection and its classes are not mutated.
   * @param filters Optional case-sensitive identity substrings or exact category:name selectors, combined with OR. Defaults to no filtering.
   * @returns The selected classes in execution order; a copy of the input when there are no filters.
   * @example
   * ```ts
   * import { Assert, TestClass, TestDiscovery, TestExecutor, TestMethod, TestRunner } from "@noldova/context.testing";
   *
   * @TestClass
   * class SampleTests {
   *   @TestMethod
   *   public adds(): void { }
   *
   *   @TestMethod
   *   public subtracts(): void { }
   * }
   * const discovery = new TestDiscovery();
   * const classes = discovery.discoverModuleExports({ SampleTests }, "sample.test.js", "Sample");
   * const selected = new TestRunner(discovery, new TestExecutor(1000)).select(classes, ["SampleTests.adds"]);
   * Assert.areEqual(1, selected[0]?.methods.length);
   * ```
   */
  public select(testClasses: readonly DiscoveredTestClass[], filters?: readonly string[]): DiscoveredTestClass[];
}

/**
 * Runs tests in parallel worker threads, as the command-line run does, and
 * returns the same result objects as {@link TestRunner}. Each worker discovers
 * the projects itself and takes whole classes from one shared queue; the main
 * thread loads no test module. A test that overruns the timeout, whether it
 * never settles or runs synchronous code that never ends, is recorded as
 * timed out with a {@link TestTimeoutException}, its worker is ended, and a
 * fresh worker resumes after it, so no test runs twice and the run goes on.
 * Every worker has ended before the returned promise settles. The runner
 * leaves the process's environment unchanged; an app that wants the tests'
 * temporary files in a folder of its own sets `TMPDIR`, `TEMP` and `TMP` first.
 *
 * Results cross from the workers as data. Test data, assertion values and
 * thrown values that are a string, number, boolean, bigint, `null` or
 * `undefined` arrive unchanged; any other value arrives as a value that prints
 * as the original did. An {@link AssertFailedException} or a
 * {@link TestTimeoutException} arrives as that exception; any other error
 * arrives as an `Error` with the original's name, message and stack.
 * {@link TestReportWriter.formatMethodLines} therefore gives the same lines for
 * a result from either runner.
 *
 * @example
 * ```ts
 * import { ParallelTestRunner, TestProject, type TestRunResult } from "@noldova/context.testing";
 *
 * export async function runUnitTestsAsync(compiledTestDirectory: string): Promise<TestRunResult> {
 *   return new ParallelTestRunner(5000).runAsync([new TestProject("Sample", compiledTestDirectory)], ["category:Unit"]);
 * }
 * // Pass an existing compiled test root. Omitting filters selects every discovered test.
 * ```
 */
export declare class ParallelTestRunner {
  /**
   * Initializes the runner with a positive integer per-test timeout in milliseconds and its number of workers.
   *
   * @param timeoutMilliseconds The per-test positive integer timeout in milliseconds; with the main thread's 250 ms grace, at most 2147483647
   *   in the Node bootstrap.
   * @param workerCount The positive integer number of workers. Defaults to one per available processor and at least two.
   * @param clock The clock the main thread times its workers on: the start limit, of 5000 ms or the timeout plus 250 ms, whichever is longer, and
   *   the timeout plus 250 ms for each test. Defaults to the system clock. The workers time each test on the system clock.
   * @throws ArgumentOutOfRangeException if the timeout or the worker count is non-positive or fractional, or the timeout exceeds the Node timer
   *   limit.
   *
   * See {@link ParallelTestRunner} for usage examples.
   */
  public constructor(timeoutMilliseconds: number, workerCount?: number, clock?: IClock);

  /**
   * Runs the explicitly identified test projects in parallel workers. Filters select as {@link TestRunner.runAsync} describes.
   *
   * @param testProjects Explicit project identities and compiled roots. An empty collection discovers no tests.
   * @param filters Optional case-sensitive identity substrings or exact category:name selectors, combined with OR. Defaults to no filtering.
   * @param progressListener Optional listener told of each test's result as it finishes, in whichever worker, and of each class's result in
   *   discovery order. Its `onMethodStarted` is never called: only the workers load the test modules, so the main thread holds no discovered
   *   class or method to pass, and loading the modules there too would run their top-level code a second time.
   * @returns A promise resolving to the reconciled result, with classes in discovery order and each class's methods in execution order. Its time
   *   is the sum of its tests' durations, as from {@link TestRunner}. No matches produce a zero-test result; the command-line entry treats it as
   *   failure. Test failures and timeouts become Failed results, not rejection of this promise.
   * @throws TestingException via promise rejection when a worker crashes or exits, starts no test within its start limit, discovers different
   *   tests from another worker, or exchanges invalid data, when a class leaves a timer, handle or request open in its worker, or when the totals
   *   do not reconcile with the selected tests; every worker has ended first.
   * @throws Error via promise rejection with the worker's own error when a worker fails to start or discovery fails, or with the listener's own
   *   exception when the listener throws; every worker has ended first.
   *
   * See {@link ParallelTestRunner} for usage examples.
   */
  public runAsync(testProjects: readonly TestProject[], filters?: readonly string[], progressListener?: ITestProgressListener): Promise<TestRunResult>;
}

/**
 * Console formatting of a run result: one block per class, then the totals.
 * Each class heading includes its package, package-relative file path, and
 * class identity. The structured result remains the authority; no consumer
 * parses this output. {@link TestConsoleReporter} writes the same blocks while
 * a run progresses.
 *
 * @example
 * ```ts
 * import { Assert, TestClassResult, TestMethodResult, TestOutcome, TestReportWriter, TestRunResult } from "@noldova/context.testing";
 *
 * const writer = new TestReportWriter();
 * const classResult = new TestClassResult("Sample", "SampleTests", "sample.test.js", [
 *   new TestMethodResult("Sample", "SampleTests", "passes", undefined, [], TestOutcome.Passed, 1, undefined, undefined)]);
 * Assert.isTrue(writer.formatLines(new TestRunResult([]), true).includes("Total:      0"));
 * Assert.areEqual("Sample/sample.test.js — SampleTests", writer.formatClassLines(classResult, false)[0]);
 * Assert.areEqual(0, writer.formatClassLines(classResult, true).length);
 * ```
 */
export declare class TestReportWriter {
  /**
   * Returns the lines of the whole report: every class block, then the totals.
   *
   * @param result The structured result to present; formatting does not mutate it.
   * @param skipPassingDetails True to hide passing tests and fully passing class headings. Failures, skips, totals, and duration remain visible.
   * @returns Fresh human-readable lines, including totals and cumulative test execution time. No console output is performed.
   *
   * See {@link TestReportWriter} for usage examples.
   */
  public formatLines(result: TestRunResult, skipPassingDetails: boolean): string[];

  /**
   * Returns one class's block: its heading, one entry per presented invocation, and a closing blank line.
   *
   * @param classResult The class result to present; formatting does not mutate it.
   * @param skipPassingDetails True to hide passing invocations. Failures and skips remain visible.
   * @returns Fresh lines for the class, or an empty array when passing details are hidden and every invocation passed.
   *
   * See {@link TestReportWriter} for usage examples.
   */
  public formatClassLines(classResult: TestClassResult, skipPassingDetails: boolean): string[];

  /**
   * Returns the heading that opens a class's block: its package, package-relative file path, and class name.
   *
   * @param classResult The class result whose identity is presented; formatting does not mutate it.
   * @returns The heading line.
   * @example
   * ```ts
   * import { Assert, TestClassResult, TestReportWriter } from "@noldova/context.testing";
   *
   * const classResult = new TestClassResult("Sample", "SampleTests", "sample.test.js", []);
   * Assert.areEqual("Sample/sample.test.js — SampleTests", new TestReportWriter().formatClassHeading(classResult));
   * ```
   */
  public formatClassHeading(classResult: TestClassResult): string;

  /**
   * Returns one invocation's entry in a class's block: its outcome mark, name, data, and duration, followed by the failure's lines when it failed.
   *
   * @param methodResult The invocation to present; formatting does not mutate it.
   * @param skipPassingDetails True to hide a passing invocation. Failures and skips remain visible.
   * @returns Fresh lines for the invocation, or an empty array when it passed and passing details are hidden.
   * @example
   * ```ts
   * import { Assert, TestMethodResult, TestOutcome, TestReportWriter } from "@noldova/context.testing";
   *
   * const writer = new TestReportWriter();
   * const methodResult = new TestMethodResult("Sample", "SampleTests", "passes", undefined, [], TestOutcome.Passed, 1, undefined, undefined);
   * Assert.isTrue(writer.formatMethodLines(methodResult, false)[0]?.includes("passes (1 ms)") ?? false);
   * Assert.areEqual(0, writer.formatMethodLines(methodResult, true).length);
   * ```
   */
  public formatMethodLines(methodResult: TestMethodResult, skipPassingDetails: boolean): string[];

  /**
   * Returns a class's block from its heading and its invocations' entries, as {@link TestReportWriter.formatClassLines} does for a whole class
   * result.
   *
   * @param heading The class's heading, as {@link TestReportWriter.formatClassHeading} returns it.
   * @param methodLines The entries of the class's invocations in order, as {@link TestReportWriter.formatMethodLines} returns them.
   * @param skipPassingDetails True to hide the whole block when no entry is presented.
   * @returns Fresh lines: the heading, the entries, and a closing blank line; or an empty array when passing details are hidden and there are no
   * entries.
   * @example
   * ```ts
   * import { Assert, TestReportWriter } from "@noldova/context.testing";
   *
   * const writer = new TestReportWriter();
   * Assert.areEqual(3, writer.formatClassBlock("Sample/sample.test.js — SampleTests", ["  entry"], true).length);
   * Assert.areEqual(0, writer.formatClassBlock("Sample/sample.test.js — SampleTests", [], true).length);
   * ```
   */
  public formatClassBlock(heading: string, methodLines: readonly string[], skipPassingDetails: boolean): string[];

  /**
   * Returns the totals that close a report: a separator, then for a filtered run its filters and its discovered, selected and unselected
   * counts, then the invocation count, the totals' duration, and the passed count, followed by the failed and skipped counts when either is
   * non-zero.
   *
   * @param totals The totals presented, a whole {@link TestRunResult} or the {@link TestRunTotals} a run counted; formatting does not mutate them.
   * @param selection What the run selected out of what it discovered; its rows appear only when it is filtered. Defaults to none.
   * @returns Fresh human-readable lines. No console output is performed.
   * @example
   * ```ts
   * import { Assert, TestReportWriter, TestRunTotals, TestSelection } from "@noldova/context.testing";
   *
   * const lines = new TestReportWriter().formatSummaryLines(new TestRunTotals(2, 0, 0, 5), new TestSelection(["Alpha"], 6, 2));
   * Assert.isTrue(lines.includes("Unselected: 4"));
   * ```
   */
  public formatSummaryLines(totals: TestRunTotals, selection?: TestSelection): string[];
}

/**
 * Writes a run to a console while it progresses: each class block as soon as its class finishes, then the totals. In an interactive terminal it
 * also keeps an animated "Running tests" line below the written blocks until the totals are written. The blocks are those of
 * {@link TestReportWriter}, so output that is no terminal holds exactly the report's lines.
 *
 * @example
 * ```ts
 * import { Assert, TestClassResult, TestConsoleReporter, TestMethodResult, TestOutcome, TestRunResult } from "@noldova/context.testing";
 *
 * const output: string[] = [];
 * const reporter = new TestConsoleReporter(t => output.push(t), false, false);
 * const classResult = new TestClassResult("Sample", "SampleTests", "sample.test.js", [
 *   new TestMethodResult("Sample", "SampleTests", "passes", undefined, [], TestOutcome.Passed, 1, undefined, undefined)]);
 * reporter.start();
 * reporter.onClassCompleted(classResult);
 * reporter.writeSummary(new TestRunResult([classResult]));
 * Assert.isTrue(output[0]?.startsWith("Sample/sample.test.js — SampleTests") ?? false);
 * Assert.isTrue(output.join("").includes("Total:      1"));
 * // With isInteractive true, start() shows the progress line and writeSummary(result) removes it.
 * ```
 */
export declare class TestConsoleReporter implements ITestProgressListener {
  /**
   * Initializes a reporter for one run.
   *
   * @param write Receives each piece of console text exactly as written, including control sequences and line feeds; it must not add its own.
   * @param isInteractive True when the text reaches an interactive terminal, which shows the progress line; false writes the report's lines only.
   * @param skipPassingDetails True to hide passing invocations and fully passing classes. Failures, skips, and totals remain visible.
   * @param clock The clock that times the progress line's animation. Defaults to the system clock, whose timer never keeps the process alive.
   *
   * See {@link TestConsoleReporter} for usage examples.
   */
  public constructor(write: (text: string) => void, isInteractive: boolean, skipPassingDetails: boolean, clock?: IClock);

  /**
   * Shows the progress line and keeps it animated until {@link TestConsoleReporter.stop} or
   * {@link TestConsoleReporter.writeSummary}. Does nothing when the output is not interactive. Call it once per run. The animation's timer never
   * keeps the process alive, and it advances only while the thread writing it is free; the command-line run keeps that thread free by running
   * the tests in a worker.
   *
   * See {@link TestConsoleReporter} for usage examples.
   */
  public start(): void;

  /**
   * Writes one finished class's block above the progress line, as {@link TestReportWriter.formatClassLines} formats it. A class whose block is
   * empty writes nothing. Passing the reporter to {@link TestRunner.runAsync} calls this for every class as it finishes.
   *
   * @param classResult The finished class's result; writing does not mutate it.
   *
   * See {@link TestConsoleReporter} for usage examples.
   */
  public onClassCompleted(classResult: TestClassResult): void;

  /**
   * Writes one finished class's block above the progress line as already formatted lines, such as a test worker formats them with
   * {@link TestReportWriter.formatClassLines}. An empty block writes nothing.
   *
   * @param lines The block's lines, without line feeds; writing does not mutate them.
   *
   * See {@link TestConsoleReporter} for usage examples.
   */
  public writeClassLines(lines: readonly string[]): void;

  /**
   * Removes the progress line and stops its animation, for a run that ends without totals. Does nothing when no progress line is shown, so it
   * may be called more than once.
   *
   * See {@link TestConsoleReporter} for usage examples.
   */
  public stop(): void;

  /**
   * Removes the progress line, when one is shown, and writes the run's totals as
   * {@link TestReportWriter.formatSummaryLines} formats them.
   *
   * @param totals The finished run's totals, a whole {@link TestRunResult} or the {@link TestRunTotals} a run counted; writing does not mutate
   *   them.
   * @param selection What the run selected out of what it discovered; its rows appear only when it is filtered. Defaults to none.
   *
   * See {@link TestConsoleReporter} for usage examples.
   */
  public writeSummary(totals: TestRunTotals, selection?: TestSelection): void;
}

/**
 * One contiguous span of source lines, 1-based and inclusive.
 *
 * @example
 * ```ts
 * import { Assert, LineRange } from "@noldova/context.testing";
 *
 * Assert.areEqual("3", new LineRange(3, 3).displayText);
 * Assert.areEqual("3-5", new LineRange(3, 5).displayText);
 * ```
 */
export declare class LineRange {
  /**
   * The inclusive 1-based first line.
   */
  public readonly startLine: number;

  /**
   * The inclusive 1-based final line.
   */
  public readonly endLine: number;

  /**
   * The range as `start` or `start-end` for reports.
   */
  public readonly displayText: string;

  /**
   * Initializes the range.
   *
   * @param startLine The positive integer, 1-based first line, inclusive.
   * @param endLine The integer, 1-based last line, inclusive; must be at least startLine.
   * @throws ArgumentOutOfRangeException if startLine is not a positive integer or endLine is not an integer at least startLine.
   *
   * See {@link LineRange} for usage examples.
   */
  public constructor(startLine: number, endLine: number);
}

/**
 * One coverage block: a distinct instrumented V8 block range, excluding
 * function roots, and whether any test run entered it.
 *
 * @example
 * ```ts
 * import { Assert, BlockCoverage } from "@noldova/context.testing";
 *
 * const block = new BlockCoverage(7, true);
 * Assert.areEqual(7, block.line);
 * Assert.isTrue(block.isTaken);
 * ```
 */
export declare class BlockCoverage {
  /**
   * The 1-based source line containing the instrumented block.
   */
  public readonly line: number;

  /**
   * True when at least one test execution entered the block.
   */
  public readonly isTaken: boolean;

  /**
   * Initializes the block coverage.
   *
   * @param line The positive integer, 1-based line number.
   * @param isTaken Whether any measured run entered this instrumented block.
   * @throws ArgumentOutOfRangeException if line is not a positive integer.
   *
   * See {@link BlockCoverage} for usage examples.
   */
  public constructor(line: number, isTaken: boolean);
}

/**
 * The flat Source Map v3 payload emitted by the pinned TypeScript bootstrap and
 * consumed by `SourceMap`.
 *
 * @example
 * ```ts
 * import { Assert, type ISourceMapData, SourceMap } from "@noldova/context.testing";
 *
 * const data: ISourceMapData = { version: 3, sources: ["sample.ts"], mappings: "AAAA" };
 * Assert.areEqual(1, new SourceMap(data, ".").mapToSource(1, 0)?.line);
 * ```
 */
export declare interface ISourceMapData {
  /**
   * The Source Map schema version; only version 3 is accepted.
   */
  readonly version: number;

  /**
   * The ordered original-source paths referenced by mapping segments.
   */
  readonly sources: readonly string[];

  /**
   * The base64 VLQ-encoded generated-to-original mappings.
   */
  readonly mappings: string;

  /**
   * The optional source-root prefix applied during source-path resolution.
   */
  readonly sourceRoot?: string;

  /**
   * The optional symbol-name table referenced by five-field segments.
   */
  readonly names?: readonly string[];
}

/**
 * An original source file and its mapped 1-based line. This model does not
 * contain a character coordinate.
 *
 * @example
 * ```ts
 * import { Assert, MappedSourceLine } from "@noldova/context.testing";
 *
 * const position = new MappedSourceLine("/project/sample.ts", 12);
 * Assert.areEqual(12, position.line);
 * // MappedSourceLine stores the supplied path; SourceMap performs path resolution.
 * ```
 */
export declare class MappedSourceLine {
  /**
   * The original-source path supplied to this model; no normalization is performed.
   */
  public readonly sourcePath: string;

  /**
   * The resolved 1-based original source line.
   */
  public readonly line: number;

  /**
   * Records the original source file and its mapped line.
   *
   * @param sourcePath The non-whitespace original source path to store. This model does not resolve or normalize it.
   * @param line The positive integer, 1-based line number.
   * @throws ArgumentException if sourcePath is blank.
   * @throws ArgumentOutOfRangeException if line is not a positive integer.
   *
   * See {@link MappedSourceLine} for usage examples.
   */
  public constructor(sourcePath: string, line: number);
}

/**
 * A decoded flat Source Map v3 document from the pinned TypeScript bootstrap.
 * Maps generated positions back to the original sources; source paths resolve
 * against the map's directory.
 *
 * @example
 * ```ts
 * import { Assert, SourceMap } from "@noldova/context.testing";
 *
 * const map = new SourceMap({ version: 3, sources: ["sample.ts"], mappings: "AAKA;;AACA" }, ".");
 * Assert.areEqual(6, map.mapToSource(1, 0)?.line);
 * Assert.isUndefined(map.mapToSource(2, 0)); // No mapping on this generated line.
 * Assert.areEqual(7, map.mapToSource(3, 0)?.line);
 * ```
 */
export declare class SourceMap {
  /**
   * Initializes the map from its parsed payload and the directory containing
   * the map file. Fails unless the payload is a valid flat Source Map v3
   * document within the accepted TypeScript bootstrap subset.
   *
   * @param data The typed flat Source Map v3 payload from the pinned emitter. The caller validates external JSON shape before supplying this model.
   * @param mapDirectory The non-whitespace directory containing the map, used to resolve sourceRoot and source paths.
   * @throws ArgumentException if mapDirectory is blank.
   * @throws TestingException if the version or encoded mapping is outside the supported flat v3 subset.
   *
   * See {@link SourceMap} for usage examples.
   */
  public constructor(data: ISourceMapData, mapDirectory: string);

  /**
   * Maps a generated 1-based line and 0-based column to its original source file and line,
   * using the nearest preceding segment on the same generated line; undefined
   * when no segment maps that position. Invalid coordinates throw
   * `ArgumentOutOfRangeException`.
   *
   * @param generatedLine The positive integer, 1-based line in generated JavaScript.
   * @param generatedColumn The non-negative integer, 0-based column in generated JavaScript.
   * @returns The mapped original path and 1-based line, or undefined before the first mapped segment, on an unmapped segment, or outside mapped lines. It
   *   never borrows a mapping from another line.
   * @throws ArgumentOutOfRangeException if the generated coordinates are negative, fractional, or the line is zero.
   *
   * See {@link SourceMap} for usage examples.
   */
  public mapToSource(generatedLine: number, generatedColumn: number): MappedSourceLine | undefined;
}

/**
 * One explicitly identified production project included in a coverage run.
 *
 * @example
 * ```ts
 * import { Assert, CoverageProject } from "@noldova/context.testing";
 *
 * const project = new CoverageProject("Sample", "./installed/sample", "./src/sample");
 * Assert.areEqual("Sample", project.name);
 * // The first root contains emitted .js files; the second resolves displayed source paths.
 * ```
 */
export declare class CoverageProject {
  /**
   * The canonical project identity shown in coverage reports.
   */
  public readonly name: string;

  /**
   * The directory containing the installed production JavaScript files.
   */
  public readonly productionDirectory: string;

  /**
   * The directory against which mapped source paths are reported.
   */
  public readonly sourceDirectory: string;

  /**
   * Initializes the explicit project identity and its production and source
   * roots.
   *
   * @param name The non-whitespace project identity to display.
   * @param productionDirectory The non-whitespace root of installed production JavaScript to inventory, including files no test loads.
   * @param sourceDirectory The non-whitespace source root used for mapped display paths; mapped files must stay within it.
   * @throws ArgumentException if the name or either directory is blank.
   *
   * See {@link CoverageProject} for usage examples.
   */
  public constructor(name: string, productionDirectory: string, sourceDirectory: string);
}

/**
 * The coverage state of one production file. During bootstrap, lengths measure
 * generated JavaScript UTF-16 code units, including text inside claimed ranges,
 * not a count of original TypeScript statements or branches.
 *
 * @example
 * ```ts
 * import { Assert, BlockCoverage, FileCoverage, LineRange } from "@noldova/context.testing";
 *
 * const partial = new FileCoverage("Sample", "sample.ts", [new LineRange(3, 3)], 100, 20, [new BlockCoverage(3, false)]);
 * Assert.isFalse(partial.isFullyCovered);
 * const inert = new FileCoverage("Sample", "types.ts", [], 0, 0, []);
 * Assert.isFalse(inert.isExecutable);
 * Assert.isFalse(inert.isFullyCovered);
 * ```
 */
export declare class FileCoverage {
  /**
   * The canonical identity of the file's project.
   */
  public readonly projectName: string;

  /**
   * The file path relative to its declared project root.
   */
  public readonly relativePath: string;

  /**
   * The uncovered 1-based source-line ranges.
   */
  public readonly uncoveredLineRanges: readonly LineRange[];

  /**
   * The measured generated JavaScript length in UTF-16 code units; zero for
   * inert files. This is not a count of executable statements.
   */
  public readonly totalLength: number;

  /**
   * The uncovered executable source length measured in code units.
   */
  public readonly uncoveredLength: number;

  /**
   * The distinct instrumented blocks of the file, excluding function roots.
   * Their taken count is reported separately from code-unit completion.
   */
  public readonly blockCoverages: readonly BlockCoverage[];

  /**
   * True when the file is executable and has no uncovered range.
   */
  public readonly isFullyCovered: boolean;

  /**
   * True when the file contains executable source ranges. Type-only and other
   * inert files remain in the inventory but do not enter coverage totals.
   */
  public readonly isExecutable: boolean;

  /**
   * The number of distinct instrumented blocks.
   */
  public readonly blockCount: number;

  /**
   * The number of blocks entered by at least one test run.
   */
  public readonly takenBlockCount: number;

  /**
   * Initializes the file coverage; fails when the uncovered line ranges and
   * the uncovered length disagree about whether anything is uncovered, or
   * when a length is negative, fractional, or exceeds the total.
   *
   * @param projectName The non-whitespace canonical project identity.
   * @param relativePath The non-whitespace project-relative displayed path, using the source root when mapped and the production root otherwise.
   * @param uncoveredLineRanges The uncovered, inclusive line ranges. Empty exactly when uncoveredLength is zero. The array is copied; ranges are shared.
   * @param totalLength The non-negative integer length measured in generated JavaScript UTF-16 code units; zero marks an inert file.
   * @param uncoveredLength The non-negative integer count of uncovered code units; cannot exceed totalLength.
   * @param blockCoverages Distinct instrumented blocks, excluding function roots. Must be empty for an inert file. The array is copied; blocks are shared.
   * @throws ArgumentException if identity/path is blank, uncovered ranges disagree with uncoveredLength, or an inert file has blocks.
   * @throws ArgumentOutOfRangeException if lengths are negative, fractional, or uncoveredLength exceeds totalLength.
   *
   * See {@link FileCoverage} for usage examples.
   */
  public constructor(
    projectName: string,
    relativePath: string,
    uncoveredLineRanges: readonly LineRange[],
    totalLength: number,
    uncoveredLength: number,
    blockCoverages: readonly BlockCoverage[]);
}

/**
 * The aggregated coverage of one complete test run.
 *
 * @example
 * ```ts
 * import { Assert, CoverageResult, FileCoverage } from "@noldova/context.testing";
 *
 * const result = new CoverageResult([
 *   new FileCoverage("Sample", "sample.ts", [], 100, 0, []),
 *   new FileCoverage("Sample", "types.ts", [], 0, 0, [])
 * ]);
 * Assert.isTrue(result.isComplete);
 * Assert.areEqual(1, result.executableFileCoverages.length);
 * Assert.areEqual(100, result.totalLength);
 * ```
 */
export declare class CoverageResult {
  /**
   * The coverage state of every inventoried production file.
   */
  public readonly fileCoverages: readonly FileCoverage[];

  /**
   * True when every executable file is fully covered.
   */
  public readonly isComplete: boolean;

  /**
   * The inventoried files that contain executable source ranges.
   */
  public readonly executableFileCoverages: readonly FileCoverage[];

  /**
   * The files that still have uncovered ranges.
   */
  public readonly incompleteFileCoverages: readonly FileCoverage[];

  /**
   * The summed executable length of every inventoried file.
   */
  public readonly totalLength: number;

  /**
   * The summed uncovered length across every measured file.
   */
  public readonly uncoveredLength: number;

  /**
   * The summed block count across every measured file.
   */
  public readonly blockCount: number;

  /**
   * The summed taken-block count across every measured file.
   */
  public readonly takenBlockCount: number;

  /**
   * Initializes the result.
   *
   * @param fileCoverages The inventoried file results, including inert files. The array is copied; file objects are shared.
   *
   * See {@link CoverageResult} for usage examples.
   */
  public constructor(fileCoverages: readonly FileCoverage[]);
}

/**
 * Terminal presentation of a coverage result: one percentage per executable
 * production file, not-applicable markers for inert files, uncovered line
 * ranges, and the overall total. The structured result remains the authority;
 * no consumer parses this output.
 *
 * @example
 * ```ts
 * import { Assert, CoverageReportWriter, CoverageResult, FileCoverage } from "@noldova/context.testing";
 *
 * const result = new CoverageResult([new FileCoverage("Sample", "types.ts", [], 0, 0, [])]);
 * const lines = new CoverageReportWriter().formatLines(result, false);
 * Assert.isTrue(lines.some(t => t.includes("types.ts")));
 * Assert.isTrue(lines.every(t => !t.includes("100.0%"))); // Inert files display "-".
 * ```
 */
export declare class CoverageReportWriter {
  /**
   * Returns the report lines without writing them.
   *
   * @param result The structured result to present; formatting does not mutate it.
   * @param skipCoveredDetails True to omit fully covered and inert file rows. Incomplete files, uncovered lines, and the overall row remain visible.
   * @returns Fresh ANSI-colored table lines. Inert files display a not-applicable marker and do not contribute to executable-file totals.
   *
   * See {@link CoverageReportWriter} for usage examples.
   */
  public formatLines(result: CoverageResult, skipCoveredDetails: boolean): string[];
}

/**
 * Reads the V8 coverage reports written by a test-run child process and
 * computes the uncovered line ranges of the production files.
 *
 * @example
 * ```ts
 * import { CoverageAnalyzer, CoverageProject, CoverageResult } from "@noldova/context.testing";
 *
 * export async function measureAsync(coverageDirectory: string, installedDirectory: string, sourceDirectory: string): Promise<CoverageResult> {
 *   return new CoverageAnalyzer().analyzeAsync(coverageDirectory, [
 *     new CoverageProject("Sample", installedDirectory, sourceDirectory)
 *   ]);
 * }
 * // Supply fresh V8 reports and the production inventory from the same build.
 * ```
 */
export declare class CoverageAnalyzer {
  /**
   * Analyzes every report in the coverage directory against the complete
   * inventory of `.js` files beneath the projects' production directories,
   * merging coverage across processes. A file the reports never mention
   * counts as fully uncovered unless it holds no executable content; a
   * position no report claims counts as uncovered; a missing source map falls
   * back to generated coordinates, while a malformed report, source map, or
   * source path outside its declared project root fails the analysis. An empty
   * inventory fails.
   *
   * @param coverageDirectory The non-whitespace directory of V8 coverage JSON reports from the matching build.
   * @param projects The non-empty explicit production-project inventory, with installed and original-source roots.
   * @returns A promise resolving to inventory-wide coverage merged across reports. Missing files in reports count as uncovered unless inert.
   * @throws ArgumentException via promise rejection if coverageDirectory is blank or projects is empty.
   * @throws TestingException via promise rejection for an empty production inventory, malformed reports/maps, out-of-file ranges, or mapped paths outside
   *   their declared roots.
   * @throws Error via promise rejection for host I/O failures. An absent source map alone falls back to generated coordinates.
   *
   * See {@link CoverageAnalyzer} for usage examples.
   */
  public analyzeAsync(coverageDirectory: string, projects: readonly CoverageProject[]): Promise<CoverageResult>;
}
