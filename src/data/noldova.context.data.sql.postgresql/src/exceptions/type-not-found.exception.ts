/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Resources } from "../resources.js";
import { PostgreSQLClientException } from "./postgresql-client.exception.js";

export class TypeNotFoundException extends PostgreSQLClientException {
  public readonly names: readonly string[];

  public constructor(names: readonly string[]) {
    super(names.length > 1
      ? Resources.formatTypesNotFound(names.join(Resources.listSeparator))
      : Resources.formatTypeNotFound(names.join(Resources.listSeparator)));

    this.names = names;
  }
}
