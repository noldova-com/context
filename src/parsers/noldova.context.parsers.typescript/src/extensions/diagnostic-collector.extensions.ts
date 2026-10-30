/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Diagnostic, DiagnosticAuthority, DiagnosticLocation, DiagnosticRelatedInformation, type DiagnosticTemplate } from "@noldova/context.diagnostics";
import { DiagnosticCollector, type Source, type SourceSpan } from "@noldova/context.parsers";

import { TypeScriptDiagnosticTemplates } from "../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptBinderDiagnostic } from "../models/typescript-binder-diagnostic.js";
import { TypeScriptGrammarDiagnostic } from "../models/typescript-grammar-diagnostic.js";

declare module "@noldova/context.parsers" {
  interface DiagnosticCollector {
    addTypeScriptGrammarDiagnostic(source: Source, template: DiagnosticTemplate, span: SourceSpan, messageArguments?: readonly (string | number)[]): void;
    addTypeScriptBinderDiagnostic(source: Source, template: DiagnosticTemplate, span: SourceSpan, messageArguments?: readonly (string | number)[]): void;
    addTypeScriptRelatedGrammarDiagnostic(source: Source, template: DiagnosticTemplate, span: SourceSpan, relatedTemplate: DiagnosticTemplate,
      relatedSpan: SourceSpan): void;
    getLastTypeScriptParseDiagnosticIndex(): number;
    hasTypeScriptParseDiagnosticsSince(count: number): boolean;
    addTypeScriptMissingClosingDelimiterDiagnostic(source: Source, span: SourceSpan, openingSpan: SourceSpan | undefined, openingText: string,
      closingText: string): void;
    relateTypeScriptOpeningDelimiter(source: Source, openingSpan: SourceSpan, openingText: string, closingText: string): void;
    createTypeScriptOpeningDelimiterInformation(source: Source, openingSpan: SourceSpan, openingText: string,
      closingText: string): DiagnosticRelatedInformation;
    isLastTypeScriptParseDiagnosticAt(offset: number): boolean;
    addTypeScriptParseDiagnostic(template: DiagnosticTemplate, span: SourceSpan, messageArguments?: readonly (string | number)[]): void;
  }
}

DiagnosticCollector.prototype.addTypeScriptParseDiagnostic = function (
  this: DiagnosticCollector,
  template: DiagnosticTemplate,
  span: SourceSpan,
  messageArguments?: readonly (string | number)[]): void {
  if (!this.isLastTypeScriptParseDiagnosticAt(span.startOffset))
    this.add(template, span, messageArguments);
};

DiagnosticCollector.prototype.addTypeScriptMissingClosingDelimiterDiagnostic = function (
  this: DiagnosticCollector,
  source: Source,
  span: SourceSpan,
  openingSpan: SourceSpan | undefined,
  openingText: string,
  closingText: string): void {
  if (this.isLastTypeScriptParseDiagnosticAt(span.startOffset))
    return;
  const relatedInformation = Object.isUndefined(openingSpan)
    ? []
    : [this.createTypeScriptOpeningDelimiterInformation(source, openingSpan, openingText, closingText)];
  this.add(TypeScriptDiagnosticTemplates.TS1005.create(new DiagnosticLocation(source.identity, span.startOffset, span.length, source.length),
    [closingText], relatedInformation));
};

DiagnosticCollector.prototype.relateTypeScriptOpeningDelimiter = function (
  this: DiagnosticCollector,
  source: Source,
  openingSpan: SourceSpan,
  openingText: string,
  closingText: string): void {
  const lastIndex = this.getLastTypeScriptParseDiagnosticIndex();
  const last = this.diagnostics[lastIndex];
  if (last?.code.displayText !== TypeScriptDiagnosticTemplates.TS1005.code.displayText)
    return;
  const information = this.createTypeScriptOpeningDelimiterInformation(source, openingSpan, openingText, closingText);
  const laterDiagnostics = this.diagnostics.slice(lastIndex + 1);
  this.truncate(lastIndex);
  this.add(new Diagnostic(last.message, last.location, [...last.relatedInformation, information], last.tags));
  for (const laterDiagnostic of laterDiagnostics)
    this.add(laterDiagnostic);
};

DiagnosticCollector.prototype.createTypeScriptOpeningDelimiterInformation = function (
  this: DiagnosticCollector,
  source: Source,
  openingSpan: SourceSpan,
  openingText: string,
  closingText: string): DiagnosticRelatedInformation {
  const related = TypeScriptDiagnosticTemplates.TS1007.create(
    new DiagnosticLocation(source.identity, openingSpan.startOffset, 0, source.length), [openingText, closingText]);
  return new DiagnosticRelatedInformation(related.message, related.location);
};

DiagnosticCollector.prototype.isLastTypeScriptParseDiagnosticAt = function (this: DiagnosticCollector, offset: number): boolean {
  return this.diagnostics[this.getLastTypeScriptParseDiagnosticIndex()]?.location?.start === offset;
};

DiagnosticCollector.prototype.addTypeScriptGrammarDiagnostic = function (
  this: DiagnosticCollector, source: Source, template: DiagnosticTemplate, span: SourceSpan, messageArguments: readonly (string | number)[] = []): void {
  const diagnostic = template.create(new DiagnosticLocation(source.identity, span.startOffset, span.length, source.length), messageArguments);
  this.add(new TypeScriptGrammarDiagnostic(diagnostic));
};

DiagnosticCollector.prototype.addTypeScriptBinderDiagnostic = function (
  this: DiagnosticCollector, source: Source, template: DiagnosticTemplate, span: SourceSpan, messageArguments: readonly (string | number)[] = []): void {
  const diagnostic = template.create(new DiagnosticLocation(source.identity, span.startOffset, span.length, source.length), messageArguments);
  this.add(new TypeScriptBinderDiagnostic(diagnostic));
};

DiagnosticCollector.prototype.addTypeScriptRelatedGrammarDiagnostic = function (
  this: DiagnosticCollector, source: Source, template: DiagnosticTemplate, span: SourceSpan, relatedTemplate: DiagnosticTemplate,
  relatedSpan: SourceSpan): void {
  const related = relatedTemplate.create(new DiagnosticLocation(source.identity, relatedSpan.startOffset, relatedSpan.length, source.length));
  const diagnostic = template.create(new DiagnosticLocation(source.identity, span.startOffset, span.length, source.length), [],
    [new DiagnosticRelatedInformation(related.message, related.location)]);
  this.add(new TypeScriptGrammarDiagnostic(diagnostic));
};

DiagnosticCollector.prototype.getLastTypeScriptParseDiagnosticIndex = function (this: DiagnosticCollector): number {
  for (let index = this.diagnostics.length - 1; index >= 0; index--) {
    const diagnostic = this.diagnostics[index]!;
    if (!(diagnostic instanceof TypeScriptGrammarDiagnostic) && diagnostic.code.authority === DiagnosticAuthority.typeScript)
      return index;
  }
  return -1;
};

DiagnosticCollector.prototype.hasTypeScriptParseDiagnosticsSince = function (this: DiagnosticCollector, count: number): boolean {
  for (let index = count; index < this.diagnostics.length; index++) {
    const diagnostic = this.diagnostics[index]!;
    if (!(diagnostic instanceof TypeScriptGrammarDiagnostic) && diagnostic.code.authority === DiagnosticAuthority.typeScript)
      return true;
  }
  return false;
};
