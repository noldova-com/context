/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type SourceSpan, ValueNode } from "@noldova/context.parsers";

export class RegexUnicodePropertyEscapeNode extends ValueNode {
  public readonly mayContainStrings: boolean;
  public readonly propertyName: string | undefined;
  public readonly propertyValue: string;
  public readonly negated: boolean;

  public constructor(value: string, propertyName: string | undefined, propertyValue: string, negated: boolean, mayContainStrings: boolean, span: SourceSpan) {
    super(value, span);
    this.propertyName = propertyName;
    this.propertyValue = propertyValue;
    this.negated = negated;
    this.mayContainStrings = mayContainStrings;
  }
}
