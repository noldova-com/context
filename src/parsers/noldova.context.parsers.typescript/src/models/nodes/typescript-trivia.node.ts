/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, SourceSpan } from "@noldova/context.parsers";
import { CompositeNode } from "@noldova/context.parsers";

export class TypeScriptTriviaNode extends CompositeNode {
  public constructor(children: readonly Node[], span: SourceSpan) {
    super(children, span);
  }
}
