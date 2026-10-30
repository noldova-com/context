/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import * as api from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../fixtures/typescript-diagnostics.fixture.js";

@TestClass
export class TypeScriptParserApiTests {
  @TestMethod
  public runsTheExplicitDeclarationInputExample(): void {
    const result = api.TypeScriptParser.parse("export function read(): string;", undefined, api.TypeScriptSourceKind.Declaration);
    Assert.areEqual(0, result.diagnostics.length);
    Assert.isInstanceOf(result.rootNode.children[0], api.TypeScriptFunctionDeclarationNode);
  }

  @TestMethod
  public documentsTheSeparateResourceAndLoopAwaitTokens(): void {
    const result = api.TypeScriptParser.parse("await using handle = open();");
    const statement = result.rootNode.children[0];
    Assert.isInstanceOf(statement, api.TypeScriptVariableStatementNode);
    Assert.isInstanceOf(statement.declarationListNode.keywordNode, api.TypeScriptUsingKeywordNode);
    Assert.isInstanceOf(statement.declarationListNode.awaitKeywordNode, api.TypeScriptAwaitKeywordNode);
    Assert.areEqual(0, result.diagnostics.length);
    const loopResult = api.TypeScriptParser.parse("for await (await using item of items) {}");
    const loop = loopResult.rootNode.children[0];
    Assert.isInstanceOf(loop, api.TypeScriptForOfStatementNode);
    Assert.isInstanceOf(loop.initializerNode, api.TypeScriptVariableDeclarationListNode);
    Assert.isDefined(loop.awaitKeywordNode);
    Assert.isDefined(loop.initializerNode.awaitKeywordNode);
    Assert.isFalse(loop.awaitKeywordNode === loop.initializerNode.awaitKeywordNode);
    Assert.areEqual(1, loopResult.diagnostics.length);
    Assert.areEqual("TS1431", loopResult.diagnostics[0]?.code.displayText);
  }

  @TestMethod
  public runsWithStatementNodeDocumentation(): void {
    const result = api.TypeScriptParser.parse("with (scope) run();");
    const node = result.rootNode.children[0];
    Assert.isTrue(node instanceof api.TypeScriptWithStatementNode);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS1101", result.diagnostics[0]?.code.displayText);
  }

  @TestMethod
  public runsLabeledStatementNodeDocumentation(): void {
    const result = api.TypeScriptParser.parse("outer: while (ready) break outer;");
    const node = result.rootNode.children[0];
    Assert.isTrue(node instanceof api.TypeScriptLabeledStatementNode);
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestMethod
  public runsSwitchStatementNodeDocumentation(): void {
    const result = api.TypeScriptParser.parse("switch (value) { case 1: break; default: run(); }");
    const node = result.rootNode.children[0];
    Assert.isTrue(node instanceof api.TypeScriptSwitchStatementNode);
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestMethod
  public runsCaseBlockNodeDocumentation(): void {
    const result = api.TypeScriptParser.parse("switch (value) {}");
    const node = result.rootNode.children[0];
    Assert.isTrue(node instanceof api.TypeScriptSwitchStatementNode && node.caseBlockNode.children.length === 0);
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestMethod
  public runsCaseClauseNodeDocumentation(): void {
    const result = api.TypeScriptParser.parse("switch (value) { case 1: }");
    const node = result.rootNode.children[0];
    Assert.isTrue(node instanceof api.TypeScriptSwitchStatementNode && node.caseBlockNode.children[0] instanceof api.TypeScriptCaseClauseNode);
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestMethod
  public runsDefaultClauseNodeDocumentation(): void {
    const result = api.TypeScriptParser.parse("switch (value) { default: }");
    const node = result.rootNode.children[0];
    Assert.isTrue(node instanceof api.TypeScriptSwitchStatementNode && node.caseBlockNode.children[0] instanceof api.TypeScriptDefaultClauseNode);
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestMethod
  public runsCatchClauseNodeDocumentation(): void {
    const result = api.TypeScriptParser.parse("try {} catch (error: unknown) {}");
    const node = result.rootNode.children[0];
    Assert.isTrue(node instanceof api.TypeScriptTryStatementNode && node.catchClauseNode instanceof api.TypeScriptCatchClauseNode);
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestMethod
  public runsTryStatementNodeDocumentation(): void {
    const result = api.TypeScriptParser.parse("try {} finally {}");
    const node = result.rootNode.children[0];
    Assert.isTrue(node instanceof api.TypeScriptTryStatementNode);
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestMethod
  public runsTheNamespaceDocumentationExamples(): void {
    const result = api.TypeScriptParser.parse("export namespace App.Tools { export const version = 1; }");
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, api.TypeScriptModuleDeclarationNode);
    Assert.isInstanceOf(node.nameNode, api.TypeScriptQualifiedNameNode);
    Assert.areEqual(0, result.diagnostics.length);
    const recovered = api.TypeScriptParser.parse("namespace App. {}");
    const incomplete = recovered.rootNode.children[0];
    Assert.isInstanceOf(incomplete, api.TypeScriptModuleDeclarationNode);
    Assert.isInstanceOf(incomplete.nameNode, api.TypeScriptQualifiedNameNode);
    Assert.isInstanceOf(incomplete.nameNode.rightNode, api.TypeScriptMissingIdentifierNode);
    Assert.areEqual("TS1003@15:1", TypeScriptDiagnosticsFixture.project(recovered.diagnostics));
  }

  @TestMethod
  public runsTheModuleDocumentationExamples(): void {
    const imported = api.TypeScriptParser.parse('import main, { value as alias } from "pkg";');
    const exported = api.TypeScriptParser.parse('export { value as renamed } from "pkg";');
    const importNode = imported.rootNode.children[0];
    const exportNode = exported.rootNode.children[0];
    Assert.isInstanceOf(importNode, api.TypeScriptImportDeclarationNode);
    Assert.isInstanceOf(importNode.importClauseNode?.namedBindingsNode, api.TypeScriptNamedImportsNode);
    Assert.isInstanceOf(exportNode, api.TypeScriptExportDeclarationNode);
    Assert.isInstanceOf(exportNode.exportClauseNode, api.TypeScriptNamedExportsNode);
    Assert.areEqual(0, imported.diagnostics.length);
    Assert.areEqual(0, exported.diagnostics.length);
  }

  @TestMethod
  public documentsWrittenModifiersAndRecoveredPrefixes(): void {
    const result = api.TypeScriptParser.parse("export default async function() {}");
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, api.TypeScriptFunctionDeclarationNode);
    Assert.areEqual(3, node.modifierNodes.length);
    Assert.isInstanceOf(node.modifierNodes[0], api.TypeScriptExportKeywordNode);
    Assert.isInstanceOf(node.modifierNodes[1], api.TypeScriptDefaultKeywordNode);
    Assert.isInstanceOf(node.modifierNodes[2], api.TypeScriptAsyncKeywordNode);
    Assert.areEqual(0, result.diagnostics.length);
    Assert.areEqual("TS1128@0:6", TypeScriptDiagnosticsFixture.parse("export declare"));
  }

  @TestMethod
  public runsTheInterfaceAndEnumDocumentationExamples(): void {
    const box = api.TypeScriptParser.parse("interface Box<T> { value: T; }");
    const color = api.TypeScriptParser.parse("enum Color { Red, Green = 2 }");
    const mode = api.TypeScriptParser.parse("enum Mode { First, Second = 1 + 2 }");
    const interfaceNode = box.rootNode.children[0];
    const enumNode = color.rootNode.children[0];
    const modeNode = mode.rootNode.children[0];

    Assert.isInstanceOf(interfaceNode, api.TypeScriptInterfaceDeclarationNode);
    Assert.areEqual(1, interfaceNode.children.length);
    Assert.isInstanceOf(enumNode, api.TypeScriptEnumDeclarationNode);
    Assert.areEqual(2, enumNode.children.length);
    Assert.areEqual(1, enumNode.commaNodes.length);
    Assert.isInstanceOf(modeNode, api.TypeScriptEnumDeclarationNode);
    Assert.isUndefined(modeNode.children[0]?.initializerNode);
    Assert.areEqual(0, box.diagnostics.length);
    Assert.areEqual(0, color.diagnostics.length);
    Assert.areEqual(0, mode.diagnostics.length);
  }

  @TestMethod
  public runsTheFunctionAndClassDocumentationExamples(): void {
    const classResult = api.TypeScriptParser.parse("class Box {}");
    const functionResult = api.TypeScriptParser.parse("function ready(): boolean;");

    Assert.isInstanceOf(classResult.rootNode.children[0], api.TypeScriptClassDeclarationNode);
    Assert.isInstanceOf(functionResult.rootNode.children[0], api.TypeScriptFunctionDeclarationNode);
    Assert.areEqual(0, classResult.diagnostics.length);
    Assert.areEqual(0, functionResult.diagnostics.length);
    Assert.areEqual(0, api.TypeScriptParser.parse("const Box = class {};").diagnostics.length);
    Assert.areEqual(0, api.TypeScriptParser.parse("const ready = function () {};").diagnostics.length);
  }

  @TestMethod
  public exportsTheCompleteImplementedCatalog(): void {
    const exportNames = [
      "TypeScriptSourceKind", "TypeScriptWithStatementNode", "TypeScriptLabeledStatementNode", "TypeScriptCaseClauseNode",
      "TypeScriptDefaultClauseNode", "TypeScriptCaseBlockNode", "TypeScriptSwitchStatementNode", "TypeScriptCatchClauseNode",
      "TypeScriptTryStatementNode", "TypeScriptModuleDeclarationNode", "TypeScriptModuleDeclarationKeywordNode", "TypeScriptMissingIdentifierNode",
      "TypeScriptImportExportSpecifierNode", "TypeScriptNamedImportsNode", "TypeScriptNamedExportsNode", "TypeScriptNamespaceImportNode",
      "TypeScriptNamespaceExportNode", "TypeScriptImportClauseNode", "TypeScriptImportAttributeNode", "TypeScriptImportAttributesNode",
      "TypeScriptImportDeclarationNode", "TypeScriptExternalModuleReferenceNode", "TypeScriptImportEqualsDeclarationNode",
      "TypeScriptExportDeclarationNode", "TypeScriptExportAssignmentNode", "TypeScriptNamespaceExportDeclarationNode",
      "TypeScriptImportSpecifierNode", "TypeScriptExportSpecifierNode", "TypeScriptAbstractKeywordNode", "TypeScriptAccessibilityKeywordNode",
      "TypeScriptAccessorKeywordNode", "TypeScriptAccessorKindKeywordNode", "TypeScriptAccessorNode", "TypeScriptAmpersandAmpersandEqualsNode",
      "TypeScriptAmpersandAmpersandNode", "TypeScriptAmpersandEqualsNode", "TypeScriptAmpersandNode", "TypeScriptAnyKeywordNode",
      "TypeScriptArgumentListNode", "TypeScriptArrayBindingPatternNode", "TypeScriptArrayLiteralExpressionNode", "TypeScriptArrayTypeNode",
      "TypeScriptArrowFunctionNode", "TypeScriptArrowNode", "TypeScriptAsExpressionNode", "TypeScriptAsKeywordNode", "TypeScriptAssertKeywordNode",
      "TypeScriptAssertsKeywordNode", "TypeScriptAsteriskAsteriskEqualsNode", "TypeScriptAsteriskAsteriskNode", "TypeScriptAsteriskEqualsNode",
      "TypeScriptAsteriskNode", "TypeScriptAsyncKeywordNode", "TypeScriptAtNode", "TypeScriptAwaitExpressionNode", "TypeScriptAwaitKeywordNode",
      "TypeScriptBarBarEqualsNode", "TypeScriptBarBarNode", "TypeScriptBarEqualsNode", "TypeScriptBarNode", "TypeScriptBigIntKeywordNode",
      "TypeScriptBigIntLiteralNode", "TypeScriptBindingElementNode", "TypeScriptBindingPatternNode", "TypeScriptBinaryExpressionNode",
      "TypeScriptBlockCommentNode", "TypeScriptBlockNode", "TypeScriptBooleanKeywordNode", "TypeScriptBreakKeywordNode",
      "TypeScriptBreakStatementNode", "TypeScriptCallExpressionNode", "TypeScriptCallSignatureNode", "TypeScriptCaretEqualsNode",
      "TypeScriptCaretNode", "TypeScriptCaseKeywordNode", "TypeScriptCatchKeywordNode", "TypeScriptClassBodyNode", "TypeScriptClassDeclarationNode",
      "TypeScriptClassExpressionNode", "TypeScriptClassKeywordNode", "TypeScriptClassNode", "TypeScriptCloseBraceNode", "TypeScriptCloseBracketNode",
      "TypeScriptCloseParenthesisNode", "TypeScriptColonNode", "TypeScriptCommaNode", "TypeScriptComputedPropertyNameNode",
      "TypeScriptConditionalExpressionNode", "TypeScriptConditionalTypeNode", "TypeScriptConflictMarkerNode", "TypeScriptConstKeywordNode",
      "TypeScriptConstructSignatureNode", "TypeScriptConstructorDeclarationNode", "TypeScriptConstructorKeywordNode", "TypeScriptConstructorTypeNode",
      "TypeScriptContextualKeywordNode", "TypeScriptContinueKeywordNode", "TypeScriptContinueStatementNode", "TypeScriptDebuggerKeywordNode",
      "TypeScriptDebuggerStatementNode", "TypeScriptDeclareKeywordNode", "TypeScriptDecoratorNode", "TypeScriptDefaultKeywordNode",
      "TypeScriptDeferKeywordNode", "TypeScriptDeleteExpressionNode", "TypeScriptDeleteKeywordNode", "TypeScriptDelimitedListNode",
      "TypeScriptDoKeywordNode", "TypeScriptDoStatementNode", "TypeScriptDotDotDotNode", "TypeScriptDotNode", "TypeScriptElseKeywordNode",
      "TypeScriptElementAccessExpressionNode", "TypeScriptEmptyStatementNode", "TypeScriptEnumDeclarationNode", "TypeScriptEnumKeywordNode",
      "TypeScriptEnumMemberNode", "TypeScriptEqualsEqualsEqualsNode", "TypeScriptEqualsEqualsNode", "TypeScriptEqualsNode",
      "TypeScriptExclamationEqualsEqualsNode", "TypeScriptExclamationEqualsNode", "TypeScriptExclamationNode", "TypeScriptExportKeywordNode",
      "TypeScriptExpressionStatementNode", "TypeScriptExpressionWithTypeArgumentsNode", "TypeScriptExtendsKeywordNode", "TypeScriptFalseKeywordNode",
      "TypeScriptFinallyKeywordNode", "TypeScriptForInOrOfStatementNode", "TypeScriptForInStatementNode", "TypeScriptForKeywordNode",
      "TypeScriptForOfStatementNode", "TypeScriptForStatementNode", "TypeScriptFromKeywordNode",
      "TypeScriptFunctionDeclarationNode", "TypeScriptFunctionExpressionNode", "TypeScriptFunctionKeywordNode", "TypeScriptFunctionNode",
      "TypeScriptFunctionTypeNode", "TypeScriptGetAccessorNode", "TypeScriptGetKeywordNode", "TypeScriptGlobalKeywordNode",
      "TypeScriptGreaterThanEqualsNode", "TypeScriptGreaterThanNode", "TypeScriptHeritageClauseNode", "TypeScriptIdentifierNode",
      "TypeScriptIfKeywordNode", "TypeScriptIfStatementNode", "TypeScriptImmediateKeywordNode", "TypeScriptImplementsKeywordNode",
      "TypeScriptImportKeywordNode", "TypeScriptImportTypeNode", "TypeScriptInKeywordNode", "TypeScriptIndexParameterListNode",
      "TypeScriptIndexedAccessTypeNode", "TypeScriptIndexSignatureNode", "TypeScriptInferKeywordNode", "TypeScriptInferTypeNode",
      "TypeScriptInstanceOfKeywordNode", "TypeScriptInterfaceDeclarationNode", "TypeScriptInterfaceKeywordNode", "TypeScriptIntersectionTypeNode",
      "TypeScriptIntrinsicKeywordNode", "TypeScriptIsKeywordNode", "TypeScriptKeyOfKeywordNode", "TypeScriptKeywordNode",
      "TypeScriptLessThanEqualsNode", "TypeScriptLessThanNode", "TypeScriptLetKeywordNode", "TypeScriptLineCommentNode", "TypeScriptLiteralTypeNode",
      "TypeScriptMappedTypeNode", "TypeScriptMetaPropertyNode", "TypeScriptMissingDeclarationNode", "TypeScriptMissingExpressionNode",
      "TypeScriptMissingTypeNode", "TypeScriptMethodDeclarationNode", "TypeScriptMethodSignatureNode", "TypeScriptMinusEqualsNode",
      "TypeScriptMinusMinusNode", "TypeScriptMinusNode", "TypeScriptModuleKeywordNode", "TypeScriptNamedTupleMemberNode",
      "TypeScriptNamespaceKeywordNode", "TypeScriptNeverKeywordNode", "TypeScriptNewExpressionNode", "TypeScriptNewKeywordNode", "TypeScriptNode",
      "TypeScriptNonNullExpressionNode", "TypeScriptNonTextFileMarkerNode", "TypeScriptNoSubstitutionTemplateLiteralNode",
      "TypeScriptNullKeywordNode", "TypeScriptNumberKeywordNode", "TypeScriptNumericLiteralNode", "TypeScriptObjectBindingPatternNode",
      "TypeScriptObjectKeywordNode", "TypeScriptObjectLiteralExpressionNode", "TypeScriptOfKeywordNode", "TypeScriptOmittedExpressionNode",
      "TypeScriptOpenBraceNode", "TypeScriptOpenBracketNode", "TypeScriptOpenParenthesisNode", "TypeScriptOptionalTypeNode",
      "TypeScriptOutKeywordNode", "TypeScriptOverrideKeywordNode", "TypeScriptPackageKeywordNode", "TypeScriptParameterListNode",
      "TypeScriptParameterNode", "TypeScriptParenthesizedExpressionNode", "TypeScriptParenthesizedTypeNode", "TypeScriptParser",
      "TypeScriptPercentEqualsNode", "TypeScriptPercentNode", "TypeScriptPlusEqualsNode", "TypeScriptPlusNode", "TypeScriptPlusPlusNode",
      "TypeScriptPrefixUnaryExpressionNode", "TypeScriptPrivateIdentifierNode", "TypeScriptPrivateKeywordNode",
      "TypeScriptPostfixUnaryExpressionNode", "TypeScriptPropertyAccessExpressionNode", "TypeScriptPropertyAssignmentNode",
      "TypeScriptPropertyDeclarationNode", "TypeScriptPropertySignatureNode", "TypeScriptProtectedKeywordNode", "TypeScriptPublicKeywordNode",
      "TypeScriptQualifiedNameNode", "TypeScriptQuestionDotNode", "TypeScriptQuestionNode", "TypeScriptQuestionQuestionEqualsNode",
      "TypeScriptQuestionQuestionNode", "TypeScriptReadonlyKeywordNode", "TypeScriptRequireKeywordNode", "TypeScriptRestTypeNode",
      "TypeScriptReturnKeywordNode", "TypeScriptReturnStatementNode", "TypeScriptSatisfiesExpressionNode", "TypeScriptSatisfiesKeywordNode",
      "TypeScriptSemicolonClassElementNode", "TypeScriptSemicolonNode", "TypeScriptSetAccessorNode", "TypeScriptSetKeywordNode",
      "TypeScriptShebangNode", "TypeScriptShiftLeftEqualsNode", "TypeScriptShiftLeftNode", "TypeScriptShorthandPropertyAssignmentNode",
      "TypeScriptShiftRightEqualsNode", "TypeScriptShiftRightNode", "TypeScriptSlashEqualsNode", "TypeScriptSlashNode",
      "TypeScriptSpreadAssignmentNode", "TypeScriptSpreadElementNode", "TypeScriptStaticBlockNode", "TypeScriptStaticKeywordNode",
      "TypeScriptStringKeywordNode", "TypeScriptStringLiteralNode", "TypeScriptSuperKeywordNode", "TypeScriptSwitchKeywordNode",
      "TypeScriptSymbolKeywordNode", "TypeScriptTaggedTemplateExpressionNode", "TypeScriptTemplateExpressionNode", "TypeScriptTemplateHeadNode",
      "TypeScriptTemplateLiteralTypeNode", "TypeScriptTemplateLiteralTypeSpanNode", "TypeScriptTemplateMiddleNode", "TypeScriptTemplateSpanNode",
      "TypeScriptTemplateTailNode", "TypeScriptThisKeywordNode", "TypeScriptThisTypeNode", "TypeScriptThrowKeywordNode",
      "TypeScriptThrowStatementNode", "TypeScriptTildeNode", "TypeScriptTriviaNode", "TypeScriptTrueKeywordNode", "TypeScriptTryKeywordNode",
      "TypeScriptTupleTypeNode", "TypeScriptTypeArgumentListNode", "TypeScriptTypeCheckKeywordNode", "TypeScriptTypeKeywordNode",
      "TypeScriptTypeLiteralNode", "TypeScriptTypeOperatorNode", "TypeScriptTypeParameterListNode", "TypeScriptTypeParameterNode",
      "TypeScriptTypePredicateNode", "TypeScriptTypeQueryNode", "TypeScriptTypeAssertionExpressionNode", "TypeScriptTypeCheckExpressionNode",
      "TypeScriptTypeOfExpressionNode", "TypeScriptTypeReferenceNode", "TypeScriptTypeOfKeywordNode", "TypeScriptTypeAliasDeclarationNode",
      "TypeScriptUndefinedKeywordNode", "TypeScriptUnionTypeNode", "TypeScriptUniqueKeywordNode", "TypeScriptUnknownKeywordNode",
      "TypeScriptUnknownNode", "TypeScriptUnsignedShiftRightEqualsNode", "TypeScriptUnsignedShiftRightNode", "TypeScriptUsingKeywordNode",
      "TypeScriptVarKeywordNode", "TypeScriptVariableDeclarationListNode", "TypeScriptVariableDeclarationNode", "TypeScriptVariableStatementNode",
      "TypeScriptVoidExpressionNode", "TypeScriptVoidKeywordNode", "TypeScriptWhileKeywordNode", "TypeScriptWhileStatementNode",
      "TypeScriptWithKeywordNode", "TypeScriptYieldExpressionNode", "TypeScriptYieldKeywordNode"
    ];

    Assert.areEqual(exportNames.length, Object.keys(api).length);
    for (const exportName of exportNames)
      Assert.isTrue(Object.hasOwn(api, exportName), `Missing export "${exportName}".`);
  }

  @TestMethod
  public runsTheConstructorInspectionExample(): void {
    const result = api.TypeScriptParser.parse("class Example { constructor(value: string) {} }");
    const declaration = result.rootNode.children[0];
    Assert.isInstanceOf(declaration, api.TypeScriptClassDeclarationNode);
    const member = declaration.bodyNode.children[0];
    Assert.isInstanceOf(member, api.TypeScriptConstructorDeclarationNode);
    Assert.areEqual(1, member.parameterListNode.children.length);
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestMethod
  public runsThePropertyAndTypeOperatorConstructionExamples(): void {
    const name = new api.TypeScriptIdentifierNode("value", new SourceSpan(0, 5));
    const colon = new api.TypeScriptColonNode(new SourceSpan(5, 1));
    const value = new api.TypeScriptNumericLiteralNode("1", new SourceSpan(7, 1));
    const property = new api.TypeScriptPropertyAssignmentNode(new SourceSpan(0, 8), name, value, colon);
    Assert.areEqual(value, property.initializerNode);
    Assert.isUndefined(property.questionNode);
    const shorthand = new api.TypeScriptShorthandPropertyAssignmentNode(name, name.span);
    Assert.areEqual(name, shorthand.nameNode);
    Assert.isUndefined(shorthand.initializerNode);
    const operand = new api.TypeScriptIdentifierNode("Value", new SourceSpan(1, 5));
    const operator = new api.TypeScriptQuestionNode(new SourceSpan(0, 1));
    const type = new api.TypeScriptTypeOperatorNode(operator, new SourceSpan(0, 6), operand);
    Assert.isDefined(type.typeNode);
    Assert.isTrue(type.operatorNode.span.startOffset < type.typeNode.span.startOffset);
  }

  @TestMethod
  public runsTheDelimiterFamilyExample(): void {
    const statement = api.TypeScriptParser.parse("(value);").rootNode.children[0];

    Assert.isInstanceOf(statement, api.TypeScriptExpressionStatementNode);
    Assert.isInstanceOf(statement.expressionNode, api.TypeScriptParenthesizedExpressionNode);
    Assert.areEqual("(", statement.expressionNode.openParenthesisNode.value);
    Assert.areEqual("(", new api.TypeScriptOpenParenthesisNode(new SourceSpan(0, 1)).value);
  }

  @TestMethod
  public runsTheKeywordAndStatementFamilyExamples(): void {
    const statement = api.TypeScriptParser.parse("return value;").rootNode.children[0];

    Assert.isInstanceOf(statement, api.TypeScriptReturnStatementNode);
    Assert.isInstanceOf(statement.returnKeywordNode, api.TypeScriptKeywordNode);
    Assert.areEqual("return", statement.returnKeywordNode.value);
    Assert.isInstanceOf(statement.expressionNode, api.TypeScriptIdentifierNode);
    Assert.isInstanceOf(statement.semicolonNode, api.TypeScriptSemicolonNode);
  }

  @TestMethod
  public runsTheLiteralFamilyExample(): void {
    const statement = api.TypeScriptParser.parse("'text';").rootNode.children[0];

    Assert.isInstanceOf(statement, api.TypeScriptExpressionStatementNode);
    Assert.isInstanceOf(statement.expressionNode, api.TypeScriptStringLiteralNode);
    Assert.areEqual("'text'", statement.expressionNode.value);
  }

  @TestMethod
  public runsTheExpressionAndOperatorFamilyExample(): void {
    const statement = api.TypeScriptParser.parse("first + second;").rootNode.children[0];

    Assert.isInstanceOf(statement, api.TypeScriptExpressionStatementNode);
    Assert.isInstanceOf(statement.expressionNode, api.TypeScriptBinaryExpressionNode);
    Assert.isInstanceOf(statement.expressionNode.operatorNode, api.TypeScriptPlusNode);
    Assert.isInstanceOf(statement.expressionNode.leftNode, api.TypeScriptIdentifierNode);
  }

  @TestMethod
  public runsTheIdentifierFamilyExample(): void {
    const statement = api.TypeScriptParser.parse("\\u0076alue;").rootNode.children[0];

    Assert.isInstanceOf(statement, api.TypeScriptExpressionStatementNode);
    Assert.isInstanceOf(statement.expressionNode, api.TypeScriptIdentifierNode);
    Assert.areEqual("value", statement.expressionNode.value);
  }

  @TestMethod
  public runsTheAccessorFamilyExample(): void {
    const result = api.TypeScriptParser.parse("class Box { get value(): number { return 1; } set value(next: number) {} }");
    const classNode = result.rootNode.children[0];

    Assert.isInstanceOf(classNode, api.TypeScriptClassDeclarationNode);
    const [getter, setter] = classNode.bodyNode.children;
    Assert.isInstanceOf(getter, api.TypeScriptGetAccessorNode);
    Assert.isInstanceOf(getter, api.TypeScriptAccessorNode);
    Assert.isInstanceOf(setter, api.TypeScriptSetAccessorNode);
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestMethod
  public runsTheDelimitedListExample(): void {
    const statement = api.TypeScriptParser.parse("call(first, second,);").rootNode.children[0];

    Assert.isInstanceOf(statement, api.TypeScriptExpressionStatementNode);
    Assert.isInstanceOf(statement.expressionNode, api.TypeScriptCallExpressionNode);
    const argumentList = statement.expressionNode.argumentListNode;
    Assert.isInstanceOf(argumentList, api.TypeScriptDelimitedListNode);
    Assert.areEqual(2, argumentList.commaNodes.length);
  }

  @TestMethod
  public runsTheTypeCheckExample(): void {
    const statement = api.TypeScriptParser.parse("first + second as Total;").rootNode.children[0];

    Assert.isInstanceOf(statement, api.TypeScriptExpressionStatementNode);
    Assert.isInstanceOf(statement.expressionNode, api.TypeScriptAsExpressionNode);
    Assert.isInstanceOf(statement.expressionNode, api.TypeScriptTypeCheckExpressionNode);
    Assert.isInstanceOf(statement.expressionNode.expressionNode, api.TypeScriptBinaryExpressionNode);
  }
}
