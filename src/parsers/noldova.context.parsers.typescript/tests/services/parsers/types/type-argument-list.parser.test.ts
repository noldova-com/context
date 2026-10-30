/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  TypeScriptBinaryExpressionNode,
  TypeScriptCallExpressionNode,
  TypeScriptFunctionTypeNode,
  TypeScriptParser,
  TypeScriptTypeReferenceNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";
import { TypeScriptSyntaxParserProbe } from "../../../fixtures/typescript-syntax-parser-probe.js";

@TestClass
export class TypeArgumentListParserTests {
  @TestData("<Value>", true)
  @TestData("<Value>;", true)
  @TestData("<Value>[key]", false)
  @TestData("<Value>!", false)
  @TestData("<Value>++", false)
  @TestData("<Value>\nnext", true)
  @TestData("<Value>\n+next", false)
  @TestData("<Value>\n-next", false)
  @TestData("<Value>\n<Next>", false)
  @TestData("<Value> >", false)
  @TestData("<Value>next", false)
  @TestData("<Value>=next", false)
  @TestData("<Value>>next", false)
  @TestData("<Value>>>next", false)
  @TestData("<Value>==next", false)
  @TestMethod
  public commitsOnlyWhenTheFollowingTokenPermitsInstantiation(content: string, isAccepted: boolean): void {
    const parser = TypeScriptParserFixture.create(content);
    const opener = parser.currentNode;
    const offset = parser.typescriptLexer.reader.currentOffset;
    const node = parser.tryParseTypeArgumentExpressionSuffix();
    Assert.areEqual(isAccepted, !Object.isUndefined(node));
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
    if (isAccepted) {
      Assert.isDefined(node);
      Assert.areEqual("<Value>", parser.typescriptLexer.reader.source.getText(node.span));
    }
    else {
      Assert.areEqual(opener, parser.currentNode);
      Assert.areEqual(offset, parser.typescriptLexer.reader.currentOffset);
    }
  }

  @TestData("(b)", 40)
  @TestData("(b)", 160)
  @TestData("(b)", 640)
  @TestData("[b]", 40)
  @TestData("[b]", 160)
  @TestData("[b]", 640)
  @TestData("{field: b}", 40)
  @TestData("{field: b}", 160)
  @TestData("{field: b}", 640)
  @TestData("\"b\"", 40)
  @TestData("\"b\"", 160)
  @TestData("\"b\"", 640)
  @TestData("b | c", 40)
  @TestData("b | c", 160)
  @TestData("b | c", 640)
  @TestData("(b | c)", 40)
  @TestData("(b | c)", 160)
  @TestData("(b | c)", 640)
  @TestData("(b & c)", 40)
  @TestData("(b & c)", 160)
  @TestData("(b & c)", 640)
  @TestData("[{field:b}]", 40)
  @TestData("[{field:b}]", 160)
  @TestData("[{field:b}]", 640)
  @TestData("(b /* > */)", 40)
  @TestData("(b /* > */)", 160)
  @TestData("(b /* > */)", 640)
  @TestMethod
  public boundsRelationalArgumentsAcrossTypeLikeOperands(operand: string, argumentCount: number): void {
    const content = "f(" + Array<string>(argumentCount).fill("a < " + operand).join(",") + ");";
    const parser = new TypeScriptSyntaxParserProbe(content);
    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptCallExpressionNode);
    Assert.isUndefined(node.typeArgumentListNode);
    Assert.areEqual(argumentCount, node.argumentListNode.children.length);
    for (const argumentNode of node.argumentListNode.children) {
      Assert.isInstanceOf(argumentNode, TypeScriptBinaryExpressionNode);
      Assert.areEqual("a < " + operand, parser.typescriptLexer.reader.source.getText(argumentNode.span));
    }

    Assert.areEqual(content.length - 1, node.span.endOffset);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
    Assert.isTrue(parser.advanceCount <= argumentCount * 64 + 64);
    parser.parse();
    Assert.areEqual(0, parser.context.unclosedTypeArgumentOffsets.size);
  }

  @TestData(50)
  @TestData(100)
  @TestData(200)
  @TestData(800)
  @TestData(6400)
  @TestMethod
  public boundsLookaheadWorkForRelationalChains(comparisonCount: number): void {
    const parser = new TypeScriptSyntaxParserProbe("value < ".repeat(comparisonCount) + "value;");
    const result = parser.parse();

    Assert.areEqual(0, result.diagnostics.length);
    Assert.areEqual(1, result.rootNode.children.length);
    Assert.isTrue(parser.isEndOfFile);
    Assert.isTrue(parser.advanceCount <= comparisonCount * 16 + 16);
  }

  @TestData("f<{ field: A; other: B }>()")
  @TestData("f<`text`>()")
  @TestData("f<Outer<Inner<A>>>()")
  @TestData("f<A.B, C>()")
  @TestData("f<1>()")
  @TestData("f?.<{ field: A; other: B }>()")
  @TestData("f<(A)>()")
  @TestData("f<((A))>()")
  @TestData("f<(A<B>)>()")
  @TestData("f<A<(B)>>()")
  @TestData("f<(A | B)>()")
  @TestData("f<((x: A) => B)>()")
  @TestData("f<A, (B)>()")
  @TestData("f?.<(A)>()")
  @TestData("f<{[a < b]: T}>()")
  @TestData("f<{[a > b]: T}>()")
  @TestData("f<{field: \">\"}>()")
  @TestData("f<[A, \">\", (B)]>()")
  @TestData("f<{method(): A; field: B}>()")
  @TestData("f<((x: {field: A}) => B)>()")
  @TestData("f<A extends B ? C : D>()")
  @TestData("f<{field: `a${A}`}>()")
  @TestMethod
  public leavesComplexTypeArgumentsToTheGrammar(content: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptCallExpressionNode);
    Assert.isDefined(node.typeArgumentListNode);
    Assert.isDefined(node.typeArgumentListNode.greaterThanNode);
    Assert.areEqual(content.length, node.span.endOffset);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
    Assert.isTrue(parser.isEndOfFile);
  }

  @TestData("a < (b) > (c)", 1)
  @TestData("a < (b), c > (d)", 2)
  @TestMethod
  public permitsARealGenericCallAfterParenthesizedTypes(content: string, typeArgumentCount: number): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptCallExpressionNode);
    Assert.isDefined(node.typeArgumentListNode);
    Assert.areEqual(typeArgumentCount, node.typeArgumentListNode.children.length);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
    Assert.isTrue(parser.isEndOfFile);
  }

  @TestMethod
  public keepsAnOuterClosingParenthesisOutsideTheRejectedTypeArguments(): void {
    const parser = TypeScriptParserFixture.create("outer(a < (b)), c > (d)");
    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptBinaryExpressionNode);
    Assert.isInstanceOf(node.leftNode, TypeScriptCallExpressionNode);
    Assert.isUndefined(node.leftNode.typeArgumentListNode);
    Assert.areEqual(1, node.leftNode.argumentListNode.children.length);
    Assert.isInstanceOf(node.leftNode.argumentListNode.children[0], TypeScriptBinaryExpressionNode);
    Assert.isInstanceOf(node.rightNode, TypeScriptBinaryExpressionNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
    Assert.isTrue(parser.isEndOfFile);
  }

  @TestData("<(A]")
  @TestData("<[A)")
  @TestData("<{field:A)")
  @TestData("<((A)")
  @TestMethod
  public doesNotCacheRejectionsAcrossUnbalancedDelimiterGroups(content: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.currentNode;
    const offset = parser.typescriptLexer.reader.currentOffset;

    Assert.isUndefined(parser.tryParseTypeArgumentExpressionSuffix());
    Assert.areEqual(node, parser.currentNode);
    Assert.areEqual(offset, parser.typescriptLexer.reader.currentOffset);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
    Assert.areEqual(0, parser.context.unclosedTypeArgumentOffsets.size);
  }

  @TestMethod
  public parsesNestedTypeArgumentsOneGreaterThanAtATime(): void {
    const parser = TypeScriptParserFixture.create("Outer<Inner<Value>, Other>");
    const node = parser.parseType();

    Assert.isInstanceOf(node, TypeScriptTypeReferenceNode);
    Assert.isDefined(node.typeArgumentListNode);
    Assert.areEqual(2, node.typeArgumentListNode.children.length);
    const innerNode = node.typeArgumentListNode.children[0];
    Assert.isInstanceOf(innerNode, TypeScriptTypeReferenceNode);
    Assert.isDefined(innerNode.typeArgumentListNode);
    Assert.areEqual(1, innerNode.typeArgumentListNode.children.length);
    Assert.isTrue(parser.isEndOfFile);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public reLexesShiftLeftAsTwoGenericOpeners(): void {
    const parser = TypeScriptParserFixture.create("Factory<<Value>() => Value>");
    const node = parser.parseType();

    Assert.isInstanceOf(node, TypeScriptTypeReferenceNode);
    Assert.isDefined(node.typeArgumentListNode);
    Assert.isInstanceOf(node.typeArgumentListNode.children[0], TypeScriptFunctionTypeNode);
    Assert.isTrue(parser.isEndOfFile);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public reportsAMissingClosingGreaterThan(): void {
    const parser = TypeScriptParserFixture.create("Outer<Value");
    const node = parser.parseType();

    Assert.isInstanceOf(node, TypeScriptTypeReferenceNode);
    Assert.isDefined(node.typeArgumentListNode);
    Assert.isUndefined(node.typeArgumentListNode.greaterThanNode);
    Assert.areEqual("TS1005", parser.context.diagnosticCollector.diagnostics[0]?.code.displayText);
    Assert.areEqual("'>' expected.", parser.context.diagnosticCollector.diagnostics[0]?.message.text);
  }

  @TestMethod
  public preservesATrailingCommaWhenTheCloserIsMissing(): void {
    const parser = TypeScriptParserFixture.create("Outer<Value,");
    const node = parser.parseType();

    Assert.isInstanceOf(node, TypeScriptTypeReferenceNode);
    Assert.isDefined(node.typeArgumentListNode);
    Assert.areEqual(1, node.typeArgumentListNode.commaNodes.length);
    Assert.isUndefined(node.typeArgumentListNode.greaterThanNode);
    Assert.areEqual(node.typeArgumentListNode.commaNodes[0]?.span.endOffset, node.typeArgumentListNode.span.endOffset);
  }

  @TestData("let v: A<#x>;", "TS1005:#x,TS1005:>,TS1109:;")
  @TestData("let v: A<#x, B>;", "TS1005:#x,TS1005:>,TS1109:;")
  @TestData("type T = A<#x>;", "TS1005:#x,TS1109:;")
  @TestData("let v: A<B, #x>;", "TS1005:#x,TS1005:>,TS1109:;")
  @TestData("f<#x>();", "TS1109:)")
  @TestData("let v: A<)>;", "TS1005:),TS1134:>,TS1109:;")
  @TestData("let v: A<@x>;", "TS1005:@,TS1146:,TS1109:;")
  @TestData("let v: A<;>;", "TS1005:;,TS1109:>,TS1109:;")
  @TestData("let v: A<B C>;", "TS1005:C,TS1005:>,TS1109:;")
  @TestData("let v: A<...B>;", "TS1110:...,TS1005:>,TS1109:;")
  @TestData("let v: A<, B>;", "TS1110:,")
  @TestData("type T = A<{ ) }>;", "TS1131:),TS1128:},TS1109:>,TS1109:;")
  @TestData("class C extends B<{ ) }> {}", "TS1131:),TS1109:},TS1109:>")
  @TestData("interface I extends A<{ ) }> {}", "TS1131:),TS1109:},TS1109:>")
  @TestMethod
  public endsAtTheFirstTokenThatStartsNoArgument(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectText(content, result.diagnostics));
  }

  @TestData("type A = B<<T>() => void>;", "")
  @TestData("type A = import(\"m\")<<T>() => void>;", "")
  @TestData("let a: typeof x.y<<T>() => void>;", "TS1005@17:2 ',' expected.")
  @TestData("type A = typeof x<<T>;", "TS1005@17:2 ';' expected.|TS1109@21:1 Expression expected.")
  @TestData("class C extends A<<T>(x: T) => T> {}",
    "TS1005@17:2 ',' expected.|TS1005@23:1 ')' expected.|TS1434@25:1 Unexpected keyword or identifier.|TS1128@26:1 Declaration or statement expected.|TS1128@28:2 Declaration or statement expected.")
  @TestData("interface I extends A<<T>() => void> {}",
    "TS1005@21:2 ',' expected.|TS1109@26:1 Expression expected.|TS1005@28:2 ';' expected.|TS1109@35:1 Expression expected.")
  @TestMethod
  public readsShiftLeftAsAnOpenerOnlyWhereATypeReferenceReadsIt(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
  }

  @TestData("function* g() { interface I extends A<yield> {} }", "TS1005@38:5 '>' expected.|TS1109@43:1 Expression expected.")
  @TestData("function* g() { class C extends A<yield> {} }", "TS1005@34:5 '>' expected.|TS1109@39:1 Expression expected.")
  @TestData("function* g() { f<yield>(); }", "TS1109@18:5 Expression expected.|TS1109@23:1 Expression expected.|TS1109@25:1 Expression expected.")
  @TestData("async function f() { f<await>(); }", "TS1109@28:1 Expression expected.|TS1109@30:1 Expression expected.")
  @TestMethod
  public beginsNoArgumentAtANameItsContextReserves(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
  }
}
