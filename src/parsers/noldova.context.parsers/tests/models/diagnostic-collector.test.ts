/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DiagnosticAuthority, DiagnosticCategory, DiagnosticCode, DiagnosticTemplate } from "@noldova/context.diagnostics";
import { DiagnosticCollector, Source, SourceSpan } from "@noldova/context.parsers";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class DiagnosticCollectorTests {
  @TestMethod
  public addPreservesProductionOrder(): void {
    const collector = new DiagnosticCollector(new Source("text", "source.ts"));
    const template = new DiagnosticTemplate(
      new DiagnosticCode(DiagnosticAuthority.context, 1),
      DiagnosticCategory.Error,
      "First.");
    const first = template.create(undefined);
    const second = template.create(undefined);

    collector.add(first);
    collector.add(second);

    Assert.areEqual(2, collector.diagnostics.length);
    Assert.areEqual(first, collector.diagnostics[0]);
    Assert.areEqual(second, collector.diagnostics[1]);
  }

  @TestMethod
  public addCreatesAndCollectsTheOccurrenceFromATemplate(): void {
    const collector = new DiagnosticCollector(new Source("text", "source.ts"));
    const template = new DiagnosticTemplate(
      new DiagnosticCode(DiagnosticAuthority.context, 1),
      DiagnosticCategory.Error,
      "Expected {0}.");

    collector.add(template, new SourceSpan(1, 2), ["value"]);

    Assert.areEqual(1, collector.diagnostics.length);
    Assert.areEqual("Expected value.", collector.diagnostics[0]?.message.text);
    Assert.areEqual("source.ts", collector.diagnostics[0]?.location?.sourceIdentity);
    Assert.areEqual(1, collector.diagnostics[0]?.location?.start);
    Assert.areEqual(2, collector.diagnostics[0]?.location?.length);
  }

  @TestMethod
  public constructorAcceptsAnAnonymousSource(): void {
    const collector = new DiagnosticCollector(new Source("text"));
    const template = new DiagnosticTemplate(new DiagnosticCode(DiagnosticAuthority.context, 1), DiagnosticCategory.Error, "Expected.");

    collector.add(template, new SourceSpan(0, 1));

    Assert.isUndefined(collector.diagnostics[0]?.location?.sourceIdentity);
  }

  @TestMethod
  public truncateRemovesLaterDiagnostics(): void {
    const collector = new DiagnosticCollector(new Source("text"));
    const template = new DiagnosticTemplate(new DiagnosticCode(DiagnosticAuthority.context, 1), DiagnosticCategory.Error, "Expected.");
    const first = template.create(undefined);
    collector.add(first);
    collector.add(template.create(undefined));
    collector.add(template.create(undefined));

    collector.truncate(1);

    Assert.areEqual(1, collector.diagnostics.length);
    Assert.areEqual(first, collector.diagnostics[0]);
  }

  @TestMethod
  public truncateAcceptsACountAtOrBeyondTheLength(): void {
    const collector = new DiagnosticCollector(new Source("text"));
    const template = new DiagnosticTemplate(new DiagnosticCode(DiagnosticAuthority.context, 1), DiagnosticCategory.Error, "Expected.");
    const diagnostic = template.create(undefined);
    collector.add(diagnostic);

    collector.truncate(1);
    collector.truncate(5);

    Assert.areEqual(1, collector.diagnostics.length);
    Assert.areEqual(diagnostic, collector.diagnostics[0]);
  }
}
