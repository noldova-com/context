/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export default class TypeScriptPlatformPackage {
  private static readonly NAME_PREFIX: string = "@typescript/typescript-";

  public static readonly NAME: string = `${TypeScriptPlatformPackage.NAME_PREFIX}${process.platform}-${process.arch}`;
  public static readonly NAME_PATTERN: string = `${TypeScriptPlatformPackage.NAME_PREFIX}<platform>`;
  public static readonly LIBRARY_DIRECTORY: string = "lib";
}
