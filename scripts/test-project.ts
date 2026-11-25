/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import Config from "./config.ts";

export default class TestProject {
  private static readonly PROJECT_SUFFIX: string = ".tests";
  private static readonly TSCONFIG_PATH: string = "tests/tsconfig.json";

  public readonly name: string;
  public readonly projectName: string;
  public readonly tsconfigPath: string;
  public readonly buildDirectory: string;
  public readonly sourceTsconfigPath: string | undefined;

  public constructor(name: string, folder: string, sourceTsconfigPath?: string) {
    this.name = name;
    this.projectName = `${name}${TestProject.PROJECT_SUFFIX}`;
    this.tsconfigPath = `${folder}/${TestProject.TSCONFIG_PATH}`;
    this.buildDirectory = `${Config.BUILD_FOLDER}/${this.projectName}`;
    this.sourceTsconfigPath = sourceTsconfigPath;
  }
}
