/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { NodeType } from "@noldova/context.parsers";
import { Source, ValueNode } from "@noldova/context.parsers";
import * as api from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { TypeScriptLexerFixture } from "../fixtures/typescript-lexer.fixture.js";

@TestClass
export class TypeScriptKeywordNodeFactoryTests {
  private static readonly KEYWORDS: readonly (readonly [string, Function & NodeType])[] = [
    ["abstract", api.TypeScriptAbstractKeywordNode],
    ["accessor", api.TypeScriptAccessorKeywordNode],
    ["any", api.TypeScriptAnyKeywordNode],
    ["as", api.TypeScriptAsKeywordNode],
    ["assert", api.TypeScriptAssertKeywordNode],
    ["asserts", api.TypeScriptAssertsKeywordNode],
    ["async", api.TypeScriptAsyncKeywordNode],
    ["await", api.TypeScriptAwaitKeywordNode],
    ["bigint", api.TypeScriptBigIntKeywordNode],
    ["boolean", api.TypeScriptBooleanKeywordNode],
    ["break", api.TypeScriptBreakKeywordNode],
    ["case", api.TypeScriptCaseKeywordNode],
    ["catch", api.TypeScriptCatchKeywordNode],
    ["class", api.TypeScriptClassKeywordNode],
    ["const", api.TypeScriptConstKeywordNode],
    ["constructor", api.TypeScriptConstructorKeywordNode],
    ["continue", api.TypeScriptContinueKeywordNode],
    ["debugger", api.TypeScriptDebuggerKeywordNode],
    ["declare", api.TypeScriptDeclareKeywordNode],
    ["default", api.TypeScriptDefaultKeywordNode],
    ["defer", api.TypeScriptDeferKeywordNode],
    ["delete", api.TypeScriptDeleteKeywordNode],
    ["do", api.TypeScriptDoKeywordNode],
    ["else", api.TypeScriptElseKeywordNode],
    ["enum", api.TypeScriptEnumKeywordNode],
    ["export", api.TypeScriptExportKeywordNode],
    ["extends", api.TypeScriptExtendsKeywordNode],
    ["false", api.TypeScriptFalseKeywordNode],
    ["finally", api.TypeScriptFinallyKeywordNode],
    ["for", api.TypeScriptForKeywordNode],
    ["from", api.TypeScriptFromKeywordNode],
    ["function", api.TypeScriptFunctionKeywordNode],
    ["get", api.TypeScriptGetKeywordNode],
    ["global", api.TypeScriptGlobalKeywordNode],
    ["if", api.TypeScriptIfKeywordNode],
    ["immediate", api.TypeScriptImmediateKeywordNode],
    ["implements", api.TypeScriptImplementsKeywordNode],
    ["import", api.TypeScriptImportKeywordNode],
    ["in", api.TypeScriptInKeywordNode],
    ["infer", api.TypeScriptInferKeywordNode],
    ["instanceof", api.TypeScriptInstanceOfKeywordNode],
    ["interface", api.TypeScriptInterfaceKeywordNode],
    ["intrinsic", api.TypeScriptIntrinsicKeywordNode],
    ["is", api.TypeScriptIsKeywordNode],
    ["keyof", api.TypeScriptKeyOfKeywordNode],
    ["let", api.TypeScriptLetKeywordNode],
    ["module", api.TypeScriptModuleKeywordNode],
    ["namespace", api.TypeScriptNamespaceKeywordNode],
    ["never", api.TypeScriptNeverKeywordNode],
    ["new", api.TypeScriptNewKeywordNode],
    ["null", api.TypeScriptNullKeywordNode],
    ["number", api.TypeScriptNumberKeywordNode],
    ["object", api.TypeScriptObjectKeywordNode],
    ["of", api.TypeScriptOfKeywordNode],
    ["out", api.TypeScriptOutKeywordNode],
    ["override", api.TypeScriptOverrideKeywordNode],
    ["package", api.TypeScriptPackageKeywordNode],
    ["private", api.TypeScriptPrivateKeywordNode],
    ["protected", api.TypeScriptProtectedKeywordNode],
    ["public", api.TypeScriptPublicKeywordNode],
    ["readonly", api.TypeScriptReadonlyKeywordNode],
    ["require", api.TypeScriptRequireKeywordNode],
    ["return", api.TypeScriptReturnKeywordNode],
    ["satisfies", api.TypeScriptSatisfiesKeywordNode],
    ["set", api.TypeScriptSetKeywordNode],
    ["static", api.TypeScriptStaticKeywordNode],
    ["string", api.TypeScriptStringKeywordNode],
    ["super", api.TypeScriptSuperKeywordNode],
    ["switch", api.TypeScriptSwitchKeywordNode],
    ["symbol", api.TypeScriptSymbolKeywordNode],
    ["this", api.TypeScriptThisKeywordNode],
    ["throw", api.TypeScriptThrowKeywordNode],
    ["true", api.TypeScriptTrueKeywordNode],
    ["try", api.TypeScriptTryKeywordNode],
    ["type", api.TypeScriptTypeKeywordNode],
    ["typeof", api.TypeScriptTypeOfKeywordNode],
    ["undefined", api.TypeScriptUndefinedKeywordNode],
    ["unique", api.TypeScriptUniqueKeywordNode],
    ["unknown", api.TypeScriptUnknownKeywordNode],
    ["using", api.TypeScriptUsingKeywordNode],
    ["var", api.TypeScriptVarKeywordNode],
    ["void", api.TypeScriptVoidKeywordNode],
    ["while", api.TypeScriptWhileKeywordNode],
    ["with", api.TypeScriptWithKeywordNode],
    ["yield", api.TypeScriptYieldKeywordNode],
  ];

  @TestMethod
  public createsEveryTypeScriptKeywordNode(): void {
    for (const [keyword, nodeType] of TypeScriptKeywordNodeFactoryTests.KEYWORDS) {
      const node = this.lex(keyword);

      Assert.isInstanceOf(node, ValueNode);
      Assert.isInstanceOf(node, nodeType);
      Assert.areEqual(keyword, node.value);
    }
  }

  @TestMethod
  public leavesOrdinaryIdentifiersAsIdentifiers(): void {
    Assert.isInstanceOf(this.lex("identifier"), api.TypeScriptIdentifierNode);
  }

  @TestMethod
  public preservesSourceSpanAndLeadingTrivia(): void {
    const node = this.lex(" if");

    Assert.areEqual(1, node.span.startOffset);
    Assert.areEqual(2, node.span.length);
    Assert.isDefined(node.leadingTrivia);
  }

  private lex(value: string): ValueNode {
    const node = TypeScriptLexerFixture.create(new Source(value, "source.ts")).lex();
    Assert.isInstanceOf(node, ValueNode);
    return node;
  }
}
