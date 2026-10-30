/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import { ParserException, Source, SourceReader, SourceSpan, ValueNode } from "@noldova/context.parsers";
import {
  TypeScriptArrowFunctionNode,
  TypeScriptAwaitExpressionNode,
  TypeScriptCallExpressionNode,
  TypeScriptExpressionStatementNode,
  TypeScriptFunctionExpressionNode,
  TypeScriptParameterNode,
  TypeScriptParser,
  TypeScriptReturnStatementNode,
  TypeScriptSourceKind,
  TypeScriptUnknownNode,
  TypeScriptVariableDeclarationNode,
  TypeScriptVariableStatementNode
} from "@noldova/context.parsers.typescript";
import { TypeScriptGrammarDiagnostic } from "@noldova/context.parsers.typescript/models/typescript-grammar-diagnostic.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptParserTests {
  @TestData("declare namespace N { await /p/; } export {};")
  @TestData("await(value); declare namespace N { await /p/; } export {};")
  @TestMethod
  public doesNotApplyModuleAwaitToAmbientNamespaceContents(content: string): void {
    const result = TypeScriptParser.parse(content);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS1109", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(content.indexOf("/p/") + 3, result.diagnostics[0]?.location?.start);
    Assert.areEqual(1, result.diagnostics[0]?.location?.length);
  }

  @TestData("await(value); export {};", "", "TS1036")
  @TestData("await(value); import 'm';", "", "TS1036")
  @TestData("await(value); function f(){ return import.meta; }", "", "TS1036,TS1046,TS1183")
  @TestData("await(value); const f=(x=import.meta)=>x;", "", "TS1036,TS1046")
  @TestData("await(value); import X=require('m');", "TS1202", "TS1036")
  @TestMethod
  public distinguishesModuleAwaitFromDeclarationInput(content: string, expectedCode: string,
    expectedDeclarationCode: string): void {
    const code = TypeScriptParser.parse(content);
    const declaration = TypeScriptParser.parse(content, undefined, TypeScriptSourceKind.Declaration);
    const codeStatement = code.rootNode.children[0];
    const declarationStatement = declaration.rootNode.children[0];
    Assert.isInstanceOf(codeStatement, TypeScriptExpressionStatementNode);
    Assert.isInstanceOf(declarationStatement, TypeScriptExpressionStatementNode);
    Assert.isInstanceOf(codeStatement.expressionNode, TypeScriptAwaitExpressionNode);
    Assert.isInstanceOf(declarationStatement.expressionNode, TypeScriptCallExpressionNode);
    Assert.areEqual(expectedCode, code.diagnostics.map(t => t.code.displayText).join(","));
    Assert.areEqual(expectedDeclarationCode, declaration.diagnostics.map(t => t.code.displayText).join(","));
  }

  @TestData("await(value); import('m');", "")
  @TestData("await(value); import X=A.B;", "")
  @TestData("await(value); export as namespace N;", "TS1314")
  @TestData("await(value); namespace N { export const x=1; }", "")
  @TestData("await(value); const x={import:{meta:1}};", "")
  @TestMethod
  public doesNotTurnNonModuleSyntaxIntoAnExternalModule(content: string, expectedCodes: string): void {
    const result = TypeScriptParser.parse(content);
    const statement = result.rootNode.children[0];
    Assert.isInstanceOf(statement, TypeScriptExpressionStatementNode);
    Assert.isInstanceOf(statement.expressionNode, TypeScriptCallExpressionNode);
    Assert.areEqual(expectedCodes, result.diagnostics.map(t => t.code.displayText).join(","));
  }

  @TestMethod
  public selectsDeclarationInputIndependentlyOfDiagnosticIdentityAndInputForm(): void {
    const content = "await(value); export {};";
    const ordinary = TypeScriptParser.parse(content, "api.d.ts");
    const statement = ordinary.rootNode.children[0];
    Assert.isInstanceOf(statement, TypeScriptExpressionStatementNode);
    Assert.isInstanceOf(statement.expressionNode, TypeScriptAwaitExpressionNode);
    const source = new Source(content, "code.ts");
    const results = [
      new TypeScriptParser(content, "code.ts", TypeScriptSourceKind.Declaration).parse(),
      new TypeScriptParser(source, TypeScriptSourceKind.Declaration).parse(),
      new TypeScriptParser(new SourceReader(source), TypeScriptSourceKind.Declaration).parse()
    ];
    for (const result of results) {
      const declaration = result.rootNode.children[0];
      Assert.isInstanceOf(declaration, TypeScriptExpressionStatementNode);
      Assert.isInstanceOf(declaration.expressionNode, TypeScriptCallExpressionNode);
      Assert.areEqual("TS1036", result.diagnostics.map(t => t.code.displayText).join(","));
    }
  }

  @TestMethod
  public reparsesOnlyTheBoundedInputAndPublishesOnlyItsFinalDiagnostics(): void {
    const text = "await /pattern/; export {};";
    const source = new Source("prefix" + text + "suffix");
    const reader = new SourceReader(source, new SourceSpan(6, text.length));
    const result = new TypeScriptParser(reader).parse();
    const statement = result.rootNode.children[0];
    Assert.isInstanceOf(statement, TypeScriptExpressionStatementNode);
    Assert.isInstanceOf(statement.expressionNode, TypeScriptAwaitExpressionNode);
    Assert.areEqual(6, result.rootNode.span.startOffset);
    Assert.areEqual(text.length, result.rootNode.span.length);
    Assert.areEqual(6 + text.length, reader.currentOffset);
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestMethod
  public interpretsAsyncArrowDefaultsInTheArrowContext(): void {
    const result = TypeScriptParser.parse("const f = async (x = await + 1) => x;");
    const statement = result.rootNode.children[0];
    Assert.isInstanceOf(statement, TypeScriptVariableStatementNode);
    const declaration = statement.declarationListNode.children[0];
    Assert.isInstanceOf(declaration, TypeScriptVariableDeclarationNode);
    Assert.isInstanceOf(declaration.initializerNode, TypeScriptArrowFunctionNode);
    Assert.isDefined(declaration.initializerNode.parameterListNode);
    const parameter = declaration.initializerNode.parameterListNode.children[0];
    Assert.isInstanceOf(parameter, TypeScriptParameterNode);
    Assert.isInstanceOf(parameter.initializerNode, TypeScriptAwaitExpressionNode);
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestMethod
  public interpretsArrowDefaultsOutsideTheEnclosingGeneratorContext(): void {
    const result = TypeScriptParser.parse("const f = function*(){ return (x = yield) => x; };");
    const statement = result.rootNode.children[0];
    Assert.isInstanceOf(statement, TypeScriptVariableStatementNode);
    const declaration = statement.declarationListNode.children[0];
    Assert.isInstanceOf(declaration, TypeScriptVariableDeclarationNode);
    Assert.isInstanceOf(declaration.initializerNode, TypeScriptFunctionExpressionNode);
    Assert.isDefined(declaration.initializerNode.bodyNode);
    const returnStatement = declaration.initializerNode.bodyNode.children[0];
    Assert.isInstanceOf(returnStatement, TypeScriptReturnStatementNode);
    Assert.isInstanceOf(returnStatement.expressionNode, TypeScriptArrowFunctionNode);
    Assert.isDefined(returnStatement.expressionNode.parameterListNode);
    const parameter = returnStatement.expressionNode.parameterListNode.children[0];
    Assert.isInstanceOf(parameter, TypeScriptParameterNode);
    Assert.isInstanceOf(parameter.initializerNode, ValueNode);
    Assert.areEqual("yield", parameter.initializerNode.value);
    Assert.areEqual("TS1212@35:5", TypeScriptDiagnosticsFixture.project(result.diagnostics));
  }

  @TestData("obj.\\u0069f;")
  @TestData("const \\u0061sync = 1;")
  @TestData("const \\u0061wait = 1;")
  @TestData("const object = { \\u0069f: 1 };")
  @TestData("const object = { \\u0069f() {} };")
  @TestData("type \\u0061sync = number;")
  @TestData("\\u0061sync: for (;;) { break \\u0061sync; }")
  @TestData("\\u0061sync: for (;;) { continue \\u0061sync; }")
  @TestData("type Tuple = [\\u0061sync: number];")
  @TestData("\\u0061sync => 1;")
  @TestData("\\u0061sync(1);")
  @TestMethod
  public acceptsEscapedKeywordSpellingsInNamePositions(content: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(0, result.diagnostics.length);
    Assert.areEqual(content.length, result.rootNode.span.length);
  }

  @TestData("\\u0069f (value) {}", 0, 7)
  @TestData("\\u0063onst value = 1;", 0, 10)
  @TestData("const value = \\u0074rue;", 14, 9)
  @TestData("\\u0061sync (value) => value;", 0, 10)
  @TestMethod
  public rejectsEscapesWhenConsumingAnActualKeyword(content: string, start: number, length: number): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS1260", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(start, result.diagnostics[0]?.location?.start);
    Assert.areEqual(length, result.diagnostics[0]?.location?.length);
  }

  @TestMethod
  public reportsInvalidDelegatedYieldAtTheLineBreakBoundary(): void {
    const result = TypeScriptParser.parse("const f = function*(){yield\n* values;};");

    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS1109", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(28, result.diagnostics[0]?.location?.start);
    Assert.areEqual(1, result.diagnostics[0]?.location?.length);
  }

  @TestData("", "(", "value", ")", ";")
  @TestData("type T = ", "(", "Value", ")", ";")
  @TestData("", "!", "value", "", ";")
  @TestData("", "value = ", "value", "", ";")
  @TestData("", "value ** ", "value", "", ";")
  @TestData("", "new ", "Value", "", ";")
  @TestData("", "() => ", "value", "", ";")
  @TestData("", "value => ", "value", "", ";")
  @TestData("", "async () => ", "value", "", ";")
  @TestData("", "({a:", "value", "})", ";")
  @TestData("", "f(", "value", ")", ";")
  @TestData("", "a[", "value", "]", ";")
  @TestData("", "`a${", "value", "}`", ";")
  @TestData("", "{", "value;", "}", "")
  @TestData("const ", "[", "value", "]", " = source;")
  @TestData("type T = ", "keyof ", "Value", "", ";")
  @TestData("type T = ", "Outer<", "Value", ">", ";")
  @TestData("type T = ", "A extends B ? C : ", "Value", "", ";")
  @TestData("const T = ", "class extends ", "Base", " {}", ";")
  @TestMethod
  public reportsExcessiveRecursionWithoutLeakingAHostFailure(prefix: string, opening: string, value: string, closing: string, suffix: string): void {
    const content = prefix + opening.repeat(2000) + value + closing.repeat(2000) + suffix;
    const parser = new TypeScriptParser(content, "deep.ts");
    const result = parser.parse();

    Assert.areEqual(1, result.diagnostics.length);
    const diagnostic = result.diagnostics[0];
    Assert.isDefined(diagnostic);
    Assert.areEqual("CTX2000", diagnostic.code.displayText);
    Assert.areEqual("deep.ts", diagnostic.location?.sourceIdentity);
    Assert.areEqual("TypeScript parsing exceeds the supported recursion depth of 512.", diagnostic.message.text);
    Assert.areEqual(0, result.rootNode.span.startOffset);
    Assert.areEqual(content.length, result.rootNode.span.length);
    Assert.areEqual(1, result.rootNode.children.length);
    const remainder = result.rootNode.children[0];
    Assert.isInstanceOf(remainder, TypeScriptUnknownNode);
    Assert.areEqual(content, remainder.value);
    Assert.throws(() => parser.parse(), ParserException);
  }

  @TestMethod
  public retainsCompletedStatementsAndStopsAtTheSharedReadersBound(): void {
    const input = "done; /* boundary */" + "(".repeat(800) + "value" + ")".repeat(800) + "; \"";
    const source = new Source("prefix" + input + "suffix", "embedded.ts");
    const reader = new SourceReader(source, new SourceSpan(6, input.length));
    const result = new TypeScriptParser(reader).parse();

    Assert.areEqual(2, result.rootNode.children.length);
    Assert.isInstanceOf(result.rootNode.children[0], TypeScriptExpressionStatementNode);
    const remainder = result.rootNode.children[1];
    Assert.isInstanceOf(remainder, TypeScriptUnknownNode);
    Assert.isDefined(remainder.leadingTrivia);
    Assert.areEqual(source.getText(remainder.span), remainder.value);
    Assert.areEqual(6, result.rootNode.span.startOffset);
    Assert.areEqual(input.length, result.rootNode.span.length);
    Assert.areEqual(6 + input.length, reader.currentOffset);
    Assert.areEqual("s", source.content.charAt(reader.currentOffset));
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("CTX2000", result.diagnostics[0]?.code.displayText);
    Assert.areEqual("embedded.ts", result.diagnostics[0]?.location?.sourceIdentity);
    Assert.isUndefined(result.rootNode.trailingTrivia);
  }

  @TestMethod
  public parsesAnonymousStringInput(): void {
    const result = TypeScriptParser.parse("name;");

    Assert.areEqual(1, result.rootNode.children.length);
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestMethod
  public preservesOptionalIdentityOnStringInputDiagnostics(): void {
    const anonymous = TypeScriptParser.parse("\"");
    const identified = TypeScriptParser.parse("\"", "source.ts");

    Assert.areEqual("TS1002@1:0", TypeScriptDiagnosticsFixture.project(anonymous.diagnostics));
    Assert.areEqual("TS1002@1:0", TypeScriptDiagnosticsFixture.project(identified.diagnostics));
    Assert.isUndefined(anonymous.diagnostics[0]?.location?.sourceIdentity);
    Assert.areEqual("source.ts", identified.diagnostics[0]?.location?.sourceIdentity);
  }

  @TestMethod
  public parsesACompleteSourceFile(): void {
    const sourceText = "name; 42; \"text\";";
    const result = TypeScriptParser.parse(sourceText);

    Assert.areEqual(3, result.rootNode.children.length);
    for (const statement of result.rootNode.children)
      Assert.isInstanceOf(statement, TypeScriptExpressionStatementNode);

    Assert.areEqual(0, result.rootNode.span.startOffset);
    Assert.areEqual(sourceText.length, result.rootNode.span.length);
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestMethod
  public parsesEmptyAndTriviaOnlySources(): void {
    const empty = TypeScriptParser.parse(String.empty);
    const trivia = TypeScriptParser.parse(" \n");

    Assert.areEqual(0, empty.rootNode.children.length);
    Assert.areEqual(0, empty.rootNode.span.length);
    Assert.areEqual(0, trivia.rootNode.children.length);
    Assert.areEqual(2, trivia.rootNode.span.length);
    Assert.isDefined(trivia.rootNode.leadingTrivia);
    Assert.isUndefined(trivia.rootNode.trailingTrivia);
  }

  @TestMethod
  public exposesTriviaAtBothBoundariesOfNonEmptyInput(): void {
    const result = TypeScriptParser.parse(" /* leading */value;/* trailing */ ");

    Assert.isDefined(result.rootNode.leadingTrivia);
    Assert.isDefined(result.rootNode.trailingTrivia);
  }

  @TestMethod
  public preservesTheAbsoluteSpanOfABoundedReader(): void {
    const source = new Source("prefixname;suffix", "source.ts");
    const reader = new SourceReader(source, new SourceSpan(6, 5));
    const result = new TypeScriptParser(reader).parse();

    Assert.areEqual(6, result.rootNode.span.startOffset);
    Assert.areEqual(5, result.rootNode.span.length);
    Assert.areEqual(1, result.rootNode.children.length);
    Assert.areEqual(0, result.diagnostics.length);
    Assert.areEqual(11, reader.currentOffset);
    Assert.areEqual("s", source.content.charAt(reader.currentOffset));
  }

  @TestMethod
  public reportsDiagnosticsUnderTheIdentityOfASuppliedSource(): void {
    const result = new TypeScriptParser(new Source('"', "shared.ts")).parse();

    Assert.areEqual("TS1002@1:0", TypeScriptDiagnosticsFixture.project(result.diagnostics));
    Assert.areEqual("shared.ts", result.diagnostics[0]?.location?.sourceIdentity);
  }

  @TestMethod
  public startsAtTheSuppliedReadersCurrentPosition(): void {
    const reader = new SourceReader(new Source("prefixname;suffix"), new SourceSpan(0, 11));
    reader.seek(6);

    const result = new TypeScriptParser(reader).parse();

    Assert.areEqual(6, result.rootNode.span.startOffset);
    Assert.areEqual(5, result.rootNode.span.length);
    Assert.areEqual(11, reader.currentOffset);
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestMethod
  public rejectsSessionReuseWithoutChangingItsPublishedResult(): void {
    const parser = new TypeScriptParser("value;");
    const result = parser.parse();
    const failure = Assert.throws(() => parser.parse(), ParserException);

    Assert.areEqual("The parser session has already been used.", failure.message);
    Assert.areEqual(1, result.rootNode.children.length);
    Assert.areEqual(0, result.diagnostics.length);
    Assert.areEqual(1, TypeScriptParser.parse("other;").rootNode.children.length);
  }

  @TestData("context")
  @TestData("currentNode")
  @TestData("advance")
  @TestData("lookAhead")
  @TestData("tryParse")
  @TestData("parseExpression")
  @TestData("reLexRegularExpression")
  @TestData("arrowFunctionParser")
  @TestData("typeArgumentListParser")
  @TestMethod
  public doesNotExposeGrammarInternals(memberName: string): void {
    const parser = new TypeScriptParser("value;");

    Assert.isFalse(memberName in parser);
  }

  @TestData("function f(value? = initial) {}", "TS1015@11:5")
  @TestData("function f(value?, other) {}", "TS1016@19:5")
  @TestData("const f = (...values,) => values;", "TS1013@20:1")
  @TestData("class C { get value<T>() {} }", "TS1094@14:5")
  @TestData("class C { set value() {} }", "TS1049@14:5")
  @TestData("class C { public [key: string]: T; }", "TS1071@10:6")
  @TestData("type T = import(number);", "TS1141@16:6")
  @TestData("new.value;", "TS17013@0:9|TS17012@4:5")
  @TestData("import.value;", "TS17012@7:5")
  @TestData("tag?.`value`;", "TS1358@5:7")
  @TestData("left ?? right || other;", "TS5076@0:13")
  @TestData("throw\nvalue;", "TS1142@5:0")
  @TestMethod
  public reportsGrammarErrorsInCompleteSyntax(content: string, expected: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const syntax = parser.parse();

    Assert.isFalse(parser.context.diagnosticCollector.hasTypeScriptParseDiagnosticsSince(0));
    Assert.isTrue(syntax.diagnostics.every(t => t instanceof TypeScriptGrammarDiagnostic));
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(syntax.diagnostics));
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("// @ts-ignore\ninterface string {}", "")
  @TestData("// @ts-ignore\n\n// comment\ninterface string {}", "")
  @TestData("// @ts-ignore\nlet a;\ninterface string {}", "TS2427@31:6")
  @TestData("// note\ninterface string {}\n// @ts-ignore\nlet a;", "TS2427@18:6")
  @TestData("// @ts-ignore\n   \ninterface string {}", "")
  @TestMethod
  public suppressesGrammarDiagnosticsOnTheCodeLineAfterACommentDirective(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("/* @ts-ignore */\ninterface string {}", "")
  @TestData("/* note\n * @ts-expect-error */\ninterface string {}", "")
  @TestData("// // @ts-ignore\ninterface string {}", "TS2427@27:6")
  @TestData("// /@ts-ignore\ninterface string {}", "TS2427@25:6")
  @TestData("// //@ts-ignore\ninterface string {}", "TS2427@26:6")
  @TestData("/* *@ts-ignore */\ninterface string {}", "TS2427@28:6")
  @TestData("///@ts-ignore\ninterface string {}", "")
  @TestData("/**@ts-ignore */\ninterface string {}", "")
  @TestMethod
  public recognizesACommentDirectiveOnlyAtTheStartOfItsCommentText(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("type T = ([a = /(/]) => void;", "CTX1003@17:0|TS2371@11:1")
  @TestData("const x;\nlet r = /a/gg;", "CTX1001@21:1|TS1155@6:1")
  @TestMethod
  public publishesSyntaxDiagnosticsBeforeGrammarDiagnostics(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("type U = string | () => void;", "TS1385@17:11")
  @TestMethod
  public reportsAFunctionTypeInAUnionWithoutParentheses(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("class C { m(@d this: C) {} }", "TS1433@12:2")
  @TestData("class C { get x(this: C): number { return 1; } set x(this: C, v: number) {} }", "TS2784@16:7|TS2784@53:7")
  @TestData("class A { constructor(x = class { m(public y) {} }) {} }", "TS2369@36:8")
  @TestMethod
  public reportsParameterFormsTheirFunctionCannotDeclare(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("interface I { []: number }", "TS1096@14:10")
  @TestData("class C { constructor<>() {} }", "TS1098@21:2|TS1092@22:0")
  @TestData("class C { set x; }", "TS1005@15:1")
  @TestMethod
  public reportsSignaturesTheirMemberCannotHave(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("const o = { get x() };", "TS1005@18:1")
  @TestData("const o = { m() };", "TS1005@14:1")
  @TestData("interface I { get x(): number, y: string }", "")
  @TestMethod
  public requiresBodiesOnObjectLiteralMethodsAndAccessors(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("type T = { get x() { return 1; } };", "TS1183@19:13")
  @TestData("declare class C { constructor() {} }", "TS1183@32:1")
  @TestMethod
  public reportsImplementationsInAmbientContexts(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("class C { declare m() {} }", "TS1031@10:7|TS1183@22:1")
  @TestData("class C { declare get x() }", "TS1031@10:7")
  @TestData("const o = { public x: 1 };", "TS1042@12:6")
  @TestData("const o = { public m() {} };", "TS1042@12:6|TS1184@12:6")
  @TestData("const o = { async m() {} };", "")
  @TestData("interface I { static [s: string]: number; }", "TS1071@14:6")
  @TestData("async namespace M {}", "TS1042@0:5")
  @TestData("declare namespace N { declare var x; }", "TS1038@22:7")
  @TestData("interface I { static [key?: string]: T; }", "TS1071@14:6")
  @TestData("class C { @d [key?: string]: T; }", "TS1206@10:1")
  @TestData("class C { m(): { static [key: string]: number } { return {}; } }", "TS1071@17:6")
  @TestMethod
  public reportsModifiersTheirDeclarationCannotCarry(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("abstract class C { async abstract get x(): number; }", "TS1243@19:5")
  @TestData("abstract class C { async abstract set x(v: number); }", "TS1243@19:5")
  @TestData("abstract class C { async abstract x: number; }", "TS1243@19:5")
  @TestData("abstract class C { async abstract m(): void; }", "TS1243@19:5")
  @TestData("abstract class C { abstract async m(): void; }", "TS1243@28:5")
  @TestData("class C { declare accessor a: any; accessor declare b: any; }", "TS1243@18:8|TS1243@44:7")
  @TestData("class C { readonly readonly [key?: string]: T; }", "TS1030@19:8")
  @TestMethod
  public reportsModifiersThatCannotBeCombined(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("class C { \n    public {};\n}", "TS1146@21:0|TS1005@22:1|TS1128@26:1")
  @TestData("class C { static const ...a; }", "TS1146@22:0|TS1005@23:3")
  @TestData("class C { const ...a; }", "TS1068@10:5|TS1134@16:3|TS1128@22:1")
  @TestData("class C { const @dec a = 1; }", "TS1068@10:5|TS1134@16:1|TS1146@20:0|TS1128@28:1")
  @TestData("abstract class C { abstract { } = 1; }", "TS1068@19:8|TS2809@32:1|TS1128@37:1")
  @TestData("class C { declare abstract ...a }", "TS1068@10:7|TS1434@18:8|TS1128@27:3|TS1128@32:1")
  @TestData("class C { declare static ...a }", "TS1146@24:0|TS1005@25:3")
  @TestData("class C { default x }", "TS1434@10:7")
  @TestData("abstract class C { abstract function x }", "TS1068@19:8|TS1005@39:1")
  @TestData("class C { function [a] }", "TS1434@10:8")
  @TestData("abstract class C { abstract\n...a }", "TS1068@28:3")
  @TestData("class C { export default ...a }", "TS1068@10:6|TS1109@25:3|TS1128@30:1")
  @TestMethod
  public recoversAClassMemberThatStartsWithAModifierItCannotCarry(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("class C { *() { await x; } }", "TS1003@11:1")
  @TestData("({ *() { await x; } });", "TS1003@4:1")
  @TestData("class C { const *() {} }", "TS1003@17:1")
  @TestData("class C { get *() { await x; } }", "TS1434@10:3|TS1003@15:1")
  @TestMethod
  public reportsAGeneratorOrAccessorMemberWithoutAName(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("class C extends A extends B {}", "TS1172@18:7")
  @TestData("class C implements I extends A {}", "TS1173@21:7")
  @TestData("class C extends A, B {}", "TS1174@19:1")
  @TestData("class C extends A, B<string> {}", "TS1174@19:1")
  @TestData("class C extends A, N.B<string> {}", "TS1174@19:1")
  @TestData("class C implements I implements J {}", "TS1175@21:10")
  @TestData("const C = class extends A extends B {};", "TS1172@26:7")
  @TestData("(class extends First, Second {});", "TS1174@22:6")
  @TestMethod
  public reportsHeritageClausesAClassCannotHave(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("class string {}", "TS2414@6:6")
  @TestData("const C = class number {};", "TS2414@16:6")
  @TestData("enum any {}", "TS2431@5:3")
  @TestData("interface symbol {}", "TS2427@10:6")
  @TestData("type undefined = 1;", "TS2457@5:9")
  @TestData("class \\u0061ny {}", "TS2414@6:8")
  @TestData("interface str\\u0069ng {}", "TS2427@10:11")
  @TestMethod
  public reportsPredefinedTypeNamesAsDeclarationNames(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("type A = { #x: string; };", "TS18016@11:2")
  @TestData("interface B { #m(): void; }", "TS18016@14:11")
  @TestData("class C { m(): { #n(): void } { return null!; } }", "")
  @TestData("function #f() {}", "TS18016@9:2")
  @TestMethod
  public reportsPrivateIdentifiersOutsideClassBodies(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("var v: void.x;", "TS1005@11:1")
  @TestData("type F = { (n: number) => string; };", "TS1005@23:2")
  @TestData("declare const x: unique number;", "TS1005@24:6")
  @TestData("const badForNow: C[#bar] = 3;", "TS1005@19:4|TS1005@23:1|TS1134@25:1|TS1134@27:1")
  @TestMethod
  public reportsTokensThatCannotContinueAType(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("function f(a: -) {}", "TS1110@14:1|TS1109@15:1")
  @TestData("type T = -;", "TS1110@9:1|TS1109@10:1")
  @TestData("type T = -", "TS1110@9:1|TS1109@10:0")
  @TestData("type T = -x;", "TS1110@9:1")
  @TestData("type T = [-];", "TS1110@10:1|TS1109@11:1")
  @TestData("type T = A<->;", "TS1005@11:1|TS1109@12:1|TS1109@13:1")
  @TestData("function f(-) {}", "TS1138@11:1|TS1109@12:1")
  @TestMethod
  public reportsAMinusTypeWithoutANumericLiteral(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("c ? (x: A): T => x;", "TS1005@18:1")
  @TestData("c ? async (): T => v;", "TS1005@20:1")
  @TestMethod
  public readsAnArrowWithAReturnTypeAsTheTrueBranchOfAConditional(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData('type L = import("pkg", {"m": "r"}).R;', "TS1005@24:3|TS1005@27:1|TS1128@32:1|TS1128@33:1|TS1128@34:1")
  @TestData('type L = import("pkg", { with: { m: "r" } }).R;', "")
  @TestData('type L = import("pkg", { assert: { m: "r" } }).R;', "TS2880@25:6")
  @TestMethod
  public reportsImportTypeAttributesThatAreNotAWithObject(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData('import { 0n as foo } from "./foo";', "TS1003@9:2|TS1128@19:1|TS1434@21:4")
  @TestData("var x = import { foo } from './0';", "TS1109@8:6")
  @TestData("import x = A.#b;", "TS1003@15:0")
  @TestMethod
  public reportsImportsWithInvalidNamesOrPositions(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("export * from Aaa;", "TS1141@14:3")
  @TestData("import foo = require(x);", "TS1141@21:1")
  @TestMethod
  public reportsModuleSpecifiersThatAreNotStringLiterals(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("import.foo();", "TS18061@7:3")
  @TestData("import.foo;", "TS17012@7:3")
  @TestData("import.defer;", "TS1005@12:0")
  @TestMethod
  public reportsInvalidImportMetaProperties(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("let x = 1 + 1 as number * 2;", "TS1005@24:1")
  @TestData("let x = 1 as number * 2;", "")
  @TestMethod
  public readsAnAsExpressionAtRelationalPrecedence(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("a ?? b || c;", "TS5076@0:6")
  @TestData("a || b ?? c;", "TS5076@0:6")
  @TestMethod
  public reportsNullishCoalescingMixedWithLogicalOperatorsWithoutParentheses(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("y.a<string>.b = 1;", "TS1477@3:8")
  @TestData("y?.a<string>.b = 1;", "TS1477@4:8")
  @TestMethod
  public reportsAPropertyAccessAfterAnInstantiationExpression(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("(y?.a).b = 1;", "")
  @TestData("y?.a!.b = 1;", "TS2779@0:7")
  @TestData("y!?.a!!.b = 1;", "TS2779@0:9")
  @TestData("y?.a`x` = 1;", "TS2364@0:7|TS1358@4:3")
  @TestData("((y as any)! satisfies any) = 1;", "")
  @TestData("(<any>y!) = 1;", "")
  @TestData("(y?.a as any) = 1;", "TS2779@0:13")
  @TestData("(y as any)?.a = 1;", "TS2779@0:13")
  @TestMethod
  public reportsOptionalChainsAsAssignmentTargets(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("const o = { a? };", "TS1162@13:1")
  @TestData("const o = { a! };", "TS1255@13:1")
  @TestData("class C { a! = 1; }", "TS1263@11:1")
  @TestData("class C { a!; }", "TS1264@11:1")
  @TestData("class C { static a!: number; }", "TS1255@18:1")
  @TestMethod
  public reportsDefiniteAssignmentAndOptionalMarkersWhereTheyCannotAppear(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("declare function f(...a,): void;", "")
  @TestData("let [...a,] = x;", "TS1013@9:1")
  @TestData("let {...b,} = y;", "TS1013@9:1")
  @TestMethod
  public reportsATrailingCommaAfterARestElement(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("declare namespace N { y<string>; }", "TS1036@22:1")
  @TestData("declare namespace N { y.a!.b()[0]`x` as any satisfies any; }", "TS1036@22:1")
  @TestData("declare namespace N { y + 1 ? 2 : 3; }", "TS1036@22:1")
  @TestData("declare namespace N { y.a++; }", "TS1036@22:1")
  @TestData("declare namespace N { y?.a.b<string>; }", "TS1036@22:1")
  @TestMethod
  public reportsStatementsInAmbientNamespaces(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("if (x) declare type 1 = 2;", "TS1003@20:1|TS1005@22:1")
  @TestData("if (x) declare type\n= 2;", "TS1142@20:1")
  @TestData("if (x) @dec type 1 = 2;", "TS1003@17:1|TS1005@19:1")
  @TestData("if (x) @dec interface 1 {}", "TS1003@22:1|TS1005@24:1")
  @TestData("if (x) export default interface 1 {}", "TS1003@32:1|TS1005@34:1")
  @TestMethod
  public reportsAnInvalidNameInADeclarationWrittenAsASubstatement(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("enum E { @dec A }", "TS1132@9:1|TS1146@13:0|TS1128@16:1")
  @TestData("@@a class C {}", "TS1146@14:0")
  @TestData("@@", "TS1109@2:0")
  @TestData("class C { @@a m() {} }", "TS1109@13:0")
  @TestData("@@a class {} class C {}", "TS1497@1:11")
  @TestMethod
  public reportsDecoratorsThatCannotBeRead(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("x.\nvar y = 1;", "TS1003@2:0")
  @TestData("export default\n", "TS1109@14:0")
  @TestData("export default\n// c", "TS1109@14:0")
  @TestData("export =\n", "TS1109@8:0")
  @TestData("import x from\n", "TS1109@13:0")
  @TestData("import x from 'a' with { type:\n", "TS1109@30:0|TS1005@31:0")
  @TestData("target[\n", "TS1109@7:0|TS1005@8:0")
  @TestData("({ a:\n", "TS1109@5:0|TS1005@6:0")
  @TestMethod
  public reportsAMissingOperandWhereItsLineEnds(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("`\\u{41", "TS1160@6:0")
  @TestData("let a = `\\xG", "TS1125@11:0|TS1160@12:0")
  @TestMethod
  public reportsEscapeAndTerminationErrorsInUntaggedTemplates(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("type T = `\\u{110000}`;", "")
  @TestData("type T = `\\xG`;", "")
  @TestMethod
  public acceptsInvalidEscapesInTemplateLiteralTypes(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("/// <reference types=\"a\" resolution-mode=\"esm\"/>", "TS1453@42:3")
  @TestData("/// <reference/>", "TS1084@0:16")
  @TestMethod
  public reportsReferenceDirectivesWithInvalidSyntax(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("await(1);\nexport {};\nclass C { value = await other; }", "TS1308@39:5")
  @TestData("await(1);\nexport {};\nnamespace N { await x; }", "TS1308@35:5")
  @TestMethod
  public reportsAwaitOutsideAsyncFunctionsInAModule(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("class C { async abstract constructor() {} }")
  @TestMethod
  public readsNoAsyncBeforeAnAbstractOnAMemberThatCarriesNeither(content: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.isTrue(result.diagnostics.length > 0);
    Assert.isFalse(result.diagnostics.some(t => t.code.displayText === "TS1243"));
  }

  @TestData("class C { public @d [key:string]: T; }", "TS1071")
  @TestData("function f(value? = initial) {} const =;", "TS1015")
  @TestData("const broken = ; throw\nvalue;", "TS1142")
  @TestData("tag?.`value`; const =;", "TS1358")
  @TestMethod
  public doesNotPublishGrammarErrorsWhenSyntaxRecoveryWasRequired(content: string, forbiddenCode: string): void {
    const result = TypeScriptParser.parse(content);
    Assert.isTrue(result.diagnostics.length > 0);
    Assert.isFalse(result.diagnostics.some(t => t.code.displayText === forbiddenCode));
  }

  @TestMethod
  public preservesDiagnosticIdentityAndAbsoluteEmbeddedPositions(): void {
    const content = "new.value;";
    const reader = new SourceReader(new Source("prefix" + content + "suffix", "embedded.ts"), new SourceSpan(6, content.length));
    const result = new TypeScriptParser(reader).parse();

    Assert.areEqual("TS17013@6:9|TS17012@10:5", TypeScriptDiagnosticsFixture.project(result.diagnostics));
    Assert.areEqual("embedded.ts", result.diagnostics[0]?.location?.sourceIdentity);
    Assert.areEqual("embedded.ts", result.diagnostics[1]?.location?.sourceIdentity);
    Assert.areEqual(6 + content.length, reader.currentOffset);
  }

  @TestData("namespace 0x;", "TS2819@10:2|TS1125@12:0")
  @TestData("class C { set value(x: string): void { const f = (a?: string, b: string) => a; } }", "TS1095@14:5|TS1016@62:1")
  @TestData("f(/[a;", "TS1161@2:3|CTX1004@5:0|TS1005@5:1")
  @TestData("let x = 1;\nabc �", "TS1490@0:0|TS1434@11:3|TS1128@15:1")
  @TestData("abc �", "TS1490@0:0|TS1128@4:1")
  @TestData("f(a++ `\\", "TS1005@6:2|TS1005@8:0|TS1126@8:0")
  @TestMethod
  public publishesDiagnosticsInSourceOrder(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestMethod
  public publishesTheNarrowerDiagnosticFirstWhereTwoStartTogether(): void {
    Assert.areEqual("TS1206@0:1|TS1203@0:18", TypeScriptDiagnosticsFixture.parse("@d export = value;"));
  }

  @TestData("while (\n", "TS1109@7:0 Expression expected.|TS1005@8:0 ')' expected.")
  @TestData("if (\n", "TS1109@4:0 Expression expected.|TS1005@5:0 ')' expected.")
  @TestData("with (\n", "TS1109@6:0 Expression expected.|TS1005@7:0 ')' expected.")
  @TestData("for (\n", "TS1109@5:0 Expression expected.|TS1005@6:0 ')' expected.|TS1005@6:0 ';' expected.")
  @TestData("for (;\n", "TS1109@6:0 Expression expected.|TS1005@7:0 ')' expected.|TS1005@7:0 ';' expected.")
  @TestData("for (x\n", "TS1109@6:0 Expression expected.|TS1005@7:0 ')' expected.|TS1005@7:0 ';' expected.")
  @TestData("for (let\n", "TS1109@8:0 Expression expected.|TS1005@9:0 ')' expected.|TS1005@9:0 ';' expected.")
  @TestData("for (var k = 1) {}\n",
    "TS1005@14:1 ',' expected.|TS1109@18:0 Expression expected.|TS1005@19:0 ')' expected.|TS1005@19:0 ';' expected.")
  @TestMethod
  public publishesARepeatedDiagnosticOnce(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
  }

  @TestMethod
  public validatesADeepFlatExpressionDuringParsingWithoutATreeWalk(): void {
    const content = "value+".repeat(12000) + "value;";
    Assert.areEqual(0, TypeScriptParser.parse(content).diagnostics.length);
  }

  @TestData("const yield = 1;", "TS1212@6:5")
  @TestData("const \\u0079ield = 1;", "TS1212@6:10")
  @TestData("const let = 1;\nexport {};", "TS1214@6:3|TS2480@6:3")
  @TestData("class implements {}", "TS1213@6:10")
  @TestData('import await from "m";', "TS1262@7:5")
  @TestData("async function f() { const await = 1; }", "TS1359@27:5")
  @TestData("const await = 1;", "")
  @TestData("function f() { const let = 1; }", "TS1212@21:3|TS2480@21:3")
  @TestData("class C { yield() {} }", "")
  @TestData("const implements = 1;", "TS1212@6:10")
  @TestData("interface I { implements; yield; static(): void; }", "")
  @TestData("let v: E.static;", "")
  @TestData("(yield);", "TS1212@1:5")
  @TestData("const interface = 1;", "TS1212@6:9")
  @TestData("const package = 1;", "TS1212@6:7")
  @TestData("const private = 1;", "TS1212@6:7")
  @TestData("const protected = 1;", "TS1212@6:9")
  @TestData("const public = 1;", "TS1212@6:6")
  @TestData("const static = 1;", "TS1212@6:6")
  @TestData("class C { static { class D { x = await; } } }", "")
  @TestData("class C { static { let await: any; } }", "TS1359@23:5")
  @TestData("namespace A.class {}", "")
  @TestData("namespace A.public {}", "TS1212@12:6")
  @TestMethod
  public reportsNamesTheSourceReserves(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("extends B;", "TS1128@0:7")
  @TestData("else x;", "TS1128@0:4")
  @TestData("{ extends B; }", "TS1128@2:7")
  @TestMethod
  public skipsAKeywordThatBelongsToAnEnclosingConstruct(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("if (ready) const x = 1;", "TS1156@11:12")
  @TestData("if (ready) let x = 1;", "TS1156@11:10")
  @TestData("while (ready) using value = resource;", "TS1156@14:23")
  @TestData("do const x = 1; while (ready);", "TS1156@3:12")
  @TestData("for(;;) const x = 1;", "TS1156@8:12")
  @TestData("if (ready) interface I {}", "TS1156@21:1")
  @TestData("if (ready) type T = string;", "TS1156@16:1")
  @TestData("if (ready) namespace N {}", "TS1235@11:9")
  @TestData("if (ready) import x = require(\"m\");", "TS1232@11:6")
  @TestData("if (ready) export = value;", "TS1231@11:6")
  @TestData("if (ready) var x = 1;", "")
  @TestData("if (ready) { const x = 1; }", "")
  @TestData("if (ready) class C {}", "")
  @TestData("switch(x){case 1: using v = r; break;}", "TS1547@18:11")
  @TestData("switch(x){default: await using v = r; break;}", "TS1548@19:17")
  @TestData("switch(x){case 1: { using v = r; } break;}", "")
  @TestData("switch(x){case 1: const y = 1; break;}", "")
  @TestData("function f() { export namespace N {} }", "TS1235@15:6")
  @TestData("function f() { export default 1; }", "TS1258@15:6")
  @TestData("function f() { export = value; }", "TS1231@15:6")
  @TestData("namespace N { export = value; }", "TS1063@14:15")
  @TestData("export = value;", "TS1203@0:15")
  @TestMethod
  public reportsDeclarationsByWhereTheyAreWritten(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestMethod
  public reportsADeclarationKeywordWhereNoDeclarationMayBe(): void {
    Assert.areEqual("TS1440@23:3", TypeScriptDiagnosticsFixture.parse("class C { public const var export foo = 10; }"));
  }

  @TestData("var q = { z: 1, z: 2 };\nwith (a) { delete 1; }\nvar o = { x: 1, x: 2 };\nwith (b) { delete 2; }\nvar p = { y: 1, y: 2 };", "TS1117:z,TS1101:with,TS1117:x,TS1101:with,TS1117:y")
  @TestData("type T = import(\"m\")<{ a: number = 1 }>; with (a) { delete 1; } declare function f(a = delete 1): void; var o = { x: 1, x: 2 };", "TS1101:with,TS2371:a = delete 1,TS1117:x")
  @TestData("with (x) { with (y) { var o = { a: 1, a: 2 }; } }", "TS1101:with,TS1101:with")
  @TestData("with (x) { type T = import(\"m\")<{ a: number = 1 }>; delete 1; }", "TS1101:with")
  @TestData("declare function f(a = function (b = 1) { with (x) { delete 1; } }): void;", "TS2371:a = function (b = 1) { with (x) { delete 1; } },TS1101:with")
  @TestMethod
  public withholdsGrammarDiagnosticsInsideUncheckedRegions(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectText(content, result.diagnostics));
  }
}
