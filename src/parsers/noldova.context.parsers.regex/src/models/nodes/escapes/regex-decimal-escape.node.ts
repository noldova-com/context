/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type SourceSpan, ValueNode } from "@noldova/context.parsers";

export class RegexDecimalEscapeNode extends ValueNode {
  public readonly decimalValue: bigint;

  public constructor(value: string, decimalValue: bigint, span: SourceSpan) {
    super(value, span);
    this.decimalValue = decimalValue;
  }
}
