/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ArgumentException } from "@noldova/context.exceptions";
import { CompositeNode, type SourceSpan } from "@noldova/context.parsers";

import { Resources } from "../../resources.js";
import type { RegexAlternativeNode } from "./regex-alternative.node.js";

export class RegexDisjunctionNode extends CompositeNode {
  public declare readonly children: readonly [RegexAlternativeNode, ...RegexAlternativeNode[]];

  public constructor(alternatives: readonly RegexAlternativeNode[], span: SourceSpan) {
    ArgumentException.throwIfEmpty(alternatives, Resources.alternativesParameterName);
    super([...alternatives], span);
  }
}
