/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { ClientOptions } from "../models/client-options.js";
import type { TransformSettings } from "./transform-settings.js";

export type ClientSettings = Partial<Omit<ClientOptions, "transform">> & {
  readonly host?: string | readonly string[];
  readonly port?: number;
  readonly database?: string;
  readonly user?: string;
  readonly password?: string;
  readonly ssl?: boolean | string;
  readonly sslnegotiation?: string;
  readonly channelBinding?: string;
  readonly targetSessionAttrs?: string;
  readonly connectTimeout?: number;
  readonly connection?: ReadonlyMap<string, string>;
  readonly transform?: TransformSettings;
};
