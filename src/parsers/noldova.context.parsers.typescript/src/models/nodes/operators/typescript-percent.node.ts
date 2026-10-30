/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, SourceSpan } from "@noldova/context.parsers";
import { ValueNode } from "@noldova/context.parsers";

import { Resources } from "../../../resources.js";

export class TypeScriptPercentNode extends ValueNode {
  public constructor(span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node) {
    super(Resources.percent, span, leadingTrivia, trailingTrivia);
  }
}
