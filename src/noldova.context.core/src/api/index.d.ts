/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Describes the member-name projection supplied to a {@link nameof} selector,
 * not an instance of the selected type. Each property has its own key as its
 * value type, is readonly, and is required even when the original is optional.
 * Only string-keyed members can be returned by `nameof`.
 *
 * @template T The type whose member names the selector may access.
 * @example
 * ```ts
 * import { nameof, type NameofSelector } from "@noldova/context.core";
 *
 * const selectEmpty = (t: NameofSelector<StringConstructor>): "empty" => t.empty;
 * nameof<StringConstructor>(selectEmpty); // "empty"
 * ```
 */
export declare type NameofSelector<T> = { readonly [TName in keyof T]-?: TName; };

/**
 * Returns a string member name checked against `T` during compilation. The
 * runtime returns the string unchanged; it does not inspect an instance of `T`
 * or verify that the named member exists at runtime.
 *
 * @template T The type that declares the member.
 * @param name A string key of `T`. Numeric and symbol keys are not accepted.
 * @returns The supplied member name without conversion or normalization.
 * @example
 * ```ts
 * import { nameof } from "@noldova/context.core";
 *
 * nameof<StringConstructor>("empty"); // "empty"
 * ```
 */
export declare function nameof<T>(name: keyof T & string): string;

/**
 * Returns the name of the single string member selected by the callback.
 *
 * @template T The type that declares the member.
 * @param selector A synchronous callback that reads exactly one string-keyed
 * member from {@link NameofSelector} and returns that member's projected name.
 * It must not traverse nested members or invoke the selected member. During
 * the bootstrap it is invoked once and is not retained.
 * @returns The selected member's name, not the original member's value.
 * @throws {TypeError} If the callback reads no member, reads more than one,
 * selects a symbol, returns a different value, or throws. A callback failure is
 * retained as the resulting error's `cause`.
 * @example
 * ```ts
 * import { nameof } from "@noldova/context.core";
 *
 * nameof<StringConstructor>(t => t.isNullOrEmpty); // "isNullOrEmpty"
 * nameof<StringConstructor>(t => t["empty"]); // "empty"
 * ```
 */
export declare function nameof<T>(selector: (t: NameofSelector<T>) => keyof T & string): string;

declare global {
  /**
   * CONTEXT predicates added to the global `Object` constructor.
   * Import `@noldova/context.core` to install them before use. They inspect
   * values without converting, modifying, or retaining them.
   */
  interface ObjectConstructor {
    /**
     * Identifies primitive big integers, not boxed BigInt objects.
     *
     * @param value Any value to classify; no numeric conversion is attempted.
     * @returns `true` for a primitive `bigint`, narrowing the value to `bigint`;
     * otherwise `false`.
     * @example
     * ```ts
     * import "@noldova/context.core";
     *
     * Object.isBigInt(1n); // true
     * Object.isBigInt(Object(1n)); // false
     * ```
     */
    isBigInt(value: unknown): value is bigint;

    /**
     * Identifies primitive Booleans rather than testing truthiness.
     *
     * @param value Any value to classify, including `false` and boxed Booleans.
     * @returns `true` for `true` or `false`, narrowing the value to `boolean`;
     * otherwise `false`.
     * @example
     * ```ts
     * import "@noldova/context.core";
     *
     * Object.isBoolean(false); // true
     * Object.isBoolean(new Boolean(false)); // false
     * ```
     */
    isBoolean(value: unknown): value is boolean;

    /**
     * Identifies the function category, including class constructors.
     *
     * @param value Any value to classify. The function is not invoked.
     * @returns `true` for a function or class constructor, narrowing the value
     * to `Function`; otherwise `false`. This does not establish a call signature
     * or promise that the value can be invoked without `new`.
     * @example
     * ```ts
     * import "@noldova/context.core";
     *
     * Object.isFunction(() => undefined); // true
     * Object.isFunction(Map); // true; Map still requires new.
     * Object.isFunction({}); // false
     * ```
     */
    isFunction(value: unknown): value is Function;

    /**
     * Distinguishes `null` from `undefined` and other values.
     *
     * @param value Any value to test without conversion.
     * @returns `true` only for `null`, narrowing the value to `null`;
     * otherwise `false`. See {@link ObjectConstructor.isNullOrUndefined} to
     * recognize either nullish value.
     * @example
     * ```ts
     * import "@noldova/context.core";
     *
     * Object.isNull(null); // true
     * Object.isNull(undefined); // false
     * ```
     */
    isNull(value: unknown): value is null;

    /**
     * Recognizes either nullish value without treating other falsy values as absent.
     *
     * @param value Any value to test, including zero, `false`, and empty strings.
     * @returns `true` only for `null` or `undefined`, narrowing to their union;
     * otherwise `false`.
     * @example
     * ```ts
     * import "@noldova/context.core";
     *
     * Object.isNullOrUndefined(undefined); // true
     * Object.isNullOrUndefined(0); // false
     * Object.isNullOrUndefined(""); // false
     * ```
     */
    isNullOrUndefined(value: unknown): value is null | undefined;

    /**
     * Identifies primitive numbers, not necessarily finite or valid measurements.
     *
     * @param value Any value to classify; strings and boxed numbers are not converted.
     * @returns `true` for a primitive `number`, including `NaN` and both infinities,
     * narrowing to `number`; otherwise `false`. Use an additional numeric check
     * when a finite number or an integer is required.
     * @example
     * ```ts
     * import "@noldova/context.core";
     *
     * Object.isNumber(Number.NaN); // true
     * Object.isNumber(Number.POSITIVE_INFINITY); // true
     * Object.isNumber(new Number(1)); // false
     * ```
     */
    isNumber(value: unknown): value is number;

    /**
     * Identifies TypeScript's non-null `object` domain, including functions.
     *
     * @param value Any value to classify, not just a plain object.
     * @returns `true` for objects, arrays, boxed primitives, functions, and class
     * constructors, narrowing to `object`. Returns `false` for null, undefined,
     * and primitive values. No particular object shape or class is established.
     * @example
     * ```ts
     * import "@noldova/context.core";
     *
     * Object.isObject([]); // true
     * Object.isObject(Map); // true
     * Object.isObject(null); // false
     * ```
     */
    isObject(value: unknown): value is object;

    /**
     * Identifies primitive strings, including the empty string.
     *
     * @param value Any value to classify without string conversion.
     * @returns `true` for a primitive string, narrowing to `string`; otherwise
     * `false`, including for boxed strings.
     * @example
     * ```ts
     * import "@noldova/context.core";
     *
     * Object.isString(""); // true
     * Object.isString(new String("")); // false
     * ```
     */
    isString(value: unknown): value is string;

    /**
     * Identifies primitive symbols, not boxed Symbol objects.
     *
     * @param value Any value to classify; a symbol's description is not inspected.
     * @returns `true` for a primitive symbol, narrowing to `symbol`; otherwise `false`.
     * @example
     * ```ts
     * import "@noldova/context.core";
     *
     * Object.isSymbol(Symbol("value")); // true
     * Object.isSymbol(Object(Symbol("value"))); // false
     * ```
     */
    isSymbol(value: unknown): value is symbol;

    /**
     * Distinguishes `undefined` from `null` and other values.
     *
     * @param value Any value to test without conversion.
     * @returns `true` only for `undefined`, narrowing to `undefined`; otherwise
     * `false`. See {@link ObjectConstructor.isNullOrUndefined} for both nullish values.
     * @example
     * ```ts
     * import "@noldova/context.core";
     *
     * Object.isUndefined(undefined); // true
     * Object.isUndefined(null); // false
     * ```
     */
    isUndefined(value: unknown): value is undefined;
  }

  /**
   * CONTEXT values and operations added to the global `String` constructor.
   * Import `@noldova/context.core` to install them before use.
   */
  interface StringConstructor {
    /**
     * The canonical empty string, `""`. This property cannot be reassigned.
     *
     * @example
     * ```ts
     * import "@noldova/context.core";
     *
     * String.empty.length; // 0
     * ```
     */
    readonly empty: string;

    /**
     * Substitutes string or number arguments into positional placeholders.
     *
     * @param template Text containing zero-based argument indexes in braces,
     * such as `{0}` or `{12}`. Indexes use ASCII decimal digits; leading zeros
     * are allowed. Unrecognized or unavailable placeholders remain unchanged.
     * @param formatArguments Values indexed by the placeholders. Numbers use
     * ordinary string conversion, not locale formatting. Unused arguments are
     * ignored; repeated placeholders reuse an argument without consuming it.
     * @returns The resulting string without modifying the template or arguments.
     * Inserted argument text is not interpreted as another placeholder. With no
     * arguments the template is unchanged; an empty template produces an empty string.
     * @example
     * ```ts
     * import "@noldova/context.core";
     *
     * String.format("Hello {0}", "World"); // "Hello World"
     * String.format("Expected {0}", 3); // "Expected 3"
     * String.format("{1}{0}{1}", "first", "second"); // "secondfirstsecond"
     * String.format("{1}", "zero"); // "{1}"
     * String.format("{0}"); // "{0}"
     * ```
     */
    format(template: string, ...formatArguments: (string | number)[]): string;

    /**
     * Recognizes a single ASCII decimal digit.
     *
     * @param character Text to inspect as one character, not a numeric value or
     * a sequence of digits. The text is neither trimmed nor converted.
     * @returns `true` for exactly one character from `0` through `9`; otherwise
     * `false`, including for empty strings and non-ASCII digits.
     * @example
     * ```ts
     * import "@noldova/context.core";
     *
     * String.isAsciiDigit("0"); // true
     * String.isAsciiDigit("10"); // false
     * String.isAsciiDigit("\u0660"); // false: Arabic-Indic zero.
     * ```
     */
    isAsciiDigit(character: string): boolean;

    /**
     * Recognizes a single ASCII hexadecimal digit in either letter case.
     *
     * @param character Text to inspect as one character, without trimming,
     * numeric conversion, or an optional `0x` prefix.
     * @returns `true` for exactly one character from `0` through `9`, `a`
     * through `f`, or `A` through `F`; otherwise `false`.
     * @example
     * ```ts
     * import "@noldova/context.core";
     *
     * String.isAsciiHexDigit("F"); // true
     * String.isAsciiHexDigit("g"); // false
     * String.isAsciiHexDigit("10"); // false
     * ```
     */
    isAsciiHexDigit(character: string): boolean;

    /**
     * Recognizes a single ASCII letter in either case.
     *
     * @param character Text to inspect as one character, without trimming or
     * Unicode normalization. This is not a general Unicode-letter classifier.
     * @returns `true` for exactly one character from `A` through `Z` or `a`
     * through `z`; otherwise `false`, including for accented letters.
     * @example
     * ```ts
     * import "@noldova/context.core";
     *
     * String.isAsciiLetter("A"); // true
     * String.isAsciiLetter("ab"); // false
     * String.isAsciiLetter("\u00e9"); // false: an accented letter.
     * ```
     */
    isAsciiLetter(character: string): boolean;

    /**
     * Recognizes absent or empty text without trimming whitespace.
     *
     * @param value A primitive string, `null`, or `undefined` to test.
     * @returns `true` for null, undefined, or `""`, narrowing to those values;
     * otherwise `false`, narrowing to `string`. Whitespace-only strings return false.
     * @example
     * ```ts
     * import "@noldova/context.core";
     *
     * String.isNullOrEmpty(undefined); // true
     * String.isNullOrEmpty(""); // true
     * String.isNullOrEmpty(" "); // false
     * ```
     */
    isNullOrEmpty(value: string | null | undefined): value is null | undefined | "";

    /**
     * Recognizes absent, empty, or whitespace-only text using the whitespace
     * and line-terminator characters removed by {@link String.trim}.
     *
     * @param value A primitive string, `null`, or `undefined` to test. The
     * original string is not modified.
     * @returns `true` for null, undefined, or a string whose trimmed form is empty;
     * otherwise `false`. This is a Boolean result, not a type predicate: a true
     * result can still represent a nonempty string.
     * @example
     * ```ts
     * import "@noldova/context.core";
     *
     * String.isNullOrWhitespace(" \t\r\n "); // true
     * String.isNullOrWhitespace("\u00a0"); // true: nonbreaking space.
     * String.isNullOrWhitespace("\u200b"); // false: zero-width space.
     * String.isNullOrWhitespace(" value "); // false
     * ```
     */
    isNullOrWhitespace(value: string | null | undefined): boolean;
  }
}

export { };
