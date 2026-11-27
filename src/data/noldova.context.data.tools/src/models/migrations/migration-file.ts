/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class MigrationFile {
  public readonly moduleName: string;
  public readonly className: string;

  public constructor(moduleName: string, className: string) {
    this.moduleName = moduleName;
    this.className = className;
  }
}
