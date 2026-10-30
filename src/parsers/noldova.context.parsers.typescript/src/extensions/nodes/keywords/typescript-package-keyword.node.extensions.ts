/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptNameReservation } from "../../../enums/typescript-name-reservation.js";
import { TypeScriptPackageKeywordNode } from "../../../models/nodes/keywords/typescript-package-keyword.node.js";

TypeScriptPackageKeywordNode.prototype.isTypeScriptBindingIdentifier = function (this: TypeScriptPackageKeywordNode): boolean {
  return true;
};

TypeScriptPackageKeywordNode.prototype.getTypeScriptNameReservation = function (this: TypeScriptPackageKeywordNode): TypeScriptNameReservation {
  return TypeScriptNameReservation.Strict;
};
