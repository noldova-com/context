/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Source, SourceReader, SourceSpan, ValueNode } from "@noldova/context.parsers";
import {
  TypeScriptBinaryExpressionNode,
  TypeScriptExpressionStatementNode,
  TypeScriptIdentifierNode,
  TypeScriptMissingExpressionNode,
  TypeScriptMissingIdentifierNode,
  TypeScriptNode,
  TypeScriptParser,
  TypeScriptSemicolonNode
} from "@noldova/context.parsers.typescript";
import { TypeScriptAssociativity } from "@noldova/context.parsers.typescript/enums/typescript-associativity.js";
import { TypeScriptContextFlags } from "@noldova/context.parsers.typescript/enums/typescript-context-flags.js";
import { TypeScriptListKind } from "@noldova/context.parsers.typescript/enums/typescript-list-kind.js";
import { TypeScriptOperatorPrecedence } from "@noldova/context.parsers.typescript/enums/typescript-operator-precedence.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { ForeignLiteralNode } from "../../fixtures/foreign-literal.node.js";
import { TypeScriptDiagnosticsFixture } from "../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../fixtures/typescript-parser.fixture.js";

@TestClass
export class NodeExtensionsTests {
  @TestMethod
  public defaultsToNoLocalGrammarDiagnosticForUnclassifiedNodes(): void {
    const parser = TypeScriptParserFixture.create("value");
    const node = parser.currentNode;
    node.validateTypeScriptGrammar(parser.context);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
    Assert.areEqual(node.span, node.getTypeScriptMissingNodeDiagnosticSpan());
  }

  @TestData("value", true)
  @TestData("using", true)
  @TestData("yield", true)
  @TestData("1", true)
  @TestData("1n", true)
  @TestData("'value'", true)
  @TestData("`value`", true)
  @TestData("true", true)
  @TestData("false", true)
  @TestData("null", true)
  @TestData("this", true)
  @TestData("[]", true)
  @TestData("{}", true)
  @TestData("tag`value`", true)
  @TestData("!value", false)
  @TestData("++value", false)
  @TestData("value++", false)
  @TestData("await value", false)
  @TestData("typeof value", false)
  @TestData("void value", false)
  @TestData("delete value.field", false)
  @TestData("value + other", false)
  @TestData("value as T", false)
  @TestData("value satisfies T", false)
  @TestData("<T>value", false)
  @TestData("condition ? left : right", false)
  @TestData("() => value", false)
  @TestMethod
  public classifiesLeftHandSideGrammarWithoutCheckingWritability(content: string, expected: boolean): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseExpression();
    Assert.areEqual(expected, node.isTypeScriptLeftHandSideExpression());
    Assert.isTrue(parser.isEndOfFile);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestData("value", "value")
  @TestData("((value as T)! satisfies T)", "value")
  @TestData("<T>(<U>value)!!", "value")
  @TestData("(value.field as T)", "value.field")
  @TestData("( )", "")
  @TestData("(value, other)", "value, other")
  @TestMethod
  public skipsTheOuterExpressionsWrittenAroundAnExpression(content: string, expected: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseExpression().skipTypeScriptOuterExpressions();
    Assert.areEqual(expected, content.slice(node.span.startOffset, node.span.endOffset));
  }

  @TestData("value.field", false)
  @TestData("value?.field", true)
  @TestData("value?.field.other[key]()!", true)
  @TestData("value()?.[key]!.field", true)
  @TestData("value[key]?.()", true)
  @TestData("(value?.field).other", false)
  @TestData("value?.field`x`", false)
  @TestData("value", false)
  @TestMethod
  public readsAChainAsOptionalFromItsFirstQuestionDot(content: string, expected: boolean): void {
    const parser = TypeScriptParserFixture.create(content);
    Assert.areEqual(expected, parser.parseExpression().isTypeScriptOptionalChain());
  }

  @TestData("value.field()[key]!`x` as T satisfies U", "value")
  @TestData("value + other * last", "value")
  @TestData("value<T>", "value")
  @TestData("value++", "value")
  @TestData("condition ? left : right", "condition")
  @TestData("(value).field", "(")
  @TestData("await value.field", "await")
  @TestData("value", "value")
  @TestMethod
  public namesTheFirstTokenAChainIsWrittenWith(content: string, expected: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const span = parser.parseExpression().getTypeScriptFirstTokenSpan();
    Assert.areEqual(expected, content.slice(span.startOffset, span.endOffset));
  }

  @TestMethod
  public classifiesAYieldExpressionAsNoLeftHandSideOutsideAGenerator(): void {
    const parser = TypeScriptParserFixture.create("yield value");
    const node = parser.parseExpression();
    Assert.isFalse(node.isTypeScriptLeftHandSideExpression());
    Assert.isTrue(parser.isEndOfFile);
    Assert.areEqual("TS1163", parser.context.diagnosticCollector.diagnostics.map(t => t.code.displayText).join(","));
  }

  @TestMethod
  public classifiesAPrivateNameAsALeftHandSideOutsideAClassBody(): void {
    const parser = TypeScriptParserFixture.create("#field");
    const node = parser.parseExpression();

    Assert.isTrue(node.isTypeScriptLeftHandSideExpression());
    Assert.isTrue(parser.isEndOfFile);
    Assert.areEqual(1, parser.context.diagnosticCollector.diagnostics.length);
    Assert.areEqual("TS18016", parser.context.diagnosticCollector.diagnostics[0]?.code.displayText);
  }

  @TestData(";", true)
  @TestData("value", true)
  @TestData("* value", true)
  @TestData("var value", true)
  @TestData("class C {}", true)
  @TestData("function f(){}", true)
  @TestData("let value", true)
  @TestData("{", true)
  @TestData(".", false)
  @TestData("=", false)
  @TestData(")", false)
  @TestMethod
  public classifiesStatementRecoveryStartsWithoutConsumingTheToken(content: string, expected: boolean): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.currentNode;
    Assert.areEqual(expected, node.canStartTypeScriptStatement(parser));
    Assert.areEqual(node, parser.currentNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestData("value;")
  @TestData("1 + 2;")
  @TestData("async(value);")
  @TestMethod
  public defaultStatementDispatchParsesAnExpression(content: string): void {
    const parser = TypeScriptParserFixture.create(content);

    const node = parser.currentNode.parseTypeScriptStatement(parser);

    Assert.isInstanceOf(node, TypeScriptExpressionStatementNode);
    Assert.areEqual(content.length, node.span.endOffset);
    Assert.isTrue(parser.isEndOfFile);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestData("value++")
  @TestData("value")
  @TestMethod
  public defaultUnaryDispatchPreservesPostfixBehavior(content: string): void {
    const parser = TypeScriptParserFixture.create(content);

    const node = parser.currentNode.parseTypeScriptUnaryExpression(parser);

    Assert.areEqual(content.length, node.span.endOffset);
    Assert.isTrue(parser.isEndOfFile);
    Assert.isFalse(node.isTypeScriptAwaitExpressionStart(parser));
    Assert.isFalse(node.isTypeScriptPrefixUnaryOperator());
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestData("let")
  @TestData("private")
  @TestData("protected")
  @TestData("public")
  @TestData("static")
  @TestData("implements")
  @TestData("interface")
  @TestData("package")
  @TestData("yield")
  @TestMethod
  public acceptsFutureReservedWordsAsBindingNames(content: string): void {
    const parser = TypeScriptParserFixture.create(content);

    Assert.isTrue(parser.currentNode.isTypeScriptBindingIdentifier());
  }

  @TestData("<")
  @TestData("/=")
  @TestData("#private")
  @TestMethod
  public recognizesContextualExpressionOpeners(content: string): void {
    const parser = TypeScriptParserFixture.create(content);

    Assert.isTrue(parser.currentNode.canStartTypeScriptExpression(parser));
  }

  @TestMethod
  public doesNotInferLineBreaksFromUnrelatedNodes(): void {
    const node = new TypeScriptNode([], new SourceSpan(0, 0));

    Assert.isFalse(node.containsTypeScriptLineBreak());
  }

  @TestData("<", true, true)
  @TestData("<<", false, true)
  @TestData("(", true, false)
  @TestData(">>", false, false)
  @TestMethod
  public keepsSignatureAndGenericStartsDistinct(content: string, canStartSignature: boolean, canStartGenericList: boolean): void {
    const node = TypeScriptParserFixture.create(content).currentNode;

    Assert.areEqual(canStartSignature, node.canStartTypeScriptSignature());
    Assert.areEqual(canStartGenericList, node.canStartTypeScriptGenericList());
  }

  @TestData("value", true)
  @TestData("42", true)
  @TestData("[", true)
  @TestData("{", true)
  @TestData("*", true)
  @TestData("(", false)
  @TestData("<", false)
  @TestData(":", false)
  @TestData("...", true)
  @TestMethod
  public readsWhatMayFollowAModifier(content: string, expected: boolean): void {
    const node = TypeScriptParserFixture.create(content).currentNode;

    Assert.areEqual(expected, node.canFollowTypeScriptModifier());
  }

  @TestData("const", true)
  @TestData("let", true)
  @TestData("var", true)
  @TestData("using", true)
  @TestData("in", false)
  @TestMethod
  public readsConstLetVarAndUsingAsVariableDeclarationKeywords(content: string, expected: boolean): void {
    const node = TypeScriptParserFixture.create(content).currentNode;

    Assert.areEqual(expected, node.isTypeScriptVariableDeclarationKeyword());
  }

  @TestData("const a = 1;", true)
  @TestData("var a;", true)
  @TestData("using;", false)
  @TestData("value;", false)
  @TestMethod
  public defaultDeclarationRecognitionPreservesTheCurrentToken(content: string, isVariableStatement: boolean): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.currentNode;
    const offset = parser.typescriptLexer.reader.currentOffset;

    Assert.isFalse(node.isTypeScriptTypeAliasStart(parser));
    Assert.areEqual(isVariableStatement, node.isTypeScriptVariableStatementStart(parser));
    Assert.areEqual(node, parser.currentNode);
    Assert.areEqual(offset, parser.typescriptLexer.reader.currentOffset);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public doesNotAssignTypeScriptBoundariesToOtherNodes(): void {
    const node = new ForeignLiteralNode("value", new SourceSpan(0, 5));

    Assert.isFalse(node.isTypeScriptClosingDelimiter());
    Assert.isUndefined(node.getTypeScriptClosingDelimiterType());
    Assert.isUndefined(node.toTypeScriptBindingName());
    Assert.isFalse(node.canStartTypeScriptBindingName());
    Assert.isUndefined(node.toTypeScriptBindingElement());
    Assert.isUndefined(node.toTypeScriptParameter());
  }

  @TestMethod
  public doesNotAssignOperatorBehaviorToOtherNodes(): void {
    const node = new ForeignLiteralNode("value", new SourceSpan(0, 5));

    Assert.areEqual(TypeScriptOperatorPrecedence.None, node.getTypeScriptPrecedence());
    Assert.areEqual(TypeScriptAssociativity.None, node.getTypeScriptAssociativity());
  }

  @TestMethod
  public rejectsUnrelatedNodesForEveryTokenClassification(): void {
    const node = new ForeignLiteralNode("value", new SourceSpan(0, 5));

    Assert.isFalse(node.isTypeScriptParameterModifier());
    Assert.isFalse(node.isTypeScriptClassMemberModifier());
    Assert.isFalse(node.isTypeScriptTypeParameterModifier());
    Assert.isFalse(node.isTypeScriptTypeMemberModifier());
    Assert.isFalse(node.isTypeScriptVariableDeclarationKeyword());
    Assert.isFalse(node.canStartTypeScriptSignature());
    Assert.isFalse(node.canStartTypeScriptGenericList());
    Assert.isFalse(node.isTypeScriptUpdateOperator());
    Assert.isFalse(node.canFollowTypeScriptModifier());
    Assert.isFalse(node.isTypeScriptLogicalOperator());
    Assert.isUndefined(node.getTypeScriptLogicalOperatorNode());
    Assert.isFalse(node.isTypeScriptOptionalParameter());
    Assert.isFalse(node.canFollowTypeScriptOptionalParameterMarker());
    Assert.isFalse(node.isTypeScriptFunctionTypeParameterIndicator());
    Assert.isFalse(node.isTypeScriptIndexSignatureParameterIndicator(TypeScriptParserFixture.create("value")));
    Assert.isFalse(node.isTypeScriptAssignmentOperator());
    Assert.isFalse(node.isTypeScriptPrefixUnaryOperator());
    Assert.isFalse(node.isTypeScriptPredefinedTypeKeyword());
    Assert.isFalse(node.isTypeScriptLiteralTypeToken());
    Assert.isFalse(node.isTypeScriptTemplateStart());
    Assert.isFalse(node.canStartTypeScriptPropertyName());
    Assert.isFalse(node.isTypeScriptAccessName());
    Assert.isFalse(node.isTypeScriptBindingIdentifier());
    Assert.isFalse(node.isTypeScriptTypeOperator());
  }

  @TestMethod
  public doesNotClassifyEveryKeywordAsAModifierOrIdentifier(): void {
    const node = TypeScriptParserFixture.create("if").currentNode;

    Assert.isTrue(node.canStartTypeScriptPropertyName());
    Assert.isTrue(node.isTypeScriptAccessName());
    Assert.isFalse(node.isTypeScriptBindingIdentifier());
    Assert.isFalse(node.isTypeScriptParameterModifier());
    Assert.isFalse(node.isTypeScriptClassMemberModifier());
    Assert.isFalse(node.isTypeScriptTypeParameterModifier());
    Assert.isFalse(node.isTypeScriptTypeMemberModifier());
  }

  @TestMethod
  public distinguishesPrefixAssignmentAndBinaryOperators(): void {
    const plusNode = TypeScriptParserFixture.create("+").currentNode;
    const assignmentNode = TypeScriptParserFixture.create("+=").currentNode;
    const multiplyNode = TypeScriptParserFixture.create("*").currentNode;

    Assert.isTrue(plusNode.isTypeScriptPrefixUnaryOperator());
    Assert.isFalse(plusNode.isTypeScriptAssignmentOperator());
    Assert.isTrue(assignmentNode.isTypeScriptAssignmentOperator());
    Assert.isFalse(assignmentNode.isTypeScriptPrefixUnaryOperator());
    Assert.isFalse(multiplyNode.isTypeScriptAssignmentOperator());
    Assert.isFalse(multiplyNode.isTypeScriptPrefixUnaryOperator());
  }

  @TestData("let")
  @TestData("private")
  @TestData("undefined")
  @TestMethod
  public consumesIdentifierKeywordsWithoutReclassifyingTheirNode(content: string): void {
    const parser = TypeScriptParserFixture.create(content + ";");
    const node = parser.currentNode;

    Assert.areEqual(node, node.parseTypeScriptPrimaryExpression(parser));
    Assert.isInstanceOf(parser.currentNode, TypeScriptSemicolonNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestData("await", TypeScriptContextFlags.None, true)
  @TestData("await", TypeScriptContextFlags.Await, false)
  @TestData("yield", TypeScriptContextFlags.None, true)
  @TestData("yield", TypeScriptContextFlags.Yield, false)
  @TestMethod
  public preservesContextualIdentifierRestrictions(content: string, flags: TypeScriptContextFlags, isIdentifier: boolean): void {
    const parser = TypeScriptParserFixture.create(content + ";", flags);
    const node = parser.currentNode;

    const expressionNode = node.parseTypeScriptPrimaryExpression(parser);

    if (isIdentifier) {
      Assert.areEqual(node, expressionNode);
      Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
      Assert.isInstanceOf(parser.currentNode, TypeScriptSemicolonNode);
    }
    else {
      Assert.isInstanceOf(expressionNode, TypeScriptMissingExpressionNode);
      Assert.isUndefined(expressionNode.unexpectedNode);
      Assert.areEqual(0, expressionNode.span.length);
      Assert.areEqual(node, parser.currentNode);
      Assert.areEqual("TS1109", parser.context.diagnosticCollector.diagnostics[0]?.code.displayText);
    }
  }

  @TestData("return")
  @TestData("?")
  @TestMethod
  public recoversFromAnUnexpectedPrimaryToken(content: string): void {
    const parser = TypeScriptParserFixture.create(" /*leading*/ " + content + ";");
    const node = parser.currentNode;

    const expressionNode = node.parseTypeScriptPrimaryExpression(parser);

    Assert.isInstanceOf(expressionNode, TypeScriptMissingExpressionNode);
    Assert.isUndefined(expressionNode.unexpectedNode);
    Assert.isUndefined(expressionNode.leadingTrivia);
    Assert.areEqual(0, expressionNode.span.startOffset);
    Assert.areEqual(0, expressionNode.span.length);
    Assert.areEqual(node, parser.currentNode);
    Assert.areEqual("TS1109", parser.context.diagnosticCollector.diagnostics[0]?.code.displayText);
  }

  @TestData("*", "TS1109@0:1 Expression expected.")
  @TestData("%", "TS1109@0:1 Expression expected.")
  @TestData("**", "TS1109@0:2 Expression expected.")
  @TestData("&", "TS1109@0:1 Expression expected.")
  @TestData("|", "TS1109@0:1 Expression expected.")
  @TestData("^", "TS1109@0:1 Expression expected.")
  @TestData("&&", "TS1109@0:2 Expression expected.")
  @TestData("||", "TS1109@0:2 Expression expected.")
  @TestData("??", "TS1109@0:2 Expression expected.")
  @TestData("==", "TS1109@0:2 Expression expected.")
  @TestData("===", "TS1109@0:3 Expression expected.")
  @TestData("!=", "TS1109@0:2 Expression expected.")
  @TestData("!==", "TS1109@0:3 Expression expected.")
  @TestData(">", "TS1109@0:1 Expression expected.")
  @TestData(">=", "TS1109@0:1 Expression expected.")
  @TestData("<<", "TS1109@0:2 Expression expected.")
  @TestData(">>", "TS1109@0:1 Expression expected.")
  @TestData(">>>", "TS1109@0:1 Expression expected.")
  @TestData("in", "TS1109@0:2 Expression expected.")
  @TestData("instanceof", "TS1109@0:10 Expression expected.")
  @TestMethod
  public leavesBinaryOperatorsForTheirEnclosingExpression(operator: string, expected: string): void {
    const result = TypeScriptParser.parse(`${operator} value;`);
    const statement = result.rootNode.children[0];

    Assert.areEqual(1, result.rootNode.children.length);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
    Assert.isInstanceOf(statement, TypeScriptExpressionStatementNode);
    Assert.isInstanceOf(statement.expressionNode, TypeScriptBinaryExpressionNode);
    Assert.isInstanceOf(statement.expressionNode.leftNode, TypeScriptMissingExpressionNode);
    Assert.isTrue(statement.expressionNode.leftNode.span.isEmpty);
    Assert.isUndefined(statement.expressionNode.leftNode.unexpectedNode);
    Assert.isInstanceOf(statement.expressionNode.operatorNode, ValueNode);
    Assert.areEqual(operator, statement.expressionNode.operatorNode.value);
    Assert.isInstanceOf(statement.expressionNode.rightNode, TypeScriptIdentifierNode);
    Assert.areEqual("value", statement.expressionNode.rightNode.value);
  }

  @TestMethod
  public rollsBackARescannedOperatorAndItsMissingOperandDiagnostic(): void {
    const parser = TypeScriptParserFixture.create(">>> value;");
    const first = parser.currentNode;
    parser.tryParse(() => {
      parser.parseExpression();
      Assert.areEqual("TS1109@0:1", TypeScriptDiagnosticsFixture.project(parser.context.diagnosticCollector.diagnostics));
      return undefined;
    });

    Assert.areEqual(first, parser.currentNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
    const expression = parser.parseExpression();
    Assert.isInstanceOf(expression, TypeScriptBinaryExpressionNode);
    Assert.isInstanceOf(expression.operatorNode, ValueNode);
    Assert.areEqual(">>>", expression.operatorNode.value);
    Assert.areEqual("TS1109@0:1", TypeScriptDiagnosticsFixture.project(parser.context.diagnosticCollector.diagnostics));
  }

  @TestMethod
  public preservesMissingOperandOffsetsAndTriviaInEmbeddedInput(): void {
    const content = " /*leading*/ >> value;";
    const source = new Source("prefix" + content + "suffix", "embedded.ts");
    const reader = new SourceReader(source, new SourceSpan(6, content.length));
    const result = new TypeScriptParser(reader).parse();
    const statement = result.rootNode.children[0];

    Assert.areEqual("TS1109@19:1", TypeScriptDiagnosticsFixture.project(result.diagnostics));
    Assert.isInstanceOf(statement, TypeScriptExpressionStatementNode);
    Assert.isInstanceOf(statement.expressionNode, TypeScriptBinaryExpressionNode);
    Assert.isInstanceOf(statement.expressionNode.leftNode, TypeScriptMissingExpressionNode);
    Assert.areEqual(6, statement.expressionNode.leftNode.span.startOffset);
    Assert.isTrue(statement.expressionNode.leftNode.span.isEmpty);
    Assert.areEqual(6, statement.span.startOffset);
    Assert.isDefined(statement.expressionNode.operatorNode.leadingTrivia);
    Assert.areEqual(6 + content.length, reader.currentOffset);
  }

  @TestMethod
  public namesADeclarationWithoutANameRuleOfItsOwnByItsWholeSpan(): void {
    const parser = TypeScriptParserFixture.create("interface I {}");
    const node = parser.parseStatement();

    Assert.areEqual(node.span, node.getTypeScriptDeclarationNameSpan(parser.context));
  }

  @TestMethod
  public reportsAMissingPrimaryAtEndWithoutAdvancing(): void {
    const parser = TypeScriptParserFixture.create(" /*leading*/ ");
    const node = parser.currentNode;
    const offset = parser.typescriptLexer.reader.currentOffset;

    const expressionNode = node.parseTypeScriptPrimaryExpression(parser);

    Assert.isInstanceOf(expressionNode, TypeScriptMissingExpressionNode);
    Assert.isUndefined(expressionNode.unexpectedNode);
    Assert.areEqual(node, parser.currentNode);
    Assert.areEqual(offset, parser.typescriptLexer.reader.currentOffset);
    Assert.isUndefined(expressionNode.leadingTrivia);
    Assert.areEqual(0, expressionNode.span.startOffset);
    Assert.areEqual("TS1109", parser.context.diagnosticCollector.diagnostics[0]?.code.displayText);
  }

  @TestData("if (x) y;", TypeScriptListKind.SourceElements, true)
  @TestData(")", TypeScriptListKind.SourceElements, false)
  @TestData(";", TypeScriptListKind.BlockStatements, false)
  @TestData("x", TypeScriptListKind.BlockStatements, true)
  @TestData("public x", TypeScriptListKind.SwitchClauseStatements, false)
  @TestData("public;", TypeScriptListKind.SwitchClauseStatements, true)
  @TestData("case", TypeScriptListKind.SwitchClauses, true)
  @TestData("x", TypeScriptListKind.SwitchClauses, false)
  @TestData("(", TypeScriptListKind.TypeMembers, true)
  @TestData("get", TypeScriptListKind.TypeMembers, true)
  @TestData("set", TypeScriptListKind.TypeMembers, true)
  @TestData("a: string", TypeScriptListKind.TypeMembers, true)
  @TestData("declare [", TypeScriptListKind.TypeMembers, true)
  @TestData("public", TypeScriptListKind.TypeMembers, true)
  @TestData("a b", TypeScriptListKind.TypeMembers, false)
  @TestData("+", TypeScriptListKind.TypeMembers, false)
  @TestData("a", TypeScriptListKind.ClassMembers, true)
  @TestData(";", TypeScriptListKind.ClassMembers, false)
  @TestData(")", TypeScriptListKind.ClassMembers, false)
  @TestData("[", TypeScriptListKind.EnumMembers, true)
  @TestData(")", TypeScriptListKind.EnumMembers, false)
  @TestData("{ a", TypeScriptListKind.HeritageClauseElement, true)
  @TestData("{ }", TypeScriptListKind.HeritageClauseElement, false)
  @TestData("a", TypeScriptListKind.HeritageClauseElement, true)
  @TestData("this", TypeScriptListKind.HeritageClauseElement, false)
  @TestData("implements x", TypeScriptListKind.HeritageClauseElement, false)
  @TestData("#a", TypeScriptListKind.VariableDeclarations, true)
  @TestData(")", TypeScriptListKind.VariableDeclarations, false)
  @TestData("...", TypeScriptListKind.ObjectBindingElements, true)
  @TestData("a", TypeScriptListKind.ObjectBindingElements, true)
  @TestData(")", TypeScriptListKind.ObjectBindingElements, false)
  @TestData(",", TypeScriptListKind.ArrayBindingElements, true)
  @TestData("...", TypeScriptListKind.ArrayBindingElements, true)
  @TestData("{", TypeScriptListKind.ArrayBindingElements, true)
  @TestData(")", TypeScriptListKind.ArrayBindingElements, false)
  @TestData("...", TypeScriptListKind.ArgumentExpressions, true)
  @TestData("!", TypeScriptListKind.ArgumentExpressions, true)
  @TestData(")", TypeScriptListKind.ArgumentExpressions, false)
  @TestData("*", TypeScriptListKind.ObjectLiteralMembers, true)
  @TestData("...", TypeScriptListKind.ObjectLiteralMembers, true)
  @TestData(".", TypeScriptListKind.ObjectLiteralMembers, true)
  @TestData("a", TypeScriptListKind.ObjectLiteralMembers, true)
  @TestData(")", TypeScriptListKind.ObjectLiteralMembers, false)
  @TestData(",", TypeScriptListKind.ArrayLiteralMembers, true)
  @TestData("...", TypeScriptListKind.ArrayLiteralMembers, true)
  @TestData(".", TypeScriptListKind.ArrayLiteralMembers, true)
  @TestData("a", TypeScriptListKind.ArrayLiteralMembers, true)
  @TestData(")", TypeScriptListKind.ArrayLiteralMembers, false)
  @TestData("@", TypeScriptListKind.Parameters, true)
  @TestData(")", TypeScriptListKind.Parameters, false)
  @TestData("const", TypeScriptListKind.TypeParameters, true)
  @TestData(")", TypeScriptListKind.TypeParameters, false)
  @TestData(",", TypeScriptListKind.TypeArguments, true)
  @TestData("...", TypeScriptListKind.TypeArguments, true)
  @TestData("string", TypeScriptListKind.TypeArguments, true)
  @TestData("#a", TypeScriptListKind.TypeArguments, false)
  @TestData(",", TypeScriptListKind.TupleElementTypes, true)
  @TestData(")", TypeScriptListKind.TupleElementTypes, false)
  @TestData("extends", TypeScriptListKind.HeritageClauses, true)
  @TestData("implements", TypeScriptListKind.HeritageClauses, true)
  @TestData("a", TypeScriptListKind.HeritageClauses, false)
  @TestData("\"a\"", TypeScriptListKind.ImportOrExportSpecifiers, true)
  @TestData("from", TypeScriptListKind.ImportOrExportSpecifiers, true)
  @TestData("from \"m\"", TypeScriptListKind.ImportOrExportSpecifiers, false)
  @TestData(")", TypeScriptListKind.ImportOrExportSpecifiers, false)
  @TestData("default", TypeScriptListKind.ImportAttributes, true)
  @TestData(")", TypeScriptListKind.ImportAttributes, false)
  @TestMethod
  public readsWhatEachListReadsAsAnElementOnceItRecovers(content: string, kind: TypeScriptListKind, expected: boolean): void {
    const parser = TypeScriptParserFixture.create(content);

    Assert.areEqual(expected, parser.currentNode.isTypeScriptListElement(kind, parser));
  }

  @TestData("}", TypeScriptListKind.SourceElements, false)
  @TestData("}", TypeScriptListKind.BlockStatements, true)
  @TestData("}", TypeScriptListKind.SwitchClauses, true)
  @TestData("}", TypeScriptListKind.TypeMembers, true)
  @TestData("}", TypeScriptListKind.ClassMembers, true)
  @TestData("}", TypeScriptListKind.EnumMembers, true)
  @TestData("}", TypeScriptListKind.ObjectLiteralMembers, true)
  @TestData("}", TypeScriptListKind.ObjectBindingElements, true)
  @TestData("}", TypeScriptListKind.ImportOrExportSpecifiers, true)
  @TestData("}", TypeScriptListKind.ImportAttributes, true)
  @TestData(")", TypeScriptListKind.TypeMembers, false)
  @TestData("}", TypeScriptListKind.SwitchClauseStatements, true)
  @TestData("default", TypeScriptListKind.SwitchClauseStatements, true)
  @TestData("x", TypeScriptListKind.SwitchClauseStatements, false)
  @TestData("{", TypeScriptListKind.HeritageClauseElement, true)
  @TestData("extends", TypeScriptListKind.HeritageClauseElement, true)
  @TestData("implements", TypeScriptListKind.HeritageClauseElement, true)
  @TestData("x", TypeScriptListKind.HeritageClauseElement, false)
  @TestData(";", TypeScriptListKind.VariableDeclarations, true)
  @TestData("\n)", TypeScriptListKind.VariableDeclarations, true)
  @TestData("in", TypeScriptListKind.VariableDeclarations, true)
  @TestData("of", TypeScriptListKind.VariableDeclarations, true)
  @TestData("=>", TypeScriptListKind.VariableDeclarations, true)
  @TestData(")", TypeScriptListKind.VariableDeclarations, false)
  @TestData(">", TypeScriptListKind.TypeParameters, true)
  @TestData("(", TypeScriptListKind.TypeParameters, true)
  @TestData("{", TypeScriptListKind.TypeParameters, true)
  @TestData("extends", TypeScriptListKind.TypeParameters, true)
  @TestData("implements", TypeScriptListKind.TypeParameters, true)
  @TestData(";", TypeScriptListKind.TypeParameters, false)
  @TestData(")", TypeScriptListKind.ArgumentExpressions, true)
  @TestData(";", TypeScriptListKind.ArgumentExpressions, true)
  @TestData("]", TypeScriptListKind.ArgumentExpressions, false)
  @TestData("]", TypeScriptListKind.ArrayLiteralMembers, true)
  @TestData("]", TypeScriptListKind.TupleElementTypes, true)
  @TestData("]", TypeScriptListKind.ArrayBindingElements, true)
  @TestData(")", TypeScriptListKind.ArrayBindingElements, false)
  @TestData(")", TypeScriptListKind.Parameters, true)
  @TestData("]", TypeScriptListKind.Parameters, true)
  @TestData("}", TypeScriptListKind.Parameters, false)
  @TestData(")", TypeScriptListKind.TypeArguments, true)
  @TestData(",", TypeScriptListKind.TypeArguments, false)
  @TestData("{", TypeScriptListKind.HeritageClauses, true)
  @TestData("}", TypeScriptListKind.HeritageClauses, true)
  @TestData("x", TypeScriptListKind.HeritageClauses, false)
  @TestMethod
  public endsEachListWhereTheReferenceEndsIt(content: string, kind: TypeScriptListKind, expected: boolean): void {
    const parser = TypeScriptParserFixture.create(content);

    Assert.areEqual(expected, parser.currentNode.isTypeScriptListTerminator(kind, parser));
  }

  @TestMethod
  public startsNoFromClauseAtAnyTokenButFrom(): void {
    const parser = TypeScriptParserFixture.create("\"m\"");

    Assert.isFalse(parser.currentNode.startsTypeScriptFromClause(parser));
  }

  @TestData("public x;", "TS1128@0:6")
  @TestData("static x;", "TS1128@0:6")
  @TestData("readonly x;", "TS1128@0:8")
  @TestData("accessor x;", "TS1128@0:8")
  @TestData("public\nx;", "TS1212@0:6")
  @TestMethod
  public refusesAModifierWordBeforeANameWhereNoDeclarationStarts(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestMethod
  public startsNoClassStaticBlockAndNoImportPhaseByDefault(): void {
    const parser = TypeScriptParserFixture.create("value {");

    Assert.isFalse(parser.currentNode.startsTypeScriptClassStaticBlock(parser));
    Assert.isFalse(parser.currentNode.isTypeScriptImportPhase(parser));
  }

  @TestMethod
  public startsNoAsyncFunctionByDefault(): void {
    const parser = TypeScriptParserFixture.create("name;");

    Assert.isFalse(parser.currentNode.isTypeScriptAsyncFunctionStart(parser));
  }

  @TestMethod
  public startsAndParsesNoSwitchClauseByDefault(): void {
    const parser = TypeScriptParserFixture.create("name;");

    Assert.isFalse(parser.currentNode.isTypeScriptSwitchClauseStart());
    Assert.isUndefined(parser.currentNode.parseTypeScriptSwitchClause(parser));
    Assert.areEqual(0, parser.currentNode.span.startOffset);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestData(TypeScriptListKind.SourceElements, "TS1128")
  @TestData(TypeScriptListKind.BlockStatements, "TS1128")
  @TestData(TypeScriptListKind.SwitchClauseStatements, "TS1129")
  @TestMethod
  public reportsTheStatementListsOwnDiagnosticForATokenItCannotRead(kind: TypeScriptListKind, expectedCode: string): void {
    const parser = TypeScriptParserFixture.create("= value;");

    parser.currentNode.reportTypeScriptUnexpectedStatementToken(parser, kind);

    Assert.areEqual(expectedCode, parser.context.diagnosticCollector.diagnostics.map(t => t.code.displayText).join(","));
  }

  @TestData("public x;", true)
  @TestData("= x;", true)
  @TestData("x;", false)
  @TestMethod
  public treatsAMisplacedModifierAsATokenNoStatementStarts(content: string, expected: boolean): void {
    const parser = TypeScriptParserFixture.create(content);

    Assert.areEqual(expected, parser.currentNode.isTypeScriptUnexpectedStatementToken(parser));
  }

  @TestData("for (f() in x) {}", "TS2406@5:3")
  @TestData("for (x?.y in z) {}", "TS2780@5:4")
  @TestData("for (f() of x) {}", "TS2487@5:3")
  @TestData("for (x?.y of z) {}", "TS2781@5:4")
  @TestData("for (x in y) {}", "")
  @TestData("for (x.y of z) {}", "")
  @TestMethod
  public readsAnIterationInitializerAsAReference(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("type T = (this: any) => void;", "")
  @TestData("interface I { (this: any): void; }", "")
  @TestData("type F = (a = 1) => void;", "TS2371@10:5")
  @TestData("interface I { m(a = 1): void; }", "TS2371@16:5")
  @TestData("interface I { m([a]?): void; }", "")
  @TestMethod
  public readsAParameterListWithoutABodyOrAThisRule(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("class C { public\nx; }", "")
  @TestData("export default x;", "")
  @TestData("class C { export x; }", "TS1031@10:6")
  @TestMethod
  public readsAModifierFollowedOnItsLine(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("type @d class C {}", "TS2457@5:1")
  @TestData("interface )", "TS2427@10:1")
  @TestMethod
  public recordsNoTokenValueForPunctuation(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestMethod
  public givesAnUnwrittenNameNoDiagnosticText(): void {
    const node = new TypeScriptMissingIdentifierNode(new SourceSpan(3, 0));

    Assert.areEqual("", node.getTypeScriptDiagnosticText());
  }

  @TestData("a b", 1)
  @TestData("a/* gap */b", 1)
  @TestData("a\n  b", 1)
  @TestData("a;", 1)
  @TestMethod
  public placesAMissingNodeAtTheEndOfThePrecedingToken(content: string, offset: number): void {
    const parser = TypeScriptParserFixture.create(content);
    parser.advance();

    const span = parser.currentNode.getTypeScriptMissingNodeSpan();

    Assert.areEqual(offset, span.startOffset);
    Assert.areEqual(0, span.length);
  }

  @TestMethod
  public placesAMissingNodeBeforeTheFirstTokenAtTheSourceStart(): void {
    const span = TypeScriptParserFixture.create(" /* leading */ b").currentNode.getTypeScriptMissingNodeSpan();

    Assert.areEqual(0, span.startOffset);
    Assert.areEqual(0, span.length);
  }
}
