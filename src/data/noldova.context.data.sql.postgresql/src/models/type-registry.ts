/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { Buffer } from "node:buffer";

import "@noldova/context.core";

import { TypeNotFoundException } from "../exceptions/type-not-found.exception.js";
import type { ClientOptions } from "./client-options.js";
import { TypeDefinition } from "./type-definition.js";
import { TypedParameter } from "./typed-parameter.js";
import { Resources } from "../resources.js";
import type { BinaryDecoder } from "../types/binary-decoder.js";
import type { ValueParser } from "../types/value-parser.js";
import type { ValueSerializer } from "../types/value-serializer.js";
import { ArraySerializer } from "../services/types/array-serializer.js";
import { ArrayParser } from "../services/types/array.parser.js";
import { BinaryReaders } from "../services/types/binary-readers.js";
import { DateParser } from "../services/types/date.parser.js";

export class TypeRegistry {
  private static readonly arrays: ReadonlyMap<number, number> = new Map([
    [16, 1000], [17, 1001], [18, 1002], [19, 1003], [20, 1016], [21, 1005], [22, 1006], [23, 1007], [24, 1008],
    [25, 1009], [26, 1028], [27, 1010], [28, 1011], [29, 1012], [30, 1013], [114, 199], [142, 143], [600, 1017],
    [601, 1018], [602, 1019], [603, 1020], [604, 1027], [628, 629], [650, 651], [700, 1021], [701, 1022], [718, 719],
    [774, 775], [790, 791], [829, 1040], [869, 1041], [1033, 1034], [1042, 1014], [1043, 1015], [1082, 1182],
    [1083, 1183], [1114, 1115], [1184, 1185], [1186, 1187], [1266, 1270], [1560, 1561], [1562, 1563], [1700, 1231],
    [1790, 2201], [2202, 2207], [2203, 2208], [2204, 2209], [2205, 2210], [2206, 2211], [2249, 2287], [2275, 1263],
    [2950, 2951], [2970, 2949], [3220, 3221], [3614, 3643], [3615, 3645], [3734, 3735], [3769, 3770], [3802, 3807],
    [3904, 3905], [3906, 3907], [3908, 3909], [3910, 3911], [3912, 3913], [3926, 3927], [4072, 4073], [4089, 4090],
    [4096, 4097], [5038, 5039], [5069, 271]
  ]);

  private static readonly elementsOf: ReadonlyMap<number, number> = new Map([[1000, 16], [1005, 21], [1007, 23], [1016, 20]]);
  private static readonly firstUserOid: number = 16384;
  private static readonly boxOid: number = 603;
  private static readonly bigintOid: number = 20;
  private static readonly byteaOid: number = 17;
  private static readonly jsonOids: readonly number[] = [114, 3802];

  public static readonly number: ValueParser = (text: string): number => Number(text);
  public static readonly boolean: ValueParser = (text: string): boolean => text === Resources.trueLiteral;
  public static readonly json: ValueParser = (text: string): unknown => JSON.parse(text);
  public static readonly bytea: ValueParser = (text: string): Buffer => Buffer.from(text.slice(2), "hex");

  public static readonly string: ValueSerializer = (value: unknown): string => TypeRegistry.serializeString(value);
  public static readonly jsonSerializer: ValueSerializer = (value: unknown): string => JSON.stringify(value);
  public static readonly booleanSerializer: ValueSerializer = (value: unknown): string => value === true ? Resources.trueLiteral : Resources.falseLiteral;
  public static readonly dateSerializer: ValueSerializer = (value: unknown): string => DateParser.serialize(value);
  public static readonly byteaSerializer: ValueSerializer = (value: unknown): string => TypeRegistry.serializeBytea(value);

  private readonly parsers: Map<number, ValueParser> = new Map();
  private readonly serializers: Map<number, ValueSerializer> = new Map();
  private readonly elements: Map<number, readonly [number, string]> = new Map();
  private readonly bases: Map<number, number> = new Map();
  private readonly oids: Map<string, number> = new Map();
  private readonly own: Set<number | string> = new Set();
  private readonly custom: readonly TypeDefinition[];
  private readonly namedTypes: readonly TypeDefinition[];
  private readonly undefinedValue: unknown;

  public constructor(options: ClientOptions) {
    this.undefinedValue = options.transform.undefinedValue;
    for (const [oid, array] of TypeRegistry.arrays)
      this.elements.set(array, [oid, oid === TypeRegistry.boxOid ? Resources.boxDelimiter : Resources.arrayDelimiter]);
    this.register(options.infer ? TypeRegistry.createBuiltIn() : TypeRegistry.createShaped());
    this.parsers.set(1082, DateParser.date);
    this.parsers.set(1114, options.infer ? DateParser.timestamp : DateParser.date);
    this.parsers.set(1184, DateParser.timestamptz);

    this.custom = options.types;
    this.namedTypes = this.custom.filter(definition => definition.oids.some(oid => Object.isString(oid)));
    this.register(this.custom.filter(definition => !this.namedTypes.includes(definition)));
    for (const definition of this.custom)
      for (const oid of definition.oids)
        this.own.add(oid);

    const keys = options.transform.json === true ? options.transform.columnTo : null;
    if (!Object.isNull(keys))
      for (const oid of TypeRegistry.jsonOids) {
        const serializer = this.serializers.get(oid);
        if (!this.own.has(oid) && !Object.isUndefined(serializer))
          this.serializers.set(oid, (value: unknown) => serializer(TypeRegistry.rename(value, keys)));
      }
  }

  public get named(): boolean {
    return this.namedTypes.length > 0;
  }

  public get plain(): boolean {
    return !this.custom.some(definition => !Object.isNull(definition.serialize));
  }

  public static infer(value: unknown): number | string {
    if (value instanceof TypedParameter)
      return value.type;
    if (value instanceof Date)
      return 1184;
    if (value instanceof Uint8Array)
      return TypeRegistry.byteaOid;
    if (Object.isBoolean(value))
      return 16;
    if (Object.isBigInt(value))
      return TypeRegistry.bigintOid;
    if (!Array.isArray(value))
      return 0;

    const element = TypeRegistry.infer(value[0]);
    return Object.isNumber(element) ? TypeRegistry.arrays.get(element) ?? 0 : 0;
  }

  public findBinaryDecoder(oid: number): BinaryDecoder | null {
    if (this.own.has(oid))
      return null;
    if (oid === TypeRegistry.byteaOid)
      return BinaryReaders.bytes;

    const element = TypeRegistry.elementsOf.get(oid);
    if (Object.isUndefined(element))
      return null;

    const decoder = BinaryReaders.arrays.get(element);
    return !Object.isUndefined(decoder) && !this.own.has(element)
      && (element !== TypeRegistry.bigintOid || !this.parsers.has(TypeRegistry.bigintOid))
      ? decoder
      : null;
  }

  public hasUnknownTypes(oids: readonly number[]): boolean {
    return oids.some(oid => oid >= TypeRegistry.firstUserOid && !this.parsers.has(oid) && !this.serializers.has(oid) && !this.elements.has(oid) && !this.bases.has(oid));
  }

  public isKnown(oid: number): boolean {
    return this.serializers.has(oid) || this.elements.has(oid);
  }

  public resolve(type: number | string): number {
    return Object.isString(type) ? this.oids.get(type) ?? 0 : type;
  }

  public findDecoder(oid: number, parser: ValueParser | null): BinaryDecoder | null {
    if (parser === TypeRegistry.number && (oid === 21 || oid === 23 || oid === 26))
      return BinaryReaders.integer;
    if (parser === TypeRegistry.boolean && oid === 16)
      return BinaryReaders.boolean;
    if (parser === DateParser.timestamptz && oid === 1184)
      return BinaryReaders.timestamptz;

    return parser === DateParser.date && (oid === 1114 || oid === 1082) ? BinaryReaders.utcStamp : null;
  }

  public findParser(oid: number): ValueParser | null {
    const known = this.parsers.get(oid);
    if (!Object.isUndefined(known))
      return known;

    const base = this.bases.get(oid);
    if (!Object.isUndefined(base)) {
      const parser = this.findParser(base);
      if (!Object.isNull(parser))
        this.parsers.set(oid, parser);
      return parser;
    }

    const element = this.elements.get(oid);
    if (Object.isUndefined(element))
      return null;

    const [type, delimiter] = element;
    const parse = this.findParser(type);
    const parser = (text: string): unknown[] => ArrayParser.parse(text, parse, delimiter);
    this.parsers.set(oid, parser);
    return parser;
  }

  public findSerializer(oid: number): ValueSerializer {
    const known = this.serializers.get(oid);
    if (!Object.isUndefined(known))
      return known;

    const base = this.bases.get(oid);
    if (!Object.isUndefined(base)) {
      const serializer = this.findSerializer(base);
      this.serializers.set(oid, serializer);
      return serializer;
    }

    const element = this.elements.get(oid);
    if (Object.isUndefined(element))
      return TypeRegistry.string;

    const [type, delimiter] = element;
    const serialize = this.findSerializer(type);
    const serializer = (value: unknown): string | Uint8Array | null =>
      Array.isArray(value) ? ArraySerializer.serialize(value, serialize, delimiter, this.undefinedValue) : serialize(value);
    this.serializers.set(oid, serializer);
    return serializer;
  }

  public async loadAsync(run: (text: string) => Promise<readonly unknown[]>): Promise<void> {
    await Promise.all([this.fetchAsync(run), this.named ? this.loadNamesAsync(run) : Promise.resolve()]);
  }

  private async loadNamesAsync(run: (text: string) => Promise<readonly unknown[]>): Promise<void> {
    const wanted = [...new Set(this.namedTypes.flatMap(definition => definition.oids).filter(oid => Object.isString(oid)))];
    const list = wanted.map(name => Resources.formatTypeNameLiteral(name.slice(name.lastIndexOf(Resources.schemaSeparator) + 1))).join(Resources.arrayDelimiter);
    const rows = (await run(Resources.formatTypeNamesQuery(list))).map(row => TypeRegistry.readFields(row));
    const missing: string[] = [];
    for (const wantedName of wanted) {
      const dot = wantedName.indexOf(Resources.schemaSeparator);
      const schema = dot === -1 ? null : wantedName.slice(0, dot);
      const name = dot === -1 ? wantedName : wantedName.slice(dot + 1);
      const row = rows.find(fields => fields.get(Resources.nameColumn) === name
        && (Object.isNull(schema) ? fields.get(Resources.visibleColumn) === true : fields.get(Resources.schemaColumn) === schema));
      if (Object.isUndefined(row)) {
        missing.push(wantedName);
        continue;
      }

      const oid = Number(row.get(Resources.oidColumn));
      const array = Number(row.get(Resources.arrayColumn));
      this.oids.set(wantedName, oid);
      if (array && !this.elements.has(array))
        this.elements.set(array, [oid, String(row.get(Resources.delimiterColumn))]);
    }

    if (missing.length > 0)
      throw new TypeNotFoundException(missing);

    this.register(this.namedTypes.map(definition =>
      new TypeDefinition(this.resolve(definition.to), definition.from.map(oid => this.resolve(oid)), definition.serialize, definition.parse)));
    for (const definition of this.namedTypes)
      for (const oid of definition.oids)
        this.own.add(this.resolve(oid));
  }

  private async fetchAsync(run: (text: string) => Promise<readonly unknown[]>): Promise<void> {
    const rows = await run(Resources.typesQuery);
    for (const row of rows) {
      const fields = TypeRegistry.readFields(row);
      const oid = Number(fields.get(Resources.oidColumn));
      if (this.parsers.has(oid) || this.serializers.has(oid))
        continue;

      const element = Number(fields.get(Resources.elementColumn));
      if (fields.get(Resources.kindColumn) === Resources.domainKind)
        this.bases.set(oid, Number(fields.get(Resources.baseColumn)));
      else if (element && !this.elements.has(oid))
        this.elements.set(oid, [element, String(fields.get(Resources.delimiterColumn))]);
    }
  }

  private register(definitions: readonly TypeDefinition[]): void {
    for (const definition of definitions) {
      const from = definition.from.map(oid => this.resolve(oid));
      const parse = definition.parse;
      if (!Object.isNull(parse))
        for (const oid of from)
          this.parsers.set(oid, parse);

      const serialize = definition.serialize;
      if (Object.isNull(serialize))
        continue;

      this.serializers.set(this.resolve(definition.to), serialize);
      for (const oid of from)
        this.serializers.set(oid, serialize);
    }
  }

  private static createBuiltIn(): readonly TypeDefinition[] {
    return [
      new TypeDefinition(25, [], TypeRegistry.string, null),
      new TypeDefinition(0, [21, 23, 26, 700, 701], TypeRegistry.string, TypeRegistry.number),
      new TypeDefinition(114, TypeRegistry.jsonOids, TypeRegistry.jsonSerializer, TypeRegistry.json),
      new TypeDefinition(16, [16], TypeRegistry.booleanSerializer, TypeRegistry.boolean),
      new TypeDefinition(1184, [1082, 1114, 1184], TypeRegistry.dateSerializer, null),
      new TypeDefinition(TypeRegistry.byteaOid, [TypeRegistry.byteaOid], TypeRegistry.byteaSerializer, TypeRegistry.bytea)
    ];
  }

  private static createShaped(): readonly TypeDefinition[] {
    return TypeRegistry.createBuiltIn().map(definition => {
      if (definition.to === 16)
        return TypeRegistry.reshape(definition, value => Object.isBoolean(value), TypeRegistry.booleanSerializer);
      if (definition.to === 1184)
        return TypeRegistry.reshape(definition, value => value instanceof Date, TypeRegistry.dateSerializer);
      if (definition.to === TypeRegistry.byteaOid)
        return TypeRegistry.reshape(definition, value => value instanceof Uint8Array, TypeRegistry.byteaSerializer);

      return definition;
    });
  }

  private static reshape(definition: TypeDefinition, accepts: (value: unknown) => boolean, serialize: ValueSerializer): TypeDefinition {
    return new TypeDefinition(definition.to, definition.from, value => accepts(value) ? serialize(value) : TypeRegistry.serializeString(value), definition.parse);
  }

  private static serializeString(value: unknown): string {
    if (value instanceof Date)
      return DateParser.serialize(value);
    if (Array.isArray(value))
      return ArraySerializer.serialize(value, TypeRegistry.string);
    if (TypeRegistry.isLiteral(value))
      return JSON.stringify(value);

    return String(value);
  }

  private static serializeBytea(value: unknown): string {
    const bytes = value instanceof Uint8Array ? Buffer.from(value) : Buffer.from(String(value));
    return Resources.byteaPrefix + bytes.toString("hex");
  }

  private static isLiteral(value: unknown): value is object {
    if (!Object.isObject(value))
      return false;

    const prototype: unknown = Object.getPrototypeOf(value);
    return prototype === Object.prototype || Object.isNull(prototype);
  }

  private static rename(value: unknown, rename: (name: string) => string): unknown {
    if (Array.isArray(value))
      return value.map((item: unknown) => TypeRegistry.rename(item, rename));
    if (!TypeRegistry.isLiteral(value))
      return value;

    const renamed = {};
    for (const [key, item] of Object.entries(value))
      Object.defineProperty(renamed, rename(key), { value: TypeRegistry.rename(item, rename), enumerable: true, writable: true, configurable: true });

    return renamed;
  }

  private static readFields(row: unknown): ReadonlyMap<string, unknown> {
    return Object.isObject(row) ? new Map(Object.entries(row)) : new Map();
  }
}
