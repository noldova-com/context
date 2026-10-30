/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DiagnosticAuthority, DiagnosticCategory, DiagnosticCode, DiagnosticLocation, DiagnosticTemplate } from "@noldova/context.diagnostics";
import { TypeScriptBinderDiagnostic } from "@noldova/context.parsers.typescript/models/typescript-binder-diagnostic.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptBinderDiagnosticTests {
  @TestMethod
  public keepsTheOriginalDiagnosticAndForwardsItsLocationAndCode(): void {
    const template = new DiagnosticTemplate(new DiagnosticCode(DiagnosticAuthority.typeScript, 1212), DiagnosticCategory.Error, "Binder error.");
    const diagnostic = template.create(new DiagnosticLocation("source.ts", 4, 3));
    const record = new TypeScriptBinderDiagnostic(diagnostic);

    Assert.areEqual(diagnostic, record.diagnostic);
    Assert.areEqual(diagnostic.location, record.location);
    Assert.areEqual(diagnostic.code, record.code);
  }
}
