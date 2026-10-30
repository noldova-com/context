/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ValueNode } from "@noldova/context.parsers";

import { TypeScriptCharacterClassifier } from "../../services/lexers/typescript-character-classifier.js";

ValueNode.prototype.getTypeScriptDiagnosticText = function (this: ValueNode): string {
  return this.value;
};

ValueNode.prototype.containsTypeScriptLineBreak = function (this: ValueNode): boolean {
  for (const character of this.value)
    if (TypeScriptCharacterClassifier.isLineTerminator(character))
      return true;

  return false;
};
