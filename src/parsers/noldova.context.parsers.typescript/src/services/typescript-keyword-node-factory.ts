/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import type { Node, SourceSpan, ValueNodeType } from "@noldova/context.parsers";

import { TypeScriptAbstractKeywordNode } from "../models/nodes/keywords/typescript-abstract-keyword.node.js";
import { TypeScriptAccessorKeywordNode } from "../models/nodes/keywords/typescript-accessor-keyword.node.js";
import { TypeScriptAnyKeywordNode } from "../models/nodes/keywords/typescript-any-keyword.node.js";
import { TypeScriptAsKeywordNode } from "../models/nodes/keywords/typescript-as-keyword.node.js";
import { TypeScriptAssertKeywordNode } from "../models/nodes/keywords/typescript-assert-keyword.node.js";
import { TypeScriptAssertsKeywordNode } from "../models/nodes/keywords/typescript-asserts-keyword.node.js";
import { TypeScriptAsyncKeywordNode } from "../models/nodes/keywords/typescript-async-keyword.node.js";
import { TypeScriptAwaitKeywordNode } from "../models/nodes/keywords/typescript-await-keyword.node.js";
import { TypeScriptBigIntKeywordNode } from "../models/nodes/keywords/typescript-big-int-keyword.node.js";
import { TypeScriptBooleanKeywordNode } from "../models/nodes/keywords/typescript-boolean-keyword.node.js";
import { TypeScriptBreakKeywordNode } from "../models/nodes/keywords/typescript-break-keyword.node.js";
import { TypeScriptCaseKeywordNode } from "../models/nodes/keywords/typescript-case-keyword.node.js";
import { TypeScriptCatchKeywordNode } from "../models/nodes/keywords/typescript-catch-keyword.node.js";
import { TypeScriptClassKeywordNode } from "../models/nodes/keywords/typescript-class-keyword.node.js";
import { TypeScriptConstKeywordNode } from "../models/nodes/keywords/typescript-const-keyword.node.js";
import { TypeScriptConstructorKeywordNode } from "../models/nodes/keywords/typescript-constructor-keyword.node.js";
import { TypeScriptContinueKeywordNode } from "../models/nodes/keywords/typescript-continue-keyword.node.js";
import { TypeScriptDebuggerKeywordNode } from "../models/nodes/keywords/typescript-debugger-keyword.node.js";
import { TypeScriptDeclareKeywordNode } from "../models/nodes/keywords/typescript-declare-keyword.node.js";
import { TypeScriptDefaultKeywordNode } from "../models/nodes/keywords/typescript-default-keyword.node.js";
import { TypeScriptDeferKeywordNode } from "../models/nodes/keywords/typescript-defer-keyword.node.js";
import { TypeScriptDeleteKeywordNode } from "../models/nodes/keywords/typescript-delete-keyword.node.js";
import { TypeScriptDoKeywordNode } from "../models/nodes/keywords/typescript-do-keyword.node.js";
import { TypeScriptElseKeywordNode } from "../models/nodes/keywords/typescript-else-keyword.node.js";
import { TypeScriptEnumKeywordNode } from "../models/nodes/keywords/typescript-enum-keyword.node.js";
import { TypeScriptExportKeywordNode } from "../models/nodes/keywords/typescript-export-keyword.node.js";
import { TypeScriptExtendsKeywordNode } from "../models/nodes/keywords/typescript-extends-keyword.node.js";
import { TypeScriptFalseKeywordNode } from "../models/nodes/keywords/typescript-false-keyword.node.js";
import { TypeScriptFinallyKeywordNode } from "../models/nodes/keywords/typescript-finally-keyword.node.js";
import { TypeScriptForKeywordNode } from "../models/nodes/keywords/typescript-for-keyword.node.js";
import { TypeScriptFromKeywordNode } from "../models/nodes/keywords/typescript-from-keyword.node.js";
import { TypeScriptFunctionKeywordNode } from "../models/nodes/keywords/typescript-function-keyword.node.js";
import { TypeScriptGetKeywordNode } from "../models/nodes/keywords/typescript-get-keyword.node.js";
import { TypeScriptGlobalKeywordNode } from "../models/nodes/keywords/typescript-global-keyword.node.js";
import { TypeScriptIfKeywordNode } from "../models/nodes/keywords/typescript-if-keyword.node.js";
import { TypeScriptImmediateKeywordNode } from "../models/nodes/keywords/typescript-immediate-keyword.node.js";
import { TypeScriptImplementsKeywordNode } from "../models/nodes/keywords/typescript-implements-keyword.node.js";
import { TypeScriptImportKeywordNode } from "../models/nodes/keywords/typescript-import-keyword.node.js";
import { TypeScriptInKeywordNode } from "../models/nodes/keywords/typescript-in-keyword.node.js";
import { TypeScriptInferKeywordNode } from "../models/nodes/keywords/typescript-infer-keyword.node.js";
import { TypeScriptInstanceOfKeywordNode } from "../models/nodes/keywords/typescript-instance-of-keyword.node.js";
import { TypeScriptInterfaceKeywordNode } from "../models/nodes/keywords/typescript-interface-keyword.node.js";
import { TypeScriptIntrinsicKeywordNode } from "../models/nodes/keywords/typescript-intrinsic-keyword.node.js";
import { TypeScriptIsKeywordNode } from "../models/nodes/keywords/typescript-is-keyword.node.js";
import { TypeScriptKeyOfKeywordNode } from "../models/nodes/keywords/typescript-key-of-keyword.node.js";
import { TypeScriptKeywordNode } from "../models/nodes/keywords/typescript-keyword.node.js";
import { TypeScriptLetKeywordNode } from "../models/nodes/keywords/typescript-let-keyword.node.js";
import { TypeScriptModuleKeywordNode } from "../models/nodes/keywords/typescript-module-keyword.node.js";
import { TypeScriptNamespaceKeywordNode } from "../models/nodes/keywords/typescript-namespace-keyword.node.js";
import { TypeScriptNeverKeywordNode } from "../models/nodes/keywords/typescript-never-keyword.node.js";
import { TypeScriptNewKeywordNode } from "../models/nodes/keywords/typescript-new-keyword.node.js";
import { TypeScriptNullKeywordNode } from "../models/nodes/keywords/typescript-null-keyword.node.js";
import { TypeScriptNumberKeywordNode } from "../models/nodes/keywords/typescript-number-keyword.node.js";
import { TypeScriptObjectKeywordNode } from "../models/nodes/keywords/typescript-object-keyword.node.js";
import { TypeScriptOfKeywordNode } from "../models/nodes/keywords/typescript-of-keyword.node.js";
import { TypeScriptOutKeywordNode } from "../models/nodes/keywords/typescript-out-keyword.node.js";
import { TypeScriptOverrideKeywordNode } from "../models/nodes/keywords/typescript-override-keyword.node.js";
import { TypeScriptPackageKeywordNode } from "../models/nodes/keywords/typescript-package-keyword.node.js";
import { TypeScriptPrivateKeywordNode } from "../models/nodes/keywords/typescript-private-keyword.node.js";
import { TypeScriptProtectedKeywordNode } from "../models/nodes/keywords/typescript-protected-keyword.node.js";
import { TypeScriptPublicKeywordNode } from "../models/nodes/keywords/typescript-public-keyword.node.js";
import { TypeScriptReadonlyKeywordNode } from "../models/nodes/keywords/typescript-readonly-keyword.node.js";
import { TypeScriptRequireKeywordNode } from "../models/nodes/keywords/typescript-require-keyword.node.js";
import { TypeScriptReturnKeywordNode } from "../models/nodes/keywords/typescript-return-keyword.node.js";
import { TypeScriptSatisfiesKeywordNode } from "../models/nodes/keywords/typescript-satisfies-keyword.node.js";
import { TypeScriptSetKeywordNode } from "../models/nodes/keywords/typescript-set-keyword.node.js";
import { TypeScriptStaticKeywordNode } from "../models/nodes/keywords/typescript-static-keyword.node.js";
import { TypeScriptStringKeywordNode } from "../models/nodes/keywords/typescript-string-keyword.node.js";
import { TypeScriptSuperKeywordNode } from "../models/nodes/keywords/typescript-super-keyword.node.js";
import { TypeScriptSwitchKeywordNode } from "../models/nodes/keywords/typescript-switch-keyword.node.js";
import { TypeScriptSymbolKeywordNode } from "../models/nodes/keywords/typescript-symbol-keyword.node.js";
import { TypeScriptThisKeywordNode } from "../models/nodes/keywords/typescript-this-keyword.node.js";
import { TypeScriptThrowKeywordNode } from "../models/nodes/keywords/typescript-throw-keyword.node.js";
import { TypeScriptTrueKeywordNode } from "../models/nodes/keywords/typescript-true-keyword.node.js";
import { TypeScriptTryKeywordNode } from "../models/nodes/keywords/typescript-try-keyword.node.js";
import { TypeScriptTypeKeywordNode } from "../models/nodes/keywords/typescript-type-keyword.node.js";
import { TypeScriptTypeOfKeywordNode } from "../models/nodes/keywords/typescript-type-of-keyword.node.js";
import { TypeScriptUndefinedKeywordNode } from "../models/nodes/keywords/typescript-undefined-keyword.node.js";
import { TypeScriptUniqueKeywordNode } from "../models/nodes/keywords/typescript-unique-keyword.node.js";
import { TypeScriptUnknownKeywordNode } from "../models/nodes/keywords/typescript-unknown-keyword.node.js";
import { TypeScriptUsingKeywordNode } from "../models/nodes/keywords/typescript-using-keyword.node.js";
import { TypeScriptVarKeywordNode } from "../models/nodes/keywords/typescript-var-keyword.node.js";
import { TypeScriptVoidKeywordNode } from "../models/nodes/keywords/typescript-void-keyword.node.js";
import { TypeScriptWhileKeywordNode } from "../models/nodes/keywords/typescript-while-keyword.node.js";
import { TypeScriptWithKeywordNode } from "../models/nodes/keywords/typescript-with-keyword.node.js";
import { TypeScriptYieldKeywordNode } from "../models/nodes/keywords/typescript-yield-keyword.node.js";
import { Resources } from "../resources.js";

export class TypeScriptKeywordNodeFactory {
  private static readonly NODE_TYPES: ReadonlyMap<string, ValueNodeType<TypeScriptKeywordNode>> = new Map([
    [Resources.abstract, TypeScriptAbstractKeywordNode],
    [Resources.accessor, TypeScriptAccessorKeywordNode],
    [Resources.any, TypeScriptAnyKeywordNode],
    [Resources.as, TypeScriptAsKeywordNode],
    [Resources.assert, TypeScriptAssertKeywordNode],
    [Resources.asserts, TypeScriptAssertsKeywordNode],
    [Resources.async, TypeScriptAsyncKeywordNode],
    [Resources.await, TypeScriptAwaitKeywordNode],
    [Resources.bigInt, TypeScriptBigIntKeywordNode],
    [Resources.boolean, TypeScriptBooleanKeywordNode],
    [Resources.break, TypeScriptBreakKeywordNode],
    [Resources.case, TypeScriptCaseKeywordNode],
    [Resources.catch, TypeScriptCatchKeywordNode],
    [Resources.class, TypeScriptClassKeywordNode],
    [Resources.const, TypeScriptConstKeywordNode],
    [Resources.constructorKeyword, TypeScriptConstructorKeywordNode],
    [Resources.continue, TypeScriptContinueKeywordNode],
    [Resources.debugger, TypeScriptDebuggerKeywordNode],
    [Resources.declare, TypeScriptDeclareKeywordNode],
    [Resources.default, TypeScriptDefaultKeywordNode],
    [Resources.defer, TypeScriptDeferKeywordNode],
    [Resources.delete, TypeScriptDeleteKeywordNode],
    [Resources.do, TypeScriptDoKeywordNode],
    [Resources.else, TypeScriptElseKeywordNode],
    [Resources.enum, TypeScriptEnumKeywordNode],
    [Resources.export, TypeScriptExportKeywordNode],
    [Resources.extends, TypeScriptExtendsKeywordNode],
    [Resources.false, TypeScriptFalseKeywordNode],
    [Resources.finally, TypeScriptFinallyKeywordNode],
    [Resources.for, TypeScriptForKeywordNode],
    [Resources.from, TypeScriptFromKeywordNode],
    [Resources.function, TypeScriptFunctionKeywordNode],
    [Resources.get, TypeScriptGetKeywordNode],
    [Resources.global, TypeScriptGlobalKeywordNode],
    [Resources.if, TypeScriptIfKeywordNode],
    [Resources.immediate, TypeScriptImmediateKeywordNode],
    [Resources.implements, TypeScriptImplementsKeywordNode],
    [Resources.import, TypeScriptImportKeywordNode],
    [Resources.in, TypeScriptInKeywordNode],
    [Resources.infer, TypeScriptInferKeywordNode],
    [Resources.instanceof, TypeScriptInstanceOfKeywordNode],
    [Resources.interface, TypeScriptInterfaceKeywordNode],
    [Resources.intrinsic, TypeScriptIntrinsicKeywordNode],
    [Resources.is, TypeScriptIsKeywordNode],
    [Resources.keyof, TypeScriptKeyOfKeywordNode],
    [Resources.let, TypeScriptLetKeywordNode],
    [Resources.module, TypeScriptModuleKeywordNode],
    [Resources.namespace, TypeScriptNamespaceKeywordNode],
    [Resources.never, TypeScriptNeverKeywordNode],
    [Resources.new, TypeScriptNewKeywordNode],
    [Resources.null, TypeScriptNullKeywordNode],
    [Resources.number, TypeScriptNumberKeywordNode],
    [Resources.object, TypeScriptObjectKeywordNode],
    [Resources.of, TypeScriptOfKeywordNode],
    [Resources.out, TypeScriptOutKeywordNode],
    [Resources.override, TypeScriptOverrideKeywordNode],
    [Resources.package, TypeScriptPackageKeywordNode],
    [Resources.private, TypeScriptPrivateKeywordNode],
    [Resources.protected, TypeScriptProtectedKeywordNode],
    [Resources.public, TypeScriptPublicKeywordNode],
    [Resources.readonly, TypeScriptReadonlyKeywordNode],
    [Resources.require, TypeScriptRequireKeywordNode],
    [Resources.return, TypeScriptReturnKeywordNode],
    [Resources.satisfies, TypeScriptSatisfiesKeywordNode],
    [Resources.set, TypeScriptSetKeywordNode],
    [Resources.static, TypeScriptStaticKeywordNode],
    [Resources.string, TypeScriptStringKeywordNode],
    [Resources.super, TypeScriptSuperKeywordNode],
    [Resources.switch, TypeScriptSwitchKeywordNode],
    [Resources.symbol, TypeScriptSymbolKeywordNode],
    [Resources.this, TypeScriptThisKeywordNode],
    [Resources.throw, TypeScriptThrowKeywordNode],
    [Resources.true, TypeScriptTrueKeywordNode],
    [Resources.try, TypeScriptTryKeywordNode],
    [Resources.type, TypeScriptTypeKeywordNode],
    [Resources.typeof, TypeScriptTypeOfKeywordNode],
    [Resources.undefined, TypeScriptUndefinedKeywordNode],
    [Resources.unique, TypeScriptUniqueKeywordNode],
    [Resources.unknown, TypeScriptUnknownKeywordNode],
    [Resources.using, TypeScriptUsingKeywordNode],
    [Resources.var, TypeScriptVarKeywordNode],
    [Resources.void, TypeScriptVoidKeywordNode],
    [Resources.while, TypeScriptWhileKeywordNode],
    [Resources.with, TypeScriptWithKeywordNode],
    [Resources.yield, TypeScriptYieldKeywordNode],
  ]);

  public static readonly KEYWORDS: readonly string[] = [...TypeScriptKeywordNodeFactory.NODE_TYPES.keys()];

  public create(value: string, span: SourceSpan, leadingTrivia?: Node): TypeScriptKeywordNode | undefined {
    const nodeType = TypeScriptKeywordNodeFactory.NODE_TYPES.get(value);
    if (Object.isUndefined(nodeType))
      return undefined;

    return new nodeType(span, leadingTrivia);
  }
}
