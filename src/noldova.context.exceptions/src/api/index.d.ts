/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

/**
 * Options shared by every CONTEXT exception. Pass the preceding failure as
 * `cause` when translating an error without losing its original context.
 */
export declare class ExceptionOptions implements ErrorOptions {
  /**
   * The preceding failure, or `undefined` when omitted. Any value is retained
   * unchanged, including `null`, `false`, zero, and an empty string. Objects
   * are shared by reference, not cloned or converted into another exception.
   */
  public readonly cause: unknown;

  /**
   * Records the cause to supply when constructing an exception.
   *
   * @param cause The original caught value or other failure information. It
   * need not be an `Error`; omission leaves {@link ExceptionOptions.cause}
   * undefined. No truthiness check, formatting, or wrapping is performed.
   * @example
   * ```ts
   * import { ArgumentException, ExceptionOptions } from "@noldova/context.exceptions";
   *
   * const cause = new Error("Invalid encoded input.");
   * const exception = new ArgumentException("Cannot read input.", "input",
   *   new ExceptionOptions(cause));
   * exception.cause === cause; // true
   * new ExceptionOptions(0).cause; // 0, not an absent cause.
   * ```
   */
  public constructor(cause?: unknown);
}

/**
 * The abstract base of CONTEXT exceptions, extending `Error`. The inherited
 * `name` is set to the concrete class name; `cause` retains the supplied
 * preceding failure, and `stack` is supplied by the host.
 *
 * Constructing an exception does not throw it. Raise it with `throw` or an
 * exception-owned guard. Subclasses supply a meaningful concrete identity;
 * they do not need to assign `name` themselves.
 */
export declare abstract class Exception extends Error {
  /**
   * Initializes the message, cause, and concrete class name for a subclass.
   *
   * @param message The complete explanation, preserved verbatim. There is no
   * base default, trimming, or rejection of an explicitly empty string.
   * @param options Optional failure context. Omission supplies no cause;
   * otherwise the value of {@link ExceptionOptions.cause} is retained unchanged.
   * @example
   * ```ts
   * import { Exception, type ExceptionOptions } from "@noldova/context.exceptions";
   *
   * class InputException extends Exception {
   *   public constructor(message: string, options?: ExceptionOptions) {
   *     super(message, options);
   *   }
   * }
   * const exception = new InputException("Cannot read input.");
   * exception.name; // "InputException"
   * exception instanceof Error; // true
   * ```
   */
  protected constructor(message: string, options?: ExceptionOptions);
}

/**
 * The exception that is thrown when an argument does not meet the parameter
 * contract of the called method.
 */
export declare class ArgumentException extends Exception {
  /**
   * The supplied parameter name, preserved verbatim, or `undefined` when
   * omitted. A supplied name is also appended to the message as `(Parameter 'name')`.
   */
  public readonly parameterName: string | undefined;

  /**
   * Creates an invalid-argument exception; the message is the first argument.
   *
   * @param message The explanation before any parameter suffix. Omission or
   * `undefined` uses `"Value does not fall within the expected range."`.
   * An explicitly empty string is preserved.
   * @param parameterName The offending parameter's name, or `undefined` to
   * omit the suffix. A supplied name is stored and appended without normalization.
   * @param options Optional context retaining the original cause unchanged.
   * @example
   * ```ts
   * import { ArgumentException } from "@noldova/context.exceptions";
   *
   * const exception = new ArgumentException("Bad value.", "input");
   * exception.message; // "Bad value. (Parameter 'input')"
   * new ArgumentException("").message; // "", not the default message.
   * ```
   */
  public constructor(message?: string, parameterName?: string, options?: ExceptionOptions);

  /**
   * Requires a present, nonempty string. Returning normally narrows the
   * caller's value to `string`; it does not trim or otherwise change it.
   *
   * @param value The string or nullish value to validate. Nonempty whitespace
   * is accepted; use {@link ArgumentException.throwIfNullOrWhitespace} to reject it.
   * @param parameterName The caller's parameter name, included in the thrown
   * exception's metadata and message. It is supplied explicitly, not inferred.
   * @throws {ArgumentException} If `value` is null, undefined, or empty. This
   * guard uses `ArgumentException` even for nullish input, not `ArgumentNullException`.
   * @example
   * ```ts
   * const input = new Map([["input", "value"]]).get("input");
   * ArgumentException.throwIfNullOrEmpty(input, "input");
   * input.length; // 5; the guard excludes undefined from the lookup result.
   * ArgumentException.throwIfNullOrEmpty(" ", "input"); // Accepted.
   * ```
   */
  public static throwIfNullOrEmpty(value: string | null | undefined, parameterName: string): asserts value is string;

  /**
   * Requires a string containing a non-whitespace character. Returning
   * normally narrows the caller's value to `string` without trimming it.
   *
   * @param value The string or nullish value to validate. Whitespace follows
   * the characters removed by the host's `String.trim`, including line terminators.
   * @param parameterName The caller's parameter name, included in the exception.
   * @throws {ArgumentException} If `value` is null, undefined, empty, or
   * whitespace-only. Nullish input still throws `ArgumentException`.
   * @example
   * ```ts
   * import { ArgumentException } from "@noldova/context.exceptions";
   *
   * const input = new Map([["input", " value "]]).get("input");
   * ArgumentException.throwIfNullOrWhitespace(input, "input");
   * input.length; // 7: surrounding spaces are preserved.
   * ```
   */
  public static throwIfNullOrWhitespace(value: string | null | undefined, parameterName: string): asserts value is string;

  /**
   * Requires at least one element and narrows the array to a non-empty
   * readonly tuple so its first element can be accessed without an undefined check.
   *
   * @template T The array's element type, which is not inspected or narrowed.
   * @param value The array to validate. It is not copied, mutated, or retained;
   * this check establishes its length at the call, not permanent immutability.
   * @param parameterName The caller's parameter name, included in the exception.
   * @throws {ArgumentException} If the array contains no elements.
   * @example
   * ```ts
   * import { ArgumentException } from "@noldova/context.exceptions";
   *
   * const values: readonly string[] = ["value"];
   * ArgumentException.throwIfEmpty(values, "values");
   * values[0].length; // 5
   * ```
   */
  public static throwIfEmpty<T>(value: readonly T[], parameterName: string): asserts value is readonly [T, ...T[]];
}

/**
 * The exception that is thrown when a null or undefined argument is passed
 * to a method that does not accept one. It specializes {@link ArgumentException};
 * unlike the base constructor, its constructor takes `parameterName` first.
 */
export declare class ArgumentNullException extends ArgumentException {
  /**
   * Creates a null-argument exception for the supplied parameter.
   *
   * @param parameterName The offending parameter's name, or `undefined` to
   * omit the message suffix and leave the metadata undefined.
   * @param message The explanation before the suffix. Omission or `undefined`
   * uses `"Value cannot be null or undefined."`; an explicit empty string is kept.
   * @param options Optional context retaining the original cause unchanged.
   * @example
   * ```ts
   * import { ArgumentNullException } from "@noldova/context.exceptions";
   *
   * const exception = new ArgumentNullException("input");
   * exception.parameterName; // "input"
   * exception.message; // "Value cannot be null or undefined. (Parameter 'input')"
   * ```
   */
  public constructor(parameterName?: string, message?: string, options?: ExceptionOptions);

  /**
   * Requires a non-nullish value and narrows it to `NonNullable<T>` on return.
   *
   * @template T The input type, which may include null or undefined.
   * @param value The value to validate without conversion. Other falsy values,
   * including zero, `false`, and the empty string, are accepted unchanged.
   * @param parameterName The caller's parameter name, included in the exception.
   * @throws {ArgumentNullException} If `value` is null or undefined.
   * @example
   * ```ts
   * const count = new Map([["count", 0]]).get("count");
   * ArgumentNullException.throwIfNull(count, "count");
   * count + 1; // 1: zero is a valid non-nullish value.
   * ```
   */
  public static throwIfNull<T>(value: T, parameterName: string): asserts value is NonNullable<T>;
}

/**
 * The exception that is thrown when an argument lies outside the range
 * accepted by the called method.
 */
export declare class ArgumentOutOfRangeException extends ArgumentException {
  /**
   * The rejected value, or `undefined` when omitted. Objects and other values
   * are retained unchanged, not cloned or converted. This is separate metadata;
   * it is not automatically inserted into the exception message.
   */
  public readonly actualValue: unknown;

  /**
   * Creates a range exception; the parameter name and rejected value come first.
   *
   * @param parameterName The offending parameter's name, or `undefined` to
   * omit the suffix and leave {@link ArgumentException.parameterName} undefined.
   * @param actualValue The rejected value to retain for inspection. Omission
   * leaves {@link ArgumentOutOfRangeException.actualValue} undefined.
   * @param message The explanation before the suffix. Omission or `undefined`
   * uses `"The argument must be within the valid range."`; an empty string is kept.
   * @param options Optional context retaining the original cause unchanged.
   * @example
   * ```ts
   * import { ArgumentOutOfRangeException } from "@noldova/context.exceptions";
   *
   * const exception = new ArgumentOutOfRangeException("index", 5, "Invalid index.");
   * exception.actualValue; // 5
   * exception.message; // "Invalid index. (Parameter 'index')"
   * ```
   */
  public constructor(parameterName?: string, actualValue?: unknown, message?: string, options?: ExceptionOptions);

  /**
   * Requires a finite positive integer, using the `Number.isInteger` classification.
   * It does not establish a narrower TypeScript type and returns no value.
   *
   * @param value The number to validate. It must be greater than zero and have
   * no fractional part. This is not a safe-integer check; callers enforce any
   * precision requirement or application-specific upper limit separately.
   * @param parameterName The caller's parameter name, included in the exception.
   * @param message An optional explanation replacing the default out-of-range
   * text. The parameter suffix is still appended; an explicit empty message is kept.
   * @throws {ArgumentOutOfRangeException} If the value is zero, negative,
   * fractional, `NaN`, or either infinity. The exception retains `parameterName`
   * and the rejected number as `actualValue`.
   * @example
   * ```ts
   * import { ArgumentOutOfRangeException } from "@noldova/context.exceptions";
   *
   * ArgumentOutOfRangeException.throwIfNotPositiveInteger(1, "count"); // Accepted.
   * ArgumentOutOfRangeException.throwIfNotPositiveInteger(
   *   Number.MAX_SAFE_INTEGER + 1, "count"); // Also accepted: no safe-integer limit.
   * ```
   */
  public static throwIfNotPositiveInteger(value: number, parameterName: string, message?: string): void;
}

/**
 * The exception that is thrown when indexed access addresses no element of
 * the target collection or span.
 */
export declare class IndexOutOfRangeException extends Exception {
  /**
   * Creates an exception describing invalid indexed access.
   *
   * @param message The explanation. Omission or `undefined` uses
   * `"The index must be within the valid range."`. An empty string is preserved.
   * @param options Optional context retaining the original cause unchanged.
   * @example
   * ```ts
   * import { IndexOutOfRangeException } from "@noldova/context.exceptions";
   *
   * new IndexOutOfRangeException().message; // "The index must be within the valid range."
   * new IndexOutOfRangeException("").message; // ""
   * ```
   */
  public constructor(message?: string, options?: ExceptionOptions);
}
