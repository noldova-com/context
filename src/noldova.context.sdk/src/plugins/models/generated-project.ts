/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IReadOnlyDictionary } from "@noldova/context.collections";

import type { PositionMap } from "./position-map.js";

export class GeneratedProject {
  public readonly configurationPath: string;
  public readonly outputDirectory: string;
  public readonly maps: IReadOnlyDictionary<string, PositionMap>;

  public constructor(configurationPath: string, outputDirectory: string, maps: IReadOnlyDictionary<string, PositionMap>) {
    this.configurationPath = configurationPath;
    this.outputDirectory = outputDirectory;
    this.maps = maps;
  }
}
