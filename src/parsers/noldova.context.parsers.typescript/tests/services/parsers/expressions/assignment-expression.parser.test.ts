/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  TypeScriptAsteriskNode,
  TypeScriptBinaryExpressionNode,
  TypeScriptBlockNode,
  TypeScriptCallExpressionNode,
  TypeScriptCaseClauseNode,
  TypeScriptConditionalExpressionNode,
  TypeScriptDefaultClauseNode,
  TypeScriptExpressionStatementNode,
  TypeScriptFunctionExpressionNode,
  TypeScriptIdentifierNode,
  TypeScriptInKeywordNode,
  TypeScriptParser,
  TypeScriptPlusNode,
  TypeScriptPlusPlusNode,
  TypeScriptPostfixUnaryExpressionNode,
  TypeScriptPropertyAccessExpressionNode,
  TypeScriptSwitchStatementNode,
  TypeScriptYieldExpressionNode
} from "@noldova/context.parsers.typescript";
import { TypeScriptContextFlags } from "@noldova/context.parsers.typescript/enums/typescript-context-flags.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";
import { TypeScriptSyntaxParserProbe } from "../../../fixtures/typescript-syntax-parser-probe.js";

@TestClass
export class AssignmentExpressionParserTests {
  @TestData("value", "")
  @TestData("value.field", "")
  @TestData("value[index]", "")
  @TestData("call()", "TS2364")
  @TestData("1", "TS2364")
  @TestData("[]", "")
  @TestData("value?.field", "TS2779")
  @TestData("(left + right)", "TS2364")
  @TestMethod
  public acceptsEveryLeftHandSideGrammarFormAndReadsWhetherItIsAReference(left: string, expected: string): void {
    const parser = TypeScriptParserFixture.create(left + " = right;");
    const node = parser.parseAssignmentExpression();
    Assert.isInstanceOf(node, TypeScriptBinaryExpressionNode);
    Assert.isTrue(node.operatorNode.isTypeScriptAssignmentOperator());
    Assert.areEqual(left.length, node.leftNode.span.length);
    Assert.areEqual(expected, parser.context.diagnosticCollector.diagnostics.map(t => t.code.displayText).join(","));
  }

  @TestData("!value")
  @TestData("await value")
  @TestData("value as T")
  @TestData("value satisfies T")
  @TestData("left + right")
  @TestData("value++")
  @TestMethod
  public leavesAnAssignmentOperatorAfterANonLeftHandSideExpression(left: string): void {
    const parser = TypeScriptParserFixture.create(left + " = right;");
    const node = parser.parseAssignmentExpression();
    Assert.isFalse(node.isTypeScriptLeftHandSideExpression());
    Assert.isTrue(parser.currentNode.isTypeScriptAssignmentOperator());
    Assert.areEqual(left.length + 1, parser.currentNode.span.startOffset);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public preservesAssignmentsInsideConditionalBranchesAndRightAssociativity(): void {
    const parser = TypeScriptParserFixture.create("condition ? first = a : second = b = c;");
    const node = parser.parseAssignmentExpression();
    Assert.isInstanceOf(node, TypeScriptConditionalExpressionNode);
    Assert.isInstanceOf(node.trueExpressionNode, TypeScriptBinaryExpressionNode);
    Assert.isInstanceOf(node.falseExpressionNode, TypeScriptBinaryExpressionNode);
    Assert.isInstanceOf(node.falseExpressionNode.rightNode, TypeScriptBinaryExpressionNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public keepsAwaitedElementAccessOutOfTheResourceDeclarationAndAssignmentProductions(): void {
    const result = TypeScriptParser.parse("await using [x]=r;");
    Assert.areEqual(2, result.rootNode.children.length);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS1005", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(15, result.diagnostics[0]?.location?.start);
    Assert.areEqual("';' expected.", result.diagnostics[0]?.message.text);
  }

  @TestMethod
  public closesAFunctionInitializerAroundADefaultOutsideASwitch(): void {
    const result = TypeScriptParser.parse("value = function(){ default: }");
    const statement = result.rootNode.children[0];

    Assert.areEqual(1, result.rootNode.children.length);
    Assert.isInstanceOf(statement, TypeScriptExpressionStatementNode);
    Assert.isInstanceOf(statement.expressionNode, TypeScriptBinaryExpressionNode);
    Assert.isInstanceOf(statement.expressionNode.rightNode, TypeScriptFunctionExpressionNode);
    Assert.isInstanceOf(statement.expressionNode.rightNode.bodyNode, TypeScriptBlockNode);
    Assert.isDefined(statement.expressionNode.rightNode.bodyNode.closeBraceNode);
    Assert.areEqual("TS1128@20:7|TS1128@27:1", TypeScriptDiagnosticsFixture.project(result.diagnostics));
  }

  @TestMethod
  public leavesADefaultInAFunctionInitializerToTheEnclosingSwitch(): void {
    const result = TypeScriptParser.parse("switch (x) { case 1: value = function(){ default: } }");
    const statement = result.rootNode.children[0];

    Assert.isInstanceOf(statement, TypeScriptSwitchStatementNode);
    const [caseClause, defaultClause] = statement.caseBlockNode.children;
    Assert.isInstanceOf(caseClause, TypeScriptCaseClauseNode);
    const expressionStatement = caseClause.children[0];
    Assert.isInstanceOf(expressionStatement, TypeScriptExpressionStatementNode);
    Assert.isInstanceOf(expressionStatement.expressionNode, TypeScriptBinaryExpressionNode);
    Assert.isInstanceOf(expressionStatement.expressionNode.rightNode, TypeScriptFunctionExpressionNode);
    Assert.isInstanceOf(expressionStatement.expressionNode.rightNode.bodyNode, TypeScriptBlockNode);
    Assert.isUndefined(expressionStatement.expressionNode.rightNode.bodyNode.closeBraceNode);
    Assert.isInstanceOf(defaultClause, TypeScriptDefaultClauseNode);
    Assert.areEqual("TS1128@41:7|TS1128@52:1", TypeScriptDiagnosticsFixture.project(result.diagnostics));
  }

  @TestData("yield;", false, false, ";")
  @TestData("yield}", false, false, "}")
  @TestData("yield)", false, false, ")")
  @TestData("yield,", false, false, ",")
  @TestData("yield\nvalue;", false, false, "value")
  @TestData("yield\n* value;", false, false, "*")
  @TestData("yield /*\n*/ * value;", false, false, "*")
  @TestData("yield*\nvalue;", true, true, ";")
  @TestData("yield* /*\n*/ value;", true, true, ";")
  @TestData("yield value;", false, true, ";")
  @TestData("yield /a/;", false, true, ";")
  @TestData("yield (value);", false, true, ";")
  @TestData("yield [value];", false, true, ";")
  @TestData("yield {value};", false, true, ";")
  @TestData("yield +value;", false, true, ";")
  @TestData("yield 1;", false, true, ";")
  @TestData("yield 1n;", false, true, ";")
  @TestData("yield 'text';", false, true, ";")
  @TestData("yield this;", false, true, ";")
  @TestData("yield super.value;", false, true, ";")
  @TestData("yield new Value();", false, true, ";")
  @TestData("yield true;", false, true, ";")
  @TestData("yield false;", false, true, ";")
  @TestData("yield null;", false, true, ";")
  @TestData("yield typeof value;", false, true, ";")
  @TestData("yield delete value.field;", false, true, ";")
  @TestData("yield void value;", false, true, ";")
  @TestData("yield function() {};", false, true, ";")
  @TestData("yield class {};", false, true, ";")
  @TestMethod
  public respectsYieldOperandsAndLineTerminatorBoundaries(content: string, isDelegated: boolean, hasOperand: boolean, nextText: string): void {
    const parser = TypeScriptParserFixture.create(content, TypeScriptContextFlags.Yield);
    const node = parser.parseAssignmentExpression();

    Assert.isInstanceOf(node, TypeScriptYieldExpressionNode);
    Assert.areEqual(isDelegated, !Object.isUndefined(node.asteriskNode));
    Assert.areEqual(hasOperand, !Object.isUndefined(node.expressionNode));
    Assert.areEqual(nextText, parser.typescriptLexer.reader.source.getText(parser.currentNode.span));
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestData("yield")
  @TestData("yield + 1")
  @TestData("yield * value")
  @TestData("yield(value)")
  @TestData("yield\nvalue")
  @TestMethod
  public doesNotTreatOrdinaryIdentifierUsesAsYieldExpressions(content: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseAssignmentExpression();

    Assert.isFalse(node instanceof TypeScriptYieldExpressionNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestData("(value)")
  @TestData("async(value)")
  @TestMethod
  public retainsTheParsedExpressionThroughSuffixesOperatorsAndAConditional(prefix: string): void {
    const content = " /* leading */ " + prefix + "(argument).property++ + other * last ? whenTrue : whenFalse";
    const parser = new TypeScriptSyntaxParserProbe(content);
    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptConditionalExpressionNode);
    Assert.isInstanceOf(node.conditionNode, TypeScriptBinaryExpressionNode);
    Assert.isInstanceOf(node.conditionNode.operatorNode, TypeScriptPlusNode);
    Assert.isInstanceOf(node.conditionNode.rightNode, TypeScriptBinaryExpressionNode);
    Assert.isInstanceOf(node.conditionNode.rightNode.operatorNode, TypeScriptAsteriskNode);
    Assert.isInstanceOf(node.conditionNode.leftNode, TypeScriptPostfixUnaryExpressionNode);
    Assert.isInstanceOf(node.conditionNode.leftNode.operandNode, TypeScriptPropertyAccessExpressionNode);
    Assert.isInstanceOf(node.conditionNode.leftNode.operandNode.expressionNode, TypeScriptCallExpressionNode);
    const callNode = node.conditionNode.leftNode.operandNode.expressionNode;
    const initialExpressionNode = parser.parsedExpressionNodes[0];
    Assert.isDefined(initialExpressionNode);
    Assert.areEqual(initialExpressionNode, callNode.expressionNode);
    Assert.areEqual(initialExpressionNode.leadingTrivia, node.leadingTrivia);
    Assert.isDefined(node.leadingTrivia);
    Assert.isInstanceOf(node.trueExpressionNode, TypeScriptIdentifierNode);
    Assert.isInstanceOf(node.falseExpressionNode, TypeScriptIdentifierNode);
    Assert.areEqual("whenTrue", node.trueExpressionNode.value);
    Assert.areEqual("whenFalse", node.falseExpressionNode.value);
    Assert.areEqual(content.length, node.span.endOffset);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
    Assert.isTrue(parser.isEndOfFile);
  }

  @TestData("value")
  @TestData("(value)")
  @TestData("async(value)")
  @TestData("(value in inner)")
  @TestMethod
  public appliesTheInBoundaryToNewAndContinuedExpressions(prefix: string): void {
    const content = prefix + " in collection";
    const restrictedParser = TypeScriptParserFixture.create(content);
    const restrictedNode = restrictedParser.parseExpressionWithoutIn();

    Assert.areEqual(prefix, content.slice(restrictedNode.span.startOffset, restrictedNode.span.endOffset));
    Assert.isInstanceOf(restrictedParser.currentNode, TypeScriptInKeywordNode);
    Assert.areEqual(0, restrictedParser.context.diagnosticCollector.diagnostics.length);

    const unrestrictedParser = TypeScriptParserFixture.create(content);
    const unrestrictedNode = unrestrictedParser.parseExpression();

    Assert.isInstanceOf(unrestrictedNode, TypeScriptBinaryExpressionNode);
    Assert.isInstanceOf(unrestrictedNode.operatorNode, TypeScriptInKeywordNode);
    Assert.isInstanceOf(unrestrictedNode.rightNode, TypeScriptIdentifierNode);
    Assert.areEqual("collection", unrestrictedNode.rightNode.value);
    Assert.areEqual(0, unrestrictedParser.context.diagnosticCollector.diagnostics.length);
    Assert.isTrue(unrestrictedParser.isEndOfFile);
  }

  @TestData("(value)", "\n")
  @TestData("(value)", " /*\n*/ ")
  @TestData("async(value)", "\n")
  @TestData("async(value)", " /*\n*/ ")
  @TestMethod
  public leavesAPostfixOperatorAfterALineBreak(prefix: string, separator: string): void {
    const parser = TypeScriptParserFixture.create(prefix + separator + "++other");
    const node = parser.parseExpression();

    Assert.areEqual(prefix.length, node.span.endOffset);
    Assert.isFalse(node instanceof TypeScriptPostfixUnaryExpressionNode);
    Assert.isInstanceOf(parser.currentNode, TypeScriptPlusPlusNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestData("=")
  @TestData("+=")
  @TestData("-=")
  @TestData("**=")
  @TestData("*=")
  @TestData("/=")
  @TestData("%=")
  @TestData("&=")
  @TestData("|=")
  @TestData("^=")
  @TestData("<<=")
  @TestData(">>=")
  @TestData(">>>=")
  @TestData("&&=")
  @TestData("||=")
  @TestData("??=")
  @TestMethod
  public parsesEveryAssignmentOperator(operator: string): void {
    const parser = TypeScriptParserFixture.create(`left ${operator} right`);
    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptBinaryExpressionNode);
    Assert.areEqual(operator, parser.typescriptLexer.reader.source.getText(node.operatorNode.span));
    Assert.isInstanceOf(node.rightNode, TypeScriptIdentifierNode);
    Assert.isTrue(parser.isEndOfFile);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public parsesRightAssociativeAndYieldExpressions(): void {
    const assignmentNode = TypeScriptParserFixture.create("first = second = third").parseExpression();
    const yieldNode = TypeScriptParserFixture.create("yield value").parseExpression();
    const delegatedNode = TypeScriptParserFixture.create("yield* value", TypeScriptContextFlags.Yield).parseExpression();

    Assert.isInstanceOf(assignmentNode, TypeScriptBinaryExpressionNode);
    Assert.isInstanceOf(assignmentNode.rightNode, TypeScriptBinaryExpressionNode);
    Assert.isInstanceOf(yieldNode, TypeScriptYieldExpressionNode);
    Assert.isDefined(yieldNode.expressionNode);
    Assert.isInstanceOf(delegatedNode, TypeScriptYieldExpressionNode);
    Assert.isDefined(delegatedNode.asteriskNode);
  }

  @TestData("f() = 1; 1 = 2; (x) = 1; x?.y = 1; x?.[0] = 1; [f()] = x; ({ a: g() } = x); ({ ...h() } = x); [...k()] = x;", "TS2364:f(),TS2364:1,TS2779:x?.y,TS2779:x?.[0],TS2364:f(),TS2364:g(),TS2701:h(),TS2364:k()")
  @TestData("(<any>x) = 1; x! = 1; this = 1; f() += 1; x?.y += 1; [x?.y] = a; ({...x?.y} = a); new C() = 1; [[f()]] = x; ({ a: { b: g() } } = x);", "TS2364:this,TS2364:f(),TS2779:x?.y,TS2779:x?.y,TS2778:x?.y,TS2364:new C(),TS2364:f(),TS2364:g()")
  @TestData("[a = f()] = x; [(f())] = x; (x as any) = 1; (x satisfies any) = 1; ({ a: (g()) } = x); [...[f()]] = x; ({ ...(h()) } = x); [x?.y = 1] = a; [a + b] = x; ({ a, b = 1 } = x); [, c] = x; x?.y! = 1; let = 1; async = 2; undefined = 3; x?.y!.z = 1;", "TS2364:(f()),TS2364:(g()),TS2364:f(),TS2701:(h()),TS2779:x?.y,TS2364:a + b,TS2779:x?.y!,TS1212:let,TS2779:x?.y!.z")
  @TestData("({...{}} = {}); ({...({})} = {}); ({...[]} = {}); ({...([])} = {});", "TS2501:{},TS2501:({}),TS2701:({}),TS2501:[],TS2501:([]),TS2701:([])")
  @TestData("\"use strict\"; f() = 1; class C { m() { f() = 1; } } declare namespace N { f() = 1; }", "TS2364:f(),TS2364:f(),TS1036:f,TS2364:f()")
  @TestMethod
  public refusesAnAssignmentTargetThatIsNoReference(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectText(content, result.diagnostics));
  }

  @TestData("[...x = a] = a; [a, ...b = 1] = c; ({...d = 1} = e); [...x = a, y] = a;", "TS1186:=,TS1186:=")
  @TestMethod
  public refusesADefaultOnARestElementTakenApart(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectText(content, result.diagnostics));
  }

  @TestData("declare const x: any; function* g() { for (var k = yield 1 in x) {} }", "TS1189@47:1")
  @TestData("declare const x: any; function* g() { for (yield 1 in x;;) {} }", "TS1005@55:1|TS1128@57:1")
  @TestData("declare const x: any, a: any, b: any; function* g() { for (var k = yield in x) {} }", "TS1189@63:1")
  @TestData("declare const x: any, a: any, b: any; function* g() { for (var k = yield* a in x) {} }", "TS1189@63:1")
  @TestData("declare const x: any, a: any, b: any; async function g() { for (var k = await a in x) {} }", "TS1189@68:1")
  @TestData("declare const x: any, a: any, b: any; for (var k = a = a in b;;) {}", "TS1005@61:1|TS1128@63:1")
  @TestData("declare const x: any, a: any, b: any; for (var k = function* () { yield in x; };;) {}", "TS1005@72:2|TS1005@76:1|TS1128@78:1|TS1128@81:1")
  @TestMethod
  public holdsTheInRestrictionThroughAYieldOperandAndAnAssignedValue(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }
}
