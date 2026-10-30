/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import { TypeScriptCaretEqualsNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptCaretEqualsNodeExtensionsTests {
  @TestMethod
  public isAnAssignmentOperator(): void {
    const node = new TypeScriptCaretEqualsNode(new SourceSpan(0, 1));

    Assert.isTrue(node.isTypeScriptAssignmentOperator());
  }
}
