/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DiagnosticTag } from "@noldova/context.diagnostics";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class DiagnosticTagTests {
  @TestMethod
  public namesTheTagsCanonically(): void {
    Assert.areEqual<string>("Unnecessary", DiagnosticTag.Unnecessary);
    Assert.areEqual<string>("Deprecated", DiagnosticTag.Deprecated);
  }
}
