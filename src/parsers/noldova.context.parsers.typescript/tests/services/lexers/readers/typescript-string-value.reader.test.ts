/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Source, SourceReader, SourceSpan } from "@noldova/context.parsers";
import { TypeScriptStringValueReader } from "@noldova/context.parsers.typescript/services/lexers/readers/typescript-string-value.reader.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptStringValueReaderTests {
  @TestData('""', "")
  @TestData("'constructor'", "constructor")
  @TestData('"\\u0063onstructor"', "constructor")
  @TestData('"\\u{63}onstructor"', "constructor")
  @TestData('"\\x63onstructor"', "constructor")
  @TestData('"\\143onstructor"', "constructor")
  @TestData('"\\constructor"', "constructor")
  @TestData('"\\b\\f\\n\\r\\t\\v"', "\b\f\n\r\t\v")
  @TestData('"\\0\\07\\377\\77"', "\0\x07\xff?")
  @TestData('"\\477"', "'7")
  @TestData('"a\\\nb"', "ab")
  @TestData('"a\\\r\nb"', "ab")
  @TestData('"a\\\u2028b"', "ab")
  @TestData('"\\u{1F600}"', "😀")
  @TestData('"a\\"b"', 'a"b')
  @TestMethod
  public decodesValuesWithoutReadingPastTheLiteral(content: string, expected: string): void {
    const reader = new SourceReader(new Source("prefix" + content + "suffix"), new SourceSpan(6, content.length));
    Assert.areEqual(expected, new TypeScriptStringValueReader().read(reader));
    Assert.areEqual(6 + content.length, reader.currentOffset);
  }

  @TestData('"abc"', "abc")
  @TestData('"\\x61bc"', "abc")
  @TestData("'\\101'", "A")
  @TestData('"\\uD83D\\uDE00"', "😀")
  @TestData("'a\\u{110000}b'", "a\\u{110000}b")
  @TestData("'a\\x62\\u{110000}c'", "ab\\u{110000}c")
  @TestData("'a\\xG'", "a\\xG")
  @TestData("'abc", "abc")
  @TestData("'ab\\", "ab")
  @TestMethod
  public readsTokenValuesKeepingInvalidEscapesAsWritten(content: string, expected: string): void {
    Assert.areEqual(expected, new TypeScriptStringValueReader().readTokenValue(new SourceReader(new Source(content))));
  }

  @TestData("'unterminated")
  @TestData("'\\")
  @TestData("'\\\r\n")
  @TestData("'\\u'")
  @TestData("'\\u{110000}'")
  @TestData("'\\xG0'")
  @TestData("'\\x")
  @TestData("'\\7")
  @TestMethod
  public rejectsIncompleteOrInvalidQuotedValues(content: string): void {
    Assert.isUndefined(new TypeScriptStringValueReader().read(new SourceReader(new Source(content))));
  }
}
