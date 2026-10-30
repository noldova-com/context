/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, SourceSpan } from "@noldova/context.parsers";

import { Resources } from "../../../resources.js";
import { TypeScriptAccessibilityKeywordNode } from "./typescript-accessibility-keyword.node.js";

export class TypeScriptPrivateKeywordNode extends TypeScriptAccessibilityKeywordNode {
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node) {
    super(Resources.private, span, leadingTrivia, trailingTrivia);
  }
}
