/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DataException } from "@noldova/context.data";
import { TypedParameter } from "@noldova/context.data.sql.postgresql/models/typed-parameter.js";
import { ArraySerializer } from "@noldova/context.data.sql.postgresql/services/types/array-serializer.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class ArraySerializerTests {
  @TestMethod
  public serializesValuesNullsAndNestedArrays(): void {
    Assert.areEqual("{\"1\",NULL,{\"2\",\"3\"}}", ArraySerializer.serialize([1, null, [2, 3]], String));
  }

  @TestMethod
  public escapesQuotesAndBackslashes(): void {
    Assert.areEqual("{\"a\\\"b\\\\c\"}", ArraySerializer.serialize(["a\"b\\c"], String));
  }

  @TestMethod
  public replacesOrRefusesUndefined(): void {
    Assert.throws(() => ArraySerializer.serialize([undefined], String), DataException);
    Assert.areEqual("{NULL}", ArraySerializer.serialize([undefined], String, ",", null));
  }

  @TestMethod
  public keepsATypedArrayAsOneValue(): void {
    Assert.areEqual("{\"1,2\"}", ArraySerializer.serialize([new TypedParameter([1, 2], 25)], String));
    Assert.areEqual("{NULL}", ArraySerializer.serialize([new TypedParameter(null, 25)], String));
  }

  @TestMethod
  public joinsWithTheGivenDelimiter(): void {
    Assert.areEqual("{\"a\";\"b\"}", ArraySerializer.serialize(["a", "b"], String, ";"));
  }
}
