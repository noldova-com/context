/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { LiteralNode, type SourceSpan } from "@noldova/context.parsers";

export class ForeignLiteralNode extends LiteralNode {
  public constructor(value: string, span: SourceSpan) {
    super(value, span);
  }
}
