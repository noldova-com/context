/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { EndOfFileNode, type SourceSpan } from "@noldova/context.parsers";

EndOfFileNode.prototype.getTypeScriptMissingNodeDiagnosticSpan = function (this: EndOfFileNode): SourceSpan {
  return this.getTypeScriptMissingNodeSpan();
};
