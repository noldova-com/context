/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, SourceSpan } from "@noldova/context.parsers";

import { Resources } from "../../../resources.js";
import { TypeScriptContextualKeywordNode } from "./typescript-contextual-keyword.node.js";

export class TypeScriptTypeKeywordNode extends TypeScriptContextualKeywordNode {
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node) {
    super(Resources.type, span, leadingTrivia, trailingTrivia);
  }
}
