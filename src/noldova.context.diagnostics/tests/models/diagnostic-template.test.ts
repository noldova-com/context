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
import { ArgumentException } from "@noldova/context.exceptions";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

@TestClass
export class DiagnosticTemplateTests {
  @TestMethod
  public carriesTheTemplate(): void {
    const code = this.createCode(2304);
    const template = new DiagnosticTemplate(code, DiagnosticCategory.Error, "Cannot find name '{0}'.", [DiagnosticTag.Unnecessary]);

    Assert.areEqual(code, template.code);
    Assert.areEqual(DiagnosticCategory.Error, template.category);
    Assert.areEqual("Cannot find name '{0}'.", template.messageTemplate);
    Assert.areEqual(1, template.defaultTags.length);
    Assert.areEqual<DiagnosticTag | undefined>(DiagnosticTag.Unnecessary, template.defaultTags[0]);
  }

  @TestMethod
  public defaultsToNoTags(): void {
    Assert.areEqual(0, this.createTemplate("A message.").defaultTags.length);
  }

  @TestMethod
  public copiesDefaultTagsFromTheCaller(): void {
    const defaultTags = [DiagnosticTag.Unnecessary];
    const template = this.createTemplate("A message.", defaultTags);

    defaultTags.length = 0;

    Assert.areEqual(1, template.defaultTags.length);
  }

  @TestMethod
  public rejectsADuplicateDefaultTag(): void {
    Assert.throws(() => this.createTemplate("A message.", [DiagnosticTag.Deprecated, DiagnosticTag.Deprecated]), ArgumentException);
  }

  @TestMethod
  public formatsPlaceholdersBeyondTheFirstTen(): void {
    const diagnostic = this.createTemplate("{0}{1}{2}{3}{4}{5}{6}{7}{8}{9}{10}").create(undefined, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

    Assert.areEqual("012345678910", diagnostic.message.text);
  }

  @TestMethod
  public rejectsAWhitespaceTemplate(): void {
    Assert.throws(() => this.createTemplate(" "), ArgumentException);
  }

  @TestMethod
  public createsAFormattedOccurrence(): void {
    const template = this.createTemplate("Cannot find name '{0}'.");
    const location = new DiagnosticLocation("sample.ts", 12, 5);
    const diagnostic = template.create(location, ["value"]);

    Assert.areEqual("Cannot find name 'value'.", diagnostic.message.text);
    Assert.areEqual<DiagnosticLocation | undefined>(location, diagnostic.location);
    Assert.areEqual(template.code, diagnostic.code);
    Assert.areEqual(DiagnosticCategory.Error, diagnostic.category);
    Assert.areEqual(0, diagnostic.message.children.length);
    Assert.areEqual(0, diagnostic.relatedInformation.length);
    Assert.areEqual(0, diagnostic.tags.length);
  }

  @TestMethod
  public createsAnOccurrenceWithoutALocation(): void {
    Assert.isUndefined(this.createTemplate("A constant message.").create(undefined).location);
  }

  @TestMethod
  @TestData("")
  @TestData(" ")
  @TestData("\t\r\n")
  public rejectsMessagesThatBecomeBlankAfterFormatting(value: string): void {
    const template = this.createTemplate("{0}");
    const failure = Assert.throws(() => template.create(undefined, [value]), ArgumentException);

    Assert.areEqual("text", failure.parameterName);
    Assert.areEqual("{0}", template.messageTemplate);
    Assert.areEqual("value", template.create(undefined, ["value"]).message.text);
  }

  @TestMethod
  public acceptsAnEmptyArgumentWhenTheMessageRemainsNonblank(): void {
    const diagnostic = this.createTemplate("Cannot find name '{0}'.").create(undefined, [""]);

    Assert.areEqual("Cannot find name ''.", diagnostic.message.text);
  }

  @TestMethod
  public preservesUnavailablePlaceholdersWithoutValidatingTheCatalog(): void {
    const diagnostic = this.createTemplate("Cannot find name '{0}'.").create(undefined);

    Assert.areEqual("Cannot find name '{0}'.", diagnostic.message.text);
  }

  @TestMethod
  public createsIndependentOccurrencesFromTheSameTemplate(): void {
    const template = this.createTemplate("Cannot find name '{0}'.");
    const messageArguments = ["value"];
    const first = template.create(undefined, messageArguments);

    messageArguments[0] = "other";
    const second = template.create(undefined, messageArguments);

    Assert.areNotEqual(first, second);
    Assert.areNotEqual(first.message, second.message);
    Assert.areEqual("Cannot find name 'value'.", first.message.text);
    Assert.areEqual("Cannot find name 'other'.", second.message.text);
    Assert.areEqual("Cannot find name '{0}'.", template.messageTemplate);
  }

  @TestMethod
  public formatsEveryOccurrenceOfARepeatedPlaceholder(): void {
    const diagnostic = this.createTemplate("'{0}' shadows '{0}'.").create(undefined, ["value"]);

    Assert.areEqual("'value' shadows 'value'.", diagnostic.message.text);
  }

  @TestMethod
  public formatsANumericArgument(): void {
    const diagnostic = this.createTemplate("Expected {0} arguments.").create(undefined, [3]);

    Assert.areEqual("Expected 3 arguments.", diagnostic.message.text);
  }

  @TestMethod
  public formatsSeveralArgumentsInOrder(): void {
    const diagnostic = this.createTemplate("Type '{0}' is not assignable to type '{1}'.").create(undefined, ["string", "number"]);

    Assert.areEqual("Type 'string' is not assignable to type 'number'.", diagnostic.message.text);
  }

  @TestMethod
  public doesNotInterpretArgumentTextAsAPlaceholder(): void {
    const diagnostic = this.createTemplate("{0} / {1}").create(undefined, ["{1}", "second"]);

    Assert.areEqual("{1} / second", diagnostic.message.text);
  }

  @TestMethod
  public carriesRelatedInformationAndTags(): void {
    const template = this.createTemplate("A constant message.");
    const relatedMessage = new DiagnosticMessage(this.createCode(2728), DiagnosticCategory.Error, "'value' is declared here.", []);
    const relatedInformation = new DiagnosticRelatedInformation(relatedMessage, undefined);
    const diagnostic = template.create(undefined, [], [relatedInformation], [DiagnosticTag.Deprecated]);

    Assert.areEqual(1, diagnostic.relatedInformation.length);
    Assert.areEqual<DiagnosticTag | undefined>(DiagnosticTag.Deprecated, diagnostic.tags[0]);
  }

  @TestMethod
  public addsOccurrenceTagsAfterDefaultTags(): void {
    const template = this.createTemplate("A constant message.", [DiagnosticTag.Unnecessary]);
    const diagnostic = template.create(undefined, [], [], [DiagnosticTag.Deprecated]);

    Assert.areEqual(2, diagnostic.tags.length);
    Assert.areEqual<DiagnosticTag | undefined>(DiagnosticTag.Unnecessary, diagnostic.tags[0]);
    Assert.areEqual<DiagnosticTag | undefined>(DiagnosticTag.Deprecated, diagnostic.tags[1]);
  }

  @TestMethod
  public rejectsADuplicateAcrossDefaultAndOccurrenceTags(): void {
    const template = this.createTemplate("A constant message.", [DiagnosticTag.Deprecated]);

    Assert.throws(() => template.create(undefined, [], [], [DiagnosticTag.Deprecated]), ArgumentException);
  }

  private createCode(value: number): DiagnosticCode {
    return new DiagnosticCode(DiagnosticAuthority.typeScript, value);
  }

  private createTemplate(messageTemplate: string, defaultTags: readonly DiagnosticTag[] = []): DiagnosticTemplate {
    return new DiagnosticTemplate(this.createCode(2304), DiagnosticCategory.Error, messageTemplate, defaultTags);
  }
}
