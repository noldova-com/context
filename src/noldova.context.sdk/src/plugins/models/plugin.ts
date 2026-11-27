/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { PluginContext } from "./plugin-context.js";

export abstract class Plugin {
  public abstract readonly name: string;
  public abstract readonly packageName: string;

  public abstract run(context: PluginContext): void;
}
