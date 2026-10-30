/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Source, SourceReader, SourceSpan } from "@noldova/context.parsers";
import { TypeScriptIdentifierValueReader } from "@noldova/context.parsers.typescript/services/lexers/readers/typescript-identifier-value.reader.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptIdentifierValueReaderTests {
  @TestData("value123+", "value123")
  @TestData("$value", "$value")
  @TestData("_value", "_value")
  @TestData("π\u{10400}\u{2EBF0}0+", "π\u{10400}\u{2EBF0}0")
  @TestData("à‌‍+", "à‌‍")
  @TestMethod
  public readsAnIdentifierUpToTheFirstNonIdentifierCharacter(content: string, expectedValue: string): void {
    const reader = this.createReader(content);

    Assert.areEqual(expectedValue, new TypeScriptIdentifierValueReader().read(reader));
    Assert.areEqual(expectedValue.length, reader.currentOffset);
  }

  @TestData("", undefined, 0)
  @TestData("1name", undefined, 0)
  @TestData("̀value", undefined, 0)
  @TestData("😀value", undefined, 0)
  @TestData("\\u00G0", undefined, 0)
  @TestData("\\", undefined, 0)
  @TestData("\\x61", undefined, 0)
  @TestData("a\\", "a", 1)
  @TestData("a\\x61", "a", 1)
  @TestData("a\\u{110000}", "a", 1)
  @TestData("a\\u0062\\", "ab", 7)
  @TestData("a\0b", "a", 1)
  @TestData("\\u0031", undefined, 0)
  @TestData("\\u{D801}\\u{DC00}", undefined, 0)
  @TestData("\\uD801\\uDC00", undefined, 0)
  @TestData("a\\u002Dtail", "a", 1)
  @TestData("a\\u0062\\u00G0", "ab", 7)
  @TestData("a\\u0062\\u002D", "ab", 7)
  @TestMethod
  public leavesRejectedTextForTheOwningLexer(content: string, expectedValue: string | undefined, expectedOffset: number): void {
    const reader = this.createReader(content);

    Assert.areEqual(expectedValue, new TypeScriptIdentifierValueReader().read(reader));
    Assert.areEqual(expectedOffset, reader.currentOffset);
  }

  @TestData("\\u0061", "a")
  @TestData("\\u0061\\u{62}", "ab")
  @TestData("a\\u0031", "a1")
  @TestData("plain\\u0061", "plaina")
  @TestData("\\u0061middle\\u{62}tail", "amiddlebtail")
  @TestData("ab\\u0063de\\u{10400}fg", "abcde𐐀fg")
  @TestData("𐐀\\u0030̀", "𐐀0̀")
  @TestMethod
  public preservesPlainSegmentsAroundEscapes(content: string, expectedValue: string): void {
    const reader = this.createReader(`${content}+`);

    Assert.areEqual(expectedValue, new TypeScriptIdentifierValueReader().read(reader));
    Assert.areEqual(content.length, reader.currentOffset);
    Assert.areEqual("+", reader.peekCodeUnit());
  }

  @TestData("!!nameRest", 2, 4, "name", 6)
  @TestData("!!name", 2, 0, undefined, 2)
  @TestData("!!\\u0061", 2, 0, undefined, 2)
  @TestData("!!\\u0061", 2, 1, undefined, 2)
  @TestData("!!\\u0061b!", 2, 7, "ab", 9)
  @TestData("!!\\u0061b!", 2, 5, undefined, 2)
  @TestData("a\\u0062c", 0, 7, "ab", 7)
  @TestData("a\\u0062c", 0, 6, "a", 1)
  @TestData("a\\u{62}c", 0, 7, "ab", 7)
  @TestData("a\\u{62}c", 0, 6, "a", 1)
  @TestData("a𐐀z", 0, 2, "a", 1)
  @TestData("a𐐀z", 0, 3, "a𐐀", 3)
  @TestData("a𐐀z", 1, 2, "𐐀", 3)
  @TestData("a𐐀z", 2, 2, undefined, 2)
  @TestMethod
  public respectsReaderBounds(
    content: string,
    startOffset: number,
    length: number,
    expectedValue: string | undefined,
    expectedOffset: number): void {
    const reader = new SourceReader(new Source(content), new SourceSpan(startOffset, length));

    Assert.areEqual(expectedValue, new TypeScriptIdentifierValueReader().read(reader));
    Assert.areEqual(expectedOffset, reader.currentOffset);
  }

  @TestMethod
  public readsLongPlainAndEscapedIdentifiers(): void {
    const plainValue = "identifier".repeat(1000);
    const escapedText = "prefix\\u0061tail".repeat(1000);
    const plainReader = this.createReader(`${plainValue}+`);
    const escapedReader = this.createReader(`${escapedText}+`);
    const valueReader = new TypeScriptIdentifierValueReader();

    Assert.areEqual(plainValue, valueReader.read(plainReader));
    Assert.areEqual(plainValue.length, plainReader.currentOffset);
    Assert.areEqual("prefixatail".repeat(1000), valueReader.read(escapedReader));
    Assert.areEqual(escapedText.length, escapedReader.currentOffset);
  }

  private createReader(content: string): SourceReader {
    return new SourceReader(new Source(content, "source.ts"));
  }
}
