/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import { TypeScriptPackageKeywordNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptPackageKeywordNodeExtensionsTests {
  @TestMethod
  public isABindingIdentifier(): void {
    const node = new TypeScriptPackageKeywordNode(new SourceSpan(0, 0));

    Assert.isTrue(node.isTypeScriptBindingIdentifier());
  }
}
