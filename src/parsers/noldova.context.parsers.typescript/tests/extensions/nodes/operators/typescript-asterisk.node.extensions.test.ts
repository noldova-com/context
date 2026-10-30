/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import { TypeScriptAsteriskNode } from "@noldova/context.parsers.typescript";
import { TypeScriptAssociativity } from "@noldova/context.parsers.typescript/enums/typescript-associativity.js";
import { TypeScriptOperatorPrecedence } from "@noldova/context.parsers.typescript/enums/typescript-operator-precedence.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptAsteriskNodeExtensionsTests {
  @TestMethod
  public startsAClassMember(): void {
    const parser = TypeScriptParserFixture.create("*");
    Assert.isTrue(parser.currentNode.canStartTypeScriptClassMember(parser));
  }

  @TestMethod
  public bindsAsALeftAssociativeMultiplicativeOperator(): void {
    const node = new TypeScriptAsteriskNode(new SourceSpan(0, 1));

    Assert.areEqual(TypeScriptOperatorPrecedence.Multiplicative, node.getTypeScriptPrecedence());
    Assert.areEqual(TypeScriptAssociativity.Left, node.getTypeScriptAssociativity());
  }

  @TestMethod
  public canFollowAModifier(): void {
    const node = new TypeScriptAsteriskNode(new SourceSpan(0, 1));

    Assert.isTrue(node.canFollowTypeScriptModifier());
  }

  @TestMethod
  public startsAType(): void {
    const parser = TypeScriptParserFixture.create("*");
    const node = parser.currentNode;
    Assert.isTrue(node.canStartTypeScriptType(parser));
  }

  @TestData('export * from "m";', "")
  @TestData('export type * from "m";', "")
  @TestMethod
  public startsAnExportClause(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }
}
