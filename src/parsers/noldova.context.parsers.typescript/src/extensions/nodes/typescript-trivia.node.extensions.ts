/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptTriviaNode } from "../../models/nodes/typescript-trivia.node.js";

TypeScriptTriviaNode.prototype.containsTypeScriptLineBreak = function (this: TypeScriptTriviaNode): boolean {
  return this.children.some(t => t.containsTypeScriptLineBreak());
};
