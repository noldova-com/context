/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { TestingException } from "../../exceptions/testing.exception.js";
import { Resources } from "../../resources.js";

export class TestWorkerRecord {
  private readonly fields: ReadonlyMap<string, unknown>;

  private constructor(fields: ReadonlyMap<string, unknown>) {
    this.fields = fields;
  }

  public static from(value: unknown): TestWorkerRecord {
    if (!Object.isObject(value) || Array.isArray(value))
      throw new TestingException(Resources.testWorkerDataInvalid);

    return new TestWorkerRecord(new Map(Object.entries(value)));
  }

  public string(name: string): string {
    const value = this.fields.get(name);
    if (!Object.isString(value))
      throw new TestingException(Resources.testWorkerDataInvalid);

    return value;
  }

  public optionalString(name: string): string | undefined {
    const value = this.fields.get(name);
    return Object.isUndefined(value) ? value : this.string(name);
  }

  public boolean(name: string): boolean {
    const value = this.fields.get(name);
    if (!Object.isBoolean(value))
      throw new TestingException(Resources.testWorkerDataInvalid);

    return value;
  }

  public count(name: string): number {
    return TestWorkerRecord.toCount(this.fields.get(name));
  }

  public optionalCount(name: string): number | undefined {
    const value = this.fields.get(name);
    return Object.isUndefined(value) ? value : this.count(name);
  }

  public duration(name: string): number {
    const value = this.fields.get(name);
    if (!Object.isNumber(value) || !Number.isFinite(value) || value < 0)
      throw new TestingException(Resources.testWorkerDataInvalid);

    return value;
  }

  public strings(name: string): string[] {
    return this.values(name).map(t => {
      if (!Object.isString(t))
        throw new TestingException(Resources.testWorkerDataInvalid);

      return t;
    });
  }

  public records(name: string): TestWorkerRecord[] {
    return this.values(name).map(t => TestWorkerRecord.from(t));
  }

  public value(name: string): unknown {
    return this.fields.get(name);
  }

  public values(name: string): readonly unknown[] {
    const value = this.fields.get(name);
    if (!Array.isArray(value))
      throw new TestingException(Resources.testWorkerDataInvalid);

    return value;
  }

  private static toCount(value: unknown): number {
    if (!Object.isNumber(value) || !Number.isInteger(value) || value < 0)
      throw new TestingException(Resources.testWorkerDataInvalid);

    return value;
  }
}
