/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";

import { TypeScriptArrayBindingPatternNode } from "../../../models/nodes/declarations/typescript-array-binding-pattern.node.js";

TypeScriptArrayBindingPatternNode.prototype.getTypeScriptFirstTokenSpan = function (this: TypeScriptArrayBindingPatternNode): SourceSpan {
  return this.openBracketNode.span;
};
