/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file is needed only while npm installs the packages, and goes away when we replace Node.

import { nameof } from "@noldova/context.core";

import { Resources } from "../resources.js";

export class TextCopy {
  public static claim(): void {
    if (Object.hasOwn(String, nameof<StringConstructor>(t => t.isAsciiBinaryDigit)))
      throw new Error(Resources.textCopiesLoaded);
  }
}
