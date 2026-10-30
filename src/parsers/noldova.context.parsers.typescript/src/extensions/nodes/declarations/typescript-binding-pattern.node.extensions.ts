/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptBindingPatternNode } from "../../../models/nodes/declarations/typescript-binding-pattern.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";

TypeScriptBindingPatternNode.prototype.validateTypeScriptGrammar = function (this: TypeScriptBindingPatternNode, context: TypeScriptParserContext): void {
  this.reportTypeScriptRestTrailingComma(context);
  this.children.at(-1)?.reportTypeScriptRestInitializer(context);
};

TypeScriptBindingPatternNode.prototype.reportTypeScriptLetNames = function (this: TypeScriptBindingPatternNode, context: TypeScriptParserContext): void {
  for (const elementNode of this.children)
    elementNode.reportTypeScriptLetNames(context);
};

TypeScriptBindingPatternNode.prototype.reportTypeScriptInitializersWithoutImplementation = function (this: TypeScriptBindingPatternNode,
  context: TypeScriptParserContext, isTypeRead: boolean): void {
  for (const elementNode of this.children)
    elementNode.reportTypeScriptInitializersWithoutImplementation(context, isTypeRead);
};

TypeScriptBindingPatternNode.prototype.readsTypeScriptDeclaredType = function (this: TypeScriptBindingPatternNode,
  isSignatureParameter: boolean): boolean {
  return this.children.some(t => t.readsTypeScriptDeclaredType(isSignatureParameter));
};

TypeScriptBindingPatternNode.prototype.hasTypeScriptBindingName = function (this: TypeScriptBindingPatternNode, name: string): boolean {
  return this.children.some(t => t.hasTypeScriptBindingName(name));
};
