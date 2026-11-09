/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DataException } from "@noldova/context.data";

import { Resources } from "../resources.js";

export class TypeNotFoundException extends DataException {
  public override readonly name: string = "TypeNotFoundException";
  public readonly names: readonly string[];

  public constructor(names: readonly string[]) {
    super(names.length > 1
      ? Resources.formatTypesNotFound(names.join(Resources.listSeparator))
      : Resources.formatTypeNotFound(names.join(Resources.listSeparator)));

    this.names = names;
  }
}
