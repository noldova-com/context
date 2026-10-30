/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export default class PackageInfo {
  public readonly name: string;
  public readonly path: string;
  public readonly packageName: string;

  public constructor(name: string, path: string, packageName: string) {
    this.name = name;
    this.path = path;
    this.packageName = packageName;
  }

  public archiveName(version: string): string {
    return `${this.packageName.replace("@", "").replace("/", "-")}-${version}.tgz`;
  }
}
