/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import { TypeScriptBarNode } from "@noldova/context.parsers.typescript";
import { TypeScriptAssociativity } from "@noldova/context.parsers.typescript/enums/typescript-associativity.js";
import { TypeScriptOperatorPrecedence } from "@noldova/context.parsers.typescript/enums/typescript-operator-precedence.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptBarNodeExtensionsTests {
  @TestMethod
  public bindsAsALeftAssociativeBitwiseOrOperator(): void {
    const node = new TypeScriptBarNode(new SourceSpan(0, 1));

    Assert.areEqual(TypeScriptOperatorPrecedence.BitwiseOr, node.getTypeScriptPrecedence());
    Assert.areEqual(TypeScriptAssociativity.Left, node.getTypeScriptAssociativity());
  }

  @TestMethod
  public startsAType(): void {
    const parser = TypeScriptParserFixture.create("|");
    Assert.isTrue(parser.currentNode.canStartTypeScriptType(parser));
  }
}
