/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class ProcessSignals {
  public readonly stop: NodeJS.Signals | number;
  public readonly resume: NodeJS.Signals | number;
  public readonly terminate: NodeJS.Signals | number;
  public readonly kill: NodeJS.Signals | number;

  public constructor(stop: NodeJS.Signals | number, resume: NodeJS.Signals | number, terminate: NodeJS.Signals | number, kill: NodeJS.Signals | number) {
    this.stop = stop;
    this.resume = resume;
    this.terminate = terminate;
    this.kill = kill;
  }
}
