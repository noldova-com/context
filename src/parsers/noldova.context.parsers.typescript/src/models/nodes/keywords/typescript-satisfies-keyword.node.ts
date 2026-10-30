/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, SourceSpan } from "@noldova/context.parsers";

import { Resources } from "../../../resources.js";
import { TypeScriptTypeCheckKeywordNode } from "./typescript-type-check-keyword.node.js";

export class TypeScriptSatisfiesKeywordNode extends TypeScriptTypeCheckKeywordNode {
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node) {
    super(Resources.satisfies, span, leadingTrivia, trailingTrivia);
  }
}
