/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as api from "@noldova/context.query.expressions";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class QueryExpressionsApiTests {
  @TestMethod
  public exportsTheCompleteCatalog(): void {
    Assert.areEqual("BinaryExpression,BinaryOperator,CallExpression,ConditionalExpression,ConstantExpression,Expression,LambdaExpression,MemberExpression,"
      + "ObjectExpression,ParameterExpression,PropertyExpression,UnaryExpression,UnaryOperator", Object.keys(api).sort().join(","));
  }
}
