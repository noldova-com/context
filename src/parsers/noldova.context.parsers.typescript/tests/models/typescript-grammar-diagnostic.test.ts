/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  DiagnosticAuthority,
  DiagnosticCategory,
  DiagnosticCode,
  DiagnosticLocation,
  DiagnosticMessage,
  DiagnosticRelatedInformation,
  DiagnosticTag,
  DiagnosticTemplate
} from "@noldova/context.diagnostics";
import { TypeScriptGrammarDiagnostic } from "@noldova/context.parsers.typescript/models/typescript-grammar-diagnostic.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptGrammarDiagnosticTests {
  @TestMethod
  public preservesTheOriginalDiagnosticWithoutChangingItsPublicFields(): void {
    const template = new DiagnosticTemplate(new DiagnosticCode(DiagnosticAuthority.context, 3), DiagnosticCategory.Error, "Grammar error.");
    const location = new DiagnosticLocation("source.ts", 4, 3);
    const relatedMessage = new DiagnosticMessage(new DiagnosticCode(DiagnosticAuthority.context, 4), DiagnosticCategory.Message, "Related.", []);
    const relatedInformation = new DiagnosticRelatedInformation(relatedMessage, new DiagnosticLocation("source.ts", 0, 1));
    const diagnostic = template.create(location, [], [relatedInformation], [DiagnosticTag.Unnecessary]);
    const record = new TypeScriptGrammarDiagnostic(diagnostic);

    Assert.areEqual(diagnostic, record.diagnostic);
    Assert.areEqual(diagnostic.message, record.message);
    Assert.areEqual(diagnostic.code, record.code);
    Assert.areEqual(diagnostic.category, record.category);
    Assert.areEqual(location, record.location);
    Assert.areEqual(1, record.relatedInformation.length);
    Assert.areEqual(relatedInformation, record.relatedInformation[0]);
    Assert.areEqual(1, record.tags.length);
    Assert.areEqual(DiagnosticTag.Unnecessary, record.tags[0]);
  }
}
