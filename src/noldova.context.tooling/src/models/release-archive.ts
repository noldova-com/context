/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { PackageInfo } from "./package-info.ts";

export class ReleaseArchive {
  public readonly packageInfo: PackageInfo;
  public readonly filePath: string;

  public constructor(packageInfo: PackageInfo, filePath: string) {
    this.packageInfo = packageInfo;
    this.filePath = filePath;
  }
}
