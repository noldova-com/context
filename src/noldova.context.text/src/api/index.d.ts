/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

declare global {
  /**
   * Text operations added to the global `String` constructor.
   *
   * @example
   * ```ts
   * import "@noldova/context.text";
   *
   * String.isAsciiBinaryDigit("1"); // true
   * String.isAsciiBinaryDigit("2"); // false
   * String.isAsciiOctalDigit("7"); // true
   * String.isAsciiOctalDigit("8"); // false
   * String.isAsciiOctalDigit("07"); // false: not one character.
   * ```
   */
  interface StringConstructor {
    /**
     * Identifies a single ASCII binary digit.
     *
     * @param character The complete string to classify; no trimming or numeric
     * conversion is performed.
     * @returns True only for `"0"` or `"1"`. Empty strings, longer strings,
     * and non-ASCII digits return false.
     * @example
     * ```ts
     * import "@noldova/context.text";
     *
     * String.isAsciiBinaryDigit("1"); // true
     * String.isAsciiBinaryDigit("10"); // false: not one character.
     * ```
     */
    isAsciiBinaryDigit(character: string): boolean;

    /**
     * Identifies a single ASCII octal digit.
     *
     * @param character The complete string to classify; no trimming or numeric
     * conversion is performed.
     * @returns True only for one character from `"0"` through `"7"`. Empty
     * strings, longer strings, and non-ASCII digits return false.
     * @example
     * ```ts
     * import "@noldova/context.text";
     *
     * String.isAsciiOctalDigit("7"); // true
     * String.isAsciiOctalDigit("8"); // false
     * ```
     */
    isAsciiOctalDigit(character: string): boolean;
  }
}

/**
 * Defines a language's line-terminator policy for UTF-16 text.
 * Sequence recognition and single-code-unit classification are distinct operations.
 * This contract does not select the host operating system's newline convention.
 *
 * @see {@link EcmaScriptLineTerminator} for a concrete policy and examples.
 */
export declare abstract class LineTerminator {
  /**
   * Examines the sequence beginning at one UTF-16 position.
   *
   * @param value The complete text to inspect, without changing or normalizing it.
   * @param index The zero-based UTF-16 offset to inspect. Must be an integer
   * between zero and `value.length`, inclusive.
   * @returns The recognized sequence's length in code units, or zero for an
   * ordinary position or the end of the string.
   * @example
   * ```ts
   * import { EcmaScriptLineTerminator, LineTerminator } from "@noldova/context.text";
   *
   * const terminator: LineTerminator = new EcmaScriptLineTerminator();
   * terminator.getLength("a\r\nb", 1); // 2: CRLF.
   * terminator.getLength("ab", 1); // 0: an ordinary position.
   * ```
   */
  public abstract getLength(value: string, index: number): 0 | 1 | 2;

  /**
   * Classifies one complete code unit as a line terminator.
   *
   * @param character The whole string to classify, not a position within a
   * larger string. Only a one-code-unit string can qualify.
   * @returns True when that code unit is a line terminator under this policy.
   * Empty strings and multi-code-unit strings return false.
   * @example
   * ```ts
   * import { EcmaScriptLineTerminator, LineTerminator } from "@noldova/context.text";
   *
   * const terminator: LineTerminator = new EcmaScriptLineTerminator();
   * terminator.isLineTerminator("\n"); // true
   * terminator.isLineTerminator(""); // false
   * ```
   */
  public abstract isLineTerminator(character: string): boolean;
}

/**
 * Recognizes the ECMAScript sequences CRLF, CR, LF, U+2028, and U+2029.
 * It does not treat U+0085 as a line terminator.
 *
 * @example
 * ```ts
 * import { EcmaScriptLineTerminator } from "@noldova/context.text";
 *
 * const terminator = new EcmaScriptLineTerminator();
 * terminator.getLength("a\r\nb", 1); // 2: CRLF.
 * terminator.getLength("a\r\nb", 2); // 1: LF at the requested position.
 * terminator.getLength("", 0); // 0: end of text.
 * terminator.isLineTerminator("\u2028"); // true
 * terminator.isLineTerminator("\r\n"); // false: two code units.
 * ```
 */
export declare class EcmaScriptLineTerminator extends LineTerminator {
  /**
   * Recognizes a line-terminator sequence at the requested position.
   *
   * @param value The complete text to inspect without modifying it.
   * @param index The zero-based UTF-16 offset. An offset equal to the string's
   * length is valid and represents the end of text.
   * @returns Two for CRLF; one for CR, LF, U+2028, or U+2029; otherwise zero.
   * Recognition starts exactly at `index` and does not look behind it.
   * @throws {ArgumentOutOfRangeException} Synchronously, when the index is
   * non-integer, negative, or greater than the string's length.
   * @example
   * ```ts
   * import { EcmaScriptLineTerminator } from "@noldova/context.text";
   *
   * const terminator = new EcmaScriptLineTerminator();
   * terminator.getLength("a\rb", 1); // 1: CR alone.
   * terminator.getLength("a", 1); // 0: the end of text.
   * terminator.getLength("a", 2); // Throws ArgumentOutOfRangeException.
   * ```
   */
  public override getLength(value: string, index: number): 0 | 1 | 2;

  /**
   * Classifies a single ECMAScript line-terminator code unit.
   *
   * @param character The whole string to classify. It is not trimmed,
   * split, or normalized.
   * @returns True only for CR, LF, U+2028, or U+2029. In particular, CRLF
   * returns false here; use {@link EcmaScriptLineTerminator.getLength} for sequences.
   * @example
   * ```ts
   * import { EcmaScriptLineTerminator } from "@noldova/context.text";
   *
   * const terminator = new EcmaScriptLineTerminator();
   * terminator.isLineTerminator(""); // true
   * terminator.isLineTerminator("\u0085"); // false: NEL is not an ECMAScript line terminator.
   * ```
   */
  public override isLineTerminator(character: string): boolean;
}

/**
 * An immutable UTF-16 view backed by an existing string.
 *
 * Creating or slicing a span creates a view object without copying its
 * represented characters. The view retains its backing source string, even
 * when it represents only a small or empty range of a large source.
 * Indexes and lengths count code units, not Unicode code points or displayed
 * characters; a view may include only one half of a surrogate pair.
 *
 * @example
 * ```ts
 * import { ReadOnlyStringSpan } from "@noldova/context.text";
 *
 * const span = new ReadOnlyStringSpan("hello world", 6, 5);
 * span.toString(); // "world"
 * span.get(0); // "w": indexes are relative to the span.
 * span.slice(1, 3).toString(); // "orl"
 * span.slice(span.length).isEmpty; // true
 * new ReadOnlyStringSpan("😀").length; // 2 UTF-16 code units.
 * ```
 */
export declare class ReadOnlyStringSpan {
  /**
   * A reusable zero-length span backed by an empty string.
   */
  public static readonly empty: ReadOnlyStringSpan;

  /**
   * The number of UTF-16 code units visible through this span.
   */
  public readonly length: number;

  /**
   * Whether this span has zero visible code units.
   */
  public readonly isEmpty: boolean;

  /**
   * Creates a view of the complete source or one contained range.
   *
   * @param source The backing string retained by this span. Empty strings
   * and unpaired UTF-16 surrogate code units are allowed.
   * @param start The zero-based source offset in code units; defaults to zero.
   * An offset equal to `source.length` is valid for an empty view.
   * @param length The number of code units in the view; defaults to all
   * remaining source units from `start`. Zero is allowed.
   * @throws {ArgumentOutOfRangeException} Synchronously, when start or length
   * is non-integer or negative, start exceeds the source length, or the range
   * extends past its end.
   * @example
   * ```ts
   * import { ReadOnlyStringSpan } from "@noldova/context.text";
   *
   * new ReadOnlyStringSpan("hello").toString(); // "hello"
   * new ReadOnlyStringSpan("hello", 1, 3).toString(); // "ell"
   * new ReadOnlyStringSpan("hello", 5).isEmpty; // true
   * new ReadOnlyStringSpan("hello", 2, 4); // Throws ArgumentOutOfRangeException.
   * ```
   */
  public constructor(source: string, start?: number, length?: number);

  /**
   * Reads one code unit relative to this span.
   *
   * @param index The zero-based span offset, from zero through
   * `length - 1`. No index is valid for an empty span.
   * @returns A string containing exactly one UTF-16 code unit. A surrogate
   * is returned as that code unit, without combining it with its neighbor.
   * @throws {IndexOutOfRangeException} Synchronously, when the index is
   * non-integer, negative, or greater than or equal to the span's length.
   * @example
   * ```ts
   * import { ReadOnlyStringSpan } from "@noldova/context.text";
   *
   * const span = new ReadOnlyStringSpan("hello", 1, 3);
   * span.get(0); // "e": indexes are relative to the span.
   * span.get(3); // Throws IndexOutOfRangeException.
   * ```
   */
  public get(index: number): string;

  /**
   * Creates a new view contained within this span.
   *
   * @param start The zero-based offset relative to this span, not its backing
   * source. An offset equal to `length` is valid for an empty slice.
   * @param length The number of code units to expose; defaults to the remainder
   * of this span. Zero is allowed.
   * @returns A new span sharing the original backing string. The current span
   * is unchanged, and the result cannot expose text outside its parent.
   * @throws {ArgumentOutOfRangeException} Synchronously, when start or length
   * is non-integer or negative, or the requested range is outside this span.
   * @example
   * ```ts
   * import { ReadOnlyStringSpan } from "@noldova/context.text";
   *
   * const span = new ReadOnlyStringSpan("hello world", 6);
   * span.slice(1, 3).toString(); // "orl"
   * span.slice(span.length).isEmpty; // true
   * span.slice(4, 2); // Throws ArgumentOutOfRangeException.
   * ```
   */
  public slice(start: number, length?: number): ReadOnlyStringSpan;

  /**
   * Produces the text represented by the view.
   *
   * @returns The visible code units in order, or an empty string for an empty
   * span. The operation does not consume or alter the span.
   * @example
   * ```ts
   * import { ReadOnlyStringSpan } from "@noldova/context.text";
   *
   * new ReadOnlyStringSpan("hello world", 6, 5).toString(); // "world"
   * ReadOnlyStringSpan.empty.toString(); // ""
   * ```
   */
  public toString(): string;
}

/**
 * Collects string fragments and materializes their combined UTF-16 text on demand.
 * Fragments remain retained until {@link StringBuilder.clear} or the builder
 * itself becomes unreachable. Materializing a string does not clear the builder.
 *
 * @example
 * ```ts
 * import { StringBuilder } from "@noldova/context.text";
 *
 * const builder = new StringBuilder();
 * builder.append("hello").append(" ").append("world");
 * builder.length; // 11
 * const first = builder.toString(); // "hello world"
 * builder.append("!");
 * builder.toString(); // "hello world!"
 * first; // Still "hello world".
 * builder.clear();
 * builder.length; // 0
 * builder.toString(); // ""
 * builder.append("again").toString(); // "again": the builder is reusable.
 * ```
 */
export declare class StringBuilder {
  /**
   * The total number of UTF-16 code units in the retained fragments.
   */
  public get length(): number;

  /**
   * Appends a string exactly as supplied.
   *
   * @param value The entire fragment to retain. Empty strings have no effect.
   * Newlines and surrogate code units are neither inserted, replaced, nor normalized.
   * @returns This same builder, allowing further appends to be chained.
   *
   * @example
   * ```ts
   * import { StringBuilder } from "@noldova/context.text";
   *
   * const builder = new StringBuilder();
   * builder.append("a\r").append("\nb");
   * builder.toString(); // "a\r\nb": preserves the exact supplied newline.
   * ```
   */
  public append(value: string): this;

  /**
   * Releases this builder's references to its fragments and sets its length to zero.
   * The builder can be reused, and strings previously returned by
   * {@link StringBuilder.toString} remain unchanged.
   *
   * @example
   * ```ts
   * import { StringBuilder } from "@noldova/context.text";
   *
   * const builder = new StringBuilder().append("draft");
   * builder.clear();
   * builder.length; // 0
   * builder.append("final").toString(); // "final"
   * ```
   */
  public clear(): void;

  /**
   * Joins the retained fragments without consuming them.
   *
   * @returns The combined code units, or an empty string when no content has
   * been appended. Subsequent changes to the builder do not change this string.
   *
   * @remarks
   * Each call joins the current fragments again; the result is not cached.
   * Materialize after accumulation rather than after every append.
   * @example
   * ```ts
   * import { StringBuilder } from "@noldova/context.text";
   *
   * const builder = new StringBuilder();
   * builder.toString(); // ""
   * builder.append("a").append("b").toString(); // "ab"
   * ```
   */
  public toString(): string;
}

/**
 * Classifies numeric code points using the pinned Unicode 15.1 identifier data.
 * This is Unicode classification, not a complete language-identifier policy:
 * a language may add characters such as ECMAScript's dollar sign.
 * The host's Unicode version does not select these results.
 *
 * @example
 * ```ts
 * import { UnicodeCodePointService } from "@noldova/context.text";
 *
 * UnicodeCodePointService.isIdentifierStart(0x41); // true: A.
 * UnicodeCodePointService.isIdentifierStart(0x30); // false: 0.
 * UnicodeCodePointService.isIdentifierContinue(0x30); // true: 0 can continue.
 * UnicodeCodePointService.isIdentifierStart(0x24); // false: dollar sign.
 * UnicodeCodePointService.isIdentifierStart(0x2EBF0); // true: Unicode 15.1 addition.
 * UnicodeCodePointService.isIdentifierStart(0x10D50); // false: absent from this profile.
 * UnicodeCodePointService.isIdentifierContinue(Number.NaN); // false
 * ```
 */
export declare class UnicodeCodePointService {
  /**
   * Tests the Unicode 15.1 `ID_Start` property, including its
   * `Other_ID_Start` contributions.
   *
   * @param value The numeric code point to classify, not a string index.
   * @returns True for a code point in the pinned start set. Non-integers,
   * negative values, values above U+10FFFF, and all other code points return false.
   * @example
   * ```ts
   * import { UnicodeCodePointService } from "@noldova/context.text";
   *
   * UnicodeCodePointService.isIdentifierStart(0x41); // true: A.
   * UnicodeCodePointService.isIdentifierStart(0x30); // false: 0.
   * UnicodeCodePointService.isIdentifierStart(0x110000); // false: past U+10FFFF.
   * ```
   */
  public static isIdentifierStart(value: number): boolean;

  /**
   * Tests the Unicode 15.1 `ID_Continue` property.
   *
   * @param value The numeric code point to classify, not a string index.
   * @returns True for a code point in the pinned continuation set. Non-integers,
   * negative values, values above U+10FFFF, and all other code points return false.
   * @example
   * ```ts
   * import { UnicodeCodePointService } from "@noldova/context.text";
   *
   * UnicodeCodePointService.isIdentifierContinue(0x30); // true: 0 can continue.
   * UnicodeCodePointService.isIdentifierContinue(0x2D); // false: hyphen-minus.
   * UnicodeCodePointService.isIdentifierContinue(1.5); // false: not an integer.
   * ```
   */
  public static isIdentifierContinue(value: number): boolean;

  /**
   * Identifies a UTF-16 leading-surrogate code unit by its numeric value.
   *
   * @param value The integer code-unit value to classify.
   * @returns True from U+D800 through U+DBFF, inclusive; false for every other
   * value, including non-integers. Surrogates are not Unicode scalar values.
   *
   * @example
   * ```ts
   * import { UnicodeCodePointService } from "@noldova/context.text";
   *
   * UnicodeCodePointService.isLeadingSurrogate(0xD83D); // true
   * UnicodeCodePointService.isTrailingSurrogate(0xDE00); // true
   * UnicodeCodePointService.isLeadingSurrogate(0xDE00); // false
   * UnicodeCodePointService.isTrailingSurrogate(0xE000); // false: past the range.
   * ```
   */
  public static isLeadingSurrogate(value: number): boolean;

  /**
   * Identifies a UTF-16 trailing-surrogate code unit by its numeric value.
   *
   * @param value The integer code-unit value to classify.
   * @returns True from U+DC00 through U+DFFF, inclusive; false for every other
   * value, including non-integers. Surrogates are not Unicode scalar values.
   * @example
   * ```ts
   * import { UnicodeCodePointService } from "@noldova/context.text";
   *
   * UnicodeCodePointService.isTrailingSurrogate(0xDE00); // true
   * UnicodeCodePointService.isTrailingSurrogate(0xD83D); // false: a leading surrogate.
   * ```
   */
  public static isTrailingSurrogate(value: number): boolean;
}
