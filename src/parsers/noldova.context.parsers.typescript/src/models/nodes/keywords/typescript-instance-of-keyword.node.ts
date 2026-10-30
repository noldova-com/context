/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, SourceSpan } from "@noldova/context.parsers";

import { Resources } from "../../../resources.js";
import { TypeScriptKeywordNode } from "./typescript-keyword.node.js";

export class TypeScriptInstanceOfKeywordNode extends TypeScriptKeywordNode {
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node) {
    super(Resources.instanceof, span, leadingTrivia, trailingTrivia);
  }
}
