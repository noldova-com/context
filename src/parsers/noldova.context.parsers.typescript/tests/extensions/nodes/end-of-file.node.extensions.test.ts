/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { EndOfFileNode, SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import "@noldova/context.parsers.typescript/extensions/nodes/node.extensions.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class EndOfFileNodeExtensionsTests {
  @TestMethod
  public placesMissingSyntaxBeforeTrailingTriviaAtEndOfInput(): void {
    const plain = new EndOfFileNode(new SourceSpan(8, 0));
    const withTrivia = new EndOfFileNode(new SourceSpan(10, 0), new WhitespaceNode("  ", new SourceSpan(8, 2)));
    Assert.areEqual(8, plain.getTypeScriptMissingNodeDiagnosticSpan().startOffset);
    Assert.areEqual(8, withTrivia.getTypeScriptMissingNodeDiagnosticSpan().startOffset);
    Assert.areEqual(0, withTrivia.getTypeScriptMissingNodeDiagnosticSpan().length);
  }
}
