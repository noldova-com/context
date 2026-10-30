/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DiagnosticAuthority, DiagnosticCategory, DiagnosticLocation } from "@noldova/context.diagnostics";
import { TypeScriptParserDiagnosticTemplates } from "@noldova/context.parsers.typescript/models/diagnostics/typescript-parser-diagnostic-templates.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptParserDiagnosticTemplatesTests {
  @TestMethod
  public reportsTheImplementationLimitUnderItsOwnAuthority(): void {
    const template = TypeScriptParserDiagnosticTemplates.CTX2000;
    const location = new DiagnosticLocation("source.ts", 12, 1, 20);
    const diagnostic = template.create(location, [512]);

    Assert.areEqual(DiagnosticAuthority.context, diagnostic.code.authority);
    Assert.areEqual("CTX2000", diagnostic.code.displayText);
    Assert.areEqual(DiagnosticCategory.Error, diagnostic.category);
    Assert.areEqual("TypeScript parsing exceeds the supported recursion depth of 512.", diagnostic.message.text);
    Assert.areEqual(location, diagnostic.location);
    Assert.areEqual(0, diagnostic.tags.length);
    Assert.areEqual(0, diagnostic.relatedInformation.length);
  }
}
