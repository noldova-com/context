/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type SourceSpan, ValueNode } from "@noldova/context.parsers";

import { Resources } from "../../../resources.js";

export class RegexCloseBracketNode extends ValueNode {
  public constructor(span: SourceSpan) {
    super(Resources.closeBracket, span);
  }
}
