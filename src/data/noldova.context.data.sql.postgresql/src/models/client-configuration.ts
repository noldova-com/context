/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { ClientOptions } from "./client-options.js";
import type { ConnectionOptions } from "./connection-options.js";

export class ClientConfiguration {
  public readonly options: ClientOptions;
  public readonly connection: ConnectionOptions;

  public constructor(options: ClientOptions, connection: ConnectionOptions) {
    this.options = options;
    this.connection = connection;
  }
}
