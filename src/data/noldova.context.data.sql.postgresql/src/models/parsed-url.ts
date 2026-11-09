/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { HostTarget } from "../types/host-target.js";

export class ParsedUrl {
  public readonly username: string;
  public readonly password: string;
  public readonly pathname: string;
  public readonly searchParams: ReadonlyMap<string, string>;
  public readonly targets: readonly HostTarget[];

  public constructor(username: string, password: string, pathname: string, searchParams: ReadonlyMap<string, string>, targets: readonly HostTarget[]) {
    this.username = username;
    this.password = password;
    this.pathname = pathname;
    this.searchParams = searchParams;
    this.targets = targets;
  }
}
