/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IReadOnlyDictionary, IReadOnlyList } from "@noldova/context.collections";

export class ProjectConfiguration {
  public readonly rootDirectory: string;
  public readonly outputDirectory: string;
  public readonly files: IReadOnlyList<string>;
  public readonly paths: IReadOnlyDictionary<string, IReadOnlyList<string>>;

  public constructor(rootDirectory: string, outputDirectory: string, files: IReadOnlyList<string>, paths: IReadOnlyDictionary<string, IReadOnlyList<string>>) {
    this.rootDirectory = rootDirectory;
    this.outputDirectory = outputDirectory;
    this.files = files;
    this.paths = paths;
  }
}
