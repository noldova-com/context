/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptFunctionDeclarationNode, TypeScriptParser } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptBlockNodeExtensionsTests {
  @TestData("declare namespace N { {} }", "TS1036@22:1")
  @TestData("declare namespace N { { x; } }", "TS1036@22:1|TS1036@24:1")
  @TestMethod
  public reportsAnAmbientStatementAtItsOpeningBrace(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("function f() {}", true)
  @TestData("function f() 5", false)
  @TestMethod
  public treatsOnlyAWrittenBlockAsPresent(content: string, expected: boolean): void {
    const node = TypeScriptParser.parse(content).rootNode.children[0];
    Assert.isInstanceOf(node, TypeScriptFunctionDeclarationNode);
    Assert.isDefined(node.bodyNode);

    Assert.areEqual(expected, node.bodyNode.isTypeScriptPresent());
  }
}
