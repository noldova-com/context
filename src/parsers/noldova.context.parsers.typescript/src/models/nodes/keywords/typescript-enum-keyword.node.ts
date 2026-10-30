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

export class TypeScriptEnumKeywordNode extends TypeScriptKeywordNode {
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node) {
    super(Resources.enum, span, leadingTrivia, trailingTrivia);
  }
}
