/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DiagnosticAuthority } from "@noldova/context.diagnostics";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class DiagnosticAuthorityTests {
  @TestMethod
  public providesTheCanonicalAuthoritiesAndPrefixes(): void {
    Assert.areEqual("CTX", DiagnosticAuthority.context.codePrefix);
    Assert.areEqual("TS", DiagnosticAuthority.typeScript.codePrefix);
    Assert.areNotEqual(DiagnosticAuthority.context, DiagnosticAuthority.typeScript);
  }
}
