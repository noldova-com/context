/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Source, SourceReader, SourceSpan, ValueNode } from "@noldova/context.parsers";
import { TypeScriptParser, TypeScriptVariableDeclarationNode, TypeScriptVariableStatementNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class VariableDeclarationListParserTests {
  @TestMethod
  public restoresDeclarationRecoveryAndAbsoluteOffsetsInBoundedInput(): void {
    const content = " /*lead*/ using x, );";
    const reader = new SourceReader(new Source("<html>" + content + "</html>"), new SourceSpan(6, content.length));
    const result = new TypeScriptParser(reader).parse();
    const statement = result.rootNode.children[0];
    Assert.isInstanceOf(statement, TypeScriptVariableStatementNode);
    Assert.isDefined(statement.leadingTrivia);
    Assert.areEqual("TS1134", result.diagnostics.map(t => t.code.displayText).join(","));
    Assert.areEqual(6 + content.indexOf(")"), result.diagnostics[0]?.location?.start);
    Assert.areEqual(6 + content.length, reader.currentOffset);

    const parser = TypeScriptParserFixture.create(content);
    const original = parser.currentNode;
    parser.lookAhead(() => { parser.parseStatement(); return true; });
    Assert.areEqual(original, parser.currentNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
    parser.tryParse(() => { parser.parseStatement(); return undefined; });
    Assert.areEqual(original, parser.currentNode);
    parser.parseStatement();
    Assert.areEqual(3, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public makesProgressAcrossAFlatRunOfUnownedTokens(): void {
    const result = TypeScriptParser.parse("var value " + ") ".repeat(256) + ";");
    Assert.areEqual(1, result.rootNode.children.length);
    Assert.areEqual(256, result.diagnostics.length);
    Assert.areEqual("TS1005", result.diagnostics[0]?.code.displayText);
    Assert.areEqual("TS1134", result.diagnostics.at(-1)?.code.displayText);
  }

  @TestData("using x = r, of resources){}", "TS1005@16:9|TS1005@25:1")
  @TestData("for(await using x, of resources){}", "TS1005@22:9|TS1005@31:1|TS1005@34:0")
  @TestData("using {x}! = r;", "TS1005@9:1|TS1109@11:1")
  @TestData("for(using x! = r;;){}", "TS1005@11:1|TS1109@13:1|TS1005@16:1|TS1128@18:1")
  @TestData("for(let x! = r;;){}", "TS1005@9:1|TS1109@11:1|TS1005@14:1|TS1128@16:1")
  @TestData("for(await using of r()){}", "TS1005@19:1|TS1005@20:1|TS1109@21:1|TS1005@22:1")
  @TestData("using x, );", "TS1134@9:1")
  @TestMethod
  public reportsMalformedResourceAndForInitializerDeclarations(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("if (ready) run();", "TS1005@10:2 ',' expected.", 10)
  @TestData("do {} while(ready);", "TS1005@10:2 ',' expected.", 10)
  @TestData("while(ready){}", "TS1005@10:5 ',' expected.", 10)
  @TestData("for(;;){}", "TS1005@10:3 ',' expected.", 10)
  @TestData("continue;", "TS1005@10:8 ',' expected.", 10)
  @TestData("break;", "TS1005@10:5 ',' expected.", 10)
  @TestData("return;", "TS1005@10:6 ',' expected.", 10)
  @TestData("with(scope){}", "TS1005@10:4 ',' expected.", 10)
  @TestData("switch(value){}", "TS1005@10:6 ',' expected.", 10)
  @TestData("throw error;", "TS1005@10:5 ',' expected.", 10)
  @TestData("try{} finally{}", "TS1005@10:3 ',' expected.", 10)
  @TestData("debugger;", "TS1005@10:8 ',' expected.", 10)
  @TestData("catch{}", "TS1005@10:5 ',' expected.", 9)
  @TestData("finally{}", "TS1005@10:7 ',' expected.", 9)
  @TestMethod
  public leavesARecognizableFollowingStatementWithItsGrammarOwner(statement: string, expected: string, statementStart: number): void {
    const result = TypeScriptParser.parse("var value " + statement);
    Assert.areEqual(2, result.rootNode.children.length);
    Assert.isInstanceOf(result.rootNode.children[0], TypeScriptVariableStatementNode);
    Assert.areEqual(statementStart, result.rootNode.children[1]?.span.startOffset);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
  }

  @TestMethod
  public skipsAnUnownedClosingTokenWithoutInventingAMissingDeclaration(): void {
    const result = TypeScriptParser.parse("using x, );");
    const statement = result.rootNode.children[0];
    Assert.isInstanceOf(statement, TypeScriptVariableStatementNode);
    Assert.areEqual(1, result.rootNode.children.length);
    Assert.areEqual(1, statement.declarationListNode.children.length);
    Assert.areEqual(1, statement.declarationListNode.commaNodes.length);
    Assert.isDefined(statement.semicolonNode);
    Assert.areEqual("Variable declaration expected.", result.diagnostics[0]?.message.text);
  }

  @TestMethod
  public keepsAnEnclosingSwitchClauseAvailableDuringDeclarationRecovery(): void {
    const result = TypeScriptParser.parse("switch(x){case 1: var value, case 2:;}");
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS1389", result.diagnostics[0]?.code.displayText);
    Assert.areEqual("'case' is not allowed as a variable declaration name.", result.diagnostics[0]?.message.text);
  }

  @TestData("using first = a, second = b;")
  @TestData("await using first = a, second = b;")
  @TestData("using first = a,\nsecond = b;")
  @TestMethod
  public sharesOrdinaryCommaAndLineBreakGrammarForResourceLists(content: string): void {
    const result = TypeScriptParser.parse(content);
    const statement = result.rootNode.children[0];
    Assert.isInstanceOf(statement, TypeScriptVariableStatementNode);
    Assert.areEqual(2, statement.declarationListNode.children.length);
    Assert.areEqual(1, statement.declarationListNode.commaNodes.length);
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestData("using first = a,;", "TS1009@15:1")
  @TestData("using first = a,", "TS1009@15:1")
  @TestData("let first,;", "TS1009@9:1")
  @TestMethod
  public retainsTrailingCommasWithoutInventingAnotherDeclaration(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);
    const statement = result.rootNode.children[0];
    Assert.isInstanceOf(statement, TypeScriptVariableStatementNode);
    Assert.areEqual(1, statement.declarationListNode.children.length);
    Assert.areEqual(1, statement.declarationListNode.commaNodes.length);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(result.diagnostics));
  }

  @TestData("declare const value = 1;", "")
  @TestData("declare const value: number = 1;", "TS1039@30:1")
  @TestData("declare let value = 1;", "TS1039@20:1")
  @TestData("declare var value = 1;", "TS1039@20:1")
  @TestData("declare using value = 1;", "TS1491@0:7")
  @TestData("declare namespace N { const value = 1; }", "")
  @TestData("declare namespace N { let value = 1; }", "TS1039@34:1")
  @TestData("declare const value;", "")
  @TestData("declare const = 1;", "TS1134@14:1|TS1134@16:1")
  @TestData("declare const value = 1, = 2;", "TS1134@25:1|TS1134@27:1")
  @TestMethod
  public readsTheValueAnAmbientDeclarationWrites(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("const [key,value];", "TS1182@6:11")
  @TestData("let [key,value];", "TS1182@4:11")
  @TestData("var {key} = source, [value];", "TS1182@20:7")
  @TestData("declare const [key,value];", "")
  @TestData("for (const [key,value] of entries) {}", "")
  @TestData("for (const [key] in entries) {}", "TS2491@11:5")
  @TestData("for (const [key,value];;) {}", "TS1182@11:11")
  @TestData("for (let [key];;) {}", "TS1182@9:5")
  @TestMethod
  public readsAWrittenPatternWhereTheValueItTakesApartIsWritten(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("let let = 1; const let = 1; var let = 1;", "TS1212:let,TS2480:let,TS1212:let,TS2480:let,TS1212:let")
  @TestData("let [let, {a: let, ...let}] = x; let {let = 1} = x; let [...let] = x;", "TS1212:let,TS2480:let,TS1212:let,TS2480:let,TS1212:let,TS2480:let,TS1212:let,TS2480:let,TS1212:let,TS2480:let")
  @TestData("for (let let of x) {} for (const let in x) {} for (let let; ;) {} for (const let = 1; ;) {} for (let [let] of x) {}", "TS1212:let,TS2480:let,TS1212:let,TS2480:let,TS1212:let,TS2480:let,TS1212:let,TS2480:let,TS1212:let,TS2480:let")
  @TestData("using let = x; for (using {let} of x) {} let let; let let!: number; let let: number = 1;", "TS1212:let,TS2480:let,TS1492:{let},TS1212:let,TS1212:let,TS2480:let,TS1212:let,TS2480:let,TS1212:let,TS2480:let")
  @TestData("const let; let [let]; let let! = 1; const [let];", "TS1155:let,TS1212:let,TS1182:[let],TS1212:let,TS1212:let,TS1263:!,TS1182:[let],TS1212:let")
  @TestData("declare let let: number; declare namespace N { let let: number; x; for (let let of y) {} }", "TS2480:let,TS2480:let,TS1036:x,TS2480:let")
  @TestData("let \\u006cet = 1; let let = 1; export {};", "TS1214:\\u006cet,TS2480:\\u006cet,TS1214:let,TS2480:let")
  @TestData("for (let a = function () { const b; let let = 1; }; ;) {} function f() { let let = 1; } class C { static { let let = 1; } m() { let let = 2; } }", "TS1155:b,TS1212:let,TS2480:let,TS1212:let,TS2480:let,TS1213:let,TS2480:let,TS1213:let,TS2480:let")
  @TestData("for (const a, ; ;) {} for (using b, ; ;) {}", "TS1155:a,TS1009:,,TS1155:b,TS1009:,")
  @TestMethod
  public refusesLetAsABlockScopedName(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectText(content, result.diagnostics));
  }

  @TestData("using using = resource;", "using", "")
  @TestData("using of = resource;", "of", "")
  @TestData("using await = resource;", "await", "")
  @TestData("using yield = resource;", "yield", "TS1212")
  @TestData("using of;", "of", "TS1155")
  @TestMethod
  public keepsContextualBindingNamesAsDeclarations(content: string, name: string, expectedCode: string): void {
    const result = TypeScriptParser.parse(content);
    const statement = result.rootNode.children[0];
    Assert.isInstanceOf(statement, TypeScriptVariableStatementNode);
    const declaration = statement.declarationListNode.children[0];
    Assert.isInstanceOf(declaration, TypeScriptVariableDeclarationNode);
    Assert.isInstanceOf(declaration.nameNode, ValueNode);
    Assert.areEqual(name, declaration.nameNode.value);
    Assert.isFalse(statement.declarationListNode.keywordNode === declaration.nameNode);
    Assert.areEqual(expectedCode, result.diagnostics.map(t => t.code.displayText).join(","));
  }

  @TestMethod
  public readsAMissingCommaBeforeLetAsTheNextDeclarations(): void {
    const result = TypeScriptParser.parse("let a = 1 let b = 2;");
    const statement = result.rootNode.children[0];

    Assert.areEqual(1, result.rootNode.children.length);
    Assert.isInstanceOf(statement, TypeScriptVariableStatementNode);
    Assert.areEqual(3, statement.declarationListNode.children.length);
    Assert.areEqual(0, statement.declarationListNode.commaNodes.length);
    const expectedNames = ["a", "let", "b"];
    for (const [index, declaration] of statement.declarationListNode.children.entries()) {
      Assert.isInstanceOf(declaration, TypeScriptVariableDeclarationNode);
      Assert.isInstanceOf(declaration.nameNode, ValueNode);
      Assert.areEqual(expectedNames[index], declaration.nameNode.value);
    }

    Assert.areEqual(2, result.diagnostics.length);
    Assert.areEqual("TS1005", result.diagnostics[0]?.code.displayText);
    Assert.areEqual("TS1005", result.diagnostics[1]?.code.displayText);
    Assert.areEqual(10, result.diagnostics[0]?.location?.start);
    Assert.areEqual(3, result.diagnostics[0]?.location?.length);
    Assert.areEqual(14, result.diagnostics[1]?.location?.start);
    Assert.areEqual(1, result.diagnostics[1]?.location?.length);
    for (const diagnostic of result.diagnostics)
      Assert.areEqual("',' expected.", diagnostic.message.text);
  }

  @TestData("let a b;")
  @TestData("var a b;")
  @TestData("let a {} = b;")
  @TestData("let a [] = b;")
  @TestMethod
  public recoversMissingCommasBeforeBindingNames(content: string): void {
    const result = TypeScriptParser.parse(content);
    const statement = result.rootNode.children[0];

    Assert.isInstanceOf(statement, TypeScriptVariableStatementNode);
    Assert.areEqual(2, statement.declarationListNode.children.length);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS1005", result.diagnostics[0]?.code.displayText);
    Assert.areEqual("',' expected.", result.diagnostics[0]?.message.text);
    Assert.areEqual(6, result.diagnostics[0]?.location?.start);
    Assert.areEqual(1, result.diagnostics[0]?.location?.length);
  }

  @TestData("let a\nb;", 2)
  @TestData("let a = 1\nlet b = 2;", 2)
  @TestData("let a = 1,\nb = 2;", 1)
  @TestData("for (let a of b) {}", 1)
  @TestData("for (let a in b) {}", 1)
  @TestMethod
  public preservesListAndStatementBoundaries(content: string, statementCount: number): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(0, result.diagnostics.length);
    Assert.areEqual(statementCount, result.rootNode.children.length);
  }

  @TestMethod
  public parsesCommaSeparatedDeclarations(): void {
    const statementNode = TypeScriptParserFixture.create("let first, second;").parseStatement();

    Assert.isInstanceOf(statementNode, TypeScriptVariableStatementNode);
    Assert.areEqual(2, statementNode.declarationListNode.children.length);
    Assert.areEqual(1, statementNode.declarationListNode.commaNodes.length);
  }

  @TestData("declare namespace N { using x: T; await using y: null; } declare module 'M' { using x: T; } declare namespace N2 { using x = y; } namespace N3 { using x: T; }", "TS1545:using x: T,TS1546:await using y: null,TS1545:using x: T,TS1545:using x = y,TS1155:x")
  @TestMethod
  public refusesAResourceDeclarationInAnAmbientContext(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectText(content, result.diagnostics));
  }

  @TestData("let a = 1\n) b = 2;", "TS1128:)")
  @TestData("let a = 1, ) b = 2;", "TS1134:)")
  @TestData("for (let a of ) b) {}", "TS1109:),TS1434:b,TS1128:)")
  @TestData("f(() => { let a ) });", "TS1005:),TS1128:},TS1128:)")
  @TestData("let x: {\n  a: string;\n  )\n  b: number;\n};", "TS1131:),TS1128:}")
  @TestData("let x: { a: string\n  ]\n  b: number };", "TS1131:],TS1128:}")
  @TestData("switch (x) { case 1: let y: { ; }; }", "TS1131:;,TS1128:}")
  @TestMethod
  public endsWhereASemicolonMayBeInserted(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectText(content, result.diagnostics));
  }

  @TestData("declare const x: any, a: any, b: any; for (var k = function () { var c = a in b; };;) {}", "")
  @TestData("declare const x: any, a: any, b: any; for (var k = () => { let c = a in b; };;) {}", "")
  @TestData("declare const x: any; for (let k = () => 1 in x) {}", "TS1189@31:1")
  @TestMethod
  public readsInAsAnOperatorOutsideAForInitializer(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }
}
