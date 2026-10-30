/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, TestClass, TestMethod } from "@noldova/context.testing";
import * as api from "@noldova/context.text";

@TestClass
export class TextApiTests {
  @TestMethod
  public exportsTheCompleteCatalog(): void {
    Assert.areEqual("EcmaScriptLineTerminator,LineTerminator,ReadOnlyStringSpan,StringBuilder,UnicodeCodePointService", Object.keys(api).sort().join(","));
  }

  @TestMethod
  public exposesTheDocumentedConstructibleTypes(): void {
    Assert.isInstanceOf(new api.EcmaScriptLineTerminator(), api.LineTerminator);
    Assert.areEqual("text", new api.ReadOnlyStringSpan("text").toString());
    Assert.areEqual("text", new api.StringBuilder().append("text").toString());
    Assert.isTrue(api.UnicodeCodePointService.isIdentifierStart(0x41));
  }
}
