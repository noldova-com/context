/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import { TypeScriptAwaitKeywordNode } from "@noldova/context.parsers.typescript";
import { TypeScriptWrittenAwait } from "@noldova/context.parsers.typescript/models/typescript-written-await.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptWrittenAwaitTests {
  @TestMethod
  public keepsEachFactInItsRole(): void {
    const keywordNode = new TypeScriptAwaitKeywordNode(new SourceSpan(0, 5));
    const writtenAwait = new TypeScriptWrittenAwait(keywordNode, true, false);

    Assert.areEqual(keywordNode, writtenAwait.keywordNode);
    Assert.isTrue(writtenAwait.isForAwait);
    Assert.isFalse(writtenAwait.isSourceTopLevel);
  }
}
