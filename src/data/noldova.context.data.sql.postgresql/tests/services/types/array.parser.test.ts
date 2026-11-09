/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ArrayParser } from "@noldova/context.data.sql.postgresql/services/types/array.parser.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class ArrayParserTests {
  @TestMethod
  public parsesValuesAndNulls(): void {
    Assert.areEqual("[1,2,null]", JSON.stringify(ArrayParser.parse("{1,2,NULL}", Number)));
    Assert.areEqual("[\"a\",\"b\"]", JSON.stringify(ArrayParser.parse("{a,b}", null)));
    Assert.areEqual("[]", JSON.stringify(ArrayParser.parse("{}", Number)));
  }

  @TestMethod
  public parsesNestedArrays(): void {
    Assert.areEqual("[[1,2],[3,4]]", JSON.stringify(ArrayParser.parse("{{1,2},{3,4}}", Number)));
  }

  @TestMethod
  public parsesQuotedValuesWithEscapes(): void {
    Assert.areEqual("[\"a\\\"b\",\"c,d\",\"NULL\"]", JSON.stringify(ArrayParser.parse("{\"a\\\"b\",\"c,d\",\"NULL\"}", null)));
    Assert.areEqual("[1]", JSON.stringify(ArrayParser.parse("{\"1\"}", Number)));
  }

  @TestMethod
  public skipsTheDimensionPrefix(): void {
    Assert.areEqual("[5,6]", JSON.stringify(ArrayParser.parse("[1:2]={5,6}", Number)));
  }

  @TestMethod
  public splitsOnTheGivenDelimiter(): void {
    Assert.areEqual("[\"(1,1),(0,0)\",\"(2,2),(1,1)\"]", JSON.stringify(ArrayParser.parse("{(1,1),(0,0);(2,2),(1,1)}", null, ";")));
  }

  @TestMethod
  public stopsAtTheEndOfTruncatedText(): void {
    Assert.areEqual("[1,2]", JSON.stringify(ArrayParser.parse("{1,2", Number)));
    Assert.areEqual("[\"abc\"]", JSON.stringify(ArrayParser.parse("{\"abc", null)));
  }
}
