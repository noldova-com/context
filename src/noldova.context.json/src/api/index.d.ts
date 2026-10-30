/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Exception, type ExceptionOptions } from "@noldova/context.exceptions";

/**
 * A value JSON can carry.
 *
 * @remarks
 * `undefined` is never a JSON value. In JSON an absent key means missing and `null` means
 * explicitly nothing; `JsonReader` keeps that distinction.
 */
export declare type JsonValue = string | number | boolean | null | readonly JsonValue[] | JsonObject;

/**
 * A JSON object: string keys with JSON values.
 */
export declare type JsonObject = { readonly [key: string]: JsonValue };

/**
 * Raised when text or a value received at a boundary is not the JSON its reader expects.
 *
 * @remarks
 * Every failure of `JsonReader` is a `JsonException`, and so is a failure of a model's own
 * `fromJson` that reads through it. The message is the path, `: `, and the text, so it can be
 * shown to a user as is.
 */
export declare class JsonException extends Exception {
  /**
   * Path of the offending field, such as `$.params.name`, or the root path `$` when the whole
   * value is at fault.
   */
  public readonly path: string;

  /**
   * Initializes the exception. The message becomes the path, `: `, and the text.
   *
   * @param text What is wrong, as a sentence without the path, normally a `Resources` message.
   * @param path Path of the offending field, or the root path.
   * @param options Optional options carrying the cause, such as the `SyntaxError` of a failed
   * parse.
   * @example
   * ```ts
   * import { JsonException } from "@noldova/context.json";
   *
   * export function requirePort(port: number): number {
   *   if (!Number.isInteger(port) || port < 1 || port > 65535)
   *     throw new JsonException("Expected a port number.", "$.port");
   *   return port;
   * }
   * ```
   */
  public constructor(text: string, path: string, options?: ExceptionOptions);
}

/**
 * Reads typed fields from untrusted JSON, so that unknown input is narrowed in one place, such
 * as a model's `fromJson`.
 *
 * @remarks
 * A required field must be present and not `null`. An `optional` accessor returns `undefined`
 * for an absent field and still rejects `null`. A `nullable` accessor requires the field and
 * accepts `null`. Unknown fields are ignored, so a reader accepts JSON that a newer writer
 * extended.
 * Every failure is a `JsonException` whose path names the field.
 *
 * @example
 * ```ts
 * import { JsonReader } from "@noldova/context.json";
 *
 * export function readMessage(line: string): string {
 *   const reader = JsonReader.parse(line);
 *   const detail = reader.readOptionalString("detail");
 *   return `${reader.readNonBlankString("id")}: ${detail ?? "no detail"}`;
 * }
 * ```
 */
export declare class JsonReader {
  /**
   * The deepest nesting of arrays and objects a reader accepts, counting the outermost as 1;
   * deeper JSON is refused with a `JsonException` rather than read recursively.
   */
  public static readonly maximumDepth: number;

  /**
   * Path of the object this reader reads, such as `$` or `$.params.version`; field paths are
   * built beneath it.
   */
  public readonly path: string;

  private constructor();

  /**
   * Parses text as JSON and returns a reader over the resulting object.
   *
   * @param text The JSON text, such as one line received from another process.
   * @param path Path to report for the parsed value; the root path `$` by default.
   * @returns A reader over the parsed object.
   * @throws JsonException synchronously when the text is not valid JSON (the `SyntaxError` is the cause),
   * the parsed value is not an object, or it nests deeper than `maximumDepth`.
   * @example
   * ```ts
   * import { JsonReader } from "@noldova/context.json";
   *
   * export const reader: JsonReader = JsonReader.parse("{\"name\":\"Fixture\"}");
   * ```
   * @example
   * ```ts
   * import { JsonException, JsonReader } from "@noldova/context.json";
   *
   * try {
   *   JsonReader.parse("[1, 2]");
   * }
   * catch (error) {
   *   if (!(error instanceof JsonException))
   *     throw error;
   * }
   * ```
   */
  public static parse(text: string, path?: string): JsonReader;

  /**
   * Returns a reader over an untrusted value that must be a JSON object.
   *
   * @param value The untrusted value, such as a structured-clone payload.
   * @param path Path to report for the value; the root path `$` by default.
   * @returns A reader over the narrowed object.
   * @throws JsonException synchronously when the value is not a JSON object or contains anything JSON
   * cannot carry, as `toJsonValue` says.
   * @example
   * ```ts
   * import { JsonReader } from "@noldova/context.json";
   *
   * export function readName(message: unknown): string {
   *   return JsonReader.fromValue(message, "$.params").readString("name");
   * }
   * ```
   */
  public static fromValue(value: unknown, path?: string): JsonReader;

  /**
   * Narrows an untrusted value to JSON, preserving keys such as `__proto__` as data.
   *
   * @param value The untrusted value; repeated references are allowed unless they form a cycle.
   * @param path Path to report for the value; the root path `$` by default.
   * @returns The value as JSON; object members whose value is `undefined` are dropped.
   * @throws JsonException synchronously for `undefined`, functions, symbols, bigints, non-finite
   * numbers, objects other than arrays and plain objects (whose prototype is `Object.prototype` or
   * `null`), arrays with missing items, circular references, and nesting deeper than
   * `maximumDepth`, at the path of the offending member.
   * @example
   * ```ts
   * import { JsonReader, type JsonValue } from "@noldova/context.json";
   *
   * export const value: JsonValue = JsonReader.toJsonValue({ name: "Fixture", nickname: undefined });
   * ```
   */
  public static toJsonValue(value: unknown, path?: string): JsonValue;

  /**
   * Returns the narrowed object this reader reads from.
   *
   * @returns The object, as JSON.
   * @example
   * ```ts
   * import { JsonReader } from "@noldova/context.json";
   *
   * const reader: JsonReader = JsonReader.parse("{\"name\":\"Fixture\"}");
   * export const copy: string = JSON.stringify(reader.toJson());
   * ```
   */
  public toJson(): JsonObject;

  /**
   * Reports whether a field is present, with any value including `null`.
   *
   * @param name The field's name.
   * @returns `true` when the field exists.
   * @example
   * ```ts
   * import { JsonReader } from "@noldova/context.json";
   *
   * const reader: JsonReader = JsonReader.parse("{\"name\":\"Fixture\"}");
   * export const hasEmail: boolean = reader.hasField("email");
   * ```
   */
  public hasField(name: string): boolean;

  /**
   * Reads a required string field.
   *
   * @param name The field's name.
   * @returns The string, possibly empty.
   * @throws JsonException synchronously when the field is absent, `null`, or not a string.
   * @example
   * ```ts
   * import { JsonReader } from "@noldova/context.json";
   *
   * const reader: JsonReader = JsonReader.parse("{\"name\":\"Fixture\"}");
   * export const name: string = reader.readString("name");
   * ```
   */
  public readString(name: string): string;

  /**
   * Reads a required string field that must not be blank.
   *
   * @param name The field's name.
   * @returns The string, which is not blank.
   * @throws JsonException synchronously when the field is absent, `null`, not a string, or empty or whitespace.
   * @example
   * ```ts
   * import { JsonReader } from "@noldova/context.json";
   *
   * const reader: JsonReader = JsonReader.parse("{\"id\":\"a1\"}");
   * export const id: string = reader.readNonBlankString("id");
   * ```
   */
  public readNonBlankString(name: string): string;

  /**
   * Reads an optional string field.
   *
   * @param name The field's name.
   * @returns The string, or `undefined` when the field is absent.
   * @throws JsonException synchronously when the field is present but `null` or not a string.
   * @example
   * ```ts
   * import { JsonReader } from "@noldova/context.json";
   *
   * const reader: JsonReader = JsonReader.parse("{\"name\":\"Fixture\"}");
   * export const nickname: string | undefined = reader.readOptionalString("nickname");
   * ```
   */
  public readOptionalString(name: string): string | undefined;

  /**
   * Reads a required string field that may be explicitly `null`.
   *
   * @param name The field's name.
   * @returns The string, or `null` when the field is `null`.
   * @throws JsonException synchronously when the field is absent or neither a string nor `null`.
   * @example
   * ```ts
   * import { JsonReader } from "@noldova/context.json";
   *
   * const reader: JsonReader = JsonReader.parse("{\"parentId\":null}");
   * export const parentId: string | null = reader.readNullableString("parentId");
   * ```
   */
  public readNullableString(name: string): string | null;

  /**
   * Reads a required number field.
   *
   * @param name The field's name.
   * @returns The number, always finite.
   * @throws JsonException synchronously when the field is absent, `null`, or not a number.
   * @example
   * ```ts
   * import { JsonReader } from "@noldova/context.json";
   *
   * const reader: JsonReader = JsonReader.parse("{\"ratio\":0.5}");
   * export const ratio: number = reader.readNumber("ratio");
   * ```
   */
  public readNumber(name: string): number;

  /**
   * Reads a required integer field.
   *
   * @param name The field's name.
   * @returns The integer.
   * @throws JsonException synchronously when the field is absent, `null`, not a number, or not an integer.
   * @example
   * ```ts
   * import { JsonReader } from "@noldova/context.json";
   *
   * const reader: JsonReader = JsonReader.parse("{\"count\":3}");
   * export const count: number = reader.readInteger("count");
   * ```
   */
  public readInteger(name: string): number;

  /**
   * Reads a required field that is an integer or `null`.
   *
   * @param name The field's name.
   * @returns The integer, or `null` when the field is `null`.
   * @throws JsonException synchronously when the field is absent or not an integer.
   * @example
   * ```ts
   * import { JsonReader } from "@noldova/context.json";
   *
   * const reader: JsonReader = JsonReader.parse("{\"exitCode\":null}");
   * export const exitCode: number | null = reader.readNullableInteger("exitCode");
   * ```
   */
  public readNullableInteger(name: string): number | null;

  /**
   * Reads a required array of strings.
   *
   * @param name The field's name.
   * @returns The strings, in order; empty for an empty array.
   * @throws JsonException synchronously when the field is absent, `null`, or not an array, or when an item is
   * not a string; the path names the item.
   * @example
   * ```ts
   * import { JsonReader } from "@noldova/context.json";
   *
   * const reader: JsonReader = JsonReader.parse("{\"tags\":[\"a\",\"b\"]}");
   * export const tags: readonly string[] = reader.readStringArray("tags");
   * ```
   */
  public readStringArray(name: string): readonly string[];

  /**
   * Reads a required array of objects as nested readers.
   *
   * @param name The field's name.
   * @returns One reader per item, in order, each with the item's path such as `$.options.1`; empty
   * for an empty array.
   * @throws JsonException synchronously when the field is absent, `null`, or not an array, or when an item is
   * not an object; the path names the item.
   * @example
   * ```ts
   * import { JsonReader } from "@noldova/context.json";
   *
   * const reader: JsonReader = JsonReader.parse("{\"items\":[{\"id\":\"a\"},{\"id\":\"b\"}]}");
   * export const ids: readonly string[] = reader.readObjectArray("items").map(t => t.readString("id"));
   * ```
   */
  public readObjectArray(name: string): readonly JsonReader[];

  /**
   * Reads a required field that is an object or `null`.
   *
   * @param name The field's name.
   * @returns A reader over the nested object, or `null` when the field is `null`.
   * @throws JsonException synchronously when the field is absent or neither an object nor `null`.
   * @example
   * ```ts
   * import { JsonReader } from "@noldova/context.json";
   *
   * const reader: JsonReader = JsonReader.parse("{\"error\":null}");
   * export const error: JsonReader | null = reader.readNullableObject("error");
   * ```
   */
  public readNullableObject(name: string): JsonReader | null;

  /**
   * Reads a required boolean field.
   *
   * @param name The field's name.
   * @returns The boolean.
   * @throws JsonException synchronously when the field is absent, `null`, or not a boolean.
   * @example
   * ```ts
   * import { JsonReader } from "@noldova/context.json";
   *
   * const reader: JsonReader = JsonReader.parse("{\"enabled\":true}");
   * export const enabled: boolean = reader.readBoolean("enabled");
   * ```
   */
  public readBoolean(name: string): boolean;

  /**
   * Reads a required object field as a nested reader.
   *
   * @param name The field's name.
   * @returns A reader over the nested object whose path is this reader's path plus the name.
   * @throws JsonException synchronously when the field is absent, `null`, or not an object.
   * @example
   * ```ts
   * import { JsonReader } from "@noldova/context.json";
   *
   * const reader: JsonReader = JsonReader.parse("{\"params\":{\"taskId\":\"t1\"}}");
   * export const taskId: string = reader.readObject("params").readString("taskId");
   * ```
   */
  public readObject(name: string): JsonReader;

  /**
   * Reads a required string field that must be one of a set of values, such as an enum's values.
   *
   * @param name The field's name.
   * @param values The accepted values.
   * @returns The matching value, typed as one of `values`.
   * @throws JsonException synchronously when the field is absent, `null`, not a string, or not among the
   * values.
   * @example
   * ```ts
   * import { JsonReader } from "@noldova/context.json";
   *
   * const reader: JsonReader = JsonReader.parse("{\"mode\":\"dark\"}");
   * export const mode: "light" | "dark" = reader.readOneOf("mode", ["light", "dark"]);
   * ```
   * @example
   * ```ts
   * import { JsonReader } from "@noldova/context.json";
   *
   * const reader: JsonReader = JsonReader.parse("{\"mode\":\"dark\"}");
   * // @ts-expect-error
   * export const mode: "light" = reader.readOneOf("mode", ["light", "dark"]);
   * ```
   */
  public readOneOf<T extends string>(name: string, values: readonly T[]): T;

  /**
   * Reads a required field of any JSON type.
   *
   * @param name The field's name.
   * @returns The field's value, including `null` when the field is `null`.
   * @throws JsonException synchronously when the field is absent.
   * @example
   * ```ts
   * import { JsonReader, type JsonValue } from "@noldova/context.json";
   *
   * const reader: JsonReader = JsonReader.parse("{\"data\":[1,null]}");
   * export const data: JsonValue = reader.readValue("data");
   * ```
   */
  public readValue(name: string): JsonValue;
}
