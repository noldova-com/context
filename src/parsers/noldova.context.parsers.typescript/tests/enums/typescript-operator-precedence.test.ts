/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptOperatorPrecedence } from "@noldova/context.parsers.typescript/enums/typescript-operator-precedence.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptOperatorPrecedenceTests {
  @TestMethod
  public ordersTheImplementedBinaryPrecedenceLevels(): void {
    Assert.areEqual(0, TypeScriptOperatorPrecedence.None);
    Assert.isTrue(TypeScriptOperatorPrecedence.None < TypeScriptOperatorPrecedence.NullishCoalescing);
    Assert.areEqual(TypeScriptOperatorPrecedence.LogicalOr, TypeScriptOperatorPrecedence.NullishCoalescing);
    Assert.isTrue(TypeScriptOperatorPrecedence.LogicalOr < TypeScriptOperatorPrecedence.LogicalAnd);
    Assert.isTrue(TypeScriptOperatorPrecedence.LogicalAnd < TypeScriptOperatorPrecedence.BitwiseOr);
    Assert.isTrue(TypeScriptOperatorPrecedence.BitwiseOr < TypeScriptOperatorPrecedence.BitwiseXor);
    Assert.isTrue(TypeScriptOperatorPrecedence.BitwiseXor < TypeScriptOperatorPrecedence.BitwiseAnd);
    Assert.isTrue(TypeScriptOperatorPrecedence.BitwiseAnd < TypeScriptOperatorPrecedence.Equality);
    Assert.isTrue(TypeScriptOperatorPrecedence.Equality < TypeScriptOperatorPrecedence.Relational);
    Assert.isTrue(TypeScriptOperatorPrecedence.Relational < TypeScriptOperatorPrecedence.Shift);
    Assert.isTrue(TypeScriptOperatorPrecedence.Shift < TypeScriptOperatorPrecedence.Additive);
    Assert.isTrue(TypeScriptOperatorPrecedence.Additive < TypeScriptOperatorPrecedence.Multiplicative);
    Assert.isTrue(TypeScriptOperatorPrecedence.Multiplicative < TypeScriptOperatorPrecedence.Exponentiation);
  }
}
