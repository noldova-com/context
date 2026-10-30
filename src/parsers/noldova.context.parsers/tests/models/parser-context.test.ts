/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DiagnosticAuthority, DiagnosticCategory, DiagnosticCode, DiagnosticTemplate } from "@noldova/context.diagnostics";
import { ParserContext, Source, SourceSpan } from "@noldova/context.parsers";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class ParserContextTests {
  @TestMethod
  public startsWithAnEmptyDiagnosticSequence(): void {
    const source = new Source("text");

    const context = new ParserContext(source);

    Assert.areEqual(0, context.diagnosticCollector.diagnostics.length);
    Assert.areEqual(source, context.source);
  }

  @TestMethod
  public positionsDiagnosticsInItsSource(): void {
    const context = new ParserContext(new Source("text", "source.ts"));
    const template = new DiagnosticTemplate(new DiagnosticCode(DiagnosticAuthority.context, 1), DiagnosticCategory.Error, "Expected {0}.");

    context.diagnosticCollector.add(template, new SourceSpan(1, 1), ["grammar"]);

    Assert.areEqual("Expected grammar.", context.diagnosticCollector.diagnostics[0]?.message.text);
    Assert.areEqual("source.ts", context.diagnosticCollector.diagnostics[0]?.location?.sourceIdentity);
  }
}
