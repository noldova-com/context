/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ArgumentOutOfRangeException } from "@noldova/context.exceptions";

import { ProcessesException } from "../exceptions/processes.exception.js";
import type { IProcessIdentity } from "../interfaces/i-process-identity.js";
import { Resources } from "../resources.js";
import { ProcessIdentity } from "./process-identity.js";

export class ProcessEntry implements IProcessIdentity {
  public readonly processId: number;
  public readonly parentId: number;
  public readonly groupId: number | null;
  public readonly isZombie: boolean;
  public readonly startTime: number;

  public constructor(processId: number, parentId: number, groupId: number | null, isZombie: boolean, startTime: number) {
    ProcessEntry.throwIfNotId(processId, Resources.processIdParameterName);
    ProcessEntry.throwIfNotId(parentId, Resources.parentIdParameterName);
    if (!Object.isNull(groupId))
      ProcessEntry.throwIfNotId(groupId, Resources.groupIdParameterName);
    ProcessEntry.throwIfNotId(startTime, Resources.startTimeParameterName);

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

    const groupId = String(fields[Resources.groupIdGroup]);
    return new ProcessEntry(Number(fields[Resources.processIdGroup]), Number(fields[Resources.parentIdGroup]), groupId === Resources.noGroup ? null : Number(groupId),
      String(fields[Resources.stateGroup]).startsWith(Resources.zombieState), Number(fields[Resources.startTimeGroup]));
  }

  private static throwIfNotId(value: number, parameterName: string): void {
    ArgumentOutOfRangeException.throwIfNotInteger(value, parameterName);
    ArgumentOutOfRangeException.throwIfNegative(value, parameterName);
  }
}
