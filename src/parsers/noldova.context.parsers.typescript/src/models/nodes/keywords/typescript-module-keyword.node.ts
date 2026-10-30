/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, SourceSpan } from "@noldova/context.parsers";

import { Resources } from "../../../resources.js";
import { TypeScriptModuleDeclarationKeywordNode } from "./typescript-module-declaration-keyword.node.js";

export class TypeScriptModuleKeywordNode extends TypeScriptModuleDeclarationKeywordNode {
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node) {
    super(Resources.module, span, leadingTrivia, trailingTrivia);
  }
}
