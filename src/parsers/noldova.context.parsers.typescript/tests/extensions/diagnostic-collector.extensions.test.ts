/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DiagnosticCollector, Source, SourceSpan } from "@noldova/context.parsers";
import { TypeScriptParser } from "@noldova/context.parsers.typescript";
import "@noldova/context.parsers.typescript/extensions/diagnostic-collector.extensions.js";
import { TypeScriptDiagnosticTemplates } from "@noldova/context.parsers.typescript/models/diagnostics/typescript-diagnostic-templates.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../fixtures/typescript-parser.fixture.js";

@TestClass
export class DiagnosticCollectorExtensionsTests {
  @TestMethod
  public enrichesSyntaxDiagnosticsWithoutLosingLaterGrammarDiagnostics(): void {
    const source = new Source("(value");
    const collector = new DiagnosticCollector(source);
    const end = new SourceSpan(source.length, 0);
    collector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1005, end, [")"]);
    collector.addTypeScriptGrammarDiagnostic(source, TypeScriptDiagnosticTemplates.TS1109, new SourceSpan(1, 1));
    const grammarDiagnostic = collector.diagnostics[1];
    collector.relateTypeScriptOpeningDelimiter(source, new SourceSpan(0, 1), "(", ")");
    Assert.areEqual(2, collector.diagnostics.length);
    Assert.areEqual(1, collector.diagnostics[0]?.relatedInformation.length);
    Assert.areEqual(grammarDiagnostic, collector.diagnostics[1]);
    Assert.areEqual(0, collector.getLastTypeScriptParseDiagnosticIndex());
    Assert.isFalse(collector.hasTypeScriptParseDiagnosticsSince(1));
    Assert.isTrue(collector.hasTypeScriptParseDiagnosticsSince(0));
  }

  @TestMethod
  public attachesTheWrittenOpeningDelimiterWithoutReplacingAnotherParseError(): void {
    const source = new Source("(value", "input.ts");
    const collector = new DiagnosticCollector(source);
    const end = new SourceSpan(source.length, 0);
    const opening = new SourceSpan(0, 1);
    collector.addTypeScriptMissingClosingDelimiterDiagnostic(source, end, opening, "(", ")");
    const diagnostic = collector.diagnostics[0];
    Assert.areEqual("')' expected.", diagnostic?.message.text);
    Assert.areEqual("input.ts", diagnostic?.location?.sourceIdentity);
    Assert.areEqual("input.ts", diagnostic?.relatedInformation[0]?.location?.sourceIdentity);
    Assert.areEqual(0, diagnostic?.relatedInformation[0]?.location?.start);
    Assert.areEqual(0, diagnostic?.relatedInformation[0]?.location?.length);
    collector.truncate(0);
    collector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1109, end);
    const original = collector.diagnostics[0];
    collector.addTypeScriptMissingClosingDelimiterDiagnostic(source, end, opening, "(", ")");
    Assert.areEqual(1, collector.diagnostics.length);
    Assert.areEqual(original, collector.diagnostics[0]);
    Assert.areEqual(0, collector.diagnostics[0]?.relatedInformation.length);
  }

  @TestMethod
  public namesNoOpeningDelimiterOnAnExpectedTokenReportedEarlierAtTheSameOffset(): void {
    const source = new Source("(value");
    const collector = new DiagnosticCollector(source);
    const end = new SourceSpan(source.length, 0);
    collector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1005, end, [";"]);
    collector.addTypeScriptMissingClosingDelimiterDiagnostic(source, end, new SourceSpan(0, 1), "(", ")");
    Assert.areEqual(1, collector.diagnostics.length);
    Assert.areEqual("';' expected.", collector.diagnostics[0]?.message.text);
    Assert.areEqual(0, collector.diagnostics[0]?.relatedInformation.length);
  }

  @TestMethod
  public namesNoOpeningDelimiterThatWasNotWritten(): void {
    const source = new Source("value");
    const collector = new DiagnosticCollector(source);
    collector.addTypeScriptMissingClosingDelimiterDiagnostic(source, new SourceSpan(source.length, 0), undefined, "(", ")");
    Assert.areEqual(1, collector.diagnostics.length);
    Assert.areEqual("')' expected.", collector.diagnostics[0]?.message.text);
    Assert.areEqual(0, collector.diagnostics[0]?.relatedInformation.length);
  }

  @TestMethod
  public relatesTheOpeningDelimiterToTheLastExpectedTokenReport(): void {
    const source = new Source("(value");
    const collector = new DiagnosticCollector(source);
    const end = new SourceSpan(source.length, 0);
    collector.relateTypeScriptOpeningDelimiter(source, new SourceSpan(0, 1), "(", ")");
    Assert.areEqual(0, collector.diagnostics.length);
    collector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1005, end, [";"]);
    collector.relateTypeScriptOpeningDelimiter(source, new SourceSpan(0, 1), "(", ")");
    Assert.areEqual(1, collector.diagnostics.length);
    Assert.areEqual("';' expected.", collector.diagnostics[0]?.message.text);
    Assert.areEqual("The parser expected to find a ')' to match the '(' token here.", collector.diagnostics[0]?.relatedInformation[0]?.message.text);
    collector.truncate(0);
    collector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1109, end);
    collector.relateTypeScriptOpeningDelimiter(source, new SourceSpan(0, 1), "(", ")");
    Assert.areEqual(0, collector.diagnostics[0]?.relatedInformation.length);
  }

  @TestMethod
  public keepsTheFirstParseErrorAtARepeatedOffset(): void {
    const collector = new DiagnosticCollector(new Source("value", "source.ts"));
    collector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1005, new SourceSpan(0, 1), [";"]);
    const first = collector.diagnostics[0];
    collector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1434, new SourceSpan(0, 5));

    Assert.areEqual(1, collector.diagnostics.length);
    Assert.areEqual(first, collector.diagnostics[0]);
    Assert.areEqual("';' expected.", first?.message.text);
    Assert.areEqual("source.ts", first?.location?.sourceIdentity);
    Assert.areEqual(1, first?.location?.length);
  }

  @TestMethod
  public preservesNonconsecutiveErrorsAtTheSameOffset(): void {
    const collector = new DiagnosticCollector(new Source("abc"));
    collector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1109, new SourceSpan(0, 1));
    collector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1109, new SourceSpan(1, 1));
    collector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1109, new SourceSpan(0, 1));

    Assert.areEqual(3, collector.diagnostics.length);
    Assert.areEqual(0, collector.diagnostics[0]?.location?.start);
    Assert.areEqual(1, collector.diagnostics[1]?.location?.start);
    Assert.areEqual(0, collector.diagnostics[2]?.location?.start);
  }

  @TestMethod
  public leavesOrdinaryCollectionAndExistingOccurrencesUnchanged(): void {
    const collector = new DiagnosticCollector(new Source("value"));
    const diagnostic = TypeScriptDiagnosticTemplates.TS1109.create(undefined);
    collector.add(diagnostic);
    collector.add(diagnostic);
    collector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1109, new SourceSpan(0, 0));
    collector.add(TypeScriptDiagnosticTemplates.TS1005, new SourceSpan(0, 0), [";"]);

    Assert.areEqual(4, collector.diagnostics.length);
    Assert.areEqual(diagnostic, collector.diagnostics[0]);
    Assert.areEqual(diagnostic, collector.diagnostics[1]);
    Assert.areEqual("TS1109", collector.diagnostics[2]?.code.displayText);
    Assert.areEqual("TS1005", collector.diagnostics[3]?.code.displayText);
  }

  @TestMethod
  public derivesSuppressionFromTheRestoredTailRatherThanHiddenState(): void {
    const collector = new DiagnosticCollector(new Source("abc"));
    const other = new DiagnosticCollector(new Source("abc"));
    collector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1109, new SourceSpan(0, 1));
    collector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1109, new SourceSpan(1, 1));
    collector.truncate(1);
    collector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1109, new SourceSpan(1, 1));
    other.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1109, new SourceSpan(1, 1));

    Assert.areEqual(2, collector.diagnostics.length);
    Assert.areEqual(1, collector.diagnostics[1]?.location?.start);
    Assert.areEqual(1, other.diagnostics.length);
  }

  @TestMethod
  public suppressesAParseErrorAtALexicalErrorAcrossLookAheadAndTryParse(): void {
    const parser = TypeScriptParserFixture.create("a §;");
    const collector = parser.context.diagnosticCollector;
    parser.lookAhead(() => {
      parser.advance();
      collector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1109, parser.currentNode.span);
      Assert.areEqual("TS1127@2:1", TypeScriptDiagnosticsFixture.project(collector.diagnostics));
      return true;
    });

    parser.advance();
    Assert.areEqual("TS1127@2:1", TypeScriptDiagnosticsFixture.project(collector.diagnostics));
    parser.tryParse(() => {
      collector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1109, parser.currentNode.span);
      parser.advance();
      collector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1109, parser.currentNode.span);
      Assert.areEqual("TS1127@2:1|TS1109@3:1", TypeScriptDiagnosticsFixture.project(collector.diagnostics));
      return undefined;
    });

    collector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1109, parser.currentNode.span);
    Assert.areEqual("TS1127@2:1", TypeScriptDiagnosticsFixture.project(collector.diagnostics));
  }

  @TestMethod
  public namesTheOpeningDelimiterAtAZeroWidthLocation(): void {
    const source = new Source("(value", "input.ts");
    const collector = new DiagnosticCollector(source);

    const information = collector.createTypeScriptOpeningDelimiterInformation(source, new SourceSpan(0, 1), "(", ")");

    Assert.areEqual("The parser expected to find a ')' to match the '(' token here.", information.message.text);
    Assert.areEqual("input.ts", information.location?.sourceIdentity);
    Assert.areEqual(0, information.location?.start);
    Assert.areEqual(0, information.location?.length);
  }

  @TestMethod
  public findsTheLastParseDiagnosticByItsStart(): void {
    const source = new Source("(value");
    const collector = new DiagnosticCollector(source);
    Assert.isFalse(collector.isLastTypeScriptParseDiagnosticAt(0));

    collector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1109, new SourceSpan(1, 1));
    collector.addTypeScriptGrammarDiagnostic(source, TypeScriptDiagnosticTemplates.TS1109, new SourceSpan(3, 1));

    Assert.isTrue(collector.isLastTypeScriptParseDiagnosticAt(1));
    Assert.isFalse(collector.isLastTypeScriptParseDiagnosticAt(3));
  }

  @TestMethod
  public rollsBackGrammarDiagnosticsWithParseDiagnosticsAfterATentativeParse(): void {
    const parser = TypeScriptParserFixture.create("(value? = initial) => value");
    const collector = parser.context.diagnosticCollector;
    parser.tryParse(() => {
      parser.parseAssignmentExpression();
      Assert.areEqual("TS1015@1:5", TypeScriptDiagnosticsFixture.project(collector.diagnostics));
      return undefined;
    });

    Assert.areEqual(0, collector.diagnostics.length);
  }

  @TestMethod
  public reportsOneMissingSemicolonBeforeAWrittenOf(): void {
    const result = TypeScriptParser.parse("let a of b;");

    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS1005", result.diagnostics[0]?.code.displayText);
    Assert.areEqual("';' expected.", result.diagnostics[0]?.message.text);
    Assert.areEqual(6, result.diagnostics[0]?.location?.start);
    Assert.areEqual(2, result.diagnostics[0]?.location?.length);
    Assert.areEqual(3, result.rootNode.children.length);
  }

  @TestData("-a ** b", "TS17006@9:2")
  @TestData(">>> b", "TS1109@9:1")
  @TestMethod
  public reportsAnInitializerDiagnosticExactlyOnceAfterLookahead(initializer: string, expected: string): void {
    const parser = TypeScriptParserFixture.create(`(value = ${initializer}) => value;`);
    const collector = parser.context.diagnosticCollector;
    parser.lookAhead(() => {
      parser.parseExpression();
      Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(collector.diagnostics));
      return true;
    });

    Assert.areEqual(0, collector.diagnostics.length);
    parser.parseExpression();

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(collector.diagnostics));
  }
}
