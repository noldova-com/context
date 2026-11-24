/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import { ExceptionOptions } from "@noldova/context.exceptions";

import { JsonException } from "../exceptions/json.exception.js";
import { JsonConversion } from "../models/json-conversion.js";
import { Resources } from "../resources.js";
import type { JsonObject } from "../types/json-object.js";
import type { JsonValue } from "../types/json-value.js";

export class JsonReader {
  public static readonly maximumDepth: number = 64;

  private static readonly PLAIN_NAME: RegExp = /^[A-Za-z_$][\w$]*$/u;

  private readonly value: JsonObject;

  public readonly path: string;

  private constructor(value: JsonObject, path: string) {
    this.value = value;
    this.path = path;
  }

  public static parse(text: string, path: string = Resources.rootPath): JsonReader {
    return JsonReader.fromValue(JsonReader.parseText(text, path), path);
  }

  public static parseValue(text: string, path: string = Resources.rootPath): JsonValue {
    return JsonReader.toJsonValue(JsonReader.parseText(text, path), path);
  }

  public static fromValue(value: unknown, path: string = Resources.rootPath): JsonReader {
    const json = JsonReader.toJsonValue(value, path);

    if (!JsonReader.isObject(json))
      throw new JsonException(Resources.notObject, path);

    return new JsonReader(json, path);
  }

  public static toJsonValue(value: unknown, path: string = Resources.rootPath): JsonValue {
    return JsonReader.convertToJsonValue(value, path, new Set<object>(), new Map<object, JsonConversion>()).value;
  }

  public toJson(): JsonObject {
    return this.value;
  }

  public hasField(name: string): boolean {
    return Object.hasOwn(this.value, name);
  }

  public readString(name: string): string {
    const field = this.readRequired(name);

    if (!Object.isString(field))
      this.throwWrongTypeException(name, Resources.stringTypeName);

    return field;
  }

  public readNonBlankString(name: string): string {
    const text = this.readString(name);

    if (String.isNullOrWhitespace(text))
      throw new JsonException(Resources.blankString, this.formatFieldPath(name));

    return text;
  }

  public readOptionalString(name: string): string | undefined {
    return this.hasField(name) ? this.readString(name) : undefined;
  }

  public readNullableString(name: string): string | null {
    return Object.isNull(this.readRequiredOrNull(name)) ? null : this.readString(name);
  }

  public readNumber(name: string): number {
    const field = this.readRequired(name);

    if (!Object.isNumber(field))
      this.throwWrongTypeException(name, Resources.numberTypeName);

    return field;
  }

  public readInteger(name: string): number {
    const value = this.readNumber(name);

    if (!Number.isInteger(value))
      throw new JsonException(Resources.notInteger, this.formatFieldPath(name));
    if (!Number.isSafeInteger(value))
      throw new JsonException(Resources.unsafeInteger, this.formatFieldPath(name));

    return value;
  }

  public readNullableInteger(name: string): number | null {
    return Object.isNull(this.readRequiredOrNull(name)) ? null : this.readInteger(name);
  }

  public readBoolean(name: string): boolean {
    const field = this.readRequired(name);

    if (!Object.isBoolean(field))
      this.throwWrongTypeException(name, Resources.booleanTypeName);

    return field;
  }

  public readObject(name: string): JsonReader {
    const field = this.readRequired(name);

    if (!JsonReader.isObject(field))
      this.throwWrongTypeException(name, Resources.objectTypeName);

    return new JsonReader(field, this.formatFieldPath(name));
  }

  public readNullableObject(name: string): JsonReader | null {
    return Object.isNull(this.readRequiredOrNull(name)) ? null : this.readObject(name);
  }

  public readStringArray(name: string): readonly string[] {
    const field = this.readRequired(name);
    if (!Array.isArray(field))
      this.throwWrongTypeException(name, Resources.arrayTypeName);

    return field.map((t, index) => {
      if (!Object.isString(t))
        throw new JsonException(Resources.formatWrongType(Resources.stringTypeName), this.formatItemPath(name, index));
      return t;
    });
  }

  public readNumberArray(name: string): readonly number[] {
    const field = this.readRequired(name);
    if (!Array.isArray(field))
      this.throwWrongTypeException(name, Resources.arrayTypeName);

    return field.map((t, index) => {
      if (!Object.isNumber(t))
        throw new JsonException(Resources.formatWrongType(Resources.numberTypeName), this.formatItemPath(name, index));
      return t;
    });
  }

  public readObjectArray(name: string): readonly JsonReader[] {
    const field = this.readRequired(name);
    if (!Array.isArray(field))
      this.throwWrongTypeException(name, Resources.arrayTypeName);

    return field.map((t, index) => {
      const path = this.formatItemPath(name, index);
      if (!JsonReader.isObject(t))
        throw new JsonException(Resources.formatWrongType(Resources.objectTypeName), path);
      return new JsonReader(t, path);
    });
  }

  public readOneOf<T extends string>(name: string, values: readonly T[]): T {
    const text = this.readString(name);
    const match = values.find(t => t === text);

    if (Object.isUndefined(match))
      throw new JsonException(Resources.formatNotOneOf(values), this.formatFieldPath(name));

    return match;
  }

  public readValue(name: string): JsonValue {
    return this.readRequiredOrNull(name);
  }

  private readRequired(name: string): JsonValue {
    const field = this.readRequiredOrNull(name);

    if (Object.isNull(field))
      throw new JsonException(Resources.unexpectedNull, this.formatFieldPath(name));

    return field;
  }

  private readRequiredOrNull(name: string): JsonValue {
    const field = this.hasField(name) ? this.value[name] : undefined;
    if (Object.isUndefined(field))
      throw new JsonException(Resources.missingField, this.formatFieldPath(name));

    return field;
  }

  private throwWrongTypeException(name: string, expected: string): never {
    throw new JsonException(Resources.formatWrongType(expected), this.formatFieldPath(name));
  }

  private formatFieldPath(name: string): string {
    return JsonReader.formatKeyPath(this.path, name);
  }

  private formatItemPath(name: string, index: number): string {
    return JsonReader.formatIndexPath(this.formatFieldPath(name), index);
  }

  private static parseText(text: string, path: string): unknown {
    try {
      return JSON.parse(text);
    }
    catch (exception) {
      throw new JsonException(Resources.invalidJsonText, path, new ExceptionOptions(exception));
    }
  }

  private static convertToJsonValue(value: unknown, path: string, ancestors: Set<object>, converted: Map<object, JsonConversion>): JsonConversion {
    if (Object.isNull(value) || Object.isString(value) || Object.isBoolean(value))
      return new JsonConversion(value, 0);

    if (Object.isNumber(value)) {
      if (Number.isNaN(value))
        throw new JsonException(Resources.formatNotJsonValue(String(value)), path);
      if (!Number.isFinite(value))
        throw new JsonException(Resources.numberOutOfRange, path);
      return new JsonConversion(value, 0);
    }

    if (Array.isArray(value) || Object.isPlainObject(value)) {
      if (ancestors.has(value))
        throw new JsonException(Resources.circularReference, path);
      const known = converted.get(value);
      if (!Object.isUndefined(known)) {
        if (ancestors.size + known.height > JsonReader.maximumDepth)
          throw new JsonException(Resources.formatTooDeep(JsonReader.maximumDepth), path);
        return known;
      }
      if (ancestors.size === JsonReader.maximumDepth)
        throw new JsonException(Resources.formatTooDeep(JsonReader.maximumDepth), path);

      ancestors.add(value);
      const conversion = Array.isArray(value)
        ? JsonReader.convertArray(value, path, ancestors, converted)
        : JsonReader.convertObject(value, path, ancestors, converted);
      ancestors.delete(value);
      converted.set(value, conversion);
      return conversion;
    }

    if (Object.isObject(value) && !Object.isFunction(value))
      throw new JsonException(Resources.notPlainObject, path);

    throw new JsonException(Resources.formatNotJsonValue(typeof value), path);
  }

  private static convertArray(value: readonly unknown[], path: string, ancestors: Set<object>, converted: Map<object, JsonConversion>): JsonConversion {
    const items: JsonValue[] = [];
    let height = 0;
    for (let index = 0; index < value.length; index += 1) {
      const itemPath = JsonReader.formatIndexPath(path, index);
      if (!Object.hasOwn(value, index))
        throw new JsonException(Resources.arrayHole, itemPath);
      const item = JsonReader.convertToJsonValue(value[index], itemPath, ancestors, converted);
      items.push(item.value);
      height = Math.max(height, item.height);
    }
    return new JsonConversion(items, height + 1);
  }

  private static convertObject(value: object, path: string, ancestors: Set<object>, converted: Map<object, JsonConversion>): JsonConversion {
    const members: Record<string, JsonValue> = {};
    let height = 0;
    for (const [key, entry] of Object.entries(value)) {
      const member: unknown = entry;
      if (Object.isUndefined(member))
        continue;
      const result = JsonReader.convertToJsonValue(member, JsonReader.formatKeyPath(path, key), ancestors, converted);
      Object.defineProperty(members, key, { value: result.value, enumerable: true, writable: true, configurable: true });
      height = Math.max(height, result.height);
    }
    return new JsonConversion(members, height + 1);
  }

  private static formatKeyPath(parent: string, key: string): string {
    return JsonReader.PLAIN_NAME.test(key) ? `${parent}${Resources.pathSeparator}${key}` : Resources.formatQuotedKeyPath(parent, JSON.stringify(key));
  }

  private static formatIndexPath(parent: string, index: number): string {
    return `${parent}${Resources.pathSeparator}${index}`;
  }

  private static isObject(value: JsonValue): value is JsonObject {
    return Object.isObject(value) && !Array.isArray(value);
  }
}
