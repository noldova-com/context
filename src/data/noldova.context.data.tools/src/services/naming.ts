/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Resources } from "../resources.js";

export class Naming {
  public static toKebabCase(name: string): string {
    return name.replace(Resources.kebabWordPattern, Resources.kebabReplacement).replace(Resources.kebabAcronymPattern, Resources.kebabReplacement).toLowerCase();
  }
}
