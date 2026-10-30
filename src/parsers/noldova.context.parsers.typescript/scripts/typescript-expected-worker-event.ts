/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type TypeScriptExpectedRecord from "./typescript-expected-record.ts";

export default class TypeScriptExpectedWorkerEvent {
  public static readonly RESULT: string = "result";
  public static readonly START: string = "start";

  public readonly event: string;
  public readonly path: string;
  public readonly record: TypeScriptExpectedRecord | undefined;

  private constructor(event: string, path: string, record: TypeScriptExpectedRecord | undefined) {
    this.event = event;
    this.path = path;
    this.record = record;
  }

  public static start(path: string): TypeScriptExpectedWorkerEvent {
    return new TypeScriptExpectedWorkerEvent(TypeScriptExpectedWorkerEvent.START, path, undefined);
  }

  public static result(record: TypeScriptExpectedRecord): TypeScriptExpectedWorkerEvent {
    return new TypeScriptExpectedWorkerEvent(TypeScriptExpectedWorkerEvent.RESULT, record.path, record);
  }

  public static parse(line: string): TypeScriptExpectedWorkerEvent {
    const parsed: TypeScriptExpectedWorkerEvent = JSON.parse(line);

    return new TypeScriptExpectedWorkerEvent(parsed.event, parsed.path, parsed.record);
  }
}
