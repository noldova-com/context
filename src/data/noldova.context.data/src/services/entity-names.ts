/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Enumerable } from "@noldova/context.collections";
import { StringComparison } from "@noldova/context.core";

export class EntityNames {
  public static find(names: Enumerable<string>, name: string): string | undefined {
    return names.firstOrDefault(t => t === name) ?? names.firstOrDefault(t => String.equals(t, name, StringComparison.OrdinalIgnoreCase));
  }
}
