/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Source, SourceReader } from "@noldova/context.parsers";
import { TypeScriptUnicodeEscapeReader } from "@noldova/context.parsers.typescript/services/lexers/readers/typescript-unicode-escape.reader.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptUnicodeEscapeReaderTests {
  @TestData("\\u0061+", 0x61, 6)
  @TestData("\\u03C0+", 0x03C0, 6)
  @TestData("\\u03c0+", 0x03C0, 6)
  @TestData("\\u{000061}+", 0x61, 10)
  @TestData("\\u{10400}+", 0x10400, 9)
  @TestData("\\u{10FFFF}", 0x10FFFF, 10)
  @TestMethod
  public readsTheEscapedCodePointAndAdvancesPastTheEscape(content: string, expected: number, endOffset: number): void {
    const reader = new SourceReader(new Source(content, "source.ts"));

    Assert.areEqual(expected, new TypeScriptUnicodeEscapeReader().read(reader));
    Assert.areEqual(endOffset, reader.currentOffset);
  }

  @TestData("\\value")
  @TestData("u0061")
  @TestData("\\u061")
  @TestData("\\u00G0")
  @TestData("\\u{}")
  @TestData("\\u{12G4}")
  @TestData("\\u{0061")
  @TestData("\\u{110000}")
  @TestMethod
  public readsNothingAndStaysInPlaceAtAnInvalidEscape(content: string): void {
    const reader = new SourceReader(new Source(content, "source.ts"));

    Assert.isUndefined(new TypeScriptUnicodeEscapeReader().read(reader));
    Assert.areEqual(0, reader.currentOffset);
  }
}
