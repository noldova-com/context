/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DataException } from "@noldova/context.data";
import { ClientOptions } from "@noldova/context.data.sql.postgresql/models/client-options.js";
import { TransformOptions } from "@noldova/context.data.sql.postgresql/models/transform-options.js";
import { TypeDefinition } from "@noldova/context.data.sql.postgresql/models/type-definition.js";
import { TypedParameter } from "@noldova/context.data.sql.postgresql/models/typed-parameter.js";
import { BinaryReaders } from "@noldova/context.data.sql.postgresql/services/types/binary-readers.js";
import { DateParser } from "@noldova/context.data.sql.postgresql/services/types/date.parser.js";
import { TypeRegistry } from "@noldova/context.data.sql.postgresql/models/type-registry.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeRegistryTests {
  @TestMethod
  public parsesTheBuiltInTypes(): void {
    const registry = new TypeRegistry(new ClientOptions());

    Assert.areEqual(5, registry.findParser(23)?.("5"));
    Assert.areEqual(true, registry.findParser(16)?.("t"));
    Assert.areEqual("{\"a\":2}", JSON.stringify(registry.findParser(114)?.("{\"a\":2}")));
    Assert.areEqual("ab", String(registry.findParser(17)?.("\\x6162")));
    Assert.areEqual(DateParser.date, registry.findParser(1114));
    Assert.isNull(registry.findParser(25));
    Assert.isNull(registry.findParser(99999));
  }

  @TestMethod
  public buildsAndKeepsArrayParsers(): void {
    const registry = new TypeRegistry(new ClientOptions());

    const parser = registry.findParser(1007);

    Assert.areEqual("[1,2]", JSON.stringify(parser?.("{1,2}")));
    Assert.areEqual(parser, registry.findParser(1007));
    Assert.areEqual("[\"(1,1),(0,0)\"]", JSON.stringify(registry.findParser(1020)?.("{(1,1),(0,0)}")));
  }

  @TestMethod
  public serializesTheBuiltInTypes(): void {
    const registry = new TypeRegistry(new ClientOptions());

    Assert.areEqual("t", registry.findSerializer(16)(true));
    Assert.areEqual("f", registry.findSerializer(16)(false));
    Assert.areEqual("yes", registry.findSerializer(16)("yes"));
    Assert.areEqual("2024-01-02T00:00:00.000Z", registry.findSerializer(1184)(new Date(Date.UTC(2024, 0, 2))));
    Assert.areEqual("now", registry.findSerializer(1184)("now"));
    Assert.areEqual("\\xab", registry.findSerializer(17)(new Uint8Array([171])));
    Assert.areEqual("ab", registry.findSerializer(17)("ab"));
    Assert.areEqual("{\"a\":1}", registry.findSerializer(114)({ a: 1 }));
    Assert.areEqual("5", registry.findSerializer(99999)(5));
  }

  @TestMethod
  public serializesTextByShape(): void {
    const serialize = TypeRegistry.string;

    Assert.areEqual("{\"a\":1}", serialize({ a: 1 }));
    Assert.areEqual("2024-01-02T00:00:00.000Z", serialize(new Date(Date.UTC(2024, 0, 2))));
    Assert.areEqual("{\"1\",\"2\"}", serialize([1, 2]));
    Assert.areEqual("x", serialize("x"));
    Assert.areEqual("1", serialize(1));
    Assert.areEqual("\\x6869", TypeRegistry.byteaSerializer("hi"));
  }

  @TestMethod
  public serializesArraysOfAKnownType(): void {
    const registry = new TypeRegistry(new ClientOptions());

    const serializer = registry.findSerializer(1000);

    Assert.areEqual("{\"t\",\"f\"}", serializer([true, false]));
    Assert.areEqual("t", serializer(true));
    Assert.areEqual(serializer, registry.findSerializer(1000));
  }

  @TestMethod
  public refusesUndefinedInArraysUnlessTransformed(): void {
    const strict = new TypeRegistry(new ClientOptions());
    const lenient = new TypeRegistry(new ClientOptions({ transform: new TransformOptions({ undefinedValue: null }) }));

    Assert.throws(() => strict.findSerializer(1007)([undefined]), DataException);
    Assert.areEqual("{NULL}", lenient.findSerializer(1007)([undefined]));
  }

  @TestMethod
  public infersParameterTypes(): void {
    Assert.areEqual(1184, TypeRegistry.infer(new Date()));
    Assert.areEqual(17, TypeRegistry.infer(new Uint8Array(1)));
    Assert.areEqual(16, TypeRegistry.infer(true));
    Assert.areEqual(20, TypeRegistry.infer(1n));
    Assert.areEqual(0, TypeRegistry.infer("x"));
    Assert.areEqual("custom", TypeRegistry.infer(new TypedParameter(1, "custom")));
    Assert.areEqual(1000, TypeRegistry.infer([true]));
    Assert.areEqual(0, TypeRegistry.infer([1]));
    Assert.areEqual(0, TypeRegistry.infer([new TypedParameter(1, "custom")]));
  }

  @TestMethod
  public usesLocalTimestampsWhenInferring(): void {
    const registry = new TypeRegistry(new ClientOptions({ infer: true }));

    Assert.areEqual(DateParser.timestamp, registry.findParser(1114));
    Assert.areEqual("f", registry.findSerializer(16)("yes"));
  }

  @TestMethod
  public choosesBinaryDecoders(): void {
    const registry = new TypeRegistry(new ClientOptions());

    Assert.areEqual(BinaryReaders.bytes, registry.findBinaryDecoder(17));
    Assert.areEqual(BinaryReaders.arrays.get(23), registry.findBinaryDecoder(1007));
    Assert.areEqual(BinaryReaders.arrays.get(20), registry.findBinaryDecoder(1016));
    Assert.isNull(registry.findBinaryDecoder(23));
    Assert.isNull(registry.findBinaryDecoder(1009));
  }

  @TestMethod
  public leavesCustomTypesToText(): void {
    const parse = (text: string): string => text;
    const registry = new TypeRegistry(new ClientOptions({
      types: [new TypeDefinition(17, [17], null, parse), new TypeDefinition(23, [1005], null, parse), new TypeDefinition(20, [20], null, parse),
        new TypeDefinition(16, [16], null, parse)]
    }));

    Assert.isNull(registry.findBinaryDecoder(17));
    Assert.isNull(registry.findBinaryDecoder(1005));
    Assert.isNull(registry.findBinaryDecoder(1016));
    Assert.isNull(registry.findBinaryDecoder(1000));
    Assert.areEqual(parse, registry.findParser(20));
    Assert.isTrue(registry.plain);
    Assert.isFalse(registry.named);
  }

  @TestMethod
  public choosesTextFastPaths(): void {
    const registry = new TypeRegistry(new ClientOptions());

    Assert.areEqual(BinaryReaders.integer, registry.findDecoder(23, TypeRegistry.number));
    Assert.areEqual(BinaryReaders.integer, registry.findDecoder(21, TypeRegistry.number));
    Assert.areEqual(BinaryReaders.integer, registry.findDecoder(26, TypeRegistry.number));
    Assert.isNull(registry.findDecoder(700, TypeRegistry.number));
    Assert.areEqual(BinaryReaders.boolean, registry.findDecoder(16, TypeRegistry.boolean));
    Assert.areEqual(BinaryReaders.timestamptz, registry.findDecoder(1184, DateParser.timestamptz));
    Assert.areEqual(BinaryReaders.utcStamp, registry.findDecoder(1114, DateParser.date));
    Assert.areEqual(BinaryReaders.utcStamp, registry.findDecoder(1082, DateParser.date));
    Assert.isNull(registry.findDecoder(1184, DateParser.date));
    Assert.isNull(registry.findDecoder(25, null));
  }

  @TestMethod
  public tellsKnownAndUnknownTypes(): void {
    const registry = new TypeRegistry(new ClientOptions());

    Assert.isTrue(registry.hasUnknownTypes([23, 16384]));
    Assert.isFalse(registry.hasUnknownTypes([23, 1007]));
    Assert.isTrue(registry.isKnown(25));
    Assert.isTrue(registry.isKnown(1007));
    Assert.isFalse(registry.isKnown(99999));
    Assert.areEqual(0, registry.resolve("missing"));
    Assert.areEqual(5, registry.resolve(5));
  }

  @TestMethod
  public renamesJsonKeysWhenAsked(): void {
    const registry = new TypeRegistry(new ClientOptions({
      transform: new TransformOptions({ json: true, columnTo: name => name.toUpperCase() })
    }));
    const kept = new TypeRegistry(new ClientOptions({
      types: [new TypeDefinition(114, [114], value => String(value), null)],
      transform: new TransformOptions({ json: true, columnTo: name => name.toUpperCase() })
    }));

    Assert.areEqual("{\"A\":{\"B\":1},\"C\":[{\"D\":2}]}", registry.findSerializer(3802)({ a: { b: 1 }, c: [{ d: 2 }] }));
    Assert.areEqual("\"2024-01-02T00:00:00.000Z\"", registry.findSerializer(114)(new Date(Date.UTC(2024, 0, 2))));
    Assert.areEqual("[object Object]", kept.findSerializer(114)({ a: 1 }));
    Assert.isFalse(kept.plain);
  }

  @TestMethod
  public async loadsArraysAndDomainsAsync(): Promise<void> {
    const registry = new TypeRegistry(new ClientOptions());
    const texts: string[] = [];

    await registry.loadAsync(text => {
      texts.push(text);
      return Promise.resolve([
        { oid: 16385, element: 0, kind: "d", base: 23, delimiter: "," },
        { oid: 16386, element: 16385, kind: "b", base: 0, delimiter: "," },
        { oid: 23, element: 0, kind: "b", base: 0, delimiter: "," },
        { oid: 16390, element: 0, kind: "b", base: 0, delimiter: "," },
        "not a row"
      ]);
    });

    Assert.areEqual(1, texts.length);
    Assert.areEqual(7, registry.findParser(16385)?.("7"));
    Assert.areEqual(7, registry.findParser(16385)?.("7"));
    Assert.areEqual("[1,2]", JSON.stringify(registry.findParser(16386)?.("{1,2}")));
    Assert.areEqual("true", registry.findSerializer(16385)(true));
    Assert.isFalse(registry.hasUnknownTypes([16385, 16386]));
    Assert.isTrue(registry.hasUnknownTypes([16390]));
  }

  @TestMethod
  public async keepsADomainOfTextUnparsedAsync(): Promise<void> {
    const registry = new TypeRegistry(new ClientOptions());

    await registry.loadAsync(() => Promise.resolve([{ oid: 16385, element: 0, kind: "d", base: 25, delimiter: "," }]));

    Assert.isNull(registry.findParser(16385));
  }

  @TestMethod
  public async resolvesNamedTypesAsync(): Promise<void> {
    const parse = (text: string): string => text.toUpperCase();
    const serialize = (value: unknown): string => String(value).toLowerCase();
    const registry = new TypeRegistry(new ClientOptions({
      types: [new TypeDefinition("citext", ["citext"], serialize, parse), new TypeDefinition("app.mood", ["app.mood"], null, parse)]
    }));
    const texts: string[] = [];
    Assert.isTrue(registry.named);

    await registry.loadAsync(text => {
      texts.push(text);
      return Promise.resolve(text.includes("'citext'") ? [
        { oid: 16400, array: 16401, name: "citext", schema: "public", visible: true, delimiter: "," },
        { oid: 16410, array: 0, name: "mood", schema: "app", visible: false, delimiter: "," }
      ] : []);
    });

    Assert.areEqual(2, texts.length);
    Assert.areEqual(16400, registry.resolve("citext"));
    Assert.areEqual(16410, registry.resolve("app.mood"));
    Assert.areEqual("ABC", registry.findParser(16400)?.("abc"));
    Assert.areEqual("abc", registry.findSerializer(16400)("ABC"));
    Assert.areEqual("[\"A\",\"B\"]", JSON.stringify(registry.findParser(16401)?.("{a,b}")));
    Assert.areEqual("HAPPY", registry.findParser(16410)?.("happy"));
    Assert.isNull(registry.findBinaryDecoder(16400));
  }

  @TestMethod
  public async reportsMissingNamedTypesAsync(): Promise<void> {
    const one = new TypeRegistry(new ClientOptions({ types: [new TypeDefinition("nope", ["nope"], null, null)] }));
    const two = new TypeRegistry(new ClientOptions({
      types: [new TypeDefinition("nope", ["nope"], null, null), new TypeDefinition("app.other", ["app.other"], null, null)]
    }));

    const single = await Assert.throwsAsync(() => one.loadAsync(() => Promise.resolve([])), DataException);
    const both = await Assert.throwsAsync(() => two.loadAsync(() => Promise.resolve([
      { oid: 1, array: 0, name: "other", schema: "public", visible: true, delimiter: "," }
    ])), DataException);

    Assert.isTrue(single.message.includes("nope"));
    Assert.isTrue(both.message.includes("nope, app.other"));
  }
}
