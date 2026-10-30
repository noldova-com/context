/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert } from "@noldova/context.testing";

export class JsonObject {
  private readonly fields: ReadonlyMap<string, unknown>;
  private readonly location: string;

  private constructor(fields: ReadonlyMap<string, unknown>, location: string) {
    this.fields = fields;
    this.location = location;
  }

  public static parse(json: string, location: string): JsonObject {
    return JsonObject.from(JSON.parse(json), location);
  }

  public static from(value: unknown, location: string): JsonObject {
    Assert.isTrue(typeof value === "object" && value !== null && !Array.isArray(value), `${location} is not a JSON object.`);

    return new JsonObject(new Map(Object.entries(value)), location);
  }

  public string(name: string): string {
    const value = this.fields.get(name);
    Assert.isTrue(typeof value === "string", `${this.location}.${name} is not a string.`);

    return value;
  }

  public optionalString(name: string): string | undefined {
    return this.fields.has(name) ? this.string(name) : undefined;
  }

  public number(name: string): number {
    const value = this.fields.get(name);
    Assert.isTrue(typeof value === "number", `${this.location}.${name} is not a number.`);

    return value;
  }

  public optionalNumber(name: string): number | undefined {
    return this.fields.has(name) ? this.number(name) : undefined;
  }

  public optionalNumberOrString(name: string): number | string | undefined {
    const value = this.fields.get(name);
    Assert.isTrue(value === undefined || typeof value === "number" || typeof value === "string", `${this.location}.${name} is neither a number nor a string.`);

    return value;
  }

  public object(name: string): JsonObject {
    return JsonObject.from(this.fields.get(name), `${this.location}.${name}`);
  }

  public objects(name: string): readonly JsonObject[] {
    return this.array(name).map((t, index) => JsonObject.from(t, `${this.location}.${name}[${index}]`));
  }

  public optionalObjects(name: string): readonly JsonObject[] {
    return this.fields.has(name) ? this.objects(name) : [];
  }

  public numbers(name: string): readonly number[] {
    return this.array(name).map((t, index) => {
      Assert.isTrue(typeof t === "number", `${this.location}.${name}[${index}] is not a number.`);
      return t;
    });
  }

  public strings(name: string): readonly string[] {
    return this.array(name).map((t, index) => {
      Assert.isTrue(typeof t === "string", `${this.location}.${name}[${index}] is not a string.`);
      return t;
    });
  }

  public optionalStrings(name: string): readonly string[] {
    return this.fields.has(name) ? this.strings(name) : [];
  }

  public numberEntries(name: string): ReadonlyMap<string, number> {
    const object = this.object(name);
    return new Map([...object.fields.keys()].map(t => [t, object.number(t)]));
  }

  private array(name: string): readonly unknown[] {
    const value = this.fields.get(name);
    Assert.isTrue(Array.isArray(value), `${this.location}.${name} is not an array.`);

    return value;
  }
}
