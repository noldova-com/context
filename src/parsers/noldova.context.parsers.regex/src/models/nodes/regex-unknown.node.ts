/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type SourceSpan, ValueNode } from "@noldova/context.parsers";

export class RegexUnknownNode extends ValueNode {
  public constructor(value: string, span: SourceSpan) {
    super(value, span);
  }
}
