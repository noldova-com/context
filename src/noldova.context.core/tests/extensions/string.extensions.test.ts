/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { nameof } from "@noldova/context.core";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

@TestClass
export class StringExtensionsTests {
  @TestMethod
  public emptyIsTheEmptyString(): void {
    Assert.areEqual("", String.empty);
    Assert.areEqual(0, String.empty.length);
  }

  @TestMethod
  public emptyIsImmutable(): void {
    const descriptor = Object.getOwnPropertyDescriptor(String, nameof<StringConstructor>(t => t.empty));

    Assert.isDefined(descriptor);
    Assert.areEqual<boolean | undefined>(false, descriptor.writable);
    Assert.areEqual<boolean | undefined>(false, descriptor.enumerable);
    Assert.areEqual<boolean | undefined>(false, descriptor.configurable);
  }

  @TestMethod
  public formatIsImmutable(): void {
    const descriptor = Object.getOwnPropertyDescriptor(String, nameof<StringConstructor>(t => t.format));

    Assert.isDefined(descriptor);
    Assert.areEqual<boolean | undefined>(false, descriptor.writable);
    Assert.areEqual<boolean | undefined>(false, descriptor.enumerable);
    Assert.areEqual<boolean | undefined>(false, descriptor.configurable);
  }

  @TestMethod
  public formatReplacesAPlaceholder(): void {
    Assert.areEqual("Hello World", String.format("Hello {0}", "World"));
  }

  @TestMethod
  public formatReplacesRepeatedPlaceholders(): void {
    Assert.areEqual("value and value", String.format("{0} and {0}", "value"));
  }

  @TestMethod
  public formatReplacesANumericArgument(): void {
    Assert.areEqual("Expected 3", String.format("Expected {0}", 3));
  }

  @TestMethod
  public formatSupportsMultiDigitPlaceholders(): void {
    Assert.areEqual(
      "ten",
      String.format("{10}", "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"));
  }

  @TestMethod
  public formatKeepsAnUnavailablePlaceholder(): void {
    Assert.areEqual("{1}", String.format("{1}", "zero"));
  }

  @TestMethod
  public formatKeepsAnUnrecognizedPlaceholder(): void {
    Assert.areEqual("{name}", String.format("{name}", "value"));
  }

  @TestMethod
  public formatKeepsAnIncompletePlaceholder(): void {
    Assert.areEqual("{0", String.format("{0", "value"));
  }

  @TestMethod
  public formatDoesNotInterpretArgumentTextAsAPlaceholder(): void {
    Assert.areEqual("{1} / second", String.format("{0} / {1}", "{1}", "second"));
  }

  @TestMethod
  @TestData("", "")
  @TestData("plain text", "plain text")
  @TestData("{0}", "{0}")
  public formatPreservesTemplatesWithoutArguments(template: string, expected: string): void {
    Assert.areEqual(expected, String.format(template));
  }

  @TestMethod
  @TestData("{1}{0}{1}", "secondfirstsecond")
  @TestData("{00}/{01}", "first/second")
  @TestData("{0}/{999999999999999999999999}", "first/{999999999999999999999999}")
  public formatResolvesAdjacentAndNumericPlaceholderBoundaries(template: string, expected: string): void {
    Assert.areEqual(expected, String.format(template, "first", "second"));
  }

  @TestMethod
  public recognizesEveryAsciiDigit(): void {
    for (const character of "0123456789")
      Assert.isTrue(String.isAsciiDigit(character));
  }

  @TestMethod
  public rejectsValuesThatAreNotSingleAsciiDigits(): void {
    Assert.isFalse(String.isAsciiDigit(String.empty));
    Assert.isFalse(String.isAsciiDigit("10"));
    Assert.isFalse(String.isAsciiDigit("/"));
    Assert.isFalse(String.isAsciiDigit(":"));
    Assert.isFalse(String.isAsciiDigit("\u0660"));
  }

  @TestMethod
  public isAsciiDigitIsImmutable(): void {
    const descriptor = Object.getOwnPropertyDescriptor(String, nameof<StringConstructor>(t => t.isAsciiDigit));

    Assert.isDefined(descriptor);
    Assert.areEqual<boolean | undefined>(false, descriptor.writable);
    Assert.areEqual<boolean | undefined>(false, descriptor.enumerable);
    Assert.areEqual<boolean | undefined>(false, descriptor.configurable);
  }

  @TestMethod
  public recognizesEveryAsciiHexDigit(): void {
    for (const character of "0123456789abcdefABCDEF")
      Assert.isTrue(String.isAsciiHexDigit(character));
  }

  @TestMethod
  public rejectsValuesThatAreNotSingleAsciiHexDigits(): void {
    Assert.isFalse(String.isAsciiHexDigit(String.empty));
    Assert.isFalse(String.isAsciiHexDigit("10"));
    Assert.isFalse(String.isAsciiHexDigit("g"));
    Assert.isFalse(String.isAsciiHexDigit("G"));
    Assert.isFalse(String.isAsciiHexDigit("\u0660"));
  }

  @TestMethod
  public isAsciiHexDigitIsImmutable(): void {
    const descriptor = Object.getOwnPropertyDescriptor(String, nameof<StringConstructor>(t => t.isAsciiHexDigit));

    Assert.isDefined(descriptor);
    Assert.areEqual<boolean | undefined>(false, descriptor.writable);
    Assert.areEqual<boolean | undefined>(false, descriptor.enumerable);
    Assert.areEqual<boolean | undefined>(false, descriptor.configurable);
  }

  @TestMethod
  public recognizesEveryAsciiLetter(): void {
    for (const character of "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")
      Assert.isTrue(String.isAsciiLetter(character));
  }

  @TestMethod
  public rejectsValuesThatAreNotSingleAsciiLetters(): void {
    Assert.isFalse(String.isAsciiLetter(String.empty));
    Assert.isFalse(String.isAsciiLetter("ab"));
    Assert.isFalse(String.isAsciiLetter("@"));
    Assert.isFalse(String.isAsciiLetter("["));
    Assert.isFalse(String.isAsciiLetter("`"));
    Assert.isFalse(String.isAsciiLetter("{"));
    Assert.isFalse(String.isAsciiLetter("\u00E9"));
  }

  @TestMethod
  public isAsciiLetterIsImmutable(): void {
    const descriptor = Object.getOwnPropertyDescriptor(String, nameof<StringConstructor>(t => t.isAsciiLetter));

    Assert.isDefined(descriptor);
    Assert.areEqual<boolean | undefined>(false, descriptor.writable);
    Assert.areEqual<boolean | undefined>(false, descriptor.enumerable);
    Assert.areEqual<boolean | undefined>(false, descriptor.configurable);
  }

  @TestMethod
  public isNullOrEmptyReturnsTrueForNull(): void {
    Assert.isTrue(String.isNullOrEmpty(null));
  }

  @TestMethod
  public isNullOrEmptyReturnsTrueForUndefined(): void {
    Assert.isTrue(String.isNullOrEmpty(undefined));
  }

  @TestMethod
  public isNullOrEmptyReturnsTrueForTheEmptyString(): void {
    Assert.isTrue(String.isNullOrEmpty(String.empty));
  }

  @TestMethod
  public isNullOrEmptyReturnsFalseForWhitespace(): void {
    Assert.isFalse(String.isNullOrEmpty(" "));
  }

  @TestMethod
  public isNullOrEmptyReturnsFalseForText(): void {
    Assert.isFalse(String.isNullOrEmpty("value"));
  }

  @TestMethod
  @TestData("value", 5)
  @TestData(" ", 1)
  public isNullOrEmptyNarrowsWhenFalse(value: string | null | undefined, expectedLength: number): void {
    if (String.isNullOrEmpty(value))
      Assert.fail("The value is neither null nor empty.");

    Assert.areEqual(expectedLength, value.length);
  }

  @TestMethod
  public isNullOrWhitespaceReturnsTrueForNull(): void {
    Assert.isTrue(String.isNullOrWhitespace(null));
  }

  @TestMethod
  public isNullOrWhitespaceReturnsTrueForUndefined(): void {
    Assert.isTrue(String.isNullOrWhitespace(undefined));
  }

  @TestMethod
  public isNullOrWhitespaceReturnsTrueForTheEmptyString(): void {
    Assert.isTrue(String.isNullOrWhitespace(String.empty));
  }

  @TestMethod
  public isNullOrWhitespaceReturnsTrueForWhitespace(): void {
    Assert.isTrue(String.isNullOrWhitespace(" \t\r\n "));
  }

  @TestMethod
  @TestData("\u00a0", true)
  @TestData("\u2028\u2029", true)
  @TestData("\ufeff", true)
  @TestData("\u0085", false)
  @TestData("\u200b", false)
  public isNullOrWhitespaceFollowsStringTrim(value: string, expected: boolean): void {
    Assert.areEqual(expected, String.isNullOrWhitespace(value));
  }

  @TestMethod
  public isNullOrWhitespaceReturnsFalseForPaddedText(): void {
    Assert.isFalse(String.isNullOrWhitespace(" value "));
  }
}
