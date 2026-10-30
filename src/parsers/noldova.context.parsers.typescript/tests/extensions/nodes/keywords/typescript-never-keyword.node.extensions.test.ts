/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import { TypeScriptNeverKeywordNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptNeverKeywordNodeExtensionsTests {
  @TestMethod
  public isAPredefinedTypeKeyword(): void {
    const node = new TypeScriptNeverKeywordNode(new SourceSpan(0, 1));

    Assert.isTrue(node.isTypeScriptPredefinedTypeKeyword());
  }
}
