/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";

import { TypeScriptObjectBindingPatternNode } from "../../../models/nodes/declarations/typescript-object-binding-pattern.node.js";

TypeScriptObjectBindingPatternNode.prototype.getTypeScriptFirstTokenSpan = function (this: TypeScriptObjectBindingPatternNode): SourceSpan {
  return this.openBraceNode.span;
};
