/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class Frame {
  public static readonly ROOT: Frame = new Frame([]);

  public readonly values: readonly unknown[];
  public readonly parent: Frame;

  public constructor(values: readonly unknown[], parent?: Frame) {
    this.values = values;
    this.parent = parent ?? this;
  }

  public ancestor(depth: number): Frame {
    let frame: Frame = this;
    for (let level = 0; level < depth; level++)
      frame = frame.parent;

    return frame;
  }
}
