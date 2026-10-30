/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { NodeType } from "@noldova/context.parsers";
import {
  TypeScriptArrayBindingPatternNode,
  TypeScriptArrowFunctionNode,
  TypeScriptConstructorTypeNode,
  TypeScriptExpressionStatementNode,
  TypeScriptFunctionDeclarationNode,
  TypeScriptFunctionTypeNode,
  TypeScriptMissingIdentifierNode,
  TypeScriptObjectBindingPatternNode,
  TypeScriptParameterNode,
  TypeScriptParenthesizedTypeNode,
  TypeScriptParser,
  TypeScriptTupleTypeNode,
  TypeScriptTypeAliasDeclarationNode,
  TypeScriptTypeLiteralNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptGrammarFixture } from "../../../fixtures/typescript-grammar.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class ParameterListParserTests {
  @TestMethod
  public usesTheRecoveredNameAfterAStrayParameterColon(): void {
    const parser = TypeScriptParserFixture.create("new (optional?: Value, : Value) => Result");
    parser.parseType();
    const nodeGrammarDiagnostics = TypeScriptGrammarFixture.getDiagnostics(parser);

    const diagnostic = nodeGrammarDiagnostics.find(t => t.code.displayText === "TS1016");
    Assert.isDefined(diagnostic);
    Assert.areEqual(25, diagnostic.location?.start);
    Assert.areEqual(5, diagnostic.location?.length);
  }

  @TestMethod
  public parsesModifiersOptionalTypesAndInitializers(): void {
    const parser = TypeScriptParserFixture.create("(public readonly value?: string = fallback) => void");
    const node = parser.parseType();
    const nodeGrammarDiagnostics = TypeScriptGrammarFixture.getDiagnostics(parser);

    Assert.isInstanceOf(node, TypeScriptFunctionTypeNode);
    const parameterNode = node.parameterListNode.children[0];
    Assert.isInstanceOf(parameterNode, TypeScriptParameterNode);
    Assert.areEqual(2, parameterNode.modifierNodes.length);
    Assert.isDefined(parameterNode.questionNode);
    Assert.isDefined(parameterNode.colonNode);
    Assert.isDefined(parameterNode.typeNode);
    Assert.isDefined(parameterNode.equalsNode);
    Assert.isDefined(parameterNode.initializerNode);
    Assert.areEqual("TS1015,TS2371", nodeGrammarDiagnostics.map(t => t.code.displayText).join(","));
  }

  @TestMethod
  public parsesArrayAndObjectBindingPatterns(): void {
    const parser = TypeScriptParserFixture.create("([first, , ...rest], {source: target = fallback}) => void");
    const node = parser.parseType();

    Assert.isInstanceOf(node, TypeScriptFunctionTypeNode);
    Assert.areEqual(2, node.parameterListNode.children.length);
    const arrayParameterNode = node.parameterListNode.children[0];
    const objectParameterNode = node.parameterListNode.children[1];
    Assert.isInstanceOf(arrayParameterNode, TypeScriptParameterNode);
    Assert.isInstanceOf(arrayParameterNode.nameNode, TypeScriptArrayBindingPatternNode);
    Assert.areEqual(3, arrayParameterNode.nameNode.children.length);
    Assert.isInstanceOf(objectParameterNode, TypeScriptParameterNode);
    Assert.isInstanceOf(objectParameterNode.nameNode, TypeScriptObjectBindingPatternNode);
    Assert.areEqual(1, objectParameterNode.nameNode.children.length);
    Assert.areEqual("", parser.context.diagnosticCollector.diagnostics.map(t => t.code.displayText).join(","));
  }

  @TestMethod
  public parsesNestedBindingPatternsAndBindingDefaults(): void {
    const parser = TypeScriptParserFixture.create("([{nested}, [value]], {source: {target}, value = fallback}, this: Context) => void");
    const node = parser.parseType();

    Assert.isInstanceOf(node, TypeScriptFunctionTypeNode);
    Assert.areEqual(3, node.parameterListNode.children.length);
    Assert.areEqual("TS2371,TS2680", parser.context.diagnosticCollector.diagnostics.map(t => t.code.displayText).join(","));
  }

  @TestData("type T = ([value) => void", TypeScriptTupleTypeNode, "TS1005@16:1|TS1110@18:2|TS1005@25:0")
  @TestData("type T = ({value) => void", TypeScriptTypeLiteralNode, "TS1131@11:5|TS1128@16:1|TS1128@18:2|TS1109@25:0")
  @TestMethod
  public readsAnUnclosedPatternBeforeAnArrowAsAParenthesizedType(content: string, expectedType: Function & NodeType, expected: string): void {
    const result = TypeScriptParser.parse(content);
    const aliasNode = result.rootNode.children[0];

    Assert.isInstanceOf(aliasNode, TypeScriptTypeAliasDeclarationNode);
    Assert.isInstanceOf(aliasNode.typeNode, TypeScriptParenthesizedTypeNode);
    Assert.isInstanceOf(aliasNode.typeNode.typeNode, expectedType);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(result.diagnostics));
  }

  @TestMethod
  public reportsAMissingParameterListCloser(): void {
    const parser = TypeScriptParserFixture.create("(value: string => number");
    const node = parser.parseType();

    Assert.isInstanceOf(node, TypeScriptFunctionTypeNode);
    Assert.isUndefined(node.parameterListNode.closeParenthesisNode);
    Assert.areEqual("TS1005@15:2|TS1005@24:0", TypeScriptDiagnosticsFixture.project(parser.context.diagnosticCollector.diagnostics));
  }

  @TestMethod
  public reportsAMissingRestParameterName(): void {
    const parser = TypeScriptParserFixture.create("(...: string) => number");
    const node = parser.parseType();

    Assert.isInstanceOf(node, TypeScriptFunctionTypeNode);
    Assert.areEqual("TS1003@4:1", TypeScriptDiagnosticsFixture.project(parser.context.diagnosticCollector.diagnostics));
  }

  @TestData("type T = (...rest?: string[]) => void;", "TS1047@17:1")
  @TestData("type T = (...rest: string[] = fallback) => void;", "TS2371@10:28|TS1048@13:4")
  @TestData("type T = (optional?: string = fallback) => void;", "TS1015@10:8|TS2371@10:28")
  @TestData("type T = (optional?: string, required: string) => void;", "TS1016@29:8")
  @TestData("type T = (...rest: string[], required: string) => void;", "TS1014@10:3")
  @TestMethod
  public reportsInvalidParameterOrderingAndRestSyntax(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestMethod
  public keepsTheOptionalMarkerAndInitializerOfAParameterMissingItsName(): void {
    const result = TypeScriptParser.parse("type T = new (? = fallback) => Result;");
    const aliasNode = result.rootNode.children[0];

    Assert.isInstanceOf(aliasNode, TypeScriptTypeAliasDeclarationNode);
    Assert.isInstanceOf(aliasNode.typeNode, TypeScriptConstructorTypeNode);
    const parameterNode = aliasNode.typeNode.parameterListNode.children[0];
    Assert.isInstanceOf(parameterNode, TypeScriptParameterNode);
    Assert.isInstanceOf(parameterNode.nameNode, TypeScriptMissingIdentifierNode);
    Assert.areEqual(14, parameterNode.span.startOffset);
    Assert.isDefined(parameterNode.questionNode);
    Assert.isDefined(parameterNode.initializerNode);
    Assert.areEqual("TS1003@14:1 Identifier expected.", TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
  }

  @TestData("(optional?: string, : string) => value", 22, 6, "TS1138@20:1 Parameter declaration expected.")
  @TestData("(...?: string = fallback) => value", 1, 23, "TS1003@4:1 Identifier expected.")
  @TestData("(... = fallback) => value", 1, 14, "TS1003@5:1 Identifier expected.")
  @TestMethod
  public recoversTheSpanOfAMalformedArrowParameter(content: string, start: number, length: number, expected: string): void {
    const result = TypeScriptParser.parse(content);
    const statementNode = result.rootNode.children[0];

    Assert.isInstanceOf(statementNode, TypeScriptExpressionStatementNode);
    Assert.isInstanceOf(statementNode.expressionNode, TypeScriptArrowFunctionNode);
    Assert.isDefined(statementNode.expressionNode.parameterListNode);
    const parameterNode = statementNode.expressionNode.parameterListNode.children.at(-1);
    Assert.isInstanceOf(parameterNode, TypeScriptParameterNode);
    Assert.areEqual(start, parameterNode.span.startOffset);
    Assert.areEqual(length, parameterNode.span.length);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
  }

  @TestData("type T = (first: First second: Second) => void;", "TS1005@23:6", 1)
  @TestData("function f(default x:T){}", "TS1359@11:7|TS1005@19:1", 1)
  @TestData("function f(const x:T){}", "TS1359@11:5|TS1005@17:1", 1)
  @TestData("type T = new (: Value) => Result;", "TS1138@14:1", 1)
  @TestData("type T = new (optional?: Value, : Value) => Result;", "TS1138@32:1", 1)
  @TestData("function f(first second) {}", "TS1005@17:6", 1)
  @TestData("function f(first; second) {}", "TS1005@16:1", 1)
  @TestData("function f(first: T second: U) {}", "TS1005@20:6", 1)
  @TestMethod
  public preservesRecoveryDiagnosticsAndFollowingStatements(content: string, expected: string, statementCount: number): void {
    const result = TypeScriptParser.parse(content);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(result.diagnostics));
    Assert.areEqual(statementCount, result.rootNode.children.length);
    Assert.areEqual(content.length, result.rootNode.span.length);
  }

  @TestData("function f(public this: C){}", "TS1433@11:6 Neither decorators nor modifiers may be applied to 'this' parameters.", 1)
  @TestData("function f(@decorator this: C){}", "TS1433@11:10 Neither decorators nor modifiers may be applied to 'this' parameters.", 1)
  @TestData("function f(...this:C){}", "TS1359@14:4 Identifier expected. 'this' is a reserved word that cannot be used here.", 1)
  @TestData("function f(this?:C){}", "TS1005@15:1 ',' expected.", 1)
  @TestData("class C{m(#x:number){}}", "TS18009@10:2 Private identifiers cannot be used as parameters.", 1)
  @TestData("function f(while x){}", "TS1390@11:5 'while' is not allowed as a parameter name.|TS1005@17:1 '(' expected.", 2)
  @TestData("function f(a?, new) {}", "TS1359@15:3 Identifier expected. 'new' is a reserved word that cannot be used here.", 1)
  @TestMethod
  public reportsInvalidThisParametersAndReservedOrPrivateParameterNames(content: string, expected: string, statementCount: number): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
    Assert.areEqual(statementCount, result.rootNode.children.length);
  }

  @TestData("function f(a = 1); function f(a?) {} declare function g(b = 2); interface I { m(a = 1); } type T = (a = 1) => void; type U = new (a = 1) => void;", "TS2371:a = 1,TS2371:b = 2,TS2371:a = 1,TS2371:a = 1,TS2371:a = 1")
  @TestData("class C { m(a = 1); m(a?) {} constructor(b = 1); constructor(b?) {} } function h({a = 1}); function h(x?) {} function k([a] = []); function k(x?) {}", "TS2371:a = 1,TS2371:b = 1,TS2371:a,TS2371:[a] = []")
  @TestData("declare class D { m(a = 1); set s(v = 1); } abstract class E { abstract m(a = 1); } var x = (a = 1) => a; var y = function (a = 1) {}; class F { m(a = 1) {} }", "TS2371:a = 1,TS1052:s,TS2371:v = 1,TS2371:a = 1")
  @TestData("function f({a}?) {} function g([a]?); function g(x?) {} class C { m({a}?) {} } var h = ({a}?) => 1; function k({a}? = {}) {}", "TS2463:{a}?,TS2463:{a}?,TS2463:{a}?,TS1015:{a}")
  @TestData("class C { get x(this: C) { return 1; } set x(this: C, v) {} constructor(this: C) {} } var f = (this: C) => 1; function g(this: C) {} interface I { get x(this: I): number; new (this: I); m(a, this: I); }", "TS2784:this: C,TS2784:this: C,TS2681:this: C,TS2730:this: C,TS2784:this: I,TS2681:this: I,TS2680:this: I")
  @TestMethod
  public readsWhatTheHolderOfAParameterListAllows(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectText(content, result.diagnostics));
  }

  @TestData("declare function f(a = delete 1, b = 1++, c = (1 = 2)): void;", "TS2371:a = delete 1,TS2371:b = 1++,TS2371:c = (1 = 2)")
  @TestData("class C { m(a = (1, 2)): void; m() {} }", "TS2371:a = (1, 2)")
  @TestData("type F = (a = (1, 2)) => void;", "TS2371:a = (1, 2)")
  @TestData("class C { m(a: number = delete 1): void; m() {} }", "TS2371:a: number = delete 1")
  @TestData("function g(a = delete 1): number; function g(a?: any): string { return \"\"; }", "TS2371:a = delete 1")
  @TestData("interface I { m(a = delete 1): void; }", "TS2371:a = delete 1")
  @TestData("abstract class A { abstract m(a = delete 1): void; }", "TS2371:a = delete 1")
  @TestData("declare function f(a = function () { delete 1; }): void;", "TS2371:a = function () { delete 1; }")
  @TestData("\"use strict\";\ndeclare function f(a = delete x): void;", "TS2371:a = delete x,TS1102:x")
  @TestData("declare class E { m(a = delete 1): void; constructor(b = 1++); }", "TS2371:a = delete 1,TS2371:b = 1++")
  @TestData("type G = new (a = delete 1) => void; var o: { m(a = 1++): void };", "TS2371:a = delete 1,TS2371:a = 1++")
  @TestData("declare function f(a = { x: 1, x: 2 }): void;", "TS2371:a = { x: 1, x: 2 }")
  @TestData("declare function f({ a } = { a: delete 1 }): void;", "TS2371:{ a } = { a: delete 1 },TS2703:1")
  @TestData("declare function f([a] = [delete 1]): void;", "TS2371:[a] = [delete 1],TS2703:1")
  @TestData("declare function f({ a }: { a: boolean } = { a: delete 1 }): void;", "TS2371:{ a }: { a: boolean } = { a: delete 1 }")
  @TestData("declare function f({ a } = { a: delete 1 } as any): void;", "TS2371:{ a } = { a: delete 1 } as any")
  @TestData("type F = ({ a } = { a: 1++ }) => void;", "TS2371:{ a } = { a: 1++ },TS2357:1")
  @TestData("declare function f({ a = delete 1 }): void;", "TS2371:a,TS2703:1")
  @TestData("declare function f({ a } = <any>{ a: delete 1 }): void;", "TS2371:{ a } = <any>{ a: delete 1 }")
  @TestData("declare function f({ a } = { a: delete 1 } as const): void;", "TS2371:{ a } = { a: delete 1 } as const,TS2703:1")
  @TestData("declare function f({ a } = <const>{ a: delete 1 }): void;", "TS2371:{ a } = <const>{ a: delete 1 },TS2703:1")
  @TestData("declare function f({ a } = ({ a: delete 1 } as any)): void;", "TS2371:{ a } = ({ a: delete 1 } as any)")
  @TestData("declare function f({ a } = <any>({ a: delete 1 })): void;", "TS2371:{ a } = <any>({ a: delete 1 })")
  @TestData("async function f({ a } = await ({ a: delete 1 } as any)): Promise<void>;\nasync function f() {}", "TS2371:{ a } = await ({ a: delete 1 } as any)")
  @TestData("async function f({ a } = await { a: delete 1 }): Promise<void>;\nasync function f() {}", "TS2371:{ a } = await { a: delete 1 },TS2703:1")
  @TestData("declare function f({ a } = { a: delete 1 } as const<T>): void;", "TS2371:{ a } = { a: delete 1 } as const<T>")
  @TestData("declare function f({ a } = { a: delete 1 } as unknown as any): void;", "TS2371:{ a } = { a: delete 1 } as unknown as any")
  @TestData("declare function f({ a: b } = { a: delete 1 }): void;", "TS2371:{ a: b } = { a: delete 1 }")
  @TestData("declare function f({ a: [b] } = { a: [delete 1] }): void;", "TS2371:{ a: [b] } = { a: [delete 1] },TS2703:1")
  @TestData("declare function f([, a] = [1, delete 1]): void;", "TS2371:[, a] = [1, delete 1],TS2703:1")
  @TestData("declare function f([,] = [delete 1]): void;", "TS2371:[,] = [delete 1]")
  @TestData("declare function f({ a: b = delete 1 }): void;", "")
  @TestData("declare function f({ a: b = delete 1, c }): void;", "TS2703:1")
  @TestData("declare function f({ a: b = delete 1, c } = {}): void;", "TS2371:{ a: b = delete 1, c } = {},TS2703:1")
  @TestData("declare function f({ a: b = delete 1, c } = y): void;", "TS2371:{ a: b = delete 1, c } = y")
  @TestMethod
  public checksASignatureInitializerOnlyWhereItsTypeIsRead(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectText(content, result.diagnostics));
  }

  @TestData("declare function g(): any;\ndeclare function f([a] = g({ x: 1, x: 2 })): void;", "TS2371:[a] = g({ x: 1, x: 2 })")
  @TestData("declare function g(x: any): any;\ndeclare function f(a = g({ x: 1, x: 2 })): void;", "TS2371:a = g({ x: 1, x: 2 })")
  @TestData("declare class G {}\ndeclare function f([a] = new G({ x: 1, x: 2 })): void;", "TS2371:[a] = new G({ x: 1, x: 2 })")
  @TestData("declare function g(x: any): any;\ndeclare function f({ a } = g({ x: 1, x: 2 })): void;", "TS2371:{ a } = g({ x: 1, x: 2 })")
  @TestData("declare function g(x: any): any;\ninterface I { m([a] = g({ x: 1, x: 2 })): void; }", "TS2371:[a] = g({ x: 1, x: 2 })")
  @TestData("declare function g(x: any): any;\ndeclare function f([a] = g(delete 1)): void;", "TS2371:[a] = g(delete 1)")
  @TestData("declare function g(x: any): any;\ndeclare function f([a] = g({ x: 1, x: 2 }, delete 1)): void;", "TS2371:[a] = g({ x: 1, x: 2 }, delete 1)")
  @TestData("declare function g(x: any): any;\ndeclare function f([a] = (g({ x: 1, x: 2 }))): void;", "TS2371:[a] = (g({ x: 1, x: 2 }))")
  @TestData("declare function g(x: any): any;\ndeclare function f([a] = g?.({ x: 1, x: 2 })): void;", "TS2371:[a] = g?.({ x: 1, x: 2 })")
  @TestData("declare const o: { m(x: any): any };\ndeclare function f([a] = o?.m({ y: 1, y: 2 })): void;", "TS2371:[a] = o?.m({ y: 1, y: 2 })")
  @TestData("declare function g(x: any): any;\ndeclare function f([a] = g<{ a: 1, a: 2 }>({ x: 1, x: 2 })): void;", "TS2371:[a] = g<{ a: 1, a: 2 }>({ x: 1, x: 2 })")
  @TestData("declare class G { constructor(x: any); }\ndeclare function f([a] = new G<{ a: 1, a: 2 }>({ x: 1, x: 2 })): void;", "TS2371:[a] = new G<{ a: 1, a: 2 }>({ x: 1, x: 2 })")
  @TestData("declare class G { constructor(x: any); }\ndeclare function f([a] = new G): void;", "TS2371:[a] = new G")
  @TestData("declare function g(x: any): any;\nasync function f([a] = await g({ x: 1, x: 2 })): Promise<void>;\nasync function f() {}", "TS2371:[a] = await g({ x: 1, x: 2 })")
  @TestData("declare function g(x: any): any;\nasync function f([a] = await (g({ x: 1, x: 2 }))): Promise<void>;\nasync function f() {}", "TS2371:[a] = await (g({ x: 1, x: 2 }))")
  @TestData("declare function g(x: any): any;\ndeclare function f({ a } = g({ x: 1, x: 2 }), [b] = g({ y: 1, y: 2 })): void;", "TS2371:{ a } = g({ x: 1, x: 2 }),TS2371:[b] = g({ y: 1, y: 2 })")
  @TestData("declare function g(x: any): any;\ndeclare function f([a = g({ x: 1, x: 2 })]): void;", "TS2371:a")
  @TestData("declare function g(x: any): any;\ndeclare function f([a = g({ x: 1, x: 2 })] = [1]): void;", "TS2371:[a = g({ x: 1, x: 2 })] = [1],TS2371:a")
  @TestData("declare function g(x: any): any;\ndeclare function f([a = g({ x: 1, x: 2 })] = y as any): void;", "TS2371:[a = g({ x: 1, x: 2 })] = y as any,TS2371:a")
  @TestData("declare function g(x: any): any;\ntype F = ([a] = g({ x: 1, x: 2 })) => void;", "TS2371:[a] = g({ x: 1, x: 2 })")
  @TestData("declare function require(x: any): any;\ndeclare function f([a] = require({ x: 1, x: 2 })): void;", "TS2371:[a] = require({ x: 1, x: 2 })")
  @TestData("declare function g(x: any): any;\ndeclare function f([a] = <any>g({ x: 1, x: 2 })): void;", "TS2371:[a] = <any>g({ x: 1, x: 2 })")
  @TestData("declare const o: { m(x: any): any };\ndeclare function f([a] = (delete o, o).m({ y: 1, y: 2 })): void;", "TS2371:[a] = (delete o, o).m({ y: 1, y: 2 }),TS1102:o,TS2703:o")
  @TestData("declare class G { constructor(x: any); }\ndeclare const o: any;\ndeclare function f([a] = new (delete o, G)({ y: 1, y: 2 })): void;", "TS2371:[a] = new (delete o, G)({ y: 1, y: 2 }),TS1102:o,TS2703:o")
  @TestData("declare function g(x: any): any;\ndeclare function f([a] = g({ x: 1, x: 2 })!): void;", "TS2371:[a] = g({ x: 1, x: 2 })!,TS1117:x")
  @TestData("declare function g(x: any): any;\ndeclare function f([a] = g({ x: 1, x: 2 }) as const): void;", "TS2371:[a] = g({ x: 1, x: 2 }) as const,TS1117:x")
  @TestData("declare function g(x: any): any;\ndeclare function f([a] = g({ x: 1, x: 2 }) || [1]): void;", "TS2371:[a] = g({ x: 1, x: 2 }) || [1],TS1117:x")
  @TestData("declare function g(x: any): any;\ndeclare function f([a] = g`${{ x: 1, x: 2 }}`): void;", "TS2371:[a] = g`${{ x: 1, x: 2 }}`,TS1117:x")
  @TestData("declare function f([a] = import({ x: 1, x: 2 })): void;\nexport {};", "TS2371:[a] = import({ x: 1, x: 2 }),TS1117:x")
  @TestData("declare function f([a] = import(\"x\", { x: 1, x: 2 })): void;\nexport {};", "TS2371:[a] = import(\"x\", { x: 1, x: 2 }),TS1117:x")
  @TestData("declare class B {}\nclass C extends B { m([a] = super({ x: 1, x: 2 })): void; m() {} }", "TS2371:[a] = super({ x: 1, x: 2 }),TS1117:x")
  @TestMethod
  public checksNothingAQuickTypedCallPassesInASignatureInitializer(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectText(content, result.diagnostics));
  }

  @TestData("declare function f([a = delete 1] = y): void;", "TS2371:[a = delete 1] = y,TS2371:a")
  @TestData("declare function f({ a = delete 1 } = y.z): void;", "TS2371:{ a = delete 1 } = y.z,TS2371:a")
  @TestData("declare function f([a = delete 1] = \"s\"): void;", "TS2371:[a = delete 1] = \"s\",TS2371:a")
  @TestData("interface I { m({ a = delete 1 } = null): void; }", "TS2371:{ a = delete 1 } = null,TS2371:a")
  @TestData("declare function f([a = delete 1] = [1]): void;", "TS2371:[a = delete 1] = [1],TS2371:a,TS2703:1")
  @TestData("declare function f({ a = delete 1 } = {}): void;", "TS2371:{ a = delete 1 } = {},TS2371:a,TS2703:1")
  @TestData("declare function f([a = delete 1] = () => 1): void;", "TS2371:[a = delete 1] = () => 1,TS2371:a,TS2703:1")
  @TestData("declare function f([a = delete 1] = function () {}): void;", "TS2371:[a = delete 1] = function () {},TS2371:a,TS2703:1,TS1183:{")
  @TestData("declare function f([a = delete 1] = `a${1}`): void;", "TS2371:[a = delete 1] = `a${1}`,TS2371:a")
  @TestData("declare function f([a = delete 1] = c ? y : [1]): void;", "TS2371:[a = delete 1] = c ? y : [1],TS2371:a,TS2703:1")
  @TestData("declare function f([a = delete 1] = c ? y : y): void;", "TS2371:[a = delete 1] = c ? y : y,TS2371:a")
  @TestData("declare function f([a = delete 1] = ([1])!): void;", "TS2371:[a = delete 1] = ([1])!,TS2371:a,TS2703:1")
  @TestData("declare function f([a = delete 1] = y!): void;", "TS2371:[a = delete 1] = y!,TS2371:a")
  @TestData("declare function f([a = delete 1] = [1]!!): void;", "TS2371:[a = delete 1] = [1]!!,TS2371:a,TS2703:1")
  @TestData("declare function f([a = delete 1] = [1] as const): void;", "TS2371:[a = delete 1] = [1] as const,TS2371:a,TS2703:1")
  @TestData("declare function f([a = delete 1] = [1] as const as const): void;", "TS2371:[a = delete 1] = [1] as const as const,TS2371:a,TS2703:1")
  @TestData("declare function f([a = delete 1] = <const>[1]): void;", "TS2371:[a = delete 1] = <const>[1],TS2371:a,TS2703:1")
  @TestData("declare function f([a = delete 1] = [1] as any): void;", "TS2371:[a = delete 1] = [1] as any,TS2371:a")
  @TestData("declare function f([a = delete 1] = y || [1]): void;", "TS2371:[a = delete 1] = y || [1],TS2371:a,TS2703:1")
  @TestData("declare function f([a = delete 1] = [1] || y): void;", "TS2371:[a = delete 1] = [1] || y,TS2371:a,TS2703:1")
  @TestData("declare function f([a = delete 1] = y && [1] || y): void;", "TS2371:[a = delete 1] = y && [1] || y,TS2371:a,TS2703:1")
  @TestData("declare function f([a = delete 1] = y + [1] || y): void;", "TS2371:[a = delete 1] = y + [1] || y,TS2371:a")
  @TestData("declare function f([a = delete 1] = [1] ?? y): void;", "TS2371:[a = delete 1] = [1] ?? y,TS2371:a,TS2703:1")
  @TestData("declare function f([a = delete 1] = y ?? y): void;", "TS2371:[a = delete 1] = y ?? y,TS2371:a")
  @TestData("declare function f([a = delete 1] = y && [1]): void;", "TS2371:[a = delete 1] = y && [1],TS2371:a,TS2703:1")
  @TestData("declare function f([a = delete 1] = [1] && y): void;", "TS2371:[a = delete 1] = [1] && y,TS2371:a")
  @TestData("declare function f([a = delete 1] = (y, [1])): void;", "TS2371:[a = delete 1] = (y, [1]),TS2371:a,TS2703:1")
  @TestData("declare function f([a = delete 1] = ([1], y)): void;", "TS2371:[a = delete 1] = ([1], y),TS2371:a")
  @TestData("declare function f([a = delete 1] = y = [1]): void;", "TS2371:[a = delete 1] = y = [1],TS2371:a")
  @TestData("declare function f([a = delete 1] = [1] satisfies any): void;", "TS2371:[a = delete 1] = [1] satisfies any,TS2371:a")
  @TestData("declare function f([a = delete 1] = class {}): void;", "TS2371:[a = delete 1] = class {},TS2371:a")
  @TestData("async function f([a = delete 1] = await [1]): Promise<void>;\nasync function f() {}", "TS2371:[a = delete 1] = await [1],TS2371:a,TS2703:1")
  @TestData("async function f([a = delete 1] = await y): Promise<void>;\nasync function f() {}", "TS2371:[a = delete 1] = await y,TS2371:a")
  @TestData("declare function f([[a = delete 1] = y]): void;", "TS2371:[a = delete 1],TS2371:a,TS2703:1")
  @TestData("declare function f([[a = delete 1] = y] = y): void;", "TS2371:[[a = delete 1] = y] = y,TS2371:[a = delete 1],TS2371:a")
  @TestMethod
  public readsASignaturePatternsElementInitializersOnlyWhereItsInitializerAsksForItsType(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectText(content, result.diagnostics));
  }

  @TestData("[1]", " || y", "TS2371,TS2371,TS2703")
  @TestData("y", " ?? y", "TS2371,TS2371")
  @TestData("[1]", "!", "TS2371,TS2371,TS2703")
  @TestMethod
  public readsTheFirstOperandOfALongChainInASignatureInitializer(operand: string, link: string, expected: string): void {
    const result = TypeScriptParser.parse(`declare function f([a = delete 1] = ${operand}${link.repeat(100000)}): void;`);

    Assert.areEqual(expected, result.diagnostics.map(t => t.code.displayText).join(","));
  }

  @TestData("declare function f([a] = ()): void;", "TS1109:)")
  @TestData("declare function f([a = ()]): void;", "TS1109:)")
  @TestData("declare function f([a] = c ? y): void;", "TS1005:)")
  @TestMethod
  public reportsOnlyTheSyntaxErrorOfASignatureInitializerThatFailsToParse(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectText(content, result.diagnostics));
  }

  @TestData("declare function f(a = delete 1, b = 1++, c = (1 = 2)): void;\nf(true, 0, 0);", "TS2371:a = delete 1,TS2371:b = 1++,TS2371:c = (1 = 2)")
  @TestData("function h(a = 1): void; function h(b = delete 1): void; function h() {}", "TS2371:a = 1,TS2371:b = delete 1")
  @TestData("function m1(a = delete 1): void; var z; function m1() {}", "TS2371:a = delete 1")
  @TestData("class D { constructor(a = delete 1); constructor() {} }", "TS2371:a = delete 1")
  @TestData("declare function f(a = delete 1): void;\nvar g: (a?: number) => void = f;", "TS2371:a = delete 1")
  @TestMethod
  public leavesToSemanticAnalysisTheInitializerAUseOfTheSignatureChecks(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectText(content, result.diagnostics));
  }

  @TestData("function f(a: { ... }) {}", "TS1131:...,TS1003:}")
  @TestData("function f(a = <{ ] }>x) {}", "TS1131:],TS1128:},TS1109:>,TS1005:)")
  @TestMethod
  public endsAListItHoldsAtItsOwnElementsAndTerminators(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectText(content, result.diagnostics));
  }

  @TestData("function* g() { interface I { m(a = yield): void } }", "TS2371@32:9|TS1212@36:5")
  @TestData("function* g() { interface I { new (a = yield): I; (b = yield): void } }", "TS2371@35:9|TS1212@39:5|TS2371@51:9|TS1212@55:5")
  @TestData("function* g() { interface I { m(a = () => yield): void } }", "TS2371@32:15|TS1212@42:5")
  @TestData("function* g() { let f: (a = yield) => void; }", "TS2371@24:9|TS1212@28:5")
  @TestData("async function f() { interface I { m(a = await): void } }", "TS2371@37:9")
  @TestData("export {}; interface I { m(a = await 1): void }", "TS2371@27:11")
  @TestData("async function f() { interface I { m(@dec(await 1) a): void } }", "TS1206@37:1")
  @TestData("async function f() { interface I { m(@dec(await) a): void } }", "TS1109@47:1")
  @TestData("function* g() { interface I { m(@dec(yield) a): void } }", "TS1206@32:1|TS1212@37:5")
  @TestMethod
  public readsASignaturesParametersOutsideGeneratorsAndAsyncFunctions(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("declare const x: any, a: any, b: any; for (var k = (c = a in b) => 1;;) {}", "TS1005@58:2")
  @TestData("declare const x: any, a: any, b: any; for (var k = (c: any = a in b) => 1;;) {}", "TS1005@63:2")
  @TestData("declare const x: any, a: any, b: any; for (var k = function (c = a in b) {};;) {}", "TS1005@67:2")
  @TestData("declare const x: any, a: any, b: any; for (var k = (c = () => a in b) => 1;;) {}", "TS1005@64:2")
  @TestData("declare const x: any, a: any, b: any; for (var k = (a = b in x) in x) {}", "TS1189@47:1")
  @TestMethod
  public holdsTheInRestrictionThroughParameterInitializers(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("function f(...) {}", 11, 3, 14)
  @TestData("function f(@d) {}", 11, 2, 13)
  @TestData("function f(1) {}", 11, 0, 11)
  @TestMethod
  public writesAMissingNameWhereAParameterLacksOne(content: string, start: number, length: number, nameOffset: number): void {
    const functionNode = TypeScriptParser.parse(content).rootNode.children[0];
    Assert.isInstanceOf(functionNode, TypeScriptFunctionDeclarationNode);
    const parameterNode = functionNode.parameterListNode.children[0];
    Assert.isInstanceOf(parameterNode, TypeScriptParameterNode);

    Assert.isInstanceOf(parameterNode.nameNode, TypeScriptMissingIdentifierNode);
    Assert.areEqual(nameOffset, parameterNode.nameNode.span.startOffset);
    Assert.areEqual(0, parameterNode.nameNode.span.length);
    Assert.areEqual(start, parameterNode.span.startOffset);
    Assert.areEqual(length, parameterNode.span.length);
  }

  @TestData("<T> => T", TypeScriptFunctionTypeNode, 3, "TS1005@4:2")
  @TestData("new => T", TypeScriptConstructorTypeNode, 3, "TS1005@4:2")
  @TestData("new", TypeScriptConstructorTypeNode, 3, "TS1005@3:0")
  @TestMethod
  public writesAnEmptyListWhereTheOpeningParenthesisIsMissing(
    content: string,
    expectedType: typeof TypeScriptConstructorTypeNode | typeof TypeScriptFunctionTypeNode,
    offset: number,
    expected: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseType();

    Assert.isInstanceOf<TypeScriptConstructorTypeNode | TypeScriptFunctionTypeNode>(node, expectedType);
    Assert.isUndefined(node.parameterListNode.openParenthesisNode);
    Assert.isUndefined(node.parameterListNode.closeParenthesisNode);
    Assert.areEqual(0, node.parameterListNode.children.length);
    Assert.areEqual(offset, node.parameterListNode.span.startOffset);
    Assert.areEqual(0, node.parameterListNode.span.length);
    Assert.isUndefined(node.parameterListNode.leadingTrivia);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(parser.context.diagnosticCollector.diagnostics));
  }

  @TestData("function f(a ;", "(a ;")
  @TestMethod
  public endsAtATokenItsListSkipped(content: string, expected: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseStatement();

    Assert.isInstanceOf(node, TypeScriptFunctionDeclarationNode);
    Assert.areEqual(expected, parser.context.source.getText(node.parameterListNode.span));
  }
}
