/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import { TypeScriptMissingExpressionNode, TypeScriptUnknownNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptMissingExpressionNodeTests {
  @TestMethod
  public preservesUnexpectedSyntax(): void {
    const unexpectedNode = new TypeScriptUnknownNode("@", new SourceSpan(0, 1));
    const node = new TypeScriptMissingExpressionNode(unexpectedNode.span, unexpectedNode);

    Assert.areEqual(unexpectedNode, node.unexpectedNode);
  }
}
