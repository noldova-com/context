/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DataException } from "@noldova/context.data";

import { Resources } from "../resources.js";

export class QueryCanceledException extends DataException {
  public override readonly name: string = "QueryCanceledException";

  public constructor() {
    super(Resources.queryCanceled);
  }
}
