/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DataException } from "@noldova/context.data";

export class UnsafeTransactionException extends DataException {
  public constructor(message: string) {
    super(message);
  }
}
