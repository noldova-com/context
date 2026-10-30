/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  Diagnostic,
  DiagnosticAuthority,
  DiagnosticCategory,
  DiagnosticCode,
  DiagnosticLocation,
  DiagnosticMessage,
  DiagnosticRelatedInformation,
  DiagnosticTag
} from "@noldova/context.diagnostics";
import { ArgumentException } from "@noldova/context.exceptions";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class DiagnosticTests {
  @TestMethod
  public carriesTheOccurrence(): void {
    const location = new DiagnosticLocation("sample.ts", 12, 5);
    const diagnostic = new Diagnostic(this.createMessage(), location, [], []);

    Assert.areEqual("Cannot find name 'value'.", diagnostic.message.text);
    Assert.areEqual<DiagnosticLocation | undefined>(location, diagnostic.location);
    Assert.areEqual(0, diagnostic.relatedInformation.length);
    Assert.areEqual(0, diagnostic.tags.length);
  }

  @TestMethod
  public derivesTheCodeAndCategoryFromTheMessage(): void {
    const message = this.createMessage();
    const diagnostic = new Diagnostic(message, undefined, [], []);

    Assert.areEqual(message.code, diagnostic.code);
    Assert.areEqual("TS2304", diagnostic.code.displayText);
    Assert.areEqual(DiagnosticCategory.Error, diagnostic.category);
  }

  @TestMethod
  public acceptsAnAbsentLocation(): void {
    Assert.isUndefined(new Diagnostic(this.createMessage(), undefined, [], []).location);
  }

  @TestMethod
  public preservesTheRelatedInformationOrder(): void {
    const first = new DiagnosticRelatedInformation(this.createMessage(), undefined);
    const second = new DiagnosticRelatedInformation(this.createRelatedMessage(), undefined);
    const diagnostic = new Diagnostic(this.createMessage(), undefined, [first, second], []);

    Assert.areEqual(2, diagnostic.relatedInformation.length);
    Assert.areEqual<string | undefined>(first.message.text, diagnostic.relatedInformation[0]?.message.text);
    Assert.areEqual<string | undefined>(second.message.text, diagnostic.relatedInformation[1]?.message.text);
  }

  @TestMethod
  public preservesIdenticalRelatedInformation(): void {
    const first = new DiagnosticRelatedInformation(this.createRelatedMessage(), undefined);
    const second = new DiagnosticRelatedInformation(this.createRelatedMessage(), undefined);
    const diagnostic = new Diagnostic(this.createMessage(), undefined, [first, second], []);

    Assert.areEqual(2, diagnostic.relatedInformation.length);
  }

  @TestMethod
  public acceptsDistinctTags(): void {
    const diagnostic = new Diagnostic(this.createMessage(), undefined, [], [DiagnosticTag.Unnecessary, DiagnosticTag.Deprecated]);

    Assert.areEqual(2, diagnostic.tags.length);
    Assert.areEqual<DiagnosticTag | undefined>(DiagnosticTag.Unnecessary, diagnostic.tags[0]);
  }

  @TestMethod
  public rejectsADuplicateTag(): void {
    Assert.throws(
      () => new Diagnostic(this.createMessage(), undefined, [], [DiagnosticTag.Deprecated, DiagnosticTag.Deprecated]),
      ArgumentException);
  }

  @TestMethod
  public copiesTheSequencesFromTheCaller(): void {
    const tags = [DiagnosticTag.Unnecessary];
    const relatedInformation = [new DiagnosticRelatedInformation(this.createRelatedMessage(), undefined)];
    const diagnostic = new Diagnostic(this.createMessage(), undefined, relatedInformation, tags);

    tags.length = 0;
    relatedInformation.length = 0;

    Assert.areEqual(1, diagnostic.tags.length);
    Assert.areEqual(1, diagnostic.relatedInformation.length);
  }

  private createMessage(): DiagnosticMessage {
    const code = new DiagnosticCode(DiagnosticAuthority.typeScript, 2304);

    return new DiagnosticMessage(code, DiagnosticCategory.Error, "Cannot find name 'value'.", []);
  }

  private createRelatedMessage(): DiagnosticMessage {
    const code = new DiagnosticCode(DiagnosticAuthority.typeScript, 2728);

    return new DiagnosticMessage(code, DiagnosticCategory.Error, "'value' is declared here.", []);
  }
}
