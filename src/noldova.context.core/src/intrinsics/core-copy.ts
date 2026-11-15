/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Resources } from "../resources.js";

// The one copy of this package an app may load. A copy that finds the extensions another copy added refuses to load, rather than failing to add
// them again. It names no folder, since a module's own location is host plumbing outside the ECMAScript library this package compiles against.
export class CoreCopy {
  // It runs before this copy adds its extensions, so it reads none of them and calls no nameof.
  public static claim(): void {
    if (Object.getOwnPropertyDescriptor(Object, Resources.isFunctionName) !== undefined)
      throw new Error(Resources.coreCopiesLoaded);
  }
}
