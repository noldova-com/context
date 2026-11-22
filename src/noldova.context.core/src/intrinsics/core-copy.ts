/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file is needed only while npm installs the packages, and goes away when we replace Node.

import { Resources } from "../resources.js";

export class CoreCopy {
  public static claim(): void {
    if (Object.hasOwn(Object, Resources.isFunctionName))
      throw new Error(Resources.coreCopiesLoaded);
  }
}
