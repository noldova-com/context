/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Resources } from "../resources.js";

// The one copy of this package an app may load. The first copy records its folder on the global object before it adds its extensions; a second
// copy, which could not add them again, refuses to load with an error naming both folders.
export class CoreCopy {
  private static readonly KEY: symbol = Symbol.for(Resources.packageName);
  private static readonly FOLDER: string = new URL(Resources.packageFolderFromIntrinsics, import.meta.url).href;

  /**
   * Records this copy as the app's one copy of the package, or throws an Error if another copy is already loaded. It runs before the extensions
   * exist, so it reads none of them and calls no nameof.
   */
  public static claim(): void {
    const first: unknown = Object.getOwnPropertyDescriptor(globalThis, CoreCopy.KEY)?.value;
    if (first !== undefined)
      throw new Error(Resources.secondCopyLoaded.replace(Resources.firstFolderPlaceholder, String(first)).replace(Resources.secondFolderPlaceholder, CoreCopy.FOLDER));

    if (Object.getOwnPropertyDescriptor(Object, Resources.isFunctionName) !== undefined)
      throw new Error(Resources.olderCopyLoaded.replace(Resources.secondFolderPlaceholder, CoreCopy.FOLDER));

    Object.defineProperty(globalThis, CoreCopy.KEY, { value: CoreCopy.FOLDER, writable: false, enumerable: false, configurable: false });
  }
}
