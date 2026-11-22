/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Resources } from "../resources.js";
import { ProcessIdentity } from "./process-identity.js";

export class ProcessEntry {
  public readonly processId: number;
  public readonly parentId: number;
  public readonly groupId: number;
  public readonly isZombie: boolean;
  public readonly startTime: number;

  private constructor(processId: number, parentId: number, groupId: number, isZombie: boolean, startTime: number) {
    this.processId = processId;
    this.parentId = parentId;
    this.groupId = groupId;
    this.isZombie = isZombie;
    this.startTime = startTime;
  }

  public get key(): string {
    return ProcessEntry.keyOf(this.processId, this.startTime);
  }

  public get identity(): ProcessIdentity {
    return new ProcessIdentity(this.processId, this.startTime);
  }

  public static parse(line: string): ProcessEntry {
    const fields = line.split(Resources.fieldSeparator);
    return new ProcessEntry(Number(fields[0]), Number(fields[1]), Number(fields[2]), String(fields[3]).startsWith(Resources.zombieState), Number(fields[4]));
  }

  public static keyOf(processId: number, startTime: number): string {
    return `${processId}${Resources.targetSeparator}${startTime}`;
  }
}
