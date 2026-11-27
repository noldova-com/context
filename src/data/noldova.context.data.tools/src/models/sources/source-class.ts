/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceProperty } from "./source-property.js";

export class SourceClass {
  public readonly name: string;
  public readonly filePath: string;
  public readonly baseName: string | null;
  public readonly properties: readonly SourceProperty[];

  public constructor(name: string, filePath: string, baseName: string | null, properties: readonly SourceProperty[]) {
    this.name = name;
    this.filePath = filePath;
    this.baseName = baseName;
    this.properties = properties;
  }
}
