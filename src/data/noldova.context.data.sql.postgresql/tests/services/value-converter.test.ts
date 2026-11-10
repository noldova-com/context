/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DataException } from "@noldova/context.data";
import { ValueConverter } from "@noldova/context.data.sql.postgresql/services/value-converter.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

@TestClass
export class ValueConverterTests {
  @TestMethod
  @TestData(21, "-2", -2)
  @TestData(23, "42", 42)
  @TestData(26, "16384", 16384)
  @TestData(700, "1.5", 1.5)
  @TestData(701, "-0.25", -0.25)
  @TestData(20, "9007199254740991", 9007199254740991)
  @TestData(20, "-9007199254740991", -9007199254740991)
  public readsNumbersAsNumbers(type: number, text: string, expected: number): void {
    Assert.areEqual(expected, ValueConverter.read(type, text));
  }

  @TestMethod
  @TestData(25, "text")
  @TestData(1700, "12.50")
  @TestData(16, "t")
  @TestData(1184, "2026-11-08 12:00:00+00")
  public readsOtherTypesAsText(type: number, text: string): void {
    Assert.areEqual(text, ValueConverter.read(type, text));
  }

  @TestMethod
  public readsNullAsNull(): void {
    Assert.isNull(ValueConverter.read(20, null));
    Assert.isNull(ValueConverter.read(25, null));
  }

  @TestMethod
  @TestData("9007199254740992")
  @TestData("-9007199254740992")
  public refusesABigintOutsideTheSafeIntegers(text: string): void {
    Assert.throws(() => ValueConverter.read(20, text), DataException);
  }

  @TestMethod
  public writesParametersAsText(): void {
    Assert.areEqual("a", ValueConverter.write("a"));
    Assert.areEqual("42", ValueConverter.write(42));
    Assert.areEqual("-1.5", ValueConverter.write(-1.5));
    Assert.isNull(ValueConverter.write(null));
  }
}
