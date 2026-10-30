/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { DiagnosticTemplate } from "@noldova/context.diagnostics";
import { Node, type NodeType, SourceSpan, type ValueNode } from "@noldova/context.parsers";

import { TypeScriptAssociativity } from "../../enums/typescript-associativity.js";
import type { TypeScriptDeclarationListHolder } from "../../enums/typescript-declaration-list-holder.js";
import { TypeScriptDecoratorSupport } from "../../enums/typescript-decorator-support.js";
import { TypeScriptListKind } from "../../enums/typescript-list-kind.js";
import { TypeScriptModifierFlags } from "../../enums/typescript-modifier-flags.js";
import { TypeScriptModifierTarget } from "../../enums/typescript-modifier-target.js";
import { TypeScriptNameReservation } from "../../enums/typescript-name-reservation.js";
import { TypeScriptObjectMemberKind } from "../../enums/typescript-object-member-kind.js";
import { TypeScriptOperatorPrecedence } from "../../enums/typescript-operator-precedence.js";
import { TypeScriptTypeParameterAnnotations } from "../../enums/typescript-type-parameter-annotations.js";
import { TypeScriptDiagnosticTemplates } from "../../models/diagnostics/typescript-diagnostic-templates.js";
import type { TypeScriptCaseClauseNode } from "../../models/nodes/clauses/typescript-case-clause.node.js";
import type { TypeScriptDefaultClauseNode } from "../../models/nodes/clauses/typescript-default-clause.node.js";
import { TypeScriptBindingElementNode } from "../../models/nodes/declarations/typescript-binding-element.node.js";
import { TypeScriptParameterNode } from "../../models/nodes/declarations/typescript-parameter.node.js";
import { TypeScriptCloseBraceNode } from "../../models/nodes/delimiters/typescript-close-brace.node.js";
import { TypeScriptCloseBracketNode } from "../../models/nodes/delimiters/typescript-close-bracket.node.js";
import { TypeScriptCloseParenthesisNode } from "../../models/nodes/delimiters/typescript-close-parenthesis.node.js";
import { TypeScriptColonNode } from "../../models/nodes/delimiters/typescript-colon.node.js";
import { TypeScriptCommaNode } from "../../models/nodes/delimiters/typescript-comma.node.js";
import { TypeScriptDotDotDotNode } from "../../models/nodes/delimiters/typescript-dot-dot-dot.node.js";
import { TypeScriptDotNode } from "../../models/nodes/delimiters/typescript-dot.node.js";
import { TypeScriptOpenBraceNode } from "../../models/nodes/delimiters/typescript-open-brace.node.js";
import { TypeScriptOpenBracketNode } from "../../models/nodes/delimiters/typescript-open-bracket.node.js";
import { TypeScriptOpenParenthesisNode } from "../../models/nodes/delimiters/typescript-open-parenthesis.node.js";
import { TypeScriptSemicolonNode } from "../../models/nodes/delimiters/typescript-semicolon.node.js";
import { TypeScriptMissingExpressionNode } from "../../models/nodes/expressions/typescript-missing-expression.node.js";
import type { TypeScriptAccessorKindKeywordNode } from "../../models/nodes/keywords/typescript-accessor-kind-keyword.node.js";
import type { TypeScriptAwaitKeywordNode } from "../../models/nodes/keywords/typescript-await-keyword.node.js";
import type { TypeScriptConstKeywordNode } from "../../models/nodes/keywords/typescript-const-keyword.node.js";
import type { TypeScriptConstructorKeywordNode } from "../../models/nodes/keywords/typescript-constructor-keyword.node.js";
import type { TypeScriptDeferKeywordNode } from "../../models/nodes/keywords/typescript-defer-keyword.node.js";
import type { TypeScriptExportKeywordNode } from "../../models/nodes/keywords/typescript-export-keyword.node.js";
import { TypeScriptExtendsKeywordNode } from "../../models/nodes/keywords/typescript-extends-keyword.node.js";
import { TypeScriptImplementsKeywordNode } from "../../models/nodes/keywords/typescript-implements-keyword.node.js";
import { TypeScriptInKeywordNode } from "../../models/nodes/keywords/typescript-in-keyword.node.js";
import type { TypeScriptLetKeywordNode } from "../../models/nodes/keywords/typescript-let-keyword.node.js";
import { TypeScriptOfKeywordNode } from "../../models/nodes/keywords/typescript-of-keyword.node.js";
import type { TypeScriptStaticKeywordNode } from "../../models/nodes/keywords/typescript-static-keyword.node.js";
import type { TypeScriptTypeKeywordNode } from "../../models/nodes/keywords/typescript-type-keyword.node.js";
import type { TypeScriptUsingKeywordNode } from "../../models/nodes/keywords/typescript-using-keyword.node.js";
import type { TypeScriptVarKeywordNode } from "../../models/nodes/keywords/typescript-var-keyword.node.js";
import type { TypeScriptYieldKeywordNode } from "../../models/nodes/keywords/typescript-yield-keyword.node.js";
import type { TypeScriptNoSubstitutionTemplateLiteralNode } from "../../models/nodes/literals/typescript-no-substitution-template-literal.node.js";
import type { TypeScriptStringLiteralNode } from "../../models/nodes/literals/typescript-string-literal.node.js";
import type { TypeScriptTemplateHeadNode } from "../../models/nodes/literals/typescript-template-head.node.js";
import { TypeScriptArrowNode } from "../../models/nodes/operators/typescript-arrow.node.js";
import { TypeScriptAsteriskNode } from "../../models/nodes/operators/typescript-asterisk.node.js";
import { TypeScriptGreaterThanNode } from "../../models/nodes/operators/typescript-greater-than.node.js";
import type { TypeScriptQuestionDotNode } from "../../models/nodes/operators/typescript-question-dot.node.js";
import { TypeScriptQuestionNode } from "../../models/nodes/operators/typescript-question.node.js";
import type { TypeScriptParserContext } from "../../models/typescript-parser-context.js";
import { Resources } from "../../resources.js";
import type { TypeParser } from "../../services/parsers/types/type.parser.js";
import type { TypeScriptSyntaxParser } from "../../services/typescript-syntax.parser.js";
import "../diagnostic-collector.extensions.js";
import "./declarations/typescript-accessor.node.extensions.js";
import "./declarations/typescript-array-binding-pattern.node.extensions.js";
import "./declarations/typescript-binding-element.node.extensions.js";
import "./declarations/typescript-binding-pattern.node.extensions.js";
import "./declarations/typescript-class-body.node.extensions.js";
import "./declarations/typescript-class-declaration.node.extensions.js";
import "./declarations/typescript-computed-property-name.node.extensions.js";
import "./declarations/typescript-construct-signature.node.extensions.js";
import "./declarations/typescript-constructor-declaration.node.extensions.js";
import "./declarations/typescript-decorator.node.extensions.js";
import "./declarations/typescript-enum-declaration.node.extensions.js";
import "./declarations/typescript-enum-member.node.extensions.js";
import "./declarations/typescript-export-assignment.node.extensions.js";
import "./declarations/typescript-export-declaration.node.extensions.js";
import "./declarations/typescript-function-declaration.node.extensions.js";
import "./declarations/typescript-get-accessor.node.extensions.js";
import "./declarations/typescript-heritage-clause.node.extensions.js";
import "./declarations/typescript-import-declaration.node.extensions.js";
import "./declarations/typescript-import-equals-declaration.node.extensions.js";
import "./declarations/typescript-index-signature.node.extensions.js";
import "./declarations/typescript-interface-declaration.node.extensions.js";
import "./declarations/typescript-method-declaration.node.extensions.js";
import "./declarations/typescript-method-signature.node.extensions.js";
import "./declarations/typescript-missing-declaration.node.extensions.js";
import "./declarations/typescript-module-declaration.node.extensions.js";
import "./declarations/typescript-namespace-export-declaration.node.extensions.js";
import "./declarations/typescript-object-binding-pattern.node.extensions.js";
import "./declarations/typescript-parameter-list.node.extensions.js";
import "./declarations/typescript-parameter.node.extensions.js";
import "./declarations/typescript-property-declaration.node.extensions.js";
import "./declarations/typescript-property-signature.node.extensions.js";
import "./declarations/typescript-set-accessor.node.extensions.js";
import "./declarations/typescript-static-block.node.extensions.js";
import "./declarations/typescript-type-alias-declaration.node.extensions.js";
import "./declarations/typescript-variable-declaration-list.node.extensions.js";
import "./delimiters/typescript-at.node.extensions.js";
import "./delimiters/typescript-close-brace.node.extensions.js";
import "./delimiters/typescript-close-bracket.node.extensions.js";
import "./delimiters/typescript-close-parenthesis.node.extensions.js";
import "./delimiters/typescript-colon.node.extensions.js";
import "./delimiters/typescript-comma.node.extensions.js";
import "./delimiters/typescript-dot-dot-dot.node.extensions.js";
import "./delimiters/typescript-dot.node.extensions.js";
import "./delimiters/typescript-open-brace.node.extensions.js";
import "./delimiters/typescript-open-bracket.node.extensions.js";
import "./delimiters/typescript-open-parenthesis.node.extensions.js";
import "./delimiters/typescript-semicolon.node.extensions.js";
import "./end-of-file.node.extensions.js";
import "./expressions/typescript-array-literal-expression.node.extensions.js";
import "./expressions/typescript-arrow-function.node.extensions.js";
import "./expressions/typescript-as-expression.node.extensions.js";
import "./expressions/typescript-await-expression.node.extensions.js";
import "./expressions/typescript-binary-expression.node.extensions.js";
import "./expressions/typescript-call-expression.node.extensions.js";
import "./expressions/typescript-class-expression.node.extensions.js";
import "./expressions/typescript-conditional-expression.node.extensions.js";
import "./expressions/typescript-delete-expression.node.extensions.js";
import "./expressions/typescript-element-access-expression.node.extensions.js";
import "./expressions/typescript-function-expression.node.extensions.js";
import "./expressions/typescript-meta-property.node.extensions.js";
import "./expressions/typescript-missing-expression.node.extensions.js";
import "./expressions/typescript-new-expression.node.extensions.js";
import "./expressions/typescript-non-null-expression.node.extensions.js";
import "./expressions/typescript-object-literal-expression.node.extensions.js";
import "./expressions/typescript-parenthesized-expression.node.extensions.js";
import "./expressions/typescript-postfix-unary-expression.node.extensions.js";
import "./expressions/typescript-prefix-unary-expression.node.extensions.js";
import "./expressions/typescript-property-access-expression.node.extensions.js";
import "./expressions/typescript-property-assignment.node.extensions.js";
import "./expressions/typescript-shorthand-property-assignment.node.extensions.js";
import "./expressions/typescript-spread-assignment.node.extensions.js";
import "./expressions/typescript-spread-element.node.extensions.js";
import "./expressions/typescript-tagged-template-expression.node.extensions.js";
import "./expressions/typescript-template-expression.node.extensions.js";
import "./expressions/typescript-type-assertion-expression.node.extensions.js";
import "./expressions/typescript-type-check-expression.node.extensions.js";
import "./expressions/typescript-type-of-expression.node.extensions.js";
import "./expressions/typescript-void-expression.node.extensions.js";
import "./identifiers/typescript-identifier.node.extensions.js";
import "./identifiers/typescript-private-identifier.node.extensions.js";
import "./keywords/typescript-abstract-keyword.node.extensions.js";
import "./keywords/typescript-accessibility-keyword.node.extensions.js";
import "./keywords/typescript-accessor-keyword.node.extensions.js";
import "./keywords/typescript-accessor-kind-keyword.node.extensions.js";
import "./keywords/typescript-any-keyword.node.extensions.js";
import "./keywords/typescript-as-keyword.node.extensions.js";
import "./keywords/typescript-asserts-keyword.node.extensions.js";
import "./keywords/typescript-async-keyword.node.extensions.js";
import "./keywords/typescript-await-keyword.node.extensions.js";
import "./keywords/typescript-big-int-keyword.node.extensions.js";
import "./keywords/typescript-boolean-keyword.node.extensions.js";
import "./keywords/typescript-break-keyword.node.extensions.js";
import "./keywords/typescript-case-keyword.node.extensions.js";
import "./keywords/typescript-catch-keyword.node.extensions.js";
import "./keywords/typescript-class-keyword.node.extensions.js";
import "./keywords/typescript-const-keyword.node.extensions.js";
import "./keywords/typescript-constructor-keyword.node.extensions.js";
import "./keywords/typescript-contextual-keyword.node.extensions.js";
import "./keywords/typescript-continue-keyword.node.extensions.js";
import "./keywords/typescript-debugger-keyword.node.extensions.js";
import "./keywords/typescript-declare-keyword.node.extensions.js";
import "./keywords/typescript-default-keyword.node.extensions.js";
import "./keywords/typescript-defer-keyword.node.extensions.js";
import "./keywords/typescript-delete-keyword.node.extensions.js";
import "./keywords/typescript-do-keyword.node.extensions.js";
import "./keywords/typescript-else-keyword.node.extensions.js";
import "./keywords/typescript-enum-keyword.node.extensions.js";
import "./keywords/typescript-export-keyword.node.extensions.js";
import "./keywords/typescript-extends-keyword.node.extensions.js";
import "./keywords/typescript-false-keyword.node.extensions.js";
import "./keywords/typescript-finally-keyword.node.extensions.js";
import "./keywords/typescript-for-keyword.node.extensions.js";
import "./keywords/typescript-from-keyword.node.extensions.js";
import "./keywords/typescript-function-keyword.node.extensions.js";
import "./keywords/typescript-get-keyword.node.extensions.js";
import "./keywords/typescript-global-keyword.node.extensions.js";
import "./keywords/typescript-if-keyword.node.extensions.js";
import "./keywords/typescript-implements-keyword.node.extensions.js";
import "./keywords/typescript-import-keyword.node.extensions.js";
import "./keywords/typescript-in-keyword.node.extensions.js";
import "./keywords/typescript-instance-of-keyword.node.extensions.js";
import "./keywords/typescript-interface-keyword.node.extensions.js";
import "./keywords/typescript-key-of-keyword.node.extensions.js";
import "./keywords/typescript-keyword.node.extensions.js";
import "./keywords/typescript-let-keyword.node.extensions.js";
import "./keywords/typescript-module-declaration-keyword.node.extensions.js";
import "./keywords/typescript-never-keyword.node.extensions.js";
import "./keywords/typescript-new-keyword.node.extensions.js";
import "./keywords/typescript-null-keyword.node.extensions.js";
import "./keywords/typescript-number-keyword.node.extensions.js";
import "./keywords/typescript-object-keyword.node.extensions.js";
import "./keywords/typescript-out-keyword.node.extensions.js";
import "./keywords/typescript-override-keyword.node.extensions.js";
import "./keywords/typescript-package-keyword.node.extensions.js";
import "./keywords/typescript-private-keyword.node.extensions.js";
import "./keywords/typescript-readonly-keyword.node.extensions.js";
import "./keywords/typescript-return-keyword.node.extensions.js";
import "./keywords/typescript-satisfies-keyword.node.extensions.js";
import "./keywords/typescript-set-keyword.node.extensions.js";
import "./keywords/typescript-static-keyword.node.extensions.js";
import "./keywords/typescript-string-keyword.node.extensions.js";
import "./keywords/typescript-super-keyword.node.extensions.js";
import "./keywords/typescript-switch-keyword.node.extensions.js";
import "./keywords/typescript-symbol-keyword.node.extensions.js";
import "./keywords/typescript-this-keyword.node.extensions.js";
import "./keywords/typescript-throw-keyword.node.extensions.js";
import "./keywords/typescript-true-keyword.node.extensions.js";
import "./keywords/typescript-try-keyword.node.extensions.js";
import "./keywords/typescript-type-check-keyword.node.extensions.js";
import "./keywords/typescript-type-keyword.node.extensions.js";
import "./keywords/typescript-type-of-keyword.node.extensions.js";
import "./keywords/typescript-undefined-keyword.node.extensions.js";
import "./keywords/typescript-unique-keyword.node.extensions.js";
import "./keywords/typescript-unknown-keyword.node.extensions.js";
import "./keywords/typescript-using-keyword.node.extensions.js";
import "./keywords/typescript-var-keyword.node.extensions.js";
import "./keywords/typescript-void-keyword.node.extensions.js";
import "./keywords/typescript-while-keyword.node.extensions.js";
import "./keywords/typescript-with-keyword.node.extensions.js";
import "./keywords/typescript-yield-keyword.node.extensions.js";
import "./literal.node.extensions.js";
import "./literals/typescript-big-int-literal.node.extensions.js";
import "./literals/typescript-no-substitution-template-literal.node.extensions.js";
import "./literals/typescript-numeric-literal.node.extensions.js";
import "./literals/typescript-string-literal.node.extensions.js";
import "./literals/typescript-template-head.node.extensions.js";
import "./operators/typescript-ampersand-ampersand-equals.node.extensions.js";
import "./operators/typescript-ampersand-ampersand.node.extensions.js";
import "./operators/typescript-ampersand-equals.node.extensions.js";
import "./operators/typescript-ampersand.node.extensions.js";
import "./operators/typescript-arrow.node.extensions.js";
import "./operators/typescript-asterisk-asterisk-equals.node.extensions.js";
import "./operators/typescript-asterisk-asterisk.node.extensions.js";
import "./operators/typescript-asterisk-equals.node.extensions.js";
import "./operators/typescript-asterisk.node.extensions.js";
import "./operators/typescript-bar-bar-equals.node.extensions.js";
import "./operators/typescript-bar-bar.node.extensions.js";
import "./operators/typescript-bar-equals.node.extensions.js";
import "./operators/typescript-bar.node.extensions.js";
import "./operators/typescript-caret-equals.node.extensions.js";
import "./operators/typescript-caret.node.extensions.js";
import "./operators/typescript-equals-equals-equals.node.extensions.js";
import "./operators/typescript-equals-equals.node.extensions.js";
import "./operators/typescript-equals.node.extensions.js";
import "./operators/typescript-exclamation-equals-equals.node.extensions.js";
import "./operators/typescript-exclamation-equals.node.extensions.js";
import "./operators/typescript-exclamation.node.extensions.js";
import "./operators/typescript-greater-than-equals.node.extensions.js";
import "./operators/typescript-greater-than.node.extensions.js";
import "./operators/typescript-less-than-equals.node.extensions.js";
import "./operators/typescript-less-than.node.extensions.js";
import "./operators/typescript-minus-equals.node.extensions.js";
import "./operators/typescript-minus-minus.node.extensions.js";
import "./operators/typescript-minus.node.extensions.js";
import "./operators/typescript-percent-equals.node.extensions.js";
import "./operators/typescript-percent.node.extensions.js";
import "./operators/typescript-plus-equals.node.extensions.js";
import "./operators/typescript-plus-plus.node.extensions.js";
import "./operators/typescript-plus.node.extensions.js";
import "./operators/typescript-question-dot.node.extensions.js";
import "./operators/typescript-question-question-equals.node.extensions.js";
import "./operators/typescript-question-question.node.extensions.js";
import "./operators/typescript-question.node.extensions.js";
import "./operators/typescript-shift-left-equals.node.extensions.js";
import "./operators/typescript-shift-left.node.extensions.js";
import "./operators/typescript-shift-right-equals.node.extensions.js";
import "./operators/typescript-shift-right.node.extensions.js";
import "./operators/typescript-slash-equals.node.extensions.js";
import "./operators/typescript-slash.node.extensions.js";
import "./operators/typescript-tilde.node.extensions.js";
import "./operators/typescript-unsigned-shift-right-equals.node.extensions.js";
import "./operators/typescript-unsigned-shift-right.node.extensions.js";
import "./regex.node.extensions.js";
import "./statements/typescript-block.node.extensions.js";
import "./statements/typescript-break-statement.node.extensions.js";
import "./statements/typescript-continue-statement.node.extensions.js";
import "./statements/typescript-debugger-statement.node.extensions.js";
import "./statements/typescript-do-statement.node.extensions.js";
import "./statements/typescript-expression-statement.node.extensions.js";
import "./statements/typescript-for-in-or-of-statement.node.extensions.js";
import "./statements/typescript-for-statement.node.extensions.js";
import "./statements/typescript-if-statement.node.extensions.js";
import "./statements/typescript-labeled-statement.node.extensions.js";
import "./statements/typescript-return-statement.node.extensions.js";
import "./statements/typescript-switch-statement.node.extensions.js";
import "./statements/typescript-throw-statement.node.extensions.js";
import "./statements/typescript-try-statement.node.extensions.js";
import "./statements/typescript-variable-statement.node.extensions.js";
import "./statements/typescript-while-statement.node.extensions.js";
import "./statements/typescript-with-statement.node.extensions.js";
import "./types/typescript-constructor-type.node.extensions.js";
import "./types/typescript-expression-with-type-arguments.node.extensions.js";
import "./types/typescript-function-type.node.extensions.js";
import "./types/typescript-import-type.node.extensions.js";
import "./types/typescript-missing-type.node.extensions.js";
import "./types/typescript-parenthesized-type.node.extensions.js";
import "./types/typescript-type-argument-list.node.extensions.js";
import "./types/typescript-type-operator.node.extensions.js";
import "./types/typescript-type-parameter-list.node.extensions.js";
import "./types/typescript-type-predicate.node.extensions.js";
import "./types/typescript-type-reference.node.extensions.js";
import "./typescript-class.node.extensions.js";
import "./typescript-delimited-list.node.extensions.js";
import "./typescript-function.node.extensions.js";
import "./typescript-trivia.node.extensions.js";
import "./typescript-unknown.node.extensions.js";
import "./value.node.extensions.js";

declare module "@noldova/context.parsers" {
  interface Node {
    getTypeScriptPrecedence(): TypeScriptOperatorPrecedence;
    getTypeScriptAssociativity(): TypeScriptAssociativity;
    isTypeScriptMisplacedModifier(parser: TypeScriptSyntaxParser): boolean;
    mustStartTypeScriptDeclarationBeforeName(): boolean;
    validateTypeScriptOptionalChain(context: TypeScriptParserContext): void;
    canStartTypeScriptClassMember(parser: TypeScriptSyntaxParser): boolean;
    startsTypeScriptAccessor(parser: TypeScriptSyntaxParser): this is TypeScriptAccessorKindKeywordNode;
    getTypeScriptObjectMemberKind(): TypeScriptObjectMemberKind;
    getTypeScriptObjectMemberName(): Node | undefined;
    validateTypeScriptObjectLiteralMember(context: TypeScriptParserContext): void;
    reportTypeScriptObjectMemberName(context: TypeScriptParserContext): void;
    startsTypeScriptClassStaticBlock(parser: TypeScriptSyntaxParser): this is TypeScriptStaticKeywordNode;
    isTypeScriptImportPhase(parser: TypeScriptSyntaxParser): this is TypeScriptTypeKeywordNode | TypeScriptDeferKeywordNode;
    startsTypeScriptClassMember(): boolean;
    canStartTypeScriptRecoveryStatement(parser: TypeScriptSyntaxParser): boolean;
    canStartTypeScriptTypeMember(parser: TypeScriptSyntaxParser): boolean;
    startsTypeScriptFromClause(parser: TypeScriptSyntaxParser): boolean;
    isTypeScriptListElement(kind: TypeScriptListKind, parser: TypeScriptSyntaxParser): boolean;
    isTypeScriptListTerminator(kind: TypeScriptListKind, parser: TypeScriptSyntaxParser): boolean;
    canStartTypeScriptParameter(parser: TypeScriptSyntaxParser): boolean;
    canStartTypeScriptTypeParameter(): boolean;
    getTypeScriptMissingNodeDiagnosticSpan(): SourceSpan;
    getTypeScriptMissingNodeSpan(): SourceSpan;
    reportTypeScriptInvalidBindingName(parser: TypeScriptSyntaxParser): void;
    reportTypeScriptInvalidParameter(parser: TypeScriptSyntaxParser): void;
    parseTypeScriptPrimaryType(parser: TypeParser): Node;
    validateTypeScriptGrammar(context: TypeScriptParserContext): void;
    readTypeScriptDeclarations(context: TypeScriptParserContext, holder: TypeScriptDeclarationListHolder): void;
    reportTypeScriptLetNames(context: TypeScriptParserContext): void;
    reportTypeScriptGrammarAfterModifiers(context: TypeScriptParserContext, hasModifierDiagnostics: boolean): void;
    validateTypeScriptModifier(context: TypeScriptParserContext, target: TypeScriptModifierTarget,
      writtenFlags: TypeScriptModifierFlags, declarationNode: Node): TypeScriptModifierFlags;
    validateTypeScriptModifierForDeclaration(context: TypeScriptParserContext, declarationNode: Node): void;
    getTypeScriptAllowedModifiers(): TypeScriptModifierFlags;
    getTypeScriptDecoratorSupport(): TypeScriptDecoratorSupport;
    getTypeScriptModifierRejection(context: TypeScriptParserContext, modifierNode: Node): DiagnosticTemplate | undefined;
    isTypeScriptModifierReadAfterList(): boolean;
    getTypeScriptDeclarationNameSpan(context: TypeScriptParserContext): SourceSpan;
    getTypeScriptFirstTokenSpan(): SourceSpan;
    getTypeScriptFirstChild(): Node | undefined;
    getTypeScriptAbstractRejection(): DiagnosticTemplate | undefined;
    getTypeScriptThisParameterRejection(): DiagnosticTemplate | undefined;
    hasTypeScriptBody(): boolean;
    getTypeScriptDecoratorSyntaxError(): Node | undefined;
    getTypeScriptDecoratorChainOperand(): Node | undefined;
    getTypeScriptDecoratorLinkError(isCallAllowed: boolean): Node | undefined;
    keepsTypeScriptDecoratorCallAllowed(): boolean;
    getTypeScriptNameReservation(): TypeScriptNameReservation;
    isTypeScriptEvalOrArgumentsName(): boolean;
    isTypeScriptIterationStart(): boolean;
    markTypeScriptPattern(context: TypeScriptParserContext): void;
    getTypeScriptEffectivePropertyName(context: TypeScriptParserContext): string | undefined;
    validateTypeScriptIdentifierName(context: TypeScriptParserContext): void;
    readTypeScriptEvalOrArgumentsNames(parser: TypeScriptSyntaxParser): void;
    isTypeScriptExternalModuleIndicator(): boolean;
    isTypeScriptDeclarationStatement(): boolean;
    requiresTypeScriptDeclareModifier(): boolean;
    isTypeScriptDeclarationFileModifier(): boolean;
    isTypeScriptAsyncIdentifier(): boolean;
    isTypeScriptParameterPropertyModifier(): boolean;
    isTypeScriptReference(): boolean;
    isTypeScriptAccessExpression(): boolean;
    isTypeScriptNonArithmeticLiteral(): boolean;
    isTypeScriptOptionalChain(): boolean;
    getTypeScriptChainOperand(): Node | undefined;
    hasTypeScriptQuestionDot(): boolean;
    skipTypeScriptOuterExpressions(): Node;
    getTypeScriptOuterExpressionOperand(): Node | undefined;
    getTypeScriptUnparenthesizedExpression(): Node;
    validateTypeScriptReference(context: TypeScriptParserContext, invalidTemplate: DiagnosticTemplate, optionalChainTemplate: DiagnosticTemplate): void;
    validateTypeScriptDestructuringTarget(context: TypeScriptParserContext): void;
    validateTypeScriptIterationInitializer(context: TypeScriptParserContext, isForOf: boolean): void;
    reportTypeScriptInitializersWithoutImplementation(context: TypeScriptParserContext, isTypeRead: boolean): void;
    readsTypeScriptDeclaredType(isSignatureParameter: boolean): boolean;
    getTypeScriptQuickTypeSkippedSpan(): SourceSpan | undefined;
    isTypeScriptQuickTypedCallee(): boolean;
    readsTypeScriptContextualType(): boolean;
    passesTypeScriptContextualTypeToRightOperand(): boolean;
    passesTypeScriptContextualTypeToLeftOperand(): boolean;
    isTypeScriptConstReference(): boolean;
    validateTypeScriptPredicateParameter(context: TypeScriptParserContext, parameterNodes: readonly TypeScriptParameterNode[]): void;
    hasTypeScriptBindingName(name: string): boolean;
    reportTypeScriptCommaComputedName(context: TypeScriptParserContext): void;
    reportTypeScriptRestInitializer(context: TypeScriptParserContext): void;
    reportTypeScriptAmbientResourceDeclaration(context: TypeScriptParserContext): void;
    reportTypeScriptSignatureInitializer(context: TypeScriptParserContext, isInterface: boolean): void;
    readsTypeScriptModifierListItself(): boolean;
    canFollowTypeScriptTypeArguments(parser: TypeScriptSyntaxParser): boolean;
    isTypeScriptSingleGreaterThan(parser: TypeScriptSyntaxParser): boolean;
    reportTypeScriptInstantiationAccess(parser: TypeScriptSyntaxParser): void;
    canStartTypeScriptStatement(parser: TypeScriptSyntaxParser): boolean;
    canStartTypeScriptVariableDeclaration(): boolean;
    reportTypeScriptInvalidVariableDeclaration(parser: TypeScriptSyntaxParser): void;
    isTypeScriptLeftHandSideExpression(): boolean;
    hasTypeScriptArrowFunctionBlockingParseError(): boolean;
    validateTypeScriptAssignmentTarget(context: TypeScriptParserContext, operatorNode: Node): void;
    isTypeScriptForVariableDeclarationStart(parser: TypeScriptSyntaxParser): this is TypeScriptConstKeywordNode | TypeScriptLetKeywordNode | TypeScriptVarKeywordNode | TypeScriptUsingKeywordNode | TypeScriptAwaitKeywordNode;
    isTypeScriptUnexpectedStatementToken(parser: TypeScriptSyntaxParser): boolean;
    reportTypeScriptUnexpectedStatementToken(parser: TypeScriptSyntaxParser, kind: TypeScriptListKind): void;
    isTypeScriptSwitchClauseStart(): boolean;
    parseTypeScriptSwitchClause(parser: TypeScriptSyntaxParser): TypeScriptCaseClauseNode | TypeScriptDefaultClauseNode | undefined;
    parseTypeScriptOptionalChainSuffix(parser: TypeScriptSyntaxParser, expressionNode: Node, questionDotNode: TypeScriptQuestionDotNode): Node;
    parseTypeScriptMemberExpression(parser: TypeScriptSyntaxParser): Node;
    parseTypeScriptMemberSuffix(parser: TypeScriptSyntaxParser, expressionNode: Node): Node | undefined;
    parseTypeScriptLeftHandSideSuffix(parser: TypeScriptSyntaxParser, expressionNode: Node): Node | undefined;
    tryParseTypeScriptAssignmentStart(parser: TypeScriptSyntaxParser): Node | undefined;
    parseTypeScriptBinaryExpression(parser: TypeScriptSyntaxParser, leftNode: Node, minimumPrecedence: number): Node | undefined;
    validateTypeScriptBinaryOperands(context: TypeScriptParserContext, leftNode: Node, rightNode: Node): void;
    reportTypeScriptUnaryExponentiationDiagnostic(parser: TypeScriptSyntaxParser, expressionNode: Node): void;
    reportTypeScriptMissingSemicolon(parser: TypeScriptSyntaxParser): void;
    reLexTypeScriptBinaryOperator(parser: TypeScriptSyntaxParser): void;
    parseTypeScriptUnaryExpression(parser: TypeScriptSyntaxParser): Node;
    parseTypeScriptStatement(parser: TypeScriptSyntaxParser, modifierNodes?: readonly Node[]): Node;
    parseTypeScriptExport(parser: TypeScriptSyntaxParser, exportKeywordNode: TypeScriptExportKeywordNode, modifierNodes: readonly Node[]): Node;
    isTypeScriptDeclarationStart(parser: TypeScriptSyntaxParser): boolean;
    isTypeScriptDeclarationKeyword(parser: TypeScriptSyntaxParser): boolean;
    isTypeScriptConstructorDeclarationStart(parser: TypeScriptSyntaxParser): this is TypeScriptConstructorKeywordNode | TypeScriptStringLiteralNode;
    isTypeScriptDeclarationModifier(): boolean;
    isTypeScriptDeclarationStartModifier(): boolean;
    canParseTypeScriptDeclarationModifier(parser: TypeScriptSyntaxParser, writtenNodes?: readonly Node[]): boolean;
    hasTypeScriptModifierFollower(parser: TypeScriptSyntaxParser): boolean;
    hasTypeScriptSameLineModifierFollower(parser: TypeScriptSyntaxParser): boolean;
    canParseTypeScriptClassMemberModifier(parser: TypeScriptSyntaxParser): boolean;
    parseTypeScriptPrimaryExpression(parser: TypeScriptSyntaxParser): Node;
    reportTypeScriptMissingExpression(parser: TypeScriptSyntaxParser): TypeScriptMissingExpressionNode;
    hasTypeScriptKeywordEscape(): boolean;
    isTypeScriptIdentifier(context: TypeScriptParserContext): boolean;
    isTypeScriptTypeAliasStart(parser: TypeScriptSyntaxParser): this is TypeScriptTypeKeywordNode;
    isTypeScriptAwaitExpressionStart(parser: TypeScriptSyntaxParser): this is TypeScriptAwaitKeywordNode;
    isTypeScriptYieldExpressionStart(parser: TypeScriptSyntaxParser): this is TypeScriptYieldKeywordNode;
    canFollowTypeScriptUnscopedAwaitOrYield(): boolean;
    canStartTypeScriptExpression(parser: TypeScriptSyntaxParser): boolean;
    canStartTypeScriptLeftHandSideExpression(parser: TypeScriptSyntaxParser): boolean;
    canStartTypeScriptPrimaryExpression(parser: TypeScriptSyntaxParser): boolean;
    canStartTypeScriptHeritageExpression(parser: TypeScriptSyntaxParser): boolean;
    getTypeScriptClosingDelimiterType(): NodeType<Node> | undefined;
    isTypeScriptClosingDelimiter(): boolean;
    isTypeScriptVariableDeclarationKeyword(): this is TypeScriptConstKeywordNode | TypeScriptLetKeywordNode | TypeScriptVarKeywordNode | TypeScriptUsingKeywordNode;
    isTypeScriptVariableStatementStart(parser: TypeScriptSyntaxParser): this is TypeScriptConstKeywordNode | TypeScriptLetKeywordNode | TypeScriptVarKeywordNode | TypeScriptUsingKeywordNode | TypeScriptAwaitKeywordNode;
    canStartTypeScriptSignature(): boolean;
    canStartTypeScriptGenericList(): boolean;
    isTypeScriptUpdateOperator(): boolean;
    canFollowTypeScriptModifier(): boolean;
    canFollowTypeScriptDefaultKeyword(parser: TypeScriptSyntaxParser): boolean;
    canFollowTypeScriptExportKeyword(parser: TypeScriptSyntaxParser): boolean;
    canFollowTypeScriptExportModifier(): boolean;
    isTypeScriptExportFormStart(parser: TypeScriptSyntaxParser): boolean;
    isTypeScriptExportClauseStart(): boolean;
    getTypeScriptFullSpan(): SourceSpan;
    getTypeScriptModifierNodes(): readonly Node[];
    endsTypeScriptBinaryExpression(parser: TypeScriptSyntaxParser, lastOperandNode: Node): boolean;
    reportTypeScriptReservedTypeName(context: TypeScriptParserContext, template: DiagnosticTemplate): void;
    isTypeScriptLogicalOperator(): this is ValueNode;
    getTypeScriptLogicalOperatorNode(): ValueNode | undefined;
    getTypeScriptNullishOperatorNode(): ValueNode | undefined;
    isTypeScriptOptionalParameter(): boolean;
    isTypeScriptRestElement(): boolean;
    stopsTypeScriptIndexSignatureAtItsParameter(): boolean;
    containsTypeScriptLineBreak(): boolean;
    isTypeScriptParameterModifier(): boolean;
    canParseTypeScriptParameterModifier(parser: TypeScriptSyntaxParser): boolean;
    isTypeScriptClassMemberModifier(): boolean;
    isTypeScriptTypeParameterModifier(): boolean;
    canParseTypeScriptTypeParameterModifier(parser: TypeScriptSyntaxParser): boolean;
    validateTypeScriptTypeParameterModifier(context: TypeScriptParserContext, accepted: TypeScriptTypeParameterAnnotations,
      writtenAnnotations: TypeScriptTypeParameterAnnotations): TypeScriptTypeParameterAnnotations;
    isTypeScriptTypeMemberModifier(): boolean;
    canFollowTypeScriptOptionalParameterMarker(): boolean;
    isTypeScriptFunctionTypeParameterIndicator(): boolean;
    isTypeScriptIndexSignatureParameterIndicator(parser: TypeScriptSyntaxParser): boolean;
    isTypeScriptAssignmentOperator(): boolean;
    isTypeScriptPrefixUnaryOperator(): boolean;
    isTypeScriptPredefinedTypeKeyword(): boolean;
    isTypeScriptLiteralTypeToken(): boolean;
    isTypeScriptStringOrNumericLiteral(): boolean;
    isTypeScriptTemplateStart(): this is TypeScriptNoSubstitutionTemplateLiteralNode | TypeScriptTemplateHeadNode;
    canStartTypeScriptPropertyName(): boolean;
    isTypeScriptAccessName(): boolean;
    isTypeScriptModuleExportName(): boolean;
    isTypeScriptIdentifierName(): boolean;
    getTypeScriptDiagnosticText(): string;
    getTypeScriptTokenValue(): string | undefined;
    isTypeScriptBindingIdentifier(): boolean;
    isTypeScriptAsyncFunctionStart(parser: TypeScriptSyntaxParser): boolean;
    canStartTypeScriptBindingName(): boolean;
    isTypeScriptTypeOperator(): boolean;
    canStartTypeScriptType(parser: TypeScriptSyntaxParser): boolean;
    toTypeScriptBindingName(): Node | undefined;
    toTypeScriptBindingElement(): TypeScriptBindingElementNode | undefined;
    toTypeScriptParameter(): TypeScriptParameterNode | undefined;
  }
}

Node.prototype.getTypeScriptPrecedence = function (this: Node): TypeScriptOperatorPrecedence {
  return TypeScriptOperatorPrecedence.None;
};

Node.prototype.getTypeScriptAssociativity = function (this: Node): TypeScriptAssociativity {
  return TypeScriptAssociativity.None;
};

Node.prototype.hasTypeScriptKeywordEscape = function (this: Node): boolean {
  return false;
};

Node.prototype.parseTypeScriptExport = function (this: Node, parser: TypeScriptSyntaxParser, exportKeywordNode: TypeScriptExportKeywordNode, modifierNodes: readonly Node[]): Node {
  return parser.parseExportDeclaration(exportKeywordNode, modifierNodes);
};

Node.prototype.isTypeScriptModuleExportName = function (this: Node): boolean {
  return this.isTypeScriptIdentifierName();
};

Node.prototype.isTypeScriptIdentifierName = function (this: Node): boolean {
  return false;
};

Node.prototype.getTypeScriptDiagnosticText = function (this: Node): string {
  return String.empty;
};

Node.prototype.getTypeScriptTokenValue = function (this: Node): string | undefined {
  return undefined;
};

Node.prototype.isTypeScriptSwitchClauseStart = function (this: Node): boolean {
  return false;
};

Node.prototype.isTypeScriptUnexpectedStatementToken = function (this: Node, parser: TypeScriptSyntaxParser): boolean {
  return this.isTypeScriptAssignmentOperator() || this.isTypeScriptMisplacedModifier(parser);
};

Node.prototype.reportTypeScriptUnexpectedStatementToken = function (this: Node, parser: TypeScriptSyntaxParser, kind: TypeScriptListKind): void {
  parser.context.diagnosticCollector.addTypeScriptParseDiagnostic(
    kind === TypeScriptListKind.SwitchClauseStatements ? TypeScriptDiagnosticTemplates.TS1129 : TypeScriptDiagnosticTemplates.TS1128, this.span);
};

Node.prototype.parseTypeScriptSwitchClause = function (this: Node, _parser: TypeScriptSyntaxParser): TypeScriptCaseClauseNode | TypeScriptDefaultClauseNode | undefined {
  return undefined;
};

Node.prototype.isTypeScriptDeclarationKeyword = function (this: Node, parser: TypeScriptSyntaxParser): boolean {
  return this.isTypeScriptDeclarationStart(parser);
};

Node.prototype.isTypeScriptDeclarationStart = function (this: Node, _parser: TypeScriptSyntaxParser): boolean {
  return false;
};

Node.prototype.isTypeScriptConstructorDeclarationStart = function (
  this: Node, _parser: TypeScriptSyntaxParser): this is TypeScriptConstructorKeywordNode | TypeScriptStringLiteralNode {
  return false;
};

Node.prototype.isTypeScriptDeclarationModifier = function (this: Node): boolean {
  return false;
};

Node.prototype.isTypeScriptDeclarationStartModifier = function (this: Node): boolean {
  return false;
};

Node.prototype.canParseTypeScriptDeclarationModifier = function (this: Node, parser: TypeScriptSyntaxParser): boolean {
  return this.isTypeScriptDeclarationModifier() && this.hasTypeScriptModifierFollower(parser);
};

Node.prototype.hasTypeScriptModifierFollower = function (this: Node, parser: TypeScriptSyntaxParser): boolean {
  return this.hasTypeScriptSameLineModifierFollower(parser);
};

Node.prototype.hasTypeScriptSameLineModifierFollower = function (this: Node, parser: TypeScriptSyntaxParser): boolean {
  return parser.lookAhead(() => {
    parser.advance();
    return !parser.hasPrecedingLineBreak() && parser.currentNode.canFollowTypeScriptModifier();
  });
};

Node.prototype.canParseTypeScriptClassMemberModifier = function (this: Node, parser: TypeScriptSyntaxParser): boolean {
  return this.isTypeScriptClassMemberModifier() && !this.startsTypeScriptClassStaticBlock(parser) && this.hasTypeScriptModifierFollower(parser);
};

Node.prototype.isTypeScriptAsyncFunctionStart = function (this: Node, _parser: TypeScriptSyntaxParser): boolean {
  return false;
};

Node.prototype.isTypeScriptIdentifier = function (this: Node, _context: TypeScriptParserContext): boolean {
  return this.isTypeScriptBindingIdentifier();
};

Node.prototype.isTypeScriptTypeAliasStart = function (this: Node, _parser: TypeScriptSyntaxParser): this is TypeScriptTypeKeywordNode {
  return false;
};

Node.prototype.isTypeScriptAwaitExpressionStart = function (this: Node, _parser: TypeScriptSyntaxParser): this is TypeScriptAwaitKeywordNode {
  return false;
};

Node.prototype.isTypeScriptYieldExpressionStart = function (this: Node, _parser: TypeScriptSyntaxParser): this is TypeScriptYieldKeywordNode {
  return false;
};

Node.prototype.canFollowTypeScriptUnscopedAwaitOrYield = function (this: Node): boolean {
  return false;
};

Node.prototype.canStartTypeScriptExpression = function (this: Node, _parser: TypeScriptSyntaxParser): boolean {
  return this.isTypeScriptBindingIdentifier() || this.isTypeScriptPrefixUnaryOperator() || this.isTypeScriptTemplateStart()
    || this.getTypeScriptPrecedence() !== TypeScriptOperatorPrecedence.None;
};

Node.prototype.canStartTypeScriptLeftHandSideExpression = function (this: Node, parser: TypeScriptSyntaxParser): boolean {
  return this.isTypeScriptIdentifier(parser.context);
};

Node.prototype.canStartTypeScriptPrimaryExpression = function (this: Node, parser: TypeScriptSyntaxParser): boolean {
  return this.canStartTypeScriptLeftHandSideExpression(parser);
};

Node.prototype.canStartTypeScriptHeritageExpression = function (this: Node, parser: TypeScriptSyntaxParser): boolean {
  return this.canStartTypeScriptLeftHandSideExpression(parser);
};

Node.prototype.toTypeScriptBindingName = function (this: Node): Node | undefined {
  return undefined;
};

Node.prototype.toTypeScriptBindingElement = function (this: Node): TypeScriptBindingElementNode | undefined {
  const nameNode = this.toTypeScriptBindingName();
  if (Object.isUndefined(nameNode))
    return undefined;

  return new TypeScriptBindingElementNode(
    this.span, nameNode, undefined, undefined, undefined, undefined, undefined, this.leadingTrivia, this.trailingTrivia);
};

Node.prototype.toTypeScriptParameter = function (this: Node): TypeScriptParameterNode | undefined {
  const elementNode = this.toTypeScriptBindingElement();
  if (Object.isUndefined(elementNode))
    return undefined;

  return new TypeScriptParameterNode(
    [],
    this.span,
    elementNode.nameNode,
    elementNode.dotDotDotNode,
    undefined,
    undefined,
    undefined,
    elementNode.equalsNode,
    elementNode.initializerNode,
    this.leadingTrivia,
    this.trailingTrivia);
};

Node.prototype.validateTypeScriptAssignmentTarget = function (this: Node): void {
};

Node.prototype.hasTypeScriptArrowFunctionBlockingParseError = function (this: Node): boolean {
  return false;
};

Node.prototype.isTypeScriptParameterModifier = function (this: Node): boolean {
  return false;
};

Node.prototype.canParseTypeScriptParameterModifier = function (this: Node, parser: TypeScriptSyntaxParser): boolean {
  return this.isTypeScriptParameterModifier() && this.hasTypeScriptModifierFollower(parser);
};

Node.prototype.isTypeScriptForVariableDeclarationStart = function (this: Node, _parser: TypeScriptSyntaxParser): this is TypeScriptConstKeywordNode | TypeScriptLetKeywordNode | TypeScriptVarKeywordNode | TypeScriptUsingKeywordNode | TypeScriptAwaitKeywordNode {
  return this.isTypeScriptVariableDeclarationKeyword();
};

Node.prototype.isTypeScriptVariableDeclarationKeyword = function (this: Node): this is TypeScriptConstKeywordNode | TypeScriptLetKeywordNode | TypeScriptVarKeywordNode | TypeScriptUsingKeywordNode {
  return false;
};

Node.prototype.isTypeScriptLeftHandSideExpression = function (this: Node): boolean {
  return false;
};

Node.prototype.isTypeScriptExternalModuleIndicator = function (this: Node): boolean {
  return false;
};

Node.prototype.isTypeScriptDeclarationStatement = function (this: Node): boolean {
  return false;
};

Node.prototype.requiresTypeScriptDeclareModifier = function (this: Node): boolean {
  return false;
};

Node.prototype.isTypeScriptDeclarationFileModifier = function (this: Node): boolean {
  return false;
};

Node.prototype.isTypeScriptAsyncIdentifier = function (this: Node): boolean {
  return false;
};

Node.prototype.isTypeScriptParameterPropertyModifier = function (this: Node): boolean {
  return false;
};

Node.prototype.isTypeScriptReference = function (this: Node): boolean {
  return this.isTypeScriptBindingIdentifier();
};

Node.prototype.isTypeScriptAccessExpression = function (this: Node): boolean {
  return false;
};

Node.prototype.isTypeScriptNonArithmeticLiteral = function (this: Node): boolean {
  return false;
};

Node.prototype.isTypeScriptOptionalChain = function (this: Node): boolean {
  for (let node: Node | undefined = this; !Object.isUndefined(node); node = node.getTypeScriptChainOperand())
    if (node.hasTypeScriptQuestionDot())
      return true;
  return false;
};

Node.prototype.getTypeScriptChainOperand = function (this: Node): Node | undefined {
  return undefined;
};

Node.prototype.hasTypeScriptQuestionDot = function (this: Node): boolean {
  return false;
};

Node.prototype.skipTypeScriptOuterExpressions = function (this: Node): Node {
  let node: Node = this;
  for (let operandNode = node.getTypeScriptOuterExpressionOperand(); !Object.isUndefined(operandNode); operandNode = node.getTypeScriptOuterExpressionOperand())
    node = operandNode;
  return node;
};

Node.prototype.getTypeScriptOuterExpressionOperand = function (this: Node): Node | undefined {
  return undefined;
};

Node.prototype.getTypeScriptUnparenthesizedExpression = function (this: Node): Node {
  return this;
};

Node.prototype.validateTypeScriptReference = function (this: Node, context: TypeScriptParserContext, invalidTemplate: DiagnosticTemplate,
  optionalChainTemplate: DiagnosticTemplate): void {
  const targetNode = this.skipTypeScriptOuterExpressions();
  if (!targetNode.isTypeScriptReference())
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, invalidTemplate, this.span);
  else if (targetNode.isTypeScriptOptionalChain())
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, optionalChainTemplate, this.span);
};

Node.prototype.validateTypeScriptIterationInitializer = function (this: Node, context: TypeScriptParserContext, isForOf: boolean): void {
  if (isForOf)
    this.validateTypeScriptReference(context, TypeScriptDiagnosticTemplates.TS2487, TypeScriptDiagnosticTemplates.TS2781);
  else
    this.validateTypeScriptReference(context, TypeScriptDiagnosticTemplates.TS2406, TypeScriptDiagnosticTemplates.TS2780);
};

Node.prototype.validateTypeScriptDestructuringTarget = function (this: Node, context: TypeScriptParserContext): void {
  this.validateTypeScriptReference(context, TypeScriptDiagnosticTemplates.TS2364, TypeScriptDiagnosticTemplates.TS2779);
};

Node.prototype.reportTypeScriptInitializersWithoutImplementation = function (this: Node, _context: TypeScriptParserContext, _isTypeRead: boolean): void {
};

Node.prototype.readsTypeScriptDeclaredType = function (this: Node, _isSignatureParameter: boolean): boolean {
  return false;
};

Node.prototype.getTypeScriptQuickTypeSkippedSpan = function (this: Node): SourceSpan | undefined {
  return undefined;
};

Node.prototype.isTypeScriptQuickTypedCallee = function (this: Node): boolean {
  return true;
};

Node.prototype.readsTypeScriptContextualType = function (this: Node): boolean {
  return false;
};

Node.prototype.passesTypeScriptContextualTypeToRightOperand = function (this: Node): boolean {
  return false;
};

Node.prototype.passesTypeScriptContextualTypeToLeftOperand = function (this: Node): boolean {
  return false;
};

Node.prototype.isTypeScriptConstReference = function (this: Node): boolean {
  return false;
};

Node.prototype.validateTypeScriptPredicateParameter = function (this: Node, _context: TypeScriptParserContext,
  _parameterNodes: readonly TypeScriptParameterNode[]): void {
};

Node.prototype.hasTypeScriptBindingName = function (this: Node, name: string): boolean {
  return this.isTypeScriptBindingIdentifier() && this.getTypeScriptDiagnosticText() === name;
};

Node.prototype.reportTypeScriptAmbientResourceDeclaration = function (this: Node, _context: TypeScriptParserContext): void {
};

Node.prototype.reportTypeScriptRestInitializer = function (this: Node, _context: TypeScriptParserContext): void {
};

Node.prototype.reportTypeScriptCommaComputedName = function (this: Node, _context: TypeScriptParserContext): void {
};

Node.prototype.reportTypeScriptSignatureInitializer = function (this: Node, _context: TypeScriptParserContext, _isInterface: boolean): void {
};

Node.prototype.readsTypeScriptModifierListItself = function (this: Node): boolean {
  return false;
};

Node.prototype.canFollowTypeScriptTypeArguments = function (this: Node, parser: TypeScriptSyntaxParser): boolean {
  return parser.hasPrecedingLineBreak() || this.getTypeScriptPrecedence() !== TypeScriptOperatorPrecedence.None || !this.canStartTypeScriptExpression(parser);
};

Node.prototype.isTypeScriptSingleGreaterThan = function (this: Node, _parser: TypeScriptSyntaxParser): boolean {
  return false;
};

Node.prototype.reportTypeScriptInstantiationAccess = function (this: Node, _parser: TypeScriptSyntaxParser): void {
};

Node.prototype.canStartTypeScriptStatement = function (this: Node, parser: TypeScriptSyntaxParser): boolean {
  return this.canStartTypeScriptExpression(parser) || this.isTypeScriptDeclarationStart(parser);
};

Node.prototype.canStartTypeScriptVariableDeclaration = function (this: Node): boolean {
  return this.canStartTypeScriptBindingName();
};

Node.prototype.reportTypeScriptInvalidVariableDeclaration = function (this: Node, parser: TypeScriptSyntaxParser): void {
  parser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1134, this.span);
};

Node.prototype.isTypeScriptVariableStatementStart = function (
  this: Node,
  _parser: TypeScriptSyntaxParser): this is TypeScriptConstKeywordNode | TypeScriptLetKeywordNode | TypeScriptVarKeywordNode | TypeScriptUsingKeywordNode | TypeScriptAwaitKeywordNode {
  return this.isTypeScriptVariableDeclarationKeyword();
};

Node.prototype.canStartTypeScriptSignature = function (this: Node): boolean {
  return false;
};

Node.prototype.canStartTypeScriptGenericList = function (this: Node): boolean {
  return false;
};

Node.prototype.isTypeScriptUpdateOperator = function (this: Node): boolean {
  return false;
};

Node.prototype.canFollowTypeScriptModifier = function (this: Node): boolean {
  return this.canStartTypeScriptPropertyName();
};

Node.prototype.canFollowTypeScriptDefaultKeyword = function (this: Node, _parser: TypeScriptSyntaxParser): boolean {
  return false;
};

Node.prototype.canFollowTypeScriptExportKeyword = function (this: Node, _parser: TypeScriptSyntaxParser): boolean {
  return this.canFollowTypeScriptExportModifier();
};

Node.prototype.canFollowTypeScriptExportModifier = function (this: Node): boolean {
  return !this.isTypeScriptExportClauseStart() && this.canFollowTypeScriptModifier();
};

Node.prototype.isTypeScriptExportFormStart = function (this: Node, _parser: TypeScriptSyntaxParser): boolean {
  return this.isTypeScriptExportClauseStart();
};

Node.prototype.isTypeScriptExportClauseStart = function (this: Node): boolean {
  return false;
};

Node.prototype.isTypeScriptLogicalOperator = function (this: Node): this is ValueNode {
  return false;
};

Node.prototype.getTypeScriptLogicalOperatorNode = function (this: Node): ValueNode | undefined {
  return undefined;
};

Node.prototype.getTypeScriptNullishOperatorNode = function (this: Node): ValueNode | undefined {
  return undefined;
};

Node.prototype.isTypeScriptOptionalParameter = function (this: Node): boolean {
  return false;
};

Node.prototype.isTypeScriptRestElement = function (this: Node): boolean {
  return false;
};

Node.prototype.stopsTypeScriptIndexSignatureAtItsParameter = function (this: Node): boolean {
  return true;
};

Node.prototype.containsTypeScriptLineBreak = function (this: Node): boolean {
  return false;
};

Node.prototype.reportTypeScriptUnaryExponentiationDiagnostic = function (
  this: Node,
  _parser: TypeScriptSyntaxParser,
  _expressionNode: Node): void {
};

Node.prototype.reportTypeScriptMissingSemicolon = function (this: Node, parser: TypeScriptSyntaxParser): void {
  parser.reportExpected(Resources.semicolon);
};

Node.prototype.canStartTypeScriptBindingName = function (this: Node): boolean {
  return this.isTypeScriptBindingIdentifier();
};

Node.prototype.reLexTypeScriptBinaryOperator = function (this: Node, _parser: TypeScriptSyntaxParser): void {
};

Node.prototype.canFollowTypeScriptOptionalParameterMarker = function (this: Node): boolean {
  return false;
};

Node.prototype.isTypeScriptFunctionTypeParameterIndicator = function (this: Node): boolean {
  return false;
};

Node.prototype.isTypeScriptIndexSignatureParameterIndicator = function (this: Node, _parser: TypeScriptSyntaxParser): boolean {
  return false;
};

Node.prototype.isTypeScriptClassMemberModifier = function (this: Node): boolean {
  return false;
};

Node.prototype.isTypeScriptTypeParameterModifier = function (this: Node): boolean {
  return false;
};

Node.prototype.validateTypeScriptTypeParameterModifier = function (this: Node, context: TypeScriptParserContext,
  _accepted: TypeScriptTypeParameterAnnotations, _writtenAnnotations: TypeScriptTypeParameterAnnotations): TypeScriptTypeParameterAnnotations {
  context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1273, this.span, [context.source.getText(this.span)]);

  return TypeScriptTypeParameterAnnotations.None;
};

Node.prototype.canParseTypeScriptTypeParameterModifier = function (this: Node, parser: TypeScriptSyntaxParser): boolean {
  return this.isTypeScriptTypeParameterModifier() && this.hasTypeScriptModifierFollower(parser);
};

Node.prototype.isTypeScriptTypeMemberModifier = function (this: Node): boolean {
  return false;
};

Node.prototype.isTypeScriptAssignmentOperator = function (this: Node): boolean {
  return false;
};

Node.prototype.isTypeScriptPrefixUnaryOperator = function (this: Node): boolean {
  return false;
};

Node.prototype.isTypeScriptPredefinedTypeKeyword = function (this: Node): boolean {
  return false;
};

Node.prototype.isTypeScriptLiteralTypeToken = function (this: Node): boolean {
  return false;
};

Node.prototype.isTypeScriptStringOrNumericLiteral = function (this: Node): boolean {
  return false;
};

Node.prototype.isTypeScriptTemplateStart = function (this: Node): this is TypeScriptNoSubstitutionTemplateLiteralNode | TypeScriptTemplateHeadNode {
  return false;
};

Node.prototype.canStartTypeScriptPropertyName = function (this: Node): boolean {
  return false;
};

Node.prototype.isTypeScriptAccessName = function (this: Node): boolean {
  return false;
};

Node.prototype.isTypeScriptBindingIdentifier = function (this: Node): boolean {
  return false;
};

Node.prototype.isTypeScriptTypeOperator = function (this: Node): boolean {
  return false;
};

Node.prototype.canStartTypeScriptType = function (this: Node, _parser: TypeScriptSyntaxParser): boolean {
  return this.isTypeScriptBindingIdentifier() || this.isTypeScriptPredefinedTypeKeyword()
    || this.isTypeScriptLiteralTypeToken() || this.isTypeScriptTypeOperator() || this.canStartTypeScriptSignature();
};

Node.prototype.getTypeScriptClosingDelimiterType = function (this: Node): NodeType<Node> | undefined {
  return undefined;
};

Node.prototype.isTypeScriptClosingDelimiter = function (this: Node): boolean {
  return false;
};

Node.prototype.parseTypeScriptPrimaryExpression = function (this: Node, parser: TypeScriptSyntaxParser): Node {
  if (this.isTypeScriptIdentifier(parser.context))
    return parser.consumeName();

  this.reLexTypeScriptBinaryOperator(parser);
  return this.reportTypeScriptMissingExpression(parser);
};

Node.prototype.reportTypeScriptMissingExpression = function (this: Node, parser: TypeScriptSyntaxParser): TypeScriptMissingExpressionNode {
  parser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1109, this.getTypeScriptMissingNodeDiagnosticSpan());
  return new TypeScriptMissingExpressionNode(this.getTypeScriptMissingNodeSpan());
};

Node.prototype.parseTypeScriptStatement = function (this: Node, parser: TypeScriptSyntaxParser): Node {
  return this.isTypeScriptDeclarationStartModifier() && parser.isDeclarationStart() ? parser.parseDeclaration() : parser.parseExpressionOrLabeledStatement();
};

Node.prototype.parseTypeScriptUnaryExpression = function (this: Node, parser: TypeScriptSyntaxParser): Node {
  return parser.parsePostfixUnaryExpression();
};

Node.prototype.parseTypeScriptMemberExpression = function (this: Node, parser: TypeScriptSyntaxParser): Node {
  return parser.parsePrimaryExpression();
};

Node.prototype.parseTypeScriptMemberSuffix = function (this: Node, _parser: TypeScriptSyntaxParser, _expressionNode: Node): Node | undefined {
  return undefined;
};

Node.prototype.parseTypeScriptLeftHandSideSuffix = function (this: Node, parser: TypeScriptSyntaxParser, expressionNode: Node): Node | undefined {
  return this.parseTypeScriptMemberSuffix(parser, expressionNode);
};

Node.prototype.tryParseTypeScriptAssignmentStart = function (this: Node, _parser: TypeScriptSyntaxParser): Node | undefined {
  return undefined;
};

Node.prototype.parseTypeScriptBinaryExpression = function (
  this: Node,
  parser: TypeScriptSyntaxParser,
  leftNode: Node,
  minimumPrecedence: number): Node | undefined {
  return parser.parseBinaryOperator(this, leftNode, minimumPrecedence);
};

Node.prototype.validateTypeScriptBinaryOperands = function (this: Node, _context: TypeScriptParserContext, _leftNode: Node, _rightNode: Node): void {
};

Node.prototype.parseTypeScriptOptionalChainSuffix = function (
  this: Node,
  parser: TypeScriptSyntaxParser,
  expressionNode: Node,
  questionDotNode: TypeScriptQuestionDotNode): Node {
  return parser.parsePropertyAccessExpression(expressionNode, questionDotNode);
};

Node.prototype.validateTypeScriptGrammar = function (this: Node, _context: TypeScriptParserContext): void {
};

Node.prototype.readTypeScriptDeclarations = function (this: Node, _context: TypeScriptParserContext, _holder: TypeScriptDeclarationListHolder): void {
};

Node.prototype.reportTypeScriptLetNames = function (this: Node, _context: TypeScriptParserContext): void {
};

Node.prototype.reportTypeScriptGrammarAfterModifiers = function (this: Node, _context: TypeScriptParserContext,
  _hasModifierDiagnostics: boolean): void {
};

Node.prototype.getTypeScriptNameReservation = function (this: Node): TypeScriptNameReservation {
  return TypeScriptNameReservation.None;
};

Node.prototype.isTypeScriptEvalOrArgumentsName = function (this: Node): boolean {
  return false;
};

Node.prototype.isTypeScriptIterationStart = function (this: Node): boolean {
  return false;
};

Node.prototype.markTypeScriptPattern = function (this: Node, _context: TypeScriptParserContext): void {
};

Node.prototype.getTypeScriptEffectivePropertyName = function (this: Node, _context: TypeScriptParserContext): string | undefined {
  return this.getTypeScriptDiagnosticText();
};

Node.prototype.readTypeScriptEvalOrArgumentsNames = function (this: Node, _parser: TypeScriptSyntaxParser): void {
};

Node.prototype.validateTypeScriptIdentifierName = function (this: Node, _context: TypeScriptParserContext): void {
};

Node.prototype.getTypeScriptAllowedModifiers = function (this: Node): TypeScriptModifierFlags {
  return TypeScriptModifierFlags.All;
};

Node.prototype.getTypeScriptAbstractRejection = function (this: Node): DiagnosticTemplate | undefined {
  return undefined;
};

Node.prototype.getTypeScriptThisParameterRejection = function (this: Node): DiagnosticTemplate | undefined {
  return undefined;
};

Node.prototype.hasTypeScriptBody = function (this: Node): boolean {
  return false;
};

Node.prototype.isTypeScriptModifierReadAfterList = function (this: Node): boolean {
  return false;
};

Node.prototype.getTypeScriptModifierRejection = function (this: Node, _context: TypeScriptParserContext,
  _modifierNode: Node): DiagnosticTemplate | undefined {
  return undefined;
};

Node.prototype.getTypeScriptDeclarationNameSpan = function (this: Node, _context: TypeScriptParserContext): SourceSpan {
  return this.span;
};

Node.prototype.getTypeScriptFirstTokenSpan = function (this: Node): SourceSpan {
  let node: Node = this;
  for (let childNode = node.getTypeScriptFirstChild(); !Object.isUndefined(childNode); childNode = node.getTypeScriptFirstChild())
    node = childNode;
  return node === this ? this.span : node.getTypeScriptFirstTokenSpan();
};

Node.prototype.getTypeScriptFirstChild = function (this: Node): Node | undefined {
  return undefined;
};

Node.prototype.getTypeScriptDecoratorSupport = function (this: Node): TypeScriptDecoratorSupport {
  return TypeScriptDecoratorSupport.Unsupported;
};

Node.prototype.getTypeScriptDecoratorSyntaxError = function (this: Node): Node | undefined {
  let errorNode: Node | undefined;
  let isCallAllowed = true;
  for (let node: Node | undefined = this; !Object.isUndefined(node); node = node.getTypeScriptDecoratorChainOperand()) {
    errorNode = node.getTypeScriptDecoratorLinkError(isCallAllowed) ?? errorNode;
    isCallAllowed &&= node.keepsTypeScriptDecoratorCallAllowed();
  }
  return errorNode;
};

Node.prototype.getTypeScriptDecoratorChainOperand = function (this: Node): Node | undefined {
  return undefined;
};

Node.prototype.getTypeScriptDecoratorLinkError = function (this: Node, _isCallAllowed: boolean): Node | undefined {
  return this.isTypeScriptBindingIdentifier() ? undefined : this;
};

Node.prototype.keepsTypeScriptDecoratorCallAllowed = function (this: Node): boolean {
  return false;
};

Node.prototype.validateTypeScriptModifierForDeclaration = function (this: Node, _context: TypeScriptParserContext, _declarationNode: Node): void {
};

Node.prototype.validateTypeScriptModifier = function (this: Node, context: TypeScriptParserContext,
  target: TypeScriptModifierTarget, _writtenFlags: TypeScriptModifierFlags, _declarationNode: Node): TypeScriptModifierFlags {
  if (target === TypeScriptModifierTarget.TypeMember)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1070, this.span, [context.source.getText(this.span)]);

  return TypeScriptModifierFlags.None;
};

Node.prototype.parseTypeScriptPrimaryType = function (this: Node, parser: TypeParser): Node {
  return parser.parseReferenceType();
};

Node.prototype.canStartTypeScriptParameter = function (this: Node, parser: TypeScriptSyntaxParser): boolean {
  return this.canStartTypeScriptBindingName() || this.isTypeScriptDeclarationModifier() || this.isTypeScriptClassMemberModifier() || this.canStartTypeScriptType(parser);
};

Node.prototype.canStartTypeScriptTypeParameter = function (this: Node): boolean {
  return this.isTypeScriptBindingIdentifier();
};

Node.prototype.getTypeScriptModifierNodes = function (this: Node): readonly Node[] {
  return [];
};

Node.prototype.endsTypeScriptBinaryExpression = function (this: Node, _parser: TypeScriptSyntaxParser, _lastOperandNode: Node): boolean {
  return false;
};

Node.prototype.reportTypeScriptReservedTypeName = function (this: Node, context: TypeScriptParserContext, template: DiagnosticTemplate): void {
  if (this.isTypeScriptPredefinedTypeKeyword())
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, template, this.span, [this.getTypeScriptDiagnosticText()]);
};

Node.prototype.getTypeScriptFullSpan = function (this: Node): SourceSpan {
  const startOffset = this.leadingTrivia?.span.startOffset ?? this.span.startOffset;
  return new SourceSpan(startOffset, this.span.endOffset - startOffset);
};

Node.prototype.reportTypeScriptInvalidBindingName = function (this: Node, parser: TypeScriptSyntaxParser): void {
  parser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1003, this.getTypeScriptMissingNodeDiagnosticSpan());
};

Node.prototype.canStartTypeScriptRecoveryStatement = function (this: Node, parser: TypeScriptSyntaxParser): boolean {
  return !this.isTypeScriptMisplacedModifier(parser) && this.canStartTypeScriptStatement(parser);
};

Node.prototype.canStartTypeScriptTypeMember = function (this: Node, parser: TypeScriptSyntaxParser): boolean {
  return this.canStartTypeScriptSignature() || parser.lookAhead(() => {
    let hasName = false;
    while (parser.currentNode.isTypeScriptDeclarationModifier()) {
      hasName = true;
      parser.advance();
    }
    if (parser.currentNode instanceof TypeScriptOpenBracketNode)
      return true;
    if (parser.currentNode.canStartTypeScriptPropertyName()) {
      hasName = true;
      parser.consumeIdentifierName();
    }
    return hasName && (parser.currentNode.canStartTypeScriptSignature() || parser.currentNode instanceof TypeScriptQuestionNode
      || parser.currentNode instanceof TypeScriptColonNode || parser.currentNode instanceof TypeScriptCommaNode || parser.canParseStatementTerminator());
  });
};

Node.prototype.startsTypeScriptFromClause = function (this: Node, _parser: TypeScriptSyntaxParser): boolean {
  return false;
};

Node.prototype.isTypeScriptListElement = function (this: Node, kind: TypeScriptListKind, parser: TypeScriptSyntaxParser): boolean {
  switch (kind) {
    case TypeScriptListKind.SourceElements:
    case TypeScriptListKind.BlockStatements:
    case TypeScriptListKind.SwitchClauseStatements:
      return this.canStartTypeScriptRecoveryStatement(parser);
    case TypeScriptListKind.SwitchClauses:
      return this.isTypeScriptSwitchClauseStart();
    case TypeScriptListKind.TypeMembers:
      return this.canStartTypeScriptTypeMember(parser);
    case TypeScriptListKind.ClassMembers:
      return !(this instanceof TypeScriptSemicolonNode) && this.canStartTypeScriptClassMember(parser);
    case TypeScriptListKind.EnumMembers:
      return this.canStartTypeScriptPropertyName();
    case TypeScriptListKind.HeritageClauseElement:
      return (this instanceof TypeScriptOpenBraceNode || this.isTypeScriptIdentifier(parser.context)) && this.canStartTypeScriptHeritageExpression(parser);
    case TypeScriptListKind.VariableDeclarations:
      return this.canStartTypeScriptVariableDeclaration();
    case TypeScriptListKind.ObjectBindingElements:
      return this.canStartTypeScriptPropertyName() || this instanceof TypeScriptDotDotDotNode;
    case TypeScriptListKind.ArrayBindingElements:
      return this.canStartTypeScriptVariableDeclaration() || this instanceof TypeScriptDotDotDotNode || this instanceof TypeScriptCommaNode;
    case TypeScriptListKind.ArgumentExpressions:
      return this.canStartTypeScriptExpression(parser) || this instanceof TypeScriptDotDotDotNode;
    case TypeScriptListKind.ObjectLiteralMembers:
      return this.canStartTypeScriptPropertyName() || this instanceof TypeScriptAsteriskNode || this instanceof TypeScriptDotDotDotNode
        || this instanceof TypeScriptDotNode;
    case TypeScriptListKind.ArrayLiteralMembers:
      return this.canStartTypeScriptExpression(parser) || this instanceof TypeScriptDotDotDotNode || this instanceof TypeScriptCommaNode
        || this instanceof TypeScriptDotNode;
    case TypeScriptListKind.Parameters:
      return this.canStartTypeScriptParameter(parser);
    case TypeScriptListKind.TypeParameters:
      return this.canStartTypeScriptTypeParameter() && (!this.isTypeScriptBindingIdentifier() || this.isTypeScriptIdentifier(parser.context));
    case TypeScriptListKind.TypeArguments:
      return this instanceof TypeScriptCommaNode || this instanceof TypeScriptDotDotDotNode
        || this.canStartTypeScriptType(parser) && (!this.isTypeScriptBindingIdentifier() || this.isTypeScriptIdentifier(parser.context));
    case TypeScriptListKind.TupleElementTypes:
      return this instanceof TypeScriptCommaNode || this instanceof TypeScriptDotDotDotNode || this.canStartTypeScriptType(parser);
    case TypeScriptListKind.HeritageClauses:
      return this instanceof TypeScriptExtendsKeywordNode || this instanceof TypeScriptImplementsKeywordNode;
    case TypeScriptListKind.ImportOrExportSpecifiers:
      return this.isTypeScriptModuleExportName() && !this.startsTypeScriptFromClause(parser);
    case TypeScriptListKind.ImportAttributes:
      return this.isTypeScriptModuleExportName();
  }
};

Node.prototype.isTypeScriptListTerminator = function (this: Node, kind: TypeScriptListKind, parser: TypeScriptSyntaxParser): boolean {
  switch (kind) {
    case TypeScriptListKind.SourceElements:
      return false;
    case TypeScriptListKind.BlockStatements:
    case TypeScriptListKind.SwitchClauses:
    case TypeScriptListKind.TypeMembers:
    case TypeScriptListKind.ClassMembers:
    case TypeScriptListKind.EnumMembers:
    case TypeScriptListKind.ObjectLiteralMembers:
    case TypeScriptListKind.ObjectBindingElements:
    case TypeScriptListKind.ImportOrExportSpecifiers:
    case TypeScriptListKind.ImportAttributes:
      return this instanceof TypeScriptCloseBraceNode;
    case TypeScriptListKind.SwitchClauseStatements:
      return this instanceof TypeScriptCloseBraceNode || this.isTypeScriptSwitchClauseStart();
    case TypeScriptListKind.HeritageClauseElement:
      return this instanceof TypeScriptOpenBraceNode || this instanceof TypeScriptExtendsKeywordNode || this instanceof TypeScriptImplementsKeywordNode;
    case TypeScriptListKind.VariableDeclarations:
      return parser.canParseStatementTerminator() || this instanceof TypeScriptInKeywordNode || this instanceof TypeScriptOfKeywordNode
        || this instanceof TypeScriptArrowNode;
    case TypeScriptListKind.TypeParameters:
      return this instanceof TypeScriptGreaterThanNode || this instanceof TypeScriptOpenParenthesisNode || this instanceof TypeScriptOpenBraceNode
        || this instanceof TypeScriptExtendsKeywordNode || this instanceof TypeScriptImplementsKeywordNode;
    case TypeScriptListKind.ArgumentExpressions:
      return this instanceof TypeScriptCloseParenthesisNode || this instanceof TypeScriptSemicolonNode;
    case TypeScriptListKind.ArrayLiteralMembers:
    case TypeScriptListKind.TupleElementTypes:
    case TypeScriptListKind.ArrayBindingElements:
      return this instanceof TypeScriptCloseBracketNode;
    case TypeScriptListKind.Parameters:
      return this instanceof TypeScriptCloseParenthesisNode || this instanceof TypeScriptCloseBracketNode;
    case TypeScriptListKind.TypeArguments:
      return !(this instanceof TypeScriptCommaNode);
    case TypeScriptListKind.HeritageClauses:
      return this instanceof TypeScriptOpenBraceNode || this instanceof TypeScriptCloseBraceNode;
  }
};

Node.prototype.canStartTypeScriptClassMember = function (this: Node, _parser: TypeScriptSyntaxParser): boolean {
  return this.canStartTypeScriptPropertyName();
};

Node.prototype.startsTypeScriptAccessor = function (this: Node, _parser: TypeScriptSyntaxParser): this is TypeScriptAccessorKindKeywordNode {
  return false;
};

Node.prototype.getTypeScriptObjectMemberKind = function (this: Node): TypeScriptObjectMemberKind {
  return TypeScriptObjectMemberKind.None;
};

Node.prototype.getTypeScriptObjectMemberName = function (this: Node): Node | undefined {
  return undefined;
};

Node.prototype.validateTypeScriptObjectLiteralMember = function (this: Node, _context: TypeScriptParserContext): void { };

Node.prototype.reportTypeScriptObjectMemberName = function (this: Node, _context: TypeScriptParserContext): void { };

Node.prototype.startsTypeScriptClassStaticBlock = function (this: Node, _parser: TypeScriptSyntaxParser): this is TypeScriptStaticKeywordNode {
  return false;
};

Node.prototype.isTypeScriptImportPhase = function (this: Node, _parser: TypeScriptSyntaxParser): this is TypeScriptTypeKeywordNode | TypeScriptDeferKeywordNode {
  return false;
};

Node.prototype.startsTypeScriptClassMember = function (this: Node): boolean {
  return false;
};

Node.prototype.validateTypeScriptOptionalChain = function (this: Node, _context: TypeScriptParserContext): void {
};

Node.prototype.isTypeScriptMisplacedModifier = function (this: Node, parser: TypeScriptSyntaxParser): boolean {
  return this.mustStartTypeScriptDeclarationBeforeName() && parser.lookAhead(() => {
    parser.advance();
    return !parser.hasPrecedingLineBreak() && parser.currentNode.isTypeScriptIdentifierName();
  }) && !parser.isDeclarationStart();
};

Node.prototype.mustStartTypeScriptDeclarationBeforeName = function (this: Node): boolean {
  return false;
};

Node.prototype.reportTypeScriptInvalidParameter = function (this: Node, parser: TypeScriptSyntaxParser): void {
  parser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1138, this.span);
};

Node.prototype.getTypeScriptMissingNodeDiagnosticSpan = function (this: Node): SourceSpan {
  return this.span;
};

Node.prototype.getTypeScriptMissingNodeSpan = function (this: Node): SourceSpan {
  return new SourceSpan(this.getTypeScriptFullSpan().startOffset, 0);
};
