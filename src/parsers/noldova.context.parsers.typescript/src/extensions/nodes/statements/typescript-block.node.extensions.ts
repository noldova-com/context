/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";

import { TypeScriptBlockNode } from "../../../models/nodes/statements/typescript-block.node.js";

declare module "../../../models/nodes/statements/typescript-block.node.js" {
  interface TypeScriptBlockNode {
    isTypeScriptPresent(): boolean;
  }
}

TypeScriptBlockNode.prototype.getTypeScriptFirstTokenSpan = function (this: TypeScriptBlockNode): SourceSpan {
  return this.openBraceNode!.span;
};

TypeScriptBlockNode.prototype.isTypeScriptPresent = function (this: TypeScriptBlockNode): boolean {
  return this.span.length > 0;
};
