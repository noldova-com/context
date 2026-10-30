/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  TypeScriptCallSignatureNode,
  TypeScriptConstructSignatureNode,
  TypeScriptExpressionStatementNode,
  TypeScriptGetAccessorNode,
  TypeScriptIndexSignatureNode,
  TypeScriptInterfaceDeclarationNode,
  TypeScriptInterfaceKeywordNode,
  TypeScriptMethodSignatureNode,
  TypeScriptMissingIdentifierNode,
  TypeScriptMissingTypeNode,
  TypeScriptParser,
  TypeScriptPrivateIdentifierNode,
  TypeScriptPropertySignatureNode,
  TypeScriptSetAccessorNode,
  TypeScriptTypeAliasDeclarationNode,
  TypeScriptTypeLiteralNode
} from "@noldova/context.parsers.typescript";
import { TypeScriptContextFlags } from "@noldova/context.parsers.typescript/enums/typescript-context-flags.js";
import { InterfaceDeclarationParser } from "@noldova/context.parsers.typescript/services/parsers/declarations/interface-declaration.parser.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class InterfaceDeclarationParserTests {
  @TestMethod
  public recoversAMissingNameAfterTheGrammarHasCommitted(): void {
    const parser = TypeScriptParserFixture.create("interface {}");
    const keyword = parser.currentNode;
    Assert.isInstanceOf(keyword, TypeScriptInterfaceKeywordNode);
    const node = new InterfaceDeclarationParser(parser).parse(keyword);

    Assert.isInstanceOf(node.nameNode, TypeScriptMissingIdentifierNode);
    Assert.areEqual(9, node.nameNode.span.startOffset);
    Assert.areEqual(0, node.nameNode.span.length);
    Assert.isDefined(node.closeBraceNode);
    Assert.areEqual(1, parser.context.diagnosticCollector.diagnostics.length);
    Assert.areEqual("TS1003", parser.context.diagnosticCollector.diagnostics[0]?.code.displayText);
  }

  @TestMethod
  public retainsTheKeywordWhenACommittedDeclarationHasNoFollowingSyntax(): void {
    const parser = TypeScriptParserFixture.create("interface");
    const keyword = parser.currentNode;
    Assert.isInstanceOf(keyword, TypeScriptInterfaceKeywordNode);
    const node = new InterfaceDeclarationParser(parser).parse(keyword);

    Assert.areEqual(keyword.span.startOffset, node.span.startOffset);
    Assert.areEqual(keyword.span.endOffset, node.span.endOffset);
    Assert.isInstanceOf(node.nameNode, TypeScriptMissingIdentifierNode);
    Assert.isUndefined(node.openBraceNode);
    Assert.areEqual(0, node.children.length);
    Assert.areEqual("TS1003@9:0", TypeScriptDiagnosticsFixture.project(parser.context.diagnosticCollector.diagnostics));
  }

  @TestMethod
  public restoresNavigationAndDiagnosticsAfterTentativeDeclarations(): void {
    const parser = TypeScriptParserFixture.create("interface A { value: } next;");
    const initialNode = parser.currentNode;
    const initialOffset = parser.typescriptLexer.reader.currentOffset;

    parser.lookAhead(() => {
      parser.parseStatement();
      Assert.areEqual("TS1110@21:1", TypeScriptDiagnosticsFixture.project(parser.context.diagnosticCollector.diagnostics));
      return true;
    });
    Assert.areEqual(initialNode, parser.currentNode);
    Assert.areEqual(initialOffset, parser.typescriptLexer.reader.currentOffset);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);

    parser.tryParse(() => {
      parser.parseStatement();
      return undefined;
    });
    Assert.areEqual(initialNode, parser.currentNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);

    const node = parser.parseStatement();
    Assert.isInstanceOf(node, TypeScriptInterfaceDeclarationNode);
    Assert.areEqual(22, node.span.endOffset);
    Assert.areEqual("TS1110@21:1", TypeScriptDiagnosticsFixture.project(parser.context.diagnosticCollector.diagnostics));
  }

  @TestMethod
  public skipsAnInvalidModifierAndRecoversTheAccessor(): void {
    const result = TypeScriptParser.parse("interface A { readonly get value(): number; }");
    const node = result.rootNode.children[0];

    Assert.isInstanceOf(node, TypeScriptInterfaceDeclarationNode);
    Assert.areEqual(1, node.children.length);
    const accessor = node.children[0];
    Assert.isInstanceOf(accessor, TypeScriptGetAccessorNode);
    Assert.areEqual(0, accessor.modifierNodes.length);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS1131", result.diagnostics[0]?.code.displayText);
  }

  @TestMethod
  public doesNotTreatAnInterfaceMemberBodyAsPartOfTheSignature(): void {
    const result = TypeScriptParser.parse("interface A { method():void {} }");

    Assert.areEqual(2, result.rootNode.children.length);
    Assert.isInstanceOf(result.rootNode.children[0], TypeScriptInterfaceDeclarationNode);
    Assert.areEqual(2, result.diagnostics.length);
    Assert.areEqual("TS1005", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(28, result.diagnostics[0]?.location?.start);
    Assert.areEqual("TS1128", result.diagnostics[1]?.code.displayText);
    Assert.areEqual(31, result.diagnostics[1]?.location?.start);
  }

  @TestMethod
  public reusesEveryImplementedTypeMemberForm(): void {
    const result = TypeScriptParser.parse(
      "interface Box<T> extends Base<T>, Other { readonly value?: T; method<U>(x:U):T; (x:T):T; new(x:T):T;"
      + " [key:string]:T; get current():T; set current(value:T); [Symbol.iterator]():T; }");
    const node = result.rootNode.children[0];

    Assert.isInstanceOf(node, TypeScriptInterfaceDeclarationNode);
    Assert.isDefined(node.typeParameterListNode);
    Assert.areEqual(1, node.heritageClauseNodes.length);
    Assert.areEqual(2, node.heritageClauseNodes[0]?.children.length);
    Assert.areEqual(8, node.children.length);
    Assert.isInstanceOf(node.children[0], TypeScriptPropertySignatureNode);
    Assert.isInstanceOf(node.children[1], TypeScriptMethodSignatureNode);
    Assert.isInstanceOf(node.children[2], TypeScriptCallSignatureNode);
    Assert.isInstanceOf(node.children[3], TypeScriptConstructSignatureNode);
    Assert.isInstanceOf(node.children[4], TypeScriptIndexSignatureNode);
    Assert.isInstanceOf(node.children[5], TypeScriptGetAccessorNode);
    Assert.isInstanceOf(node.children[6], TypeScriptSetAccessorNode);
    Assert.isInstanceOf(node.children[7], TypeScriptMethodSignatureNode);
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestData("interface Empty {}", 0, "")
  @TestData("interface A extends {}", 0, "TS1097")
  @TestData("interface A extends B, {}", 1, "TS1009")
  @TestData("interface A implements B {}", 1, "TS1176")
  @TestData("interface A extends B extends C {}", 2, "TS1172")
  @TestMethod
  public preservesHeritageSyntaxWithoutClaimingItsSemanticLegality(content: string, heritageTypes: number, expectedCode: string): void {
    const result = TypeScriptParser.parse(content);
    const node = result.rootNode.children[0];

    Assert.isInstanceOf(node, TypeScriptInterfaceDeclarationNode);
    Assert.areEqual(heritageTypes, node.heritageClauseNodes.reduce((sum, clause) => sum + clause.children.length, 0));
    Assert.isDefined(node.openBraceNode);
    Assert.isDefined(node.closeBraceNode);
    Assert.areEqual(expectedCode, result.diagnostics.map(t => t.code.displayText).join(","));
  }

  @TestData("interface A", 11)
  @TestData("interface A<T>", 14)
  @TestData("interface A extends B", 21)
  @TestMethod
  public reportsAMissingBodyWithoutInventingBraces(content: string, start: number): void {
    const result = TypeScriptParser.parse(content);
    const node = result.rootNode.children[0];

    Assert.isInstanceOf(node, TypeScriptInterfaceDeclarationNode);
    Assert.isUndefined(node.openBraceNode);
    Assert.isUndefined(node.closeBraceNode);
    Assert.areEqual(0, node.children.length);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS1005", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(start, result.diagnostics[0]?.location?.start);
    Assert.areEqual(0, result.diagnostics[0]?.location?.length);
    Assert.areEqual("'{' expected.", result.diagnostics[0]?.message.text);
  }

  @TestData("interface A { x: number y: string }", "TS1005", 24, 1, "';' expected.", 2)
  @TestData("interface A { ; x:string }", "TS1131", 14, 1, "Property or signature expected.", 1)
  @TestData("interface A { , x:string }", "TS1131", 14, 1, "Property or signature expected.", 1)
  @TestData("interface A { x:string;; }", "TS1131", 23, 1, "Property or signature expected.", 1)
  @TestData("interface A { x:string", "TS1005", 22, 0, "'}' expected.", 1)
  @TestData("interface A { x: }", "TS1110", 17, 1, "Type expected.", 1)
  @TestMethod
  public recoversMalformedMembersWithTheirDiagnostic(content: string, code: string, start: number, length: number, message: string, members: number): void {
    const result = TypeScriptParser.parse(content);
    const node = result.rootNode.children[0];

    Assert.isInstanceOf(node, TypeScriptInterfaceDeclarationNode);
    Assert.areEqual(members, node.children.length);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual(code, result.diagnostics[0]?.code.displayText);
    Assert.areEqual(start, result.diagnostics[0]?.location?.start);
    Assert.areEqual(length, result.diagnostics[0]?.location?.length);
    Assert.areEqual(message, result.diagnostics[0]?.message.text);
  }

  @TestData("}", 1)
  @TestData("; next: number }", 2)
  @TestData(", next: number }", 2)
  @TestMethod
  public missingMemberTypesLeaveTheirSeparatorsForTheList(suffix: string, members: number): void {
    const result = TypeScriptParser.parse("interface A { value: " + suffix);
    const node = result.rootNode.children[0];

    Assert.isInstanceOf(node, TypeScriptInterfaceDeclarationNode);
    const first = node.children[0];
    Assert.isInstanceOf(first, TypeScriptPropertySignatureNode);
    Assert.isInstanceOf(first.typeNode, TypeScriptMissingTypeNode);
    Assert.areEqual(0, first.typeNode.span.length);
    Assert.areEqual(members, node.children.length);
    Assert.isDefined(node.closeBraceNode);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS1110", result.diagnostics[0]?.code.displayText);
  }

  @TestData("interface A { x: number\ny: string }")
  @TestData("interface A { x: number, y: string }")
  @TestMethod
  public acceptsAutomaticAndCommaMemberTerminators(content: string): void {
    const result = TypeScriptParser.parse(content);
    const node = result.rootNode.children[0];

    Assert.isInstanceOf(node, TypeScriptInterfaceDeclarationNode);
    Assert.areEqual(2, node.children.length);
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestMethod
  public clearsTypeMemberGrammarFlagsAndRestoresTheEnclosingContext(): void {
    const parser = TypeScriptParserFixture.create("interface A { method(await: await, yield: yield): await; } next;",
      TypeScriptContextFlags.Await | TypeScriptContextFlags.Yield);
    const node = parser.parseStatement();

    Assert.isInstanceOf(node, TypeScriptInterfaceDeclarationNode);
    Assert.areEqual(1, node.children.length);
    Assert.areEqual(TypeScriptContextFlags.Await | TypeScriptContextFlags.Yield, parser.context.contextFlags);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public rejectsPropertyInitializersWithoutDiscardingTheFollowingStatement(): void {
    const result = TypeScriptParser.parse("interface A { x = 1; } next();");

    Assert.isInstanceOf(result.rootNode.children[0], TypeScriptInterfaceDeclarationNode);
    Assert.areEqual(0, result.rootNode.children[0].children.length);
    Assert.isInstanceOf(result.rootNode.children[1], TypeScriptExpressionStatementNode);
    Assert.isInstanceOf(result.rootNode.children[2], TypeScriptExpressionStatementNode);
    Assert.areEqual(2, result.diagnostics.length);
    Assert.areEqual("TS1131", result.diagnostics[0]?.code.displayText);
    Assert.areEqual("TS1128", result.diagnostics[1]?.code.displayText);
  }

  @TestMethod
  public sharesMissingSeparatorValidationWithTypeLiterals(): void {
    const interfaceResult = TypeScriptParser.parse("interface I { method?<T>(value:T):T plain(); }");
    const literalResult = TypeScriptParser.parse("type I = { method?<T>(value:T):T plain(); };");
    const interfaceNode = interfaceResult.rootNode.children[0];
    const aliasNode = literalResult.rootNode.children[0];

    Assert.isInstanceOf(interfaceNode, TypeScriptInterfaceDeclarationNode);
    Assert.areEqual(2, interfaceNode.children.length);
    Assert.isInstanceOf(aliasNode, TypeScriptTypeAliasDeclarationNode);
    Assert.isInstanceOf(aliasNode.typeNode, TypeScriptTypeLiteralNode);
    Assert.areEqual(2, aliasNode.typeNode.children.length);
    Assert.areEqual("TS1005@36:5 ';' expected.", TypeScriptDiagnosticsFixture.projectWithMessages(interfaceResult.diagnostics));
    Assert.areEqual("TS1005@33:5 ';' expected.", TypeScriptDiagnosticsFixture.projectWithMessages(literalResult.diagnostics));
  }

  @TestData("interface Foo { bar: number = 5; baz?: string = \"a\"; m(): void; }", "TS1246:5,TS1246:\"a\"")
  @TestMethod
  public refusesAnInitializerOnAnInterfaceProperty(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectText(content, result.diagnostics));
  }

  @TestData("interface I { const a: string }", "TS1005:a")
  @TestData("interface I { export a: string }", "TS1070:export")
  @TestData("interface I { default: number; const(): void; export?: 1 }", "")
  @TestData("type T = { declare a: string; static b(): void; }", "TS1070:declare,TS1070:static")
  @TestData("interface I { public private a; }", "TS1070:public")
  @TestMethod
  public passesOverEveryModifierKeywordBeforeAMembersName(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectText(content, result.diagnostics));
  }

  @TestData("function* g() { interface I extends yield {} }", "TS1109@36:5")
  @TestData("export {}; interface I extends await {}", "TS1109@31:5")
  @TestData("async function f() { interface I extends await {} }", "TS1109@41:5")
  @TestData("function* g() { interface I extends A, yield {} }", "TS1109@39:5")
  @TestData("function* g() { interface I extends yield.x {} }", "TS1109@36:5|TS1005@41:1|TS1434@42:1")
  @TestData("async function f() { interface I extends await.x {} }", "TS1109@41:5|TS1109@46:1|TS1005@49:1")
  @TestData("export {}; interface I extends await.x {}", "TS1109@31:5|TS1109@36:1")
  @TestData("function* g() { class C implements yield {} }", "TS1109@35:5")
  @TestData("function* g() { interface I { [yield]: 1 } }", "")
  @TestData("async function f() { interface I { [await 1]: 1 } }", "")
  @TestData("function* g() { interface I { a = yield 1 } }", "TS1131@30:1|TS1128@44:1")
  @TestData("function* g() { interface I { a: 1 = yield } }", "TS1246@37:5")
  @TestData("function* g() { interface I { a: yield } }", "TS1212@33:5")
  @TestData("function* g() { interface I { [k: yield]: 1 } }", "TS1212@34:5")
  @TestData("function* g() { interface I<T = yield> {} }", "TS1212@32:5")
  @TestMethod
  public readsItselfInTheContextHoldingIt(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("declare const x: any, a: any, b: any; for (var k = () => { interface I { m(c: any = a in b): void } };;) {}", "TS1005@86:2")
  @TestMethod
  public holdsTheInRestrictionThroughItsMembers(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestMethod
  public reportsAReservedWordWrittenAsItsName(): void {
    const result = TypeScriptParser.parse("export default interface class {}");
    const node = result.rootNode.children[0];

    Assert.isInstanceOf(node, TypeScriptInterfaceDeclarationNode);
    Assert.isInstanceOf(node.nameNode, TypeScriptMissingIdentifierNode);
    Assert.areEqual(24, node.nameNode.span.startOffset);
    Assert.areEqual("TS1359@25:5 Identifier expected. 'class' is a reserved word that cannot be used here.",
      TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
  }

  @TestMethod
  public keepsAPrivateIdentifierWrittenAsItsName(): void {
    const result = TypeScriptParser.parse("export default interface #x {}");
    const node = result.rootNode.children[0];

    Assert.isInstanceOf(node, TypeScriptInterfaceDeclarationNode);
    Assert.isInstanceOf(node.nameNode, TypeScriptPrivateIdentifierNode);
    Assert.areEqual("TS18016@25:2", TypeScriptDiagnosticsFixture.project(result.diagnostics));
  }

  @TestData("interface I { )", "interface I { )")
  @TestData("interface I { a: T; )", "interface I { a: T; )")
  @TestMethod
  public endsAtATokenItsMemberListSkipped(content: string, expected: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseStatement();

    Assert.isInstanceOf(node, TypeScriptInterfaceDeclarationNode);
    Assert.areEqual(expected, parser.context.source.getText(node.span));
  }
}
