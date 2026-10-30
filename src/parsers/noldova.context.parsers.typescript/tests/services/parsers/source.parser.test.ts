/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ParserException, Source, SourceReader, SourceSpan } from "@noldova/context.parsers";
import {
  TypeScriptCallExpressionNode,
  TypeScriptClassDeclarationNode,
  TypeScriptExpressionStatementNode,
  TypeScriptParser,
  TypeScriptSourceKind
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { FailingSourceReader } from "../../fixtures/failing-source.reader.js";
import { TypeScriptDiagnosticsFixture } from "../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptSyntaxParserProbe } from "../../fixtures/typescript-syntax-parser-probe.js";

@TestClass
export class SourceParserTests {
  @TestData("await /first/; const stable = 1; await /second/; export {};")
  @TestData("await /first/; await /second/; export {};")
  @TestData("await\n/first/; const stable = 1; export {};")
  @TestData("await /first/; function f() { return import.meta; }")
  @TestMethod
  public reinterpretsOnlyTopLevelAwaitInModules(content: string): void {
    const result = TypeScriptParser.parse(content);
    Assert.areEqual(0, result.diagnostics.length);
    Assert.areEqual(content.length, result.rootNode.span.length);
  }

  @TestMethod
  public reusesStatementsOutsideReparsedRegions(): void {
    const parser = new TypeScriptSyntaxParserProbe("const before = 1; await /pattern/; const after = 2; export {};");
    const result = parser.parse();
    Assert.areEqual(4, result.rootNode.children.length);
    Assert.isTrue(parser.parsedStatementNodes.includes(result.rootNode.children[0]!));
    Assert.isFalse(parser.parsedStatementNodes.includes(result.rootNode.children[1]!));
    Assert.isTrue(parser.parsedStatementNodes.includes(result.rootNode.children[2]!));
    Assert.isTrue(parser.parsedStatementNodes.includes(result.rootNode.children[3]!));
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestMethod
  public discardsErrorsFromTheOriginalHeritageInterpretation(): void {
    const result = TypeScriptParser.parse("export class C extends await(value) {}");
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS1005", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(36, result.diagnostics[0]?.location?.start);
    Assert.isInstanceOf(result.rootNode.children[0], TypeScriptClassDeclarationNode);
  }

  @TestData("§; await /p/; export {};")
  @TestData("await /p/; §; export {};")
  @TestData("await /p/; export {}; §")
  @TestMethod
  public preservesLexicalDiagnosticsOnceAcrossRegionBoundaries(content: string): void {
    const result = TypeScriptParser.parse(content);
    const invalidCharacters = result.diagnostics.filter(t => t.code.displayText === "TS1127");
    Assert.areEqual(1, invalidCharacters.length);
    Assert.areEqual(content.indexOf("§"), invalidCharacters[0]?.location?.start);
  }

  @TestMethod
  public preservesAbsoluteOffsetsAndTheBoundedReaderEnd(): void {
    const content = "await /p/; export {};";
    const source = new Source("prefix" + content + "suffix", "embedded.ts");
    const reader = new SourceReader(source, new SourceSpan(6, content.length));
    const result = new TypeScriptParser(reader).parse();
    Assert.areEqual(0, result.diagnostics.length);
    Assert.areEqual(6, result.rootNode.span.startOffset);
    Assert.areEqual(content.length, result.rootNode.span.length);
    Assert.areEqual(6 + content.length, reader.currentOffset);
  }

  @TestMethod
  public enforcesTheRecursionLimitDuringModuleReinterpretation(): void {
    const content = "await\n" + "(".repeat(508) + "value" + ")".repeat(508) + "; export {};";
    const declaration = TypeScriptParser.parse(content, undefined, TypeScriptSourceKind.Declaration);
    const result = TypeScriptParser.parse(content);
    Assert.areEqual("TS1036@0:5", TypeScriptDiagnosticsFixture.project(declaration.diagnostics));
    Assert.areEqual("CTX2000", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(content.length, result.rootNode.span.endOffset);
    Assert.isUndefined(result.rootNode.trailingTrivia);
  }

  @TestMethod
  public doesNotReinterpretDeclarationInputAsTopLevelAwait(): void {
    const result = TypeScriptParser.parse("export class C extends await(value) {}", undefined, TypeScriptSourceKind.Declaration);
    const statementNode = result.rootNode.children[1];

    Assert.isInstanceOf(statementNode, TypeScriptExpressionStatementNode);
    Assert.isInstanceOf(statementNode.expressionNode, TypeScriptCallExpressionNode);
    Assert.areEqual("TS1109@23:5 Expression expected.|TS1005@36:1 ';' expected.", TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
  }

  @TestData("await\nfoo; } export{};", 22, "TS1109@11:1")
  @TestData("await\nfoo; await\nbar; export{};", 31, "")
  @TestData("export {}; await\nfoo", 20, "")
  @TestData("await\nfoo; const a=1; await\nbar; export{};", 42, "")
  @TestMethod
  public expandsReparsedRegionsWhenAwaitAbsorbsAFollowingStatement(content: string, endOffset: number, expected: string): void {
    const result = TypeScriptParser.parse(content);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(result.diagnostics));
    Assert.areEqual(endOffset, result.rootNode.span.endOffset);
  }

  @TestData("(value);", 0)
  @TestData("(await); export {};", 1)
  @TestMethod
  public propagatesAFailureOtherThanTheRecursionLimit(content: string, rewindsBeforeFailing: number): void {
    const reader = new FailingSourceReader(content, rewindsBeforeFailing);

    const failure = Assert.throws(() => new TypeScriptParser(reader).parse(), ParserException);

    Assert.areEqual(reader.failure, failure);
  }

  @TestMethod
  public keepsADiagnosticAtTheEndOfAReparsedRegion(): void {
    const content = "export {}; await";
    const result = TypeScriptParser.parse(content);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS1109", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(content.length, result.diagnostics[0]?.location?.start);
  }

  @TestData("await /pattern/; export as namespace Global; export {};", "TS1315")
  @TestData("await" + String.fromCharCode(10) + "value; let yield = 1; export {};", "TS1214")
  @TestData("await(value); function f(public a) {} export {};", "TS2369")
  @TestMethod
  public readsTheNamesAReparsedRegionWrites(content: string, expectedCodes: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expectedCodes, result.diagnostics.map(t => t.code.displayText).join(","));
  }

  @TestData("var arguments = 1; let eval;", "TS1100:arguments,TS1100:eval")
  @TestData("function f(arguments) {} function arguments() {} try {} catch (eval) {}", "TS1100:arguments,TS1100:arguments,TS1100:eval")
  @TestData("arguments = 2; eval += 1; arguments++; --eval; o.arguments = 1; [arguments] = o; ({ eval } = o);", "TS1100:arguments,TS1100:eval,TS1100:arguments,TS1100:eval")
  @TestData("var { arguments: a, eval } = o; var [arguments] = o; function f({ eval }) {}", "TS1100:eval,TS1100:arguments,TS1100:eval")
  @TestData("declare var arguments; declare function g(eval): void; declare function arguments(): void; declare function h({ eval }): void;", "TS1100:arguments,TS1100:eval")
  @TestData("class C { m(arguments) { eval = 1; } } class arguments {} type eval = 1; enum arguments2 {}", "TS1210:arguments,TS1210:eval")
  @TestData("export {}; var arguments = 1; class D { m() { eval = 1; } }", "TS1215:arguments,TS1210:eval")
  @TestData("var q = function arguments() {}; var r = (eval) => 1; var s = arguments => 1; function* g(arguments) {}", "TS1100:arguments,TS1100:eval,TS1100:arguments,TS1100:arguments")
  @TestData("var t = ({ eval }, [arguments]) => 1; var u = (eval = 1) => 1; var v = async (arguments) => 1; var w = (...eval) => 1;", "TS1100:eval,TS1100:arguments,TS1100:eval,TS1100:arguments,TS1100:eval")
  @TestData("var p = { arguments: 1, eval() {} }; class L { arguments = 1; eval() {} } for (arguments in o) {} f(eval, arguments.length);", "")
  @TestMethod
  public reportsEvalAndArgumentsWhereTheBinderRefusesThem(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectText(content, result.diagnostics));
  }

  @TestData("declare namespace N { var v; if (x) {} ; x; }", "TS1036:if")
  @TestData("declare namespace N { x; y; { x; y; } }", "TS1036:x,TS1036:x")
  @TestData("declare namespace N { return; return; }", "TS1036:return,TS1108:return")
  @TestData('declare module "m" { for (;;) {} while (x) {} }', "TS1036:for")
  @TestData("declare namespace N { if (x) { y; } else { z; } while (x) { y; } switch (x) { case 1: y; { z; } } for (;;) x; }", "TS1036:if,TS1036:y,TS1036:z,TS1036:y,TS1036:z")
  @TestData("declare namespace N { function f(): void; class C {} enum E {} type T = 1; interface I {} namespace M { x; } }", "TS1036:x")
  @TestData("declare namespace N { ; } declare namespace O { debugger; } declare namespace P { { } } declare namespace Q { label: x; } declare namespace R { foo.bar(); }", "TS1036:;,TS1036:debugger,TS1036:{,TS1036:label,TS1036:foo")
  @TestData("declare global { x; y; } namespace S { x; } declare namespace U { -x; x++; await x; }", "TS1036:x,TS1036:-,TS1308:await")
  @TestData("declare namespace A { x++; } declare namespace B { x ? 1 : 2; } declare namespace C { <T>x; } declare namespace D { typeof x; } declare namespace E { void x; } declare namespace F { delete x.y; }", "TS1036:x,TS1036:x,TS1036:<,TS1036:typeof,TS1036:void,TS1036:delete")
  @TestData("declare namespace A { await x; } declare namespace B { [x]; } declare namespace C { new X(); } declare namespace D { x as T; } declare namespace E { x satisfies T; } declare namespace F { x!; }", "TS1036:await,TS1308:await,TS1036:[,TS1036:new,TS1036:x,TS1036:x,TS1036:x")
  @TestData("declare namespace A { x[0]; } declare namespace B { x.y; } declare namespace C { x(); } declare namespace D { x + 1; } declare namespace E { x`t`; } declare namespace F { (x); }", "TS1036:x,TS1036:x,TS1036:x,TS1036:x,TS1036:x,TS1036:(")
  @TestData("declare namespace A { try {} finally {} } declare namespace B { do x; while (x); } declare namespace C { throw x; } declare namespace D { switch (x) {} } declare namespace E { break; } declare namespace F { continue; }", "TS1036:try,TS1036:do,TS1036:throw,TS1036:switch,TS1036:break,TS1036:continue")
  @TestData("declare namespace N { finally {} }", "TS1005:finally")
  @TestData("declare class C { get x() { return 1; } m() { x; } constructor() { x; } }", "TS1183:{,TS1183:{,TS1183:{")
  @TestMethod
  public refusesTheFirstStatementOfEachAmbientList(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectText(content, result.diagnostics));
  }

  @TestMethod
  public refusesTheFirstStatementOfADeclarationSource(): void {
    const content = "q;\nq;\n{ q; }\nfunction f(): void;";
    const result = TypeScriptParser.parse(content, undefined, TypeScriptSourceKind.Declaration);

    Assert.areEqual("TS1036@0,TS1036@8,TS1046@13", result.diagnostics.map(t => t.code.displayText + "@" + t.location?.start).join(","));
  }

  @TestData("var x; let y; function f(): void; class C {} enum E {} namespace N {}", "TS1046:var")
  @TestData("function f(): void; x;", "TS1046:function,TS1036:x")
  @TestData("x; class C {} enum E {}", "TS1036:x,TS1046:class")
  @TestData("enum E {} namespace N {}", "TS1046:enum")
  @TestData("namespace N {} var x;", "TS1046:namespace")
  @TestData("global {} module M {} export {};", "TS1046:global,TS1540:M")
  @TestData("const enum E {} abstract class C {} @dec class D {} async function f(): Promise<void>; await using x = y;", "TS1046:const,TS1040:async,TS1546:await using x = y")
  @TestData("abstract class C {} @dec class D {}", "TS1046:abstract")
  @TestData("@dec class D {} async function f(): Promise<void>;", "TS1046:@,TS1040:async")
  @TestData("async function f(): Promise<void>; await using x = y;", "TS1040:async,TS1046:async,TS1546:await using x = y")
  @TestData("await using x = y; abstract namespace N {} abstract var v;", "TS1046:await,TS1546:await using x = y,TS1242:abstract,TS1242:abstract")
  @TestData("abstract namespace N {} abstract var v;", "TS1046:abstract,TS1242:abstract,TS1242:abstract")
  @TestData("abstract var v; using u = w;", "TS1046:abstract,TS1242:abstract,TS1545:using u = w")
  @TestData("using u = w;", "TS1046:using,TS1545:using u = w")
  @TestData("declare var x; export function f(): void; export default class {} interface I {} type T = 1; import q = require(\"a\"); export {}; import \"a\"; export as namespace N; export = x;", "")
  @TestData("declare namespace N { var x; } declare module \"m\" { function f(): void; } var y;", "TS1046:var")
  @TestData("label: var y; abstract;", "TS1036:label,TS1344:label")
  @TestData("default class C {}", "TS1005:default")
  @TestMethod
  public refusesTheFirstUnmodifiedDeclarationOfADeclarationSource(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content, undefined, TypeScriptSourceKind.Declaration);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectText(content, result.diagnostics));
  }

  @TestData("break; continue;", "TS1105:break;,TS1104:continue;")
  @TestData("x: break x; y: continue y;", "TS1115:continue y;")
  @TestData("for (;;) { break; continue; function f() { break; continue; } }", "TS1107:break;,TS1107:continue;")
  @TestData("a: for (;;) { break a; continue a; } b: { break b; continue b; }", "TS1115:continue b;")
  @TestData("c: c: for (;;) {} d: for (;;) { d: for (;;) {} } function g() { d: for (;;) {} }", "TS1114:c,TS1114:d")
  @TestData("switch (1) { case 1: break; continue; } e: switch (1) { case 1: continue e; break e; }", "TS1104:continue;,TS1115:continue e;")
  @TestData("f: h: for (;;) { continue f; break f; } while (1) { z: { break z; } } i: for (;;) { switch (1) { case 1: break i; continue i; } }", "")
  @TestData("for (;;) { () => { break; }; } class C { static { break; } m() { break; } constructor() { continue; } }", "TS1107:break;,TS1107:break;,TS1107:break;,TS1107:continue;")
  @TestData("j: for (;;) { function k() { j: for (;;) { break j; } } } l: if (1) { break l; } m: for (;;) { m: for (;;) {} }", "TS1114:m")
  @TestData("do { continue; } while (1); for (x in y) { break; } for (x of y) { continue; } k: { k2: for (;;) { break k; } }", "")
  @TestData("declare namespace N { break; continue; } declare namespace O { q: q: for (;;) {} }", "TS1036:break,TS1104:continue;,TS1036:q")
  @TestMethod
  public readsWhatAJumpLeaves(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectText(content, result.diagnostics));
  }

  @TestData("({ a: 1, a: 2 }); ({ a: 1, a: 2, a: 3 }); ({ 'a': 1, a: 2 }); ({ a: 1, a });", "TS1117:a,TS1117:a,TS1117:a,TS1117:a,TS1117:a")
  @TestData("({ a: 1, ['a']: 2 }); ({ 1: 1, '1': 2 }); ({ 0x1: 1, 1: 2 }); ({ 1.0: 1, 1: 2 }); ({ \\u0061: 1, a: 2 });", "TS1117:['a'],TS1117:'1',TS1117:1,TS1117:1,TS1117:a")
  @TestData("({ a: 1, get a() { return 1; } }); ({ get a() { return 1; }, get a() { return 2; }, a: 1 }); ({ get a() { return 1; }, set a(v) {} }); ({ get a() { return 1; }, set a(v) {}, a: 1 }); ({ a: 1, set a(v) {}, get a() { return 1; } });", "TS1119:a,TS1118:a,TS1119:a,TS1119:a")
  @TestData("({ a = 1 }); ({ 1n: 1 }); ({ a() {}, a() {} }); ({ [x]: 1, [x]: 2 });", "TS1312:=,TS1539:1n")
  @TestData("({ a, a } = o); ({ a: { b, b } } = o); [{ b, b }] = o; for ({ c, c } of o) {} for ({ d, d } in o) {} ({ a: { b, b } = {} } = o); ({ a: 1, a: 2 } += o);", "TS2491:{ d, d },TS2364:{ a: 1, a: 2 }")
  @TestData("var w = ({ g, g }) => 1; var x = ({ h, h }: any) => 1; ({ i, i }) + 1; var v = { f: 1, f: 2 };", "TS1117:i,TS1117:f")
  @TestData("await ({ a, a } = o); ({ b: 1, b: 2 }); export {};", "TS1117:b")
  @TestMethod
  public readsTheMembersAnObjectLiteralDeclares(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectText(content, result.diagnostics));
  }

  @TestData("yield 1; function f() { yield 1; }", "TS1163:yield,TS1163:yield")
  @TestData("function* g() { yield 1; const a = () => yield 2; yield; yield* x; }", "TS1163:yield")
  @TestData("function* h(p = yield) {} function* k() { function inner() { yield 1; } }", "TS1163:yield")
  @TestData("class C { constructor() { yield foo } m() { yield foo } static { yield 1; } [yield 1] = 1; }", "TS1163:yield,TS1163:yield,TS1163:yield,TS1163:yield")
  @TestData("var v = () => { yield foo };", "TS1163:yield")
  @TestMethod
  public refusesAYieldNoGeneratorHolds(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectText(content, result.diagnostics));
  }

  @TestData("await value;", "TS1375@0:5")
  @TestData("await await value;", "TS1375@0:5|TS1375@6:5")
  @TestData("{ await value; }", "TS1375@2:5")
  @TestData("class C extends (await value) {}", "TS1375@17:5")
  @TestData("const o = { value: await other };", "TS1375@19:5")
  @TestData("for await (const value of values) {}", "TS1431@4:5")
  @TestData("{ for await (const value of values) {} }", "TS1431@6:5")
  @TestData("export {}; await value;", "")
  @TestData("export {}; for await (const value of values) {}", "")
  @TestData("async function f() { await value; }", "")
  @TestData("function f() { await value; }", "TS1308@15:5")
  @TestData("const f = () => await value;", "TS1308@16:5")
  @TestData("namespace N { await value; }", "TS1308@14:5")
  @TestData("class C { value = await other; }", "TS1308@18:5")
  @TestData("enum E { A = await value }", "TS1308@13:5")
  @TestData("class C { method() { for await (const value of values) {} } }", "TS1103@25:5")
  @TestData("namespace N { for await (const value of values) {} }", "TS1103@18:5")
  @TestData("class C { static { await value; } }", "TS18037@19:11")
  @TestData("class C { static { for await (const value of values) {} } }", "TS18038@23:5")
  @TestMethod
  public reportsAnAwaitOnlyAModuleHoldsAtItsTopLevel(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("source.mts", "await;", "TS1109@5:1")
  @TestData("source.cts", "await;", "TS1109@5:1")
  @TestData("source.cts", "var x = await;", "TS1109@13:1")
  @TestData("source.mts", "const x = await;", "TS1109@15:1")
  @TestData("source.mts", "var x = await\n", "TS1109@13:0")
  @TestData("source.mts", "await => 1;", "TS1109@6:2")
  @TestData("source.cts", "label: { await; }", "TS1109@14:1")
  @TestData("source.mts", "var yield = 1;", "TS1214@4:5")
  @TestData("source.cts", "var yield = 1;", "TS1214@4:5")
  @TestData("source.mts", "var arguments = 1;", "TS1215@4:9")
  @TestData("source.mts", "let await = 1;", "TS1262@4:5")
  @TestData("source.cts", "await x;", "")
  @TestData("source.mts", "for await (x of y) {}", "")
  @TestData("source.mts", "function f() { await 1; }", "TS1308@15:5")
  @TestData("source.mts", "export as namespace N;", "TS1315@0:22")
  @TestData("source.ts", "for await (x of y) {}", "TS1431@4:5")
  @TestMethod
  public readsAFileNamedForAModuleFormatAsAModule(name: string, content: string, expected: string): void {
    const result = TypeScriptParser.parse(content, name);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(result.diagnostics));
  }

  @TestData("source.d.mts", "await;", "TS1036@0:5")
  @TestData("source.d.cts", "declare var x: number;\nawait;", "TS1036@23:5")
  @TestData("source.d.mts", "export as namespace N;", "TS1314@0:22")
  @TestData("source.d.cts", "export as namespace N;", "TS1314@0:22")
  @TestData("source.d.mts", "export as namespace N;\nexport {};", "")
  @TestMethod
  public readsADeclarationFileAsAModuleOnlyByWhatItWrites(name: string, content: string, expected: string): void {
    const result = TypeScriptParser.parse(content, name, TypeScriptSourceKind.Declaration);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(result.diagnostics));
  }

  @TestData("await\nfoo; @ export{};", "TS1109@13:6", 2)
  @TestData("await\nfoo; await\n); export{};", "TS1109@17:1", 4)
  @TestMethod
  public preservesRecoveryDiagnosticsAndFollowingStatements(content: string, expected: string, statementCount: number): void {
    const result = TypeScriptParser.parse(content);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(result.diagnostics));
    Assert.areEqual(statementCount, result.rootNode.children.length);
    Assert.areEqual(content.length, result.rootNode.span.length);
  }

  @TestData("function f() { await value; }", "TS1356@9:1")
  @TestData("function* f() { await value; }", "TS1356@10:1")
  @TestData("const f = function g() { await value; };", "TS1356@19:1")
  @TestData("const f = function () { await value; };", "TS1356@10:8")
  @TestData("export default function () { await value; }", "TS1356@0:6")
  @TestData("const f = () => await value;", "TS1356@10:17")
  @TestData("const f = () => { await value; };", "TS1356@10:22")
  @TestData("const f = () => {" + String.fromCharCode(10) + "  await value;" + String.fromCharCode(10) + "};", "TS1356@10:7")
  @TestData("class C { m() { await value; } }", "TS1356@10:1")
  @TestData("class C { get p() { await value; } }", "TS1356@14:1")
  @TestData("class C { set p(v) { await value; } }", "TS1356@14:1")
  @TestData("class C { constructor() { await value; } }", "")
  @TestData("class C { value = await other; }", "")
  @TestMethod
  public namesTheFunctionThatCouldHaveBeenAsync(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.flatMap(t => t.relatedInformation)
      .map(t => `${t.message.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("label: f(await (x), a if (b) c);\nexport {};", "TS1005:if,TS1005:c")
  @TestData("f(await (x), a if (b) c);\nexport {};", "TS1005:if,TS1005:c")
  @TestData("if (y) f(await (x), a if (b) c);\nexport {};", "TS1005:if,TS1005:c")
  @TestData("label: f(await, a if (b) c);\nexport {};", "TS1109:,,TS1005:if,TS1005:c")
  @TestData("{ f(await, a if (b) c); }\nexport {};", "TS1109:,,TS1005:if,TS1434:c,TS1128:)")
  @TestData("switch (y) { case 1: f(await x, a if (b) c); }\nexport {};", "TS1005:if,TS1434:c,TS1129:)")
  @TestData("namespace N { f(await x, a if (b) c); }\nexport {};", "TS1005:if,TS1434:c,TS1128:)")
  @TestData("class C { [await x]() { f(a if (b) c); } }\nexport {};", "TS1005:if,TS1434:c,TS1128:)")
  @TestMethod
  public readsAStatementReadAgainForATopLevelAwaitInNoStatementList(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectText(content, result.diagnostics));
  }

  @TestData("await(a if (b) c);\nexport {};", "TS1005@8:2 ')' expected.|TS1005@8:2 ',' expected.|TS1434@15:1 Unexpected keyword or identifier.|TS1128@16:1 Declaration or statement expected.")
  @TestData("type await = f<a if>;\nexport {};", "TS2457@5:5 Type alias name cannot be 'await'.|TS1109@11:1 Expression expected.|TS1005@17:2 ';' expected.|TS1005@17:2 '>' expected.|TS1005@19:1 '(' expected.|TS1109@20:1 Expression expected.")
  @TestData("await\nexport as namespace Global; export {};", "TS1109@6:6 Expression expected.")
  @TestData("await x; export {}; (", "TS1109@21:0 Expression expected.")
  @TestData("x;\nawait\nfoo; export {}; )", "TS1109@25:1 Expression expected.")
  @TestData("await x; public y = 1; export {};", "TS1128@9:6 Declaration or statement expected.")
  @TestData("f(await x, export class C {}); export {};", "TS1135@11:6 Argument expression expected.|TS1128@28:1 Declaration or statement expected.")
  @TestMethod
  public keepsEveryDiagnosticARegionReadAgainReports(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
  }
}
