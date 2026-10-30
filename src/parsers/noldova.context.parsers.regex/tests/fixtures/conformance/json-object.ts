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

  public has(name: string): boolean {
    return this.fields.has(name);
  }

  public string(name: string): string {
    const value = this.fields.get(name);
    Assert.isTrue(typeof value === "string", `${this.location}.${name} is not a string.`);

    return value;
  }

  public number(name: string): number {
    const value = this.fields.get(name);
    Assert.isTrue(typeof value === "number", `${this.location}.${name} is not a number.`);

    return value;
  }

  public object(name: string): JsonObject {
    return JsonObject.from(this.fields.get(name), `${this.location}.${name}`);
  }

  public objects(name: string): readonly JsonObject[] {
    return JsonObject.elements(this.fields.get(name), `${this.location}.${name}`)
      .map((t, index) => JsonObject.from(t, `${this.location}.${name}[${index}]`));
  }

  public objectGroups(name: string): readonly (readonly JsonObject[])[] {
    return JsonObject.elements(this.fields.get(name), `${this.location}.${name}`)
      .map((group, index) => JsonObject.elements(group, `${this.location}.${name}[${index}]`)
        .map((t, member) => JsonObject.from(t, `${this.location}.${name}[${index}][${member}]`)));
  }

  public strings(name: string): readonly string[] {
    return JsonObject.elements(this.fields.get(name), `${this.location}.${name}`).map((t, index) => {
      Assert.isTrue(typeof t === "string", `${this.location}.${name}[${index}] is not a string.`);
      return t;
    });
  }

  public numberEntries(name: string): ReadonlyMap<string, number> {
    const object = this.object(name);
    return new Map([...object.fields.keys()].map(t => [t, object.number(t)]));
  }

  private static elements(value: unknown, location: string): readonly unknown[] {
    Assert.isTrue(Array.isArray(value), `${location} is not an array.`);

    return value;
  }
}
