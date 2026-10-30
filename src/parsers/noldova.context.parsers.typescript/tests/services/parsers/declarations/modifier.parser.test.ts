/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  TypeScriptFunctionDeclarationNode,
  TypeScriptMethodDeclarationNode,
  TypeScriptObjectLiteralExpressionNode,
  TypeScriptParameterNode,
  TypeScriptParser,
  TypeScriptPropertyDeclarationNode,
  TypeScriptShorthandPropertyAssignmentNode,
  TypeScriptVariableDeclarationNode,
  TypeScriptVariableStatementNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { ClassBodyParserFixture } from "../../../fixtures/class-body-parser.fixture.js";
import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";

@TestClass
export class ModifierParserTests {
  @TestData("@d export @e class C {}", "TS8038@10:2{Decorator used before 'export' here.@0}")
  @TestData("@d @e export @f class C {}", "TS8038@13:2{Decorator used before 'export' here.@0}")
  @TestData("@d export @e default class C {}", "TS8038@10:2{Decorator used before 'export' here.@0}")
  @TestMethod
  public reportsDecoratorsWrittenOnBothSidesOfAnExport(content: string, expected: string): void {
    const diagnostics = TypeScriptParser.parse(content).diagnostics;

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithRelated(diagnostics));
    Assert.areEqual(2, diagnostics[0]?.relatedInformation[0]?.location?.length);
  }

  @TestData("export @d class C {}")
  @TestData("export default @d class C {}")
  @TestData("declare @d abstract class C {}")
  @TestData("@d @e class C {}")
  @TestMethod
  public acceptsDecoratorsWrittenOnOneSideOfAnExport(content: string): void {
    Assert.areEqual("", TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestMethod
  public usesFollowingSyntaxAndLineBoundaries(): void {
    const bodyNode = ClassBodyParserFixture.parse("class { public static readonly value: Value; async\nmethod() {} }");

    const propertyNode = bodyNode.children[0];
    Assert.isInstanceOf(propertyNode, TypeScriptPropertyDeclarationNode);
    Assert.areEqual(3, propertyNode.modifierNodes.length);
    Assert.isInstanceOf(bodyNode.children[1], TypeScriptPropertyDeclarationNode);
    Assert.isInstanceOf(bodyNode.children[2], TypeScriptMethodDeclarationNode);
  }

  @TestData("\n")
  @TestData("\r")
  @TestData("\r\n")
  @TestData("\u2028")
  @TestData("\u2029")
  @TestMethod
  public respectsEveryTypeScriptLineTerminatorAfterAsync(lineTerminator: string): void {
    const bodyNode = ClassBodyParserFixture.parse(`class { async${lineTerminator}method() {} }`);

    Assert.isInstanceOf(bodyNode.children[0], TypeScriptPropertyDeclarationNode);
    Assert.isInstanceOf(bodyNode.children[1], TypeScriptMethodDeclarationNode);
  }

  @TestData("abstract abstract class C {}", "TS1030@9:8")
  @TestData("class C { public public value = 1; }", "TS1028@17:6")
  @TestData("class C { private private value = 1; }", "TS1028@18:7")
  @TestData("class C { protected protected value = 1; }", "TS1028@20:9")
  @TestData("class C { readonly readonly value = 1; }", "TS1030@19:8")
  @TestData("class C { override override value = 1; }", "TS1030@19:8")
  @TestData("class C { accessor accessor value = 1; }", "TS1030@19:8")
  @TestData("class C { async async method() {} }", "TS1030@16:5")
  @TestData("class C { declare declare value; }", "TS1030@18:7")
  @TestData("class C { export value = 1; }", "TS1031@10:6")
  @TestData("interface I { public value: string; }", "TS1070@14:6")
  @TestData("interface I { private value: string; }", "TS1070@14:7")
  @TestData("interface I { protected value: string; }", "TS1070@14:9")
  @TestData("interface I { static value: string; }", "TS1070@14:6")
  @TestData("interface I { abstract value: string; }", "TS1070@14:8")
  @TestData("interface I { async value: string; }", "TS1070@14:5")
  @TestData("interface I { declare value: string; }", "TS1070@14:7")
  @TestData("interface I { export value: string; }", "TS1070@14:6")
  @TestData("interface I { override value: string; }", "TS1070@14:8")
  @TestData("interface I { accessor value: string; }", "TS1070@14:8")
  @TestData("interface I { readonly readonly value: string; }", "TS1030@23:8")
  @TestData("class C { constructor(public public value: string) {} }", "TS1028@29:6")
  @TestData("function f(static value: string) {}", "TS1090@11:6")
  @TestData("function f(async value: string) {}", "TS1090@11:5")
  @TestData("function f(declare value: string) {}", "TS1090@11:7")
  @TestData("function f(export value: string) {}", "TS1090@11:6")
  @TestData("function f(abstract value: string) {}", "TS1242@11:8")
  @TestData("function f(accessor value: string) {}", "TS1275@11:8")
  @TestData("class C { constructor(readonly readonly value: string) {} }", "TS1030@31:8")
  @TestData("class C { constructor(override override value: string) {} }", "TS1030@31:8")
  @TestMethod
  public reportsTheFirstMisplacedOrRepeatedModifier(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("declare import x from \"a\"; export import y from \"a\"; declare import z = require(\"a\"); export declare import w = require(\"a\"); export import v = N.y;", "TS1079:declare,TS1191:export,TS1079:declare,TS1079:declare")
  @TestData("declare declare import x from \"a\"; abstract import y from \"a\"; async import z from \"a\"; static import q from \"a\";", "TS1030:declare,TS1242:abstract,TS1042:async,TS1044:static")
  @TestData("namespace N { declare import x = require(\"a\"); } function f() { declare import y from \"a\"; }", "TS1079:declare,TS1147:\"a\",TS1232:import")
  @TestData("declare export = x;", "TS1120:declare")
  @TestData("declare export default x; async export = y;", "TS1120:declare,TS1042:async,TS1203:async export = y;")
  @TestData("namespace N { declare export = x; } declare module \"m\" { declare export = y; }", "TS1063:declare export = x;,TS1038:declare")
  @TestData("class C { constructor(public [a], private {b}, protected e, public f, public [g], readonly ...c) {} }", "TS1187:public [a],TS1187:private {b},TS1187:public [g],TS1317:readonly ...c")
  @TestData("class C { constructor(override ...[d]) {} }", "TS1187:override ...[d]")
  @TestData("class C { m(public [a]) {} constructor(public b); constructor(...c) {} } function f(readonly d) {} declare class D { constructor(private e); }", "TS1187:public [a],TS2369:public [a],TS2369:public b,TS2369:readonly d,TS2369:private e")
  @TestData("class C { constructor(public static [a]) {} m(public static [b]) {} } interface I { m(public a); new (private b); } type T = (public c) => void;", "TS1090:static,TS2369:public static [b],TS1090:static,TS2369:public a,TS2369:private b,TS2369:public c")
  @TestData("class C { set Foo(public a: number) { } get x(public c) { return 1; } }", "TS2369:public a: number,TS1054:x,TS2369:public c")
  @TestMethod
  public readsWhatADeclarationCarriesOnceItsModifiersAreRead(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectText(content, result.diagnostics));
  }

  @TestMethod
  public readsEveryWrittenModifierWhenNoneIsMisplaced(): void {
    const result = TypeScriptParser.parse("export abstract class C { public static readonly value = 1; protected override accessor other = 2; }");

    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestData("class C { override public value = 1; }", "TS1029", "public")
  @TestData("class C { static public value = 1; }", "TS1029", "public")
  @TestData("class C { readonly public value = 1; }", "TS1029", "public")
  @TestData("class C { accessor public value = 1; }", "TS1029", "public")
  @TestData("class C { async public method() {} }", "TS1029", "public")
  @TestData("abstract class C { abstract public method(): void; }", "TS1029", "public")
  @TestData("class C { override private value = 1; }", "TS1029", "private")
  @TestData("class C { static private value = 1; }", "TS1029", "private")
  @TestData("class C { readonly private value = 1; }", "TS1029", "private")
  @TestData("class C { accessor private value = 1; }", "TS1029", "private")
  @TestData("class C { async private method() {} }", "TS1029", "private")
  @TestData("class C { override protected value = 1; }", "TS1029", "protected")
  @TestData("class C { static protected value = 1; }", "TS1029", "protected")
  @TestData("class C { readonly protected value = 1; }", "TS1029", "protected")
  @TestData("class C { accessor protected value = 1; }", "TS1029", "protected")
  @TestData("class C { async protected method() {} }", "TS1029", "protected")
  @TestData("abstract class C { abstract protected method(): void; }", "TS1029", "protected")
  @TestData("abstract class C { abstract private method(): void; }", "TS1243", "private")
  @TestData("class C { readonly static value = 1; }", "TS1029", "static")
  @TestData("class C { accessor static value = 1; }", "TS1029", "static")
  @TestData("class C { async static method() {} }", "TS1029", "static")
  @TestData("abstract class C { override static method(): void; }", "TS1029", "static")
  @TestData("abstract class C { abstract static method(): void; }", "TS1243", "static")
  @TestData("abstract class C { static abstract method(): void; }", "TS1243", "abstract")
  @TestData("abstract class C { private abstract method(): void; }", "TS1243", "abstract")
  @TestData("abstract class C { override abstract method(): void; }", "TS1029", "abstract")
  @TestData("abstract class C { accessor abstract value: number; }", "TS1029", "abstract")
  @TestData("class C { readonly override value = 1; }", "TS1029", "override")
  @TestData("class C { accessor override value = 1; }", "TS1029", "override")
  @TestData("class C { async override method() {} }", "TS1029", "override")
  @TestData("declare export class C {}", "TS1029", "export")
  @TestData("abstract export class C {}", "TS1029", "export")
  @TestData("async export class C {}", "TS1029", "export")
  @TestData("class C { accessor readonly value = 1; }", "TS1243", "readonly")
  @TestData("class C { readonly accessor value = 1; }", "TS1243", "accessor")
  @TestData("declare async function f();", "TS1040", "async")
  @TestData("async declare function f();", "TS1040", "declare")
  @TestMethod
  public reportsAModifierWrittenOutOfOrderOrInAnInvalidPair(content: string, expectedCode: string, expectedModifier: string): void {
    const result = TypeScriptParser.parse(content);

    const diagnostic = result.diagnostics[0];
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual(expectedCode, diagnostic?.code.displayText);
    Assert.areEqual(expectedModifier, content.slice(diagnostic?.location?.start, (diagnostic?.location?.start ?? 0) + (diagnostic?.location?.length ?? 0)));
  }

  @TestData("async class C {}", "TS1042")
  @TestData("async enum E { A }", "TS1042")
  @TestData("async interface I {}", "TS1042")
  @TestData("async type T = string;", "TS1042")
  @TestData("async const x = 1;", "TS1042")
  @TestData("class C { async value = 1; }", "TS1042")
  @TestData("class C { async get value() { return 1; } }", "TS1042")
  @TestData("class C { async set value(x: string) {} }", "TS1042")
  @TestData("class C { async constructor() {} }", "TS1089")
  @TestData("abstract function f() {}", "TS1242")
  @TestData("abstract enum E { A }", "TS1242")
  @TestData("abstract interface I {}", "TS1242")
  @TestData("abstract const x = 1;", "TS1242")
  @TestData("abstract class C { abstract constructor(); }", "TS1242")
  @TestData("class C { declare method(): void; }", "TS1031")
  @TestData("class C { accessor method() {} }", "TS1275")
  @TestData("class C { readonly method() {} }", "TS1024")
  @TestData("async function f() {}", "")
  @TestData("class C { async method() {} }", "")
  @TestData("abstract class C {}", "")
  @TestData("abstract class C { abstract value: string; }", "")
  @TestData("abstract class C { abstract method(): void; }", "")
  @TestData("abstract class C { abstract accessor value: string; }", "")
  @TestData("class C { declare value: string; }", "")
  @TestData("class C { accessor value = 1; }", "")
  @TestData("class C { readonly value = 1; }", "")
  @TestData("class C { override value = 1; }", "")
  @TestMethod
  public reportsAModifierTheDeclarationCannotCarry(content: string, expectedCode: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expectedCode, result.diagnostics.map(t => t.code.displayText).join(","));
  }

  @TestData("{ export function f() {} }", "export")
  @TestData("{ declare function f(); }", "declare")
  @TestData("{ export class C {} }", "export")
  @TestData("{ declare enum E { A } }", "declare")
  @TestData("{ export interface I {} }", "export")
  @TestData("{ export type T = string; }", "export")
  @TestData("{ export const value = 1; }", "export")
  @TestData("while (ready) declare function f();", "declare")
  @TestData("switch (value) { case 1: declare function f(); }", "declare")
  @TestData("class C { method() { export function f() {} } }", "export")
  @TestData("const C = @d export class {};", "export")
  @TestData("const C = @d abstract class {};", "abstract")
  @TestMethod
  public reportsAModifierTheWrittenPositionCarriesNoneOf(content: string, expectedText: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS1184", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(content.indexOf(expectedText), result.diagnostics[0]?.location?.start);
    Assert.areEqual(expectedText.length, result.diagnostics[0]?.location?.length);
    Assert.areEqual("Modifiers cannot appear here.", result.diagnostics[0]?.message.text);
  }

  @TestData("{ async function f() {} }")
  @TestData("{ abstract class C {} }")
  @TestData("{ const enum E { A } }")
  @TestData("namespace N { export function f() {} }")
  @TestData("namespace N { declare function f(); }")
  @TestData("export function f() {}")
  @TestData("const C = @d class {};")
  @TestMethod
  public acceptsTheModifiersTheWrittenPositionCarries(content: string): void {
    Assert.areEqual(0, TypeScriptParser.parse(content).diagnostics.length);
  }

  @TestData("@dec override class C {}", "")
  @TestData("@dec override abstract class C {}", "")
  @TestData("@dec override static class C {}", "TS1044@14:6")
  @TestData("@dec override override class C {}", "TS1030@14:8")
  @TestData("@dec override @dec2 class C {}", "TS1146@4:0|TS1434@5:8")
  @TestData("@dec override function f() {}", "TS1206@0:1")
  @TestData("@dec override", "TS1146@4:0")
  @TestData("@dec override;", "TS1146@4:0")
  @TestData("@dec override [x] = 1;", "TS1146@13:0")
  @TestData("override class C {}", "TS1434@0:8")
  @TestData("static override class C {}", "TS1128@0:6|TS1434@7:8")
  @TestData("export override function f() {}", "TS1128@0:6|TS1434@7:8")
  @TestData("declare override var x = 1;", "TS1434@8:8")
  @TestData("static in class C {}", "TS1128@0:6|TS1109@7:2")
  @TestData("static out class C {}", "TS1128@0:6|TS1434@7:3")
  @TestData("static @dec class C {}", "TS1434@0:6")
  @TestData("async @dec class C {}", "TS1434@0:5")
  @TestData("readonly @dec class C {}", "TS1434@0:8")
  @TestData("export @dec class C {}", "")
  @TestData("class C { static @dec m() {} }", "TS1436@17:1")
  @TestData("class C { declare static {} }", "TS1184@10:7")
  @TestData("class C { public static {} }", "TS1184@10:6")
  @TestData("const a = { x: };", "TS1109@15:1")
  @TestData("export default class C {}", "")
  @TestData("export default function f() {}", "")
  @TestData("class C { override m() {} }", "")
  @TestData("class C { override public m() {} }", "TS1029@19:6")
  @TestData("class C { constructor(override p: number) {} }", "")
  @TestData("abstract class C { abstract override m(): void; }", "")
  @TestMethod
  public readsTheModifierListApartFromTheScanThatFindsItsDeclaration(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("class C { static static() {} }", "")
  @TestData("class C { static static m() {} }", "TS1434@17:6 Unexpected keyword or identifier.")
  @TestData("class C { public static static x = 1; }", "TS1434@24:6 Unexpected keyword or identifier.")
  @TestData("var o = { static static m() {} };", "TS1005@24:1 ',' expected.")
  @TestData("var o = { async static static m() {} };", "TS1005@30:1 ',' expected.")
  @TestData("var o = { static static static() {} };", "TS1005@24:6 ',' expected.")
  @TestData("var o = { static static get x() { return 1; } };", "TS1005@24:3 ',' expected.")
  @TestData("var o = { static static: 1 };", "TS1042@10:6 'static' modifier cannot be used here.")
  @TestData("function f(static static x) {}", "TS1005@25:1 ',' expected.")
  @TestData("function f(public static static x) {}", "TS1005@32:1 ',' expected.")
  @TestData("class C { constructor(static static x) {} }", "TS1005@36:1 ',' expected.")
  @TestData("var f = (static static x) => 1;", "TS1005@23:1 ',' expected.")
  @TestData("interface I { static static x: number }", "TS1005@28:1 ';' expected.")
  @TestData("type T = { static static x: number };", "TS1005@25:1 ';' expected.")
  @TestData("interface I { static static(): void }", "TS1070@14:6 'static' modifier cannot appear on a type member.")
  @TestData("function f<static static T>() {}", "TS1005@25:1 ',' expected.")
  @TestData("type T = new (static static x) => void;", "TS1005@28:1 ',' expected.")
  @TestData("type T = (static static x) => void;",
    "TS1005@17:6 ')' expected.|TS1434@24:1 Unexpected keyword or identifier.|TS1128@25:1 Declaration or statement expected.|TS1128@27:2 Declaration or statement expected.|TS1109@34:1 Expression expected.")
  @TestData("static static class C {}", "TS1146@6:0 Declaration expected.")
  @TestData("declare static static function f();", "TS1146@14:0 Declaration expected.")
  @TestMethod
  public readsAStaticAfterOneTheListHoldsAsAName(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
  }

  @TestMethod
  public endsAnObjectMemberAtTheStaticItsListReadsAsTheName(): void {
    const content = "var o = { static static m() {} };";
    const statementNode = TypeScriptParser.parse(content).rootNode.children[0];

    Assert.isInstanceOf(statementNode, TypeScriptVariableStatementNode);
    const declarationNode = statementNode.declarationListNode.children[0];
    Assert.isInstanceOf(declarationNode, TypeScriptVariableDeclarationNode);
    Assert.isInstanceOf(declarationNode.initializerNode, TypeScriptObjectLiteralExpressionNode);
    const [staticNode, methodNode] = declarationNode.initializerNode.children;
    Assert.isInstanceOf(staticNode, TypeScriptShorthandPropertyAssignmentNode);
    Assert.areEqual(1, staticNode.modifierNodes.length);
    Assert.areEqual(17, staticNode.nameNode.span.startOffset);
    Assert.isInstanceOf(methodNode, TypeScriptMethodDeclarationNode);
    Assert.areEqual(0, methodNode.modifierNodes.length);
    Assert.areEqual(24, methodNode.nameNode.span.startOffset);
    Assert.areEqual(2, declarationNode.initializerNode.children.length);
  }

  @TestMethod
  public endsAParameterAtTheStaticItsListReadsAsTheName(): void {
    const content = "function f(public static static x) {}";
    const functionNode = TypeScriptParser.parse(content).rootNode.children[0];

    Assert.isInstanceOf(functionNode, TypeScriptFunctionDeclarationNode);
    const [staticNode, nextNode] = functionNode.parameterListNode.children;
    Assert.isInstanceOf(staticNode, TypeScriptParameterNode);
    Assert.areEqual("public,static", staticNode.modifierNodes.map(t => content.slice(t.span.startOffset, t.span.endOffset)).join(","));
    Assert.areEqual(25, staticNode.nameNode.span.startOffset);
    Assert.isInstanceOf(nextNode, TypeScriptParameterNode);
    Assert.areEqual(0, nextNode.modifierNodes.length);
    Assert.areEqual(32, nextNode.nameNode.span.startOffset);
    Assert.areEqual(2, functionNode.parameterListNode.children.length);
  }

  @TestData("async function f() { @dec(await x) function g() {} }", "TS1206:@")
  @TestData("@dec({ a: 1, a: 2 }) function g() {}", "TS1206:@")
  @TestData("class C { @d(delete 1) m(): void; m() {} }", "TS1249:@")
  @TestData("@d @d({ a: 1, a: 2 }) enum E { A }", "TS1206:@")
  @TestData("class C { @d @d(delete 1) m(): void; m() {} }", "TS1249:@")
  @TestData("@d @d({ a: 1, a: 2 }) interface I {}", "TS1206:@")
  @TestData("class C { m(@d @d({ a: 1, a: 2 }) p) {} }", "TS1206:@")
  @TestData("export @d @d({ a: 1, a: 2 }) enum E { A }", "TS1206:@")
  @TestData("class C { @d @d({ a: 1, a: 2 }) declare p; }", "TS1206:@")
  @TestData("@d.e().f @d({ a: 1, a: 2 }) enum E { A }", "TS1206:@")
  @TestData("@d @d({ a: 1, a: 2 }) class C {}", "TS1117:a")
  @TestData("class C { @d @d({ a: 1, a: 2 }) public public m() {} }", "TS1117:a,TS1028:public")
  @TestMethod
  public checksWhatADecoratorNamesOnlyWhereTheDeclarationCarriesDecorators(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectText(content, result.diagnostics));
  }
}
