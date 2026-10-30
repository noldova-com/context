/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import { TypeScriptEqualsEqualsEqualsNode } from "@noldova/context.parsers.typescript";
import { TypeScriptAssociativity } from "@noldova/context.parsers.typescript/enums/typescript-associativity.js";
import { TypeScriptOperatorPrecedence } from "@noldova/context.parsers.typescript/enums/typescript-operator-precedence.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptEqualsEqualsEqualsNodeExtensionsTests {
  @TestMethod
  public bindsAsALeftAssociativeEqualityOperator(): void {
    const node = new TypeScriptEqualsEqualsEqualsNode(new SourceSpan(0, 1));

    Assert.areEqual(TypeScriptOperatorPrecedence.Equality, node.getTypeScriptPrecedence());
    Assert.areEqual(TypeScriptAssociativity.Left, node.getTypeScriptAssociativity());
  }
}
