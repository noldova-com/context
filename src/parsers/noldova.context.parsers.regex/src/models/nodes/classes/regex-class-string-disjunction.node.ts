/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ArgumentException } from "@noldova/context.exceptions";
import { CompositeNode, type SourceSpan } from "@noldova/context.parsers";

import { Resources } from "../../../resources.js";
import type { RegexClassStringNode } from "./regex-class-string.node.js";

export class RegexClassStringDisjunctionNode extends CompositeNode {
  public declare readonly children: readonly [RegexClassStringNode, ...RegexClassStringNode[]];

  public readonly mayContainStrings: boolean;

  public constructor(strings: readonly RegexClassStringNode[], span: SourceSpan) {
    ArgumentException.throwIfEmpty(strings, Resources.stringsParameterName);
    super([...strings], span);
    this.mayContainStrings = this.children.some(t => t.children.length !== 1);
  }
}
