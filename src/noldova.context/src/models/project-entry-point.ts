/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Resources } from "../resources.js";

export class ProjectEntryPoint {
  public readonly source: string;
  public readonly className: string | undefined;

  public constructor(source: string = Resources.defaultEntrySource, className?: string) {
    this.source = source;
    this.className = className;
  }
}
