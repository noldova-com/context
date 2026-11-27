/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type IReadOnlyList, List } from "@noldova/context.collections";

import type { Plugin } from "./models/plugin.js";

export class PluginCatalog {
  public static readonly all: IReadOnlyList<Plugin> = new List<Plugin>();
}
