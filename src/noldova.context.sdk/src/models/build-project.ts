/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Project } from "@noldova/context";
import type { IReadOnlyList } from "@noldova/context.collections";

export class BuildProject {
  public readonly project: Project;
  public readonly packages: IReadOnlyList<string>;

  public constructor(project: Project, packages: IReadOnlyList<string>) {
    this.project = project;
    this.packages = packages;
  }
}
