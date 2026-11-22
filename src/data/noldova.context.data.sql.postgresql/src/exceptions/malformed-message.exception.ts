/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Resources } from "../resources.js";
import { PostgreSQLClientException } from "./postgresql-client.exception.js";

export class MalformedMessageException extends PostgreSQLClientException {
  public constructor() {
    super(Resources.malformedMessage);
  }
}
