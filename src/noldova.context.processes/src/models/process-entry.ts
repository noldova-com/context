/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ProcessesException } from "../exceptions/processes.exception.js";
import type { IProcessIdentity } from "../interfaces/i-process-identity.js";
import { Resources } from "../resources.js";
import { ProcessIdentity } from "./process-identity.js";

export class ProcessEntry implements IProcessIdentity {
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

  public get identity(): ProcessIdentity {
    return new ProcessIdentity(this.processId, this.startTime);
  }

  public static parse(line: string): ProcessEntry {
    const fields = Resources.entryPattern.exec(line)?.groups;
    if (Object.isUndefined(fields))
      throw new ProcessesException(Resources.formatEntryInvalid(line));

    return new ProcessEntry(Number(fields[Resources.processIdGroup]), Number(fields[Resources.parentIdGroup]), Number(fields[Resources.groupIdGroup]),
      String(fields[Resources.stateGroup]).startsWith(Resources.zombieState), Number(fields[Resources.startTimeGroup]));
  }
}
