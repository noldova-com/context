/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptReadonlyKeywordNodeExtensionsTests {
  @TestMethod
  public readsAsAModifierInEveryModifierList(): void {
    const node = TypeScriptParserFixture.create("readonly").currentNode;

    Assert.isTrue(node.isTypeScriptDeclarationModifier());
    Assert.isTrue(node.isTypeScriptClassMemberModifier());
    Assert.isTrue(node.isTypeScriptParameterModifier());
    Assert.isTrue(node.isTypeScriptTypeMemberModifier());
    Assert.isTrue(node.isTypeScriptTypeParameterModifier());
  }

  @TestMethod
  public isATypeOperator(): void {
    Assert.isTrue(TypeScriptParserFixture.create("readonly").currentNode.isTypeScriptTypeOperator());
  }
}
