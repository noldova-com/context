/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { LiteralNode } from "@noldova/context.parsers";

LiteralNode.prototype.getTypeScriptTokenValue = function (this: LiteralNode): string | undefined {
  return this.getTypeScriptDiagnosticText();
};
