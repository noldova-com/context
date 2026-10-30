/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import CommandFailedException from "./command-failed.exception.ts";

export default class JsonObjectReader {
  private static readonly ARRAY_KIND: string = "an array";
  private static readonly BOOLEAN_KIND: string = "a boolean";
  private static readonly INTEGER_KIND: string = "an integer";
  private static readonly INTEGERS_KIND: string = "an array of integers";
  private static readonly OBJECT_KIND: string = "an object";
  private static readonly STRING_KIND: string = "a string";
  private static readonly STRINGS_KIND: string = "an array of strings";

  public readonly value: object;
  private readonly identity: string;
  private readonly properties: ReadonlyMap<string, unknown>;

  private constructor(value: object, identity: string) {
    this.value = value;
    this.identity = identity;
    this.properties = new Map<string, unknown>(Object.entries(value));
  }

  public get names(): readonly string[] {
    return [...this.properties.keys()];
  }

  public static parse(text: string, identity: string): JsonObjectReader {
    let value: unknown;
    try {
      value = JSON.parse(text);
    }
    catch (error) {
      throw new CommandFailedException(JsonObjectReader.invalidJson(identity), { cause: error });
    }

    return JsonObjectReader.of(value, identity);
  }

  public object(name: string): JsonObjectReader {
    return JsonObjectReader.of(this.properties.get(name), this.identityOf(name));
  }

  public objects(name: string): readonly JsonObjectReader[] {
    return this.array(name).map((t, index) => JsonObjectReader.of(t, `${this.identityOf(name)}[${index}]`));
  }

  public string(name: string): string {
    const value = this.properties.get(name);
    if (typeof value !== "string")
      throw new CommandFailedException(JsonObjectReader.required(this.identityOf(name), JsonObjectReader.STRING_KIND));

    return value;
  }

  public optionalString(name: string): string | undefined {
    return this.properties.has(name) ? this.string(name) : undefined;
  }

  public strings(name: string): readonly string[] {
    const values = this.array(name);
    if (!values.every((t): t is string => typeof t === "string"))
      throw new CommandFailedException(JsonObjectReader.required(this.identityOf(name), JsonObjectReader.STRINGS_KIND));

    return values;
  }

  public integer(name: string): number {
    const value = this.properties.get(name);
    if (!JsonObjectReader.isInteger(value))
      throw new CommandFailedException(JsonObjectReader.required(this.identityOf(name), JsonObjectReader.INTEGER_KIND));

    return value;
  }

  public integers(name: string): readonly number[] {
    const values = this.array(name);
    if (!values.every((t): t is number => JsonObjectReader.isInteger(t)))
      throw new CommandFailedException(JsonObjectReader.required(this.identityOf(name), JsonObjectReader.INTEGERS_KIND));

    return values;
  }

  public optionalBoolean(name: string): boolean | undefined {
    const value = this.properties.get(name);
    if (value !== undefined && typeof value !== "boolean")
      throw new CommandFailedException(JsonObjectReader.required(this.identityOf(name), JsonObjectReader.BOOLEAN_KIND));

    return value;
  }

  private array(name: string): readonly unknown[] {
    const value = this.properties.get(name);
    if (!Array.isArray(value))
      throw new CommandFailedException(JsonObjectReader.required(this.identityOf(name), JsonObjectReader.ARRAY_KIND));

    return value;
  }

  private identityOf(name: string): string {
    return `${this.identity}[${JSON.stringify(name)}]`;
  }

  private static of(value: unknown, identity: string): JsonObjectReader {
    if (typeof value !== "object" || value === null || Array.isArray(value))
      throw new CommandFailedException(JsonObjectReader.required(identity, JsonObjectReader.OBJECT_KIND));

    return new JsonObjectReader(value, identity);
  }

  private static isInteger(value: unknown): value is number {
    return typeof value === "number" && Number.isInteger(value);
  }

  private static required(identity: string, kind: string): string {
    return `${identity} must be ${kind}.`;
  }

  private static invalidJson(identity: string): string {
    return `${identity} is not valid JSON.`;
  }
}
