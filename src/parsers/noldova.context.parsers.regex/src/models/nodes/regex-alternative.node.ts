/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { CompositeNode, type Node, type SourceSpan } from "@noldova/context.parsers";

export class RegexAlternativeNode extends CompositeNode {
  public constructor(terms: readonly Node[], span: SourceSpan) {
    super(terms, span);
  }
}
