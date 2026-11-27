/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IReadOnlyList } from "@noldova/context.collections";

export class ProjectDependencies {
  public readonly projects: IReadOnlyList<string>;
  public readonly packages: IReadOnlyList<string>;

  public constructor(projects: IReadOnlyList<string>, packages: IReadOnlyList<string>) {
    this.projects = projects;
    this.packages = packages;
  }
}
