/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type NodeType, Source, SourceReader, SourceSpan } from "@noldova/context.parsers";
import {
  TypeScriptArrowFunctionNode,
  TypeScriptAsyncKeywordNode,
  TypeScriptClassDeclarationNode,
  TypeScriptEnumDeclarationNode,
  TypeScriptExportAssignmentNode,
  TypeScriptExpressionStatementNode,
  TypeScriptFunctionDeclarationNode,
  TypeScriptFunctionExpressionNode,
  TypeScriptInterfaceDeclarationNode,
  TypeScriptMissingDeclarationNode,
  TypeScriptParser,
  TypeScriptSourceKind,
  TypeScriptTypeAliasDeclarationNode,
  TypeScriptVariableStatementNode
} from "@noldova/context.parsers.typescript";
import { TypeScriptContextFlags } from "@noldova/context.parsers.typescript/enums/typescript-context-flags.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class DeclarationParserTests {
  @TestData("declare function f(): void;", TypeScriptFunctionDeclarationNode, "declare")
  @TestData("declare const x: number;", TypeScriptVariableStatementNode, "declare")
  @TestData("declare let x: string;", TypeScriptVariableStatementNode, "declare")
  @TestData("declare var x: number;", TypeScriptVariableStatementNode, "declare")
  @TestData("declare class C { value: number; method(): void; }", TypeScriptClassDeclarationNode, "declare")
  @TestData("declare interface I { value: number }", TypeScriptInterfaceDeclarationNode, "declare")
  @TestData("declare type T = string;", TypeScriptTypeAliasDeclarationNode, "declare")
  @TestData("declare enum E { A, B = 2 }", TypeScriptEnumDeclarationNode, "declare")
  @TestData("declare const enum E { A }", TypeScriptEnumDeclarationNode, "declare,const")
  @TestData("abstract class C { abstract method(): void; }", TypeScriptClassDeclarationNode, "abstract")
  @TestData("export abstract class C {}", TypeScriptClassDeclarationNode, "export,abstract")
  @TestData("export declare abstract class C {}", TypeScriptClassDeclarationNode, "export,declare,abstract")
  @TestData("export declare function f():void;", TypeScriptFunctionDeclarationNode, "export,declare")
  @TestData("export function f() {}", TypeScriptFunctionDeclarationNode, "export")
  @TestData("export async function f() { await x; }", TypeScriptFunctionDeclarationNode, "export,async")
  @TestData("export default function() {}", TypeScriptFunctionDeclarationNode, "export,default")
  @TestData("export default async function*() { yield await x; }", TypeScriptFunctionDeclarationNode, "export,default,async")
  @TestData("export default class {}", TypeScriptClassDeclarationNode, "export,default")
  @TestData("export default abstract class {}", TypeScriptClassDeclarationNode, "export,default,abstract")
  @TestData("export default interface I {}", TypeScriptInterfaceDeclarationNode, "export,default")
  @TestData("export interface I {}", TypeScriptInterfaceDeclarationNode, "export")
  @TestData("export type T = string;", TypeScriptTypeAliasDeclarationNode, "export")
  @TestData("export enum E { A }", TypeScriptEnumDeclarationNode, "export")
  @TestData("export const enum E { A }", TypeScriptEnumDeclarationNode, "export,const")
  @TestData("const enum E { A }", TypeScriptEnumDeclarationNode, "const")
  @TestData("const\nenum E { A }", TypeScriptEnumDeclarationNode, "const")
  @TestData("export const x = 1;", TypeScriptVariableStatementNode, "export")
  @TestData("export let x;", TypeScriptVariableStatementNode, "export")
  @TestData("export var x;", TypeScriptVariableStatementNode, "export")
  @TestMethod
  public retainsOrderedModifiersOnTheDeclarationItself(content: string, expectedType: Function & NodeType, expectedModifiers: string): void {
    const result = TypeScriptParser.parse(content);
    const node = result.rootNode.children[0];

    Assert.isInstanceOf<TypeScriptClassDeclarationNode | TypeScriptEnumDeclarationNode | TypeScriptFunctionDeclarationNode | TypeScriptInterfaceDeclarationNode
      | TypeScriptTypeAliasDeclarationNode | TypeScriptVariableStatementNode>(node, expectedType);
    Assert.areEqual(expectedModifiers, node.modifierNodes.map(t => content.slice(t.span.startOffset, t.span.endOffset)).join(","));
    Assert.areEqual(0, node.span.startOffset);
    Assert.areEqual(content.length, node.span.endOffset);
    Assert.areEqual(1, result.rootNode.children.length);
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestData("async abstract class C {}", TypeScriptClassDeclarationNode, "async,abstract", "TS1042")
  @TestData("abstract async function f() {}", TypeScriptFunctionDeclarationNode, "abstract,async", "TS1242")
  @TestData("public class C {}", TypeScriptClassDeclarationNode, "public", "TS1044")
  @TestData("private class C {}", TypeScriptClassDeclarationNode, "private", "TS1044")
  @TestData("protected class C {}", TypeScriptClassDeclarationNode, "protected", "TS1044")
  @TestData("readonly class C {}", TypeScriptClassDeclarationNode, "readonly", "TS1024")
  @TestData("static\nclass C {}", TypeScriptClassDeclarationNode, "static", "TS1044")
  @TestData("accessor class C {}", TypeScriptClassDeclarationNode, "accessor", "TS1275")
  @TestData("declare declare function f();", TypeScriptFunctionDeclarationNode, "declare,declare", "TS1030")
  @TestData("export export class C {}", TypeScriptClassDeclarationNode, "export,export", "TS1030")
  @TestMethod
  public retainsModifiersItReportsAsMisplacedOrRepeated(
    content: string,
    expectedType: Function & NodeType,
    expectedModifiers: string,
    expectedCode: string): void {
    const result = TypeScriptParser.parse(content);
    const node = result.rootNode.children[0];

    Assert.isInstanceOf<TypeScriptClassDeclarationNode | TypeScriptFunctionDeclarationNode>(node, expectedType);
    Assert.areEqual(expectedModifiers, node.modifierNodes.map(t => content.slice(t.span.startOffset, t.span.endOffset)).join(","));
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual(expectedCode, result.diagnostics[0]?.code.displayText);
  }

  @TestData("declare\nfunction f(){}", TypeScriptFunctionDeclarationNode)
  @TestData("abstract\nclass C {}", TypeScriptClassDeclarationNode)
  @TestData("async\nfunction f(){}", TypeScriptFunctionDeclarationNode)
  @TestData("declare /*\n*/ function f(){}", TypeScriptFunctionDeclarationNode)
  @TestMethod
  public respectsNewlinesThatSeparateANameFromADeclaration(content: string, expectedType: Function & NodeType): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(2, result.rootNode.children.length);
    Assert.isInstanceOf(result.rootNode.children[0], TypeScriptExpressionStatementNode);
    const declaration = result.rootNode.children[1];
    Assert.isInstanceOf<TypeScriptClassDeclarationNode | TypeScriptFunctionDeclarationNode>(declaration, expectedType);
    Assert.areEqual(0, declaration.modifierNodes.length);
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestData("export\nclass C {}")
  @TestData("export default\nfunction(){}")
  @TestData("export /*\n*/ default /*\n*/ class {}")
  @TestMethod
  public preservesPermittedLineBreaksInsideExportPrefixes(content: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(1, result.rootNode.children.length);
    Assert.areEqual(0, result.diagnostics.length);
    Assert.areEqual(0, result.rootNode.children[0]?.span.startOffset);
  }

  @TestData("declare()", "")
  @TestData("declare + 1;", "")
  @TestData("declare true;", "")
  @TestData("abstract()", "")
  @TestData("abstract + 1;", "")
  @TestData("async()", "")
  @TestData("async => async", "")
  @TestData("public()", "TS1212")
  @TestData("private()", "TS1212")
  @TestData("protected()", "TS1212")
  @TestData("static()", "TS1212")
  @TestData("readonly()", "")
  @TestData("override()", "")
  @TestData("accessor()", "")
  @TestMethod
  public leavesContextualModifierWordsAvailableAsNames(content: string, expectedCode: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.isInstanceOf(result.rootNode.children[0], TypeScriptExpressionStatementNode);
    Assert.areEqual(expectedCode, result.diagnostics.map(t => t.code.displayText).join(","));
  }

  @TestData("declare type\nT = string;", "TS1142", 13, 1, "Line break not permitted here.")
  @TestData("export type\nT = string;", "TS1128", 0, 6, "Declaration or statement expected.")
  @TestData("export declare", "TS1128", 0, 6, "Declaration or statement expected.")
  @TestData("export function() {}", "TS1003", 15, 1, "Identifier expected.")
  @TestData("declare function() {}", "TS1003", 16, 1, "Identifier expected.")
  @TestData("export default function", "TS1005", 23, 0, "'(' expected.")
  @TestData("export default class", "TS1005", 20, 0, "'{' expected.")
  @TestData("declare class", "TS1005", 13, 0, "'{' expected.")
  @TestData("const enum", "TS1003", 10, 0, "Identifier expected.")
  @TestData("override class C {}", "TS1434", 0, 8, "Unexpected keyword or identifier.")
  @TestMethod
  public reportsMalformedDeclarationHeaders(content: string, code: string, start: number, length: number, message: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual(code, result.diagnostics[0]?.code.displayText);
    Assert.areEqual(start, result.diagnostics[0]?.location?.start);
    Assert.areEqual(length, result.diagnostics[0]?.location?.length);
    Assert.areEqual(message, result.diagnostics[0]?.message.text);
  }

  @TestMethod
  public doesNotDuplicateAsyncInFunctionAndArrowModels(): void {
    const functionNode = TypeScriptParserFixture.create("async function() {}").parseExpression();
    const arrowNode = TypeScriptParserFixture.create("async () => value").parseExpression();

    Assert.isInstanceOf(functionNode, TypeScriptFunctionExpressionNode);
    Assert.isInstanceOf(arrowNode, TypeScriptArrowFunctionNode);
    Assert.areEqual(1, functionNode.modifierNodes.length);
    Assert.areEqual(1, arrowNode.modifierNodes.length);
    Assert.isInstanceOf(functionNode.modifierNodes[0], TypeScriptAsyncKeywordNode);
    Assert.isInstanceOf(arrowNode.modifierNodes[0], TypeScriptAsyncKeywordNode);
  }

  @TestMethod
  public preservesBoundedCoordinatesAndTrivia(): void {
    const content = " /* lead */ export declare function f():void; /* tail */ ";
    const source = new Source("<html>" + content + "</html>");
    const reader = new SourceReader(source, new SourceSpan(6, content.length));
    const result = new TypeScriptParser(reader).parse();
    const node = result.rootNode.children[0];

    Assert.isInstanceOf(node, TypeScriptFunctionDeclarationNode);
    Assert.areEqual(18, node.span.startOffset);
    Assert.areEqual(2, node.modifierNodes.length);
    Assert.areEqual(node.modifierNodes[0]?.leadingTrivia, node.leadingTrivia);
    Assert.isDefined(node.leadingTrivia);
    Assert.isDefined(result.rootNode.trailingTrivia);
    Assert.areEqual(6 + content.length, reader.currentOffset);
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestMethod
  public restoresTentativeModifiedDeclarationsWithTheirDiagnostics(): void {
    const parser = TypeScriptParserFixture.create("export declare function(){} next;", TypeScriptContextFlags.Yield);
    const initialNode = parser.currentNode;
    const offset = parser.typescriptLexer.reader.currentOffset;
    parser.lookAhead(() => {
      parser.parseStatement();
      Assert.areEqual(2, parser.context.diagnosticCollector.diagnostics.length);
      return true;
    });

    Assert.areEqual(initialNode, parser.currentNode);
    Assert.areEqual(offset, parser.typescriptLexer.reader.currentOffset);
    Assert.areEqual(TypeScriptContextFlags.Yield, parser.context.contextFlags);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
    const node = parser.parseStatement();
    Assert.isInstanceOf(node, TypeScriptFunctionDeclarationNode);
    Assert.areEqual(2, node.modifierNodes.length);
    Assert.areEqual("TS1003@23:1|TS1183@25:1", TypeScriptDiagnosticsFixture.project(parser.context.diagnosticCollector.diagnostics));
  }

  @TestMethod
  public missingDeclarationsRetainTheirPrefixAndMakeProgress(): void {
    const result = TypeScriptParser.parse("@dec export declare");
    const node = result.rootNode.children[0];

    Assert.isInstanceOf(node, TypeScriptMissingDeclarationNode);
    Assert.areEqual(2, node.modifierNodes.length);
    Assert.areEqual(0, node.span.startOffset);
    Assert.areEqual(11, node.span.endOffset);
    Assert.areEqual(12, result.rootNode.children[1]?.span.startOffset);
    Assert.areEqual("TS1146@11:0", TypeScriptDiagnosticsFixture.project(result.diagnostics));
  }

  @TestData("static static class C {}", "static", 6, TypeScriptClassDeclarationNode, "TS1146@6:0 Declaration expected.")
  @TestData("static static\nclass C {}", "static", 6, TypeScriptClassDeclarationNode, "TS1146@6:0 Declaration expected.")
  @TestData("declare static static function f();", "declare,static", 14, TypeScriptFunctionDeclarationNode, "TS1146@14:0 Declaration expected.")
  @TestData("export static static class C {}", "export,static", 13, TypeScriptClassDeclarationNode, "TS1146@13:0 Declaration expected.")
  @TestData("static public static class C {}", "static,public", 13, TypeScriptClassDeclarationNode, "TS1146@13:0 Declaration expected.")
  @TestData("abstract static static class C {}", "abstract,static", 15, TypeScriptClassDeclarationNode, "TS1146@15:0 Declaration expected.")
  @TestMethod
  public reportsAKeywordListThatBeginsNoDeclarationWhereItEnds(
    content: string,
    expectedModifiers: string,
    expectedEnd: number,
    expectedType: Function & NodeType,
    expected: string): void {
    const result = TypeScriptParser.parse(content);
    const missingNode = result.rootNode.children[0];
    const declarationNode = result.rootNode.children[1];

    Assert.isInstanceOf(missingNode, TypeScriptMissingDeclarationNode);
    Assert.areEqual(expectedModifiers, missingNode.modifierNodes.map(t => content.slice(t.span.startOffset, t.span.endOffset)).join(","));
    Assert.areEqual(0, missingNode.span.startOffset);
    Assert.areEqual(expectedEnd, missingNode.span.endOffset);
    Assert.isInstanceOf<TypeScriptClassDeclarationNode | TypeScriptFunctionDeclarationNode>(declarationNode, expectedType);
    Assert.areEqual("static", declarationNode.modifierNodes.map(t => content.slice(t.span.startOffset, t.span.endOffset)).join(","));
    Assert.areEqual(2, result.rootNode.children.length);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
  }

  @TestData("abstract export default class {}", true)
  @TestData("declare export default class {}", true)
  @TestData("public export default class {}", true)
  @TestData("abstract export\ndefault class {}", true)
  @TestData("abstract export default 5;", true)
  @TestData("abstract export = x;", true)
  @TestData("abstract export {};", true)
  @TestData("export default class {}", true)
  @TestData("const export class C {}", true)
  @TestData("abstract\nexport default class {}", false)
  @TestData("export readonly value = 1;", false)
  @TestData("export abstract default class C {}", false)
  @TestData("export;", false)
  @TestMethod
  public answersAtTheFirstWordThatBeginsADeclaration(content: string, isDeclarationStart: boolean): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.currentNode;
    const offset = parser.typescriptLexer.reader.currentOffset;

    Assert.areEqual(isDeclarationStart, parser.isDeclarationStart());
    Assert.areEqual(node, parser.currentNode);
    Assert.areEqual(offset, parser.typescriptLexer.reader.currentOffset);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestData("abstract export default class {}", TypeScriptSourceKind.Code, TypeScriptClassDeclarationNode, "abstract,export,default", "TS1029@9:6")
  @TestData("async export default function f() {}", TypeScriptSourceKind.Code, TypeScriptFunctionDeclarationNode, "async,export,default", "TS1029@6:6")
  @TestData("abstract export\ndefault class {}", TypeScriptSourceKind.Code, TypeScriptClassDeclarationNode, "abstract,export,default", "TS1029@9:6")
  @TestData("abstract export default interface I {}", TypeScriptSourceKind.Code, TypeScriptInterfaceDeclarationNode, "abstract,export,default", "TS1242@0:8")
  @TestData("abstract declare export default class {}", TypeScriptSourceKind.Code, TypeScriptClassDeclarationNode, "abstract,declare,export,default", "TS1029@17:6")
  @TestData("declare abstract export default class {}", TypeScriptSourceKind.Code, TypeScriptClassDeclarationNode, "declare,abstract,export,default", "TS1029@17:6")
  @TestData("declare async export default function f();", TypeScriptSourceKind.Code, TypeScriptFunctionDeclarationNode, "declare,async,export,default", "TS1040@8:5")
  @TestData("public export default class {}", TypeScriptSourceKind.Code, TypeScriptClassDeclarationNode, "public,export,default", "TS1044@0:6")
  @TestData("static export default class {}", TypeScriptSourceKind.Code, TypeScriptClassDeclarationNode, "static,export,default", "TS1044@0:6")
  @TestData("readonly export default class {}", TypeScriptSourceKind.Code, TypeScriptClassDeclarationNode, "readonly,export,default", "TS1024@0:8")
  @TestData("accessor export default class {}", TypeScriptSourceKind.Code, TypeScriptClassDeclarationNode, "accessor,export,default", "TS1275@0:8")
  @TestData("readonly declare export default class {}", TypeScriptSourceKind.Code, TypeScriptClassDeclarationNode, "readonly,declare,export,default", "TS1024@0:8")
  @TestData("declare export default class {}", TypeScriptSourceKind.Code, TypeScriptClassDeclarationNode, "declare,export,default", "TS1029@8:6")
  @TestData("abstract export default class {}", TypeScriptSourceKind.Declaration, TypeScriptClassDeclarationNode, "abstract,export,default", "TS1029@9:6")
  @TestData("declare export default class {}", TypeScriptSourceKind.Declaration, TypeScriptClassDeclarationNode, "declare,export,default", "TS1029@8:6")
  @TestData("abstract export default 5;", TypeScriptSourceKind.Code, TypeScriptExportAssignmentNode, "abstract", "TS1242@0:8")
  @TestMethod
  public readsTheModifiersWrittenBeforeExportDefaultAsTheDeclarations(
    content: string,
    sourceKind: TypeScriptSourceKind,
    expectedType: Function & NodeType,
    expectedModifiers: string,
    expectedDiagnostics: string): void {
    const result = TypeScriptParser.parse(content, sourceKind === TypeScriptSourceKind.Declaration ? "source.d.ts" : "source.ts", sourceKind);
    const node = result.rootNode.children[0];

    Assert.isInstanceOf<TypeScriptClassDeclarationNode | TypeScriptExportAssignmentNode | TypeScriptFunctionDeclarationNode
      | TypeScriptInterfaceDeclarationNode>(node, expectedType);
    Assert.areEqual(1, result.rootNode.children.length);
    Assert.areEqual(expectedModifiers, node.modifierNodes.map(t => content.slice(t.span.startOffset, t.span.endOffset)).join(","));
    Assert.areEqual(expectedDiagnostics, TypeScriptDiagnosticsFixture.project(result.diagnostics));
  }

  @TestMethod
  public readsTheModifiersWrittenBeforeExportDefaultInAModuleBody(): void {
    const result = TypeScriptParser.parse("namespace N { abstract export default class {} }");

    Assert.areEqual("TS1029@23:6", TypeScriptDiagnosticsFixture.project(result.diagnostics));
  }

  @TestData("declare let x = await;\nexport {};", "TS1109@21:1")
  @TestData("declare var x: T, y = await;\nexport {};", "TS1109@27:1")
  @TestData("declare const x = { a: await };\nexport {};", "TS1109@29:1")
  @TestData("declare let x = await /p/;\nexport {};", "TS1039@16:9")
  @TestData("declare const x = await(1);\nexport {};", "")
  @TestData("declare function f(a = await): void;\nexport {};", "TS2371@19:9")
  @TestMethod
  public readsAnAmbientDeclarationAgainInAwaitContext(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("@dec import;", "TS1109@11:1 Expression expected.")
  @TestData("export @dec import;", "TS1109@18:1 Expression expected.")
  @TestData("@dec abstract import;", "TS1109@20:1 Expression expected.")
  @TestData("function f() { @dec import; }", "TS1109@26:1 Expression expected.")
  @TestData("@dec import(\"m\");", "TS1206@0:1 Decorators are not valid here.|TS1141@11:5 String literal expected.")
  @TestData("@dec interface;", "TS1003@14:1 Identifier expected.")
  @TestData("@dec type;", "TS1003@9:1 Identifier expected.")
  @TestData("@dec declare type;", "TS1003@17:1 Identifier expected.")
  @TestData("@dec namespace;", "TS1003@14:1 Identifier expected.")
  @TestData("@dec module;", "TS1003@11:1 Identifier expected.")
  @TestData("@dec global;", "TS1206@0:1 Decorators are not valid here.")
  @TestData("@dec enum;", "TS1003@9:1 Identifier expected.")
  @TestData("@dec export;", "TS1005@11:1 '{' expected.")
  @TestData("@dec using x = y;", "TS1206@0:1 Decorators are not valid here.")
  @TestData("@dec await;", "TS1146@4:0 Declaration expected.")
  @TestData("@dec static;", "TS1146@4:0 Declaration expected.")
  @TestMethod
  public readsTheDeclarationItsKeywordNamesAfterAModifierList(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
  }
}
