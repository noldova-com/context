/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class TreeShape {
  public readonly children: readonly TreeShape[];
  public readonly detached: boolean;
  public readonly exits: boolean;
  public readonly forks: boolean;
  public readonly ignoresTerminate: boolean;
  public readonly folder: string | undefined;

  private constructor(children: readonly TreeShape[], detached: boolean, exits: boolean, forks: boolean, ignoresTerminate: boolean, folder: string | undefined) {
    this.children = children;
    this.detached = detached;
    this.exits = exits;
    this.forks = forks;
    this.ignoresTerminate = ignoresTerminate;
    this.folder = folder;
  }

  public static of(...children: readonly TreeShape[]): TreeShape {
    return new TreeShape(children, false, false, false, false, undefined);
  }

  public static detachedOf(...children: readonly TreeShape[]): TreeShape {
    return new TreeShape(children, true, false, false, false, undefined);
  }

  public static exitingOf(...children: readonly TreeShape[]): TreeShape {
    return new TreeShape(children, false, true, false, false, undefined);
  }

  public static forking(): TreeShape {
    return new TreeShape([], false, false, true, false, undefined);
  }

  public static ignoringTerminate(): TreeShape {
    return new TreeShape([], false, false, false, true, undefined);
  }

  public static workingIn(folder: string): TreeShape {
    return new TreeShape([], false, false, false, false, folder);
  }
}
