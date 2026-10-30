/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptRecordMark } from "@noldova/context.parsers.typescript/models/typescript-record-mark.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptRecordMarkTests {
  @TestMethod
  public keepsWhatEachRecordHeldWhenItWasTaken(): void {
    const mark = new TypeScriptRecordMark(true, 9, 1, 2, 3, 4, 5, 6, 7, 8, 10);

    Assert.isTrue(mark.hasImportMeta);
    Assert.areEqual(9, mark.awaitNameCount);
    Assert.areEqual(1, mark.writtenAwaitCount);
    Assert.areEqual(2, mark.writtenGlobalExportCount);
    Assert.areEqual(3, mark.reservedBindingNameCount);
    Assert.areEqual(4, mark.writtenTypePredicateCount);
    Assert.areEqual(5, mark.writtenObjectLiteralCount);
    Assert.areEqual(6, mark.patternLiteralCount);
    Assert.areEqual(7, mark.misplacedParameterPropertyCount);
    Assert.areEqual(8, mark.uncheckedSpanCount);
    Assert.areEqual(10, mark.commentDirectiveOffsetCount);
  }
}
