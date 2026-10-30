/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, NodeType } from "@noldova/context.parsers";
import { ValueNode } from "@noldova/context.parsers";
import {
  TypeScriptAnyKeywordNode,
  TypeScriptArrayTypeNode,
  TypeScriptConditionalTypeNode,
  TypeScriptFunctionTypeNode,
  TypeScriptImportAttributesNode,
  TypeScriptImportTypeNode,
  TypeScriptIndexedAccessTypeNode,
  TypeScriptInferTypeNode,
  TypeScriptIntersectionTypeNode,
  TypeScriptLiteralTypeNode,
  TypeScriptMinusNode,
  TypeScriptMissingIdentifierNode,
  TypeScriptMissingTypeNode,
  TypeScriptParenthesizedTypeNode,
  TypeScriptThisTypeNode,
  TypeScriptTupleTypeNode,
  TypeScriptTypeOperatorNode,
  TypeScriptTypePredicateNode,
  TypeScriptTypeQueryNode,
  TypeScriptTypeReferenceNode,
  TypeScriptUnionTypeNode,
  TypeScriptWithKeywordNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeParserTests {
  @TestData("any")
  @TestData("bigint")
  @TestData("boolean")
  @TestData("never")
  @TestData("number")
  @TestData("object")
  @TestData("string")
  @TestData("symbol")
  @TestData("undefined")
  @TestData("unknown")
  @TestData("void")
  @TestMethod
  public parsesEveryPredefinedType(value: string): void {
    const node = this.parse(value);
    Assert.isInstanceOf(node, ValueNode);
    Assert.areEqual(value, node.value);
  }

  @TestData("1n")
  @TestData("false")
  @TestData("`value`")
  @TestData("null")
  @TestData("42")
  @TestData("\"value\"")
  @TestData("true")
  @TestMethod
  public parsesEveryLiteralType(value: string): void {
    this.assertType(value, TypeScriptLiteralTypeNode);
  }

  @TestMethod
  public parsesPrimaryTypeFamilies(): void {
    this.assertType("any", TypeScriptAnyKeywordNode);
    this.assertType("Name", TypeScriptTypeReferenceNode);
    this.assertType("(Name)", TypeScriptParenthesizedTypeNode);
    this.assertType("\"value\"", TypeScriptLiteralTypeNode);
    this.assertType("-42", TypeScriptLiteralTypeNode);
    this.assertType("this", TypeScriptThisTypeNode);
    this.assertType("typeof Namespace.Value", TypeScriptTypeQueryNode);
  }

  @TestMethod
  public leavesAMinusThatStartsNoLiteralTypeUnconsumed(): void {
    const parser = TypeScriptParserFixture.create("-x");

    parser.parseType();

    Assert.isInstanceOf(parser.currentNode, TypeScriptMinusNode);
    Assert.areEqual("TS1110@0:1", TypeScriptDiagnosticsFixture.project(parser.context.diagnosticCollector.diagnostics));
  }

  @TestMethod
  public parsesOperatorsPostfixTypesAndInference(): void {
    this.assertType("keyof readonly Value", TypeScriptTypeOperatorNode);
    this.assertType("infer Value extends Base", TypeScriptInferTypeNode);
    this.assertType("Value[]", TypeScriptArrayTypeNode);
    this.assertType("Value[Key]", TypeScriptIndexedAccessTypeNode);
  }

  @TestMethod
  public parsesDottedKeywordReferencesAndTypeQueryArguments(): void {
    const referenceNode = this.parse("string.Member");
    const queryNode = this.parse("typeof Namespace.Value<Argument>");

    Assert.isInstanceOf(referenceNode, TypeScriptTypeReferenceNode);
    Assert.isInstanceOf(queryNode, TypeScriptTypeQueryNode);
    Assert.isDefined(queryNode.typeArgumentListNode);
  }

  @TestMethod
  public reportsATypeQueryWithoutAnExpressionName(): void {
    const parser = TypeScriptParserFixture.create("typeof");
    const node = parser.parseType();

    Assert.isInstanceOf(node, TypeScriptTypeQueryNode);
    Assert.isInstanceOf(node.expressionNameNode, TypeScriptMissingIdentifierNode);
    Assert.areEqual(6, node.expressionNameNode.span.startOffset);
    Assert.areEqual(0, node.expressionNameNode.span.length);
    Assert.areEqual(6, node.span.endOffset);
    Assert.areEqual("TS1003@6:0 Identifier expected.", TypeScriptDiagnosticsFixture.projectWithMessages(parser.context.diagnosticCollector.diagnostics));
  }

  @TestMethod
  public parsesImportTypes(): void {
    const ordinaryNode = this.parse("import(\"module\")");
    const qualifiedNode = this.parse("typeof import(\"module\").Namespace.Value<Argument>");
    const attributedNode = this.parse("import(\"module\", { with: { type: \"json\" } })");

    Assert.isInstanceOf(ordinaryNode, TypeScriptImportTypeNode);
    Assert.isInstanceOf(qualifiedNode, TypeScriptImportTypeNode);
    Assert.isInstanceOf(attributedNode, TypeScriptImportTypeNode);
    Assert.isDefined(attributedNode.commaNode);
    Assert.isDefined(attributedNode.attributesOpenBraceNode);
    Assert.isInstanceOf(attributedNode.attributesNode, TypeScriptImportAttributesNode);
    Assert.isInstanceOf(attributedNode.attributesNode.keywordNode, TypeScriptWithKeywordNode);
    Assert.isDefined(attributedNode.attributesNode.colonNode);
    Assert.areEqual(1, attributedNode.attributesNode.children.length);
    Assert.isUndefined(attributedNode.attributesCommaNode);
    Assert.isDefined(attributedNode.attributesCloseBraceNode);
  }

  @TestMethod
  public keepsAnImportTypesAttributeObjectInTheTree(): void {
    const source = "import(\"module\", { with: { type: \"json\" }, })";
    const node = this.parse(source);

    Assert.isInstanceOf(node, TypeScriptImportTypeNode);
    Assert.isInstanceOf(node.attributesNode, TypeScriptImportAttributesNode);
    Assert.areEqual("{", source.slice(node.attributesOpenBraceNode?.span.startOffset, node.attributesOpenBraceNode?.span.endOffset));
    Assert.areEqual("with: { type: \"json\" }", source.slice(node.attributesNode.span.startOffset, node.attributesNode.span.endOffset));
    Assert.areEqual(",", source.slice(node.attributesCommaNode?.span.startOffset, node.attributesCommaNode?.span.endOffset));
    Assert.areEqual("}", source.slice(node.attributesCloseBraceNode?.span.startOffset, node.attributesCloseBraceNode?.span.endOffset));
  }

  @TestData("import \"module\"", "TS1005@7:8 '(' expected.|TS1005@15:0 ')' expected.")
  @TestData("import()", "TS1110@7:1 Type expected.|TS1141@7:0 String literal expected.")
  @TestData("import(number)", "TS1141@7:6 String literal expected.")
  @TestData("import(\"module\"", "TS1005@15:0 ')' expected.")
  @TestMethod
  public reportsMalformedImportTypes(content: string, expected: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseType();

    Assert.isInstanceOf(node, TypeScriptImportTypeNode);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(parser.context.diagnosticCollector.diagnostics));
  }

  @TestMethod
  public leavesInvalidNoSubstitutionTemplateEscapesUnreported(): void {
    const parser = TypeScriptParserFixture.create("`\\xG`");
    const node = parser.parseType();

    Assert.isInstanceOf(node, TypeScriptLiteralTypeNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestData("Value | () => Result", "TS1385@7:13 Function type notation must be parenthesized when used in a union type.")
  @TestData("Value | new () => Result", "TS1386@7:17 Constructor type notation must be parenthesized when used in a union type.")
  @TestData("Value & () => Result", "TS1387@7:13 Function type notation must be parenthesized when used in an intersection type.")
  @TestData("Value & new () => Result", "TS1388@7:17 Constructor type notation must be parenthesized when used in an intersection type.")
  @TestMethod
  public reportsUnparenthesizedFunctionAndConstructorConstituents(content: string, expected: string): void {
    const parser = TypeScriptParserFixture.create(content);
    parser.parseType();

    Assert.isTrue(parser.isEndOfFile);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(parser.context.diagnosticCollector.diagnostics));
  }

  @TestMethod
  public preservesLeadingUnionAndIntersectionOperators(): void {
    const unionNode = this.parse("| Left | Right");
    const intersectionNode = this.parse("& Left & Right");

    Assert.isInstanceOf(unionNode, TypeScriptUnionTypeNode);
    Assert.areEqual(2, unionNode.barNodes.length);
    Assert.areEqual(2, unionNode.children.length);
    Assert.isInstanceOf(intersectionNode, TypeScriptIntersectionTypeNode);
    Assert.areEqual(2, intersectionNode.ampersandNodes.length);
    Assert.areEqual(2, intersectionNode.children.length);
  }

  @TestMethod
  public parsesTypePredicates(): void {
    const thisNode = this.parse("this is Value");
    const assertsNode = this.parse("asserts value is Value");

    Assert.isInstanceOf(thisNode, TypeScriptTypePredicateNode);
    Assert.isInstanceOf(thisNode.parameterNameNode, TypeScriptThisTypeNode);
    Assert.isInstanceOf(assertsNode, TypeScriptTypePredicateNode);
    Assert.isDefined(assertsNode.assertsKeywordNode);
  }

  @TestMethod
  public reportsMissingConditionalDelimiters(): void {
    const parser = TypeScriptParserFixture.create("Value extends Base True False");
    const node = parser.parseType();

    Assert.isInstanceOf(node, TypeScriptConditionalTypeNode);
    Assert.isUndefined(node.questionNode);
    Assert.isUndefined(node.colonNode);
    Assert.areEqual(
      "TS1005@19:4 '?' expected.|TS1005@24:5 ':' expected.",
      TypeScriptDiagnosticsFixture.projectWithMessages(parser.context.diagnosticCollector.diagnostics));
  }

  @TestData("-Name", "TS1110@0:1 Type expected.")
  @TestData("Value[Key", "TS1005@9:0 ']' expected.")
  @TestData("()", "TS1005@2:0 '=>' expected.")
  @TestData("(Value", "TS1005@6:0 ')' expected.")
  @TestData("]", "TS1110@0:1 Type expected.")
  @TestData("Name.", "TS1003@5:0 Identifier expected.")
  @TestMethod
  public reportsMalformedPrimaryAndPostfixTypes(content: string, expected: string): void {
    const parser = TypeScriptParserFixture.create(content);
    parser.parseType();

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(parser.context.diagnosticCollector.diagnostics));
  }

  @TestMethod
  public parsesPredicateRecoveryAndFunctionConditionalConstraints(): void {
    const assertsThisNode = this.parse("asserts this");
    const conditionalNode = this.parse("Value extends () => Result ? True : False");
    const invalidAssertsParser = TypeScriptParserFixture.create("asserts 42");
    const invalidAssertsNode = invalidAssertsParser.parseType();

    Assert.isInstanceOf(assertsThisNode, TypeScriptTypePredicateNode);
    Assert.isUndefined(assertsThisNode.isKeywordNode);
    Assert.isInstanceOf(conditionalNode, TypeScriptConditionalTypeNode);
    Assert.isInstanceOf(invalidAssertsNode, TypeScriptTypeReferenceNode);
    Assert.areEqual("42", invalidAssertsParser.typescriptLexer.reader.source.getText(invalidAssertsParser.currentNode.span));
    Assert.areEqual(0, invalidAssertsParser.context.diagnosticCollector.diagnostics.length);
  }

  private assertType(value: string, nodeType: Function & NodeType): void {
    const node = this.parse(value);
    Assert.isInstanceOf(node, nodeType);
  }

  private parse(value: string): Node {
    const parser = TypeScriptParserFixture.create(value);
    const node = parser.parseType();
    Assert.isTrue(parser.isEndOfFile);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
    return node;
  }

  @TestData("?Value", TypeScriptTypeOperatorNode)
  @TestData("!!!Value", TypeScriptTypeOperatorNode)
  @TestData("*", TypeScriptTypeOperatorNode)
  @TestData("Value?", TypeScriptTypeOperatorNode)
  @TestData("Value!", TypeScriptTypeOperatorNode)
  @TestData("?Value | Other", TypeScriptUnionTypeNode)
  @TestData("[Value?, ...string[]]", TypeScriptTupleTypeNode)
  @TestMethod
  public preservesPrefixAndPostfixTypeQualifiers(content: string, expectedType: Function & NodeType): void {
    this.assertType(content, expectedType);
  }

  @TestMethod
  public handlesLongNonNullablePrefixesWithoutRecursivePrimaryParsing(): void {
    const content = "!".repeat(2000) + "Value";
    const parser = TypeScriptParserFixture.create(content);
    Assert.areEqual(content.length, parser.parseType().span.length);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestData("Container<?, Value>", "TS1110@11:1 Type expected.")
  @TestData("Container<?>", "TS1110@11:1 Type expected.")
  @TestData("{ property: ? }", "TS1110@14:1 Type expected.")
  @TestData("(?)", "TS1110@2:1 Type expected.")
  @TestData("?=value", "TS1110@1:1 Type expected.")
  @TestData("?|Value", "TS1110@1:1 Type expected.")
  @TestMethod
  public reportsTheTypeMissingAfterAPrefixQuestionAtABoundary(content: string, expected: string): void {
    const parser = TypeScriptParserFixture.create(content);
    parser.parseType();

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(parser.context.diagnosticCollector.diagnostics));
  }

  @TestData("({ value: T })", TypeScriptParenthesizedTypeNode)
  @TestData("([T, U])", TypeScriptParenthesizedTypeNode)
  @TestData("({ [K in Keys]: Value })", TypeScriptParenthesizedTypeNode)
  @TestData("(object: T) => object is U", TypeScriptFunctionTypeNode)
  @TestMethod
  public distinguishesParenthesizedObjectAndTupleTypesFromFunctionParameters(content: string, expectedType: Function & NodeType): void {
    this.assertType(content, expectedType);
  }

  @TestData("let h: *= 1;", "")
  @TestData("function f(a: *= 1) {}", "")
  @TestData("function f(a?: *= 1) {}", "TS1015@11:1")
  @TestData("class C { p: *= 1; }", "")
  @TestData("type T = { a: *=1 };", "TS1247@16:1")
  @TestData("let h: (*= 1);", "TS1005@9:1|TS1005@12:1")
  @TestData("let h: (*=);", "TS1005@9:1|TS1109@10:1")
  @TestData("type T = (*= 1);", "TS1005@11:1|TS1005@14:1")
  @TestData("type T = *= 1;", "TS1005@10:1")
  @TestData("let h: *=;", "TS1109@9:1")
  @TestData("function f(a: *=) {}", "TS1109@16:1")
  @TestData("let h: *= 1, k: *= 2;", "")
  @TestData("let h: *=\n1;", "")
  @TestData("let h: A | *= 1;", "")
  @TestData("let h: *=> 1;", "TS1005@8:2")
  @TestData("let h: A[*=];", "TS1005@9:2|TS1134@11:1")
  @TestData("let h: ?? = 1;", "TS1110@10:1")
  @TestData("let h: ??number;", "")
  @TestData("let h: (??number);", "")
  @TestMethod
  public readsATwoCharacterOperatorWhereATypeStartsByItsFirstCharacter(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("declare const x: any, a: any, b: any; for (var k: (c: any = a in b) => void;;) {}", "TS1005@62:2")
  @TestData("declare const x: any, a: any, b: any; for (var k = () => { type T = { m(c: any = a in b): void } };;) {}", "TS1005@83:2")
  @TestData("declare const x: any, a: any, b: any; for (var k = a satisfies (c: any = a in b) => void;;) {}", "TS1005@75:2")
  @TestMethod
  public holdsTheInRestrictionThroughAType(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestMethod
  public readsThePrefixNullableOperandAsATypeOperand(): void {
    const parser = TypeScriptParserFixture.create("?Value | Other");
    const node = parser.parseType();

    Assert.isInstanceOf(node, TypeScriptUnionTypeNode);
    const nullableNode = node.children[0];
    Assert.isInstanceOf(nullableNode, TypeScriptTypeOperatorNode);
    Assert.isInstanceOf(nullableNode.typeNode, TypeScriptTypeReferenceNode);
    Assert.areEqual(6, nullableNode.span.length);
    Assert.isInstanceOf(node.children[1], TypeScriptTypeReferenceNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestData("?Value[]", TypeScriptArrayTypeNode)
  @TestData("?keyof Value", TypeScriptTypeOperatorNode)
  @TestData("?(Value | Other)", TypeScriptParenthesizedTypeNode)
  @TestMethod
  public appliesThePrefixNullableToItsWholeOperand(content: string, expectedType: Function & NodeType): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseType();

    Assert.isInstanceOf(node, TypeScriptTypeOperatorNode);
    Assert.isInstanceOf(node.typeNode, expectedType);
    Assert.areEqual(content.length, node.span.length);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestData("? )", 1, "TS1110@2:1 Type expected.")
  @TestData("?", 1, "TS1110@1:0 Type expected.")
  @TestData("?|Value", 1, "TS1110@1:1 Type expected.")
  @TestMethod
  public writesAMissingOperandAfterAPrefixQuestion(content: string, offset: number, expected: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseType();
    const nullableNode = node instanceof TypeScriptUnionTypeNode ? node.children[0] : node;

    Assert.isInstanceOf(nullableNode, TypeScriptTypeOperatorNode);
    Assert.isInstanceOf(nullableNode.typeNode, TypeScriptMissingTypeNode);
    Assert.areEqual(offset, nullableNode.typeNode.span.startOffset);
    Assert.areEqual(0, nullableNode.typeNode.span.length);
    Assert.areEqual(offset, nullableNode.span.endOffset);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(parser.context.diagnosticCollector.diagnostics));
  }
}
