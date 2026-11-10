/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import { ArgumentException } from "@noldova/context.exceptions";
import { ClientOptionsParser } from "@noldova/context.data.sql.postgresql/services/client-options.parser.js";
import type { ClientSettings } from "@noldova/context.data.sql.postgresql/types/client-settings.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

@TestClass
export class ClientOptionsParserTests {
  @TestMethod
  public readsTheConnectionStringAndItsQuery(): void {
    const parsed = ClientOptionsParser.parse(
      "postgres://app%40user:p%3Ass@db.example:6543/notes?sslmode=require&channel_binding=require&connect_timeout=5&search_path=app"
      + "&max=4&min=1&idle_timeout=20&queue_timeout=2&query_timeout=3&cancel_timeout=4&max_lifetime=60&max_pipeline=5&backoff=2&keep_alive=7"
      + "&scheduler=false&prepare=disable&debug=true&fetch_types=false&infer=true&publications=all&slot=one&sslnegotiation=postgres");
    const connection = parsed.connection;
    const options = parsed.options;

    Assert.areEqual("db.example", connection.host);
    Assert.areEqual(6543, connection.port);
    Assert.areEqual("notes", connection.database);
    Assert.areEqual("app@user", connection.user);
    Assert.areEqual("p:ss", connection.password);
    Assert.areEqual("require", connection.sslMode);
    Assert.areEqual("require", connection.channelBinding);
    Assert.areEqual(5, connection.connectTimeout);
    Assert.areEqual(JSON.stringify([["application_name", "noldova.context"], ["search_path", "app"]]), JSON.stringify([...connection.parameters]));
    Assert.areEqual(JSON.stringify([4, 1, 20, 2, 3, 4, 60, 5, 2, 7]), JSON.stringify([
      options.max, options.min, options.idleTimeout, options.queueTimeout, options.queryTimeout, options.cancelTimeout, options.maxLifetime, options.maxPipeline,
      options.backoff, options.keepAlive]));
    Assert.areEqual(JSON.stringify([false, false, true, false, true]), JSON.stringify([options.scheduler, options.prepare, options.debug, options.fetchTypes, options.infer]));
  }

  @TestMethod
  public letsTheSettingsWinOverTheConnectionString(): void {
    const settings: ClientSettings = {
      host: "other", port: 7000, database: "base", user: "owner", password: "word", ssl: true, channelBinding: "disable", connectTimeout: 9, max: 2, infer: false,
      connection: new Map([["application_name", "mine"], ["timezone", "UTC"]])
    };
    const parsed = ClientOptionsParser.parse("postgres://app:secret@db.example:6543/notes?max=4&infer=1&channel_binding=require&connect_timeout=5", settings);

    Assert.areEqual("other", parsed.connection.host);
    Assert.areEqual(7000, parsed.connection.port);
    Assert.areEqual("base", parsed.connection.database);
    Assert.areEqual("owner", parsed.connection.user);
    Assert.areEqual("word", parsed.connection.password);
    Assert.areEqual("verify-full", parsed.connection.sslMode);
    Assert.areEqual("disable", parsed.connection.channelBinding);
    Assert.areEqual(9, parsed.connection.connectTimeout);
    Assert.areEqual("mine", parsed.connection.parameters.get("application_name"));
    Assert.areEqual("UTC", parsed.connection.parameters.get("timezone"));
    Assert.areEqual(2, parsed.options.max);
    Assert.isFalse(parsed.options.infer);
  }

  @TestMethod
  public appliesTheDefaults(): void {
    const parsed = ClientOptionsParser.parse(null, { user: "app" });

    Assert.areEqual("localhost", parsed.connection.host);
    Assert.areEqual(5432, parsed.connection.port);
    Assert.areEqual("app", parsed.connection.database);
    Assert.areEqual("", parsed.connection.password);
    Assert.areEqual("disable", parsed.connection.sslMode);
    Assert.areEqual("prefer", parsed.connection.channelBinding);
    Assert.areEqual(30, parsed.connection.connectTimeout);
    Assert.areEqual(10, parsed.options.max);
    Assert.isTrue(parsed.options.prepare);
    Assert.isFalse(parsed.options.infer);
  }

  @TestMethod
  public readsHostsPortsAndInvalidEscapes(): void {
    const bracketed = ClientOptionsParser.parse("postgres://app:%E0%A4%A@[::1]:6000/%ZZ");
    const portOnly = ClientOptionsParser.parse("postgres://app@:6001");
    const fromQuery = ClientOptionsParser.parse("postgres://app@/notes?host=db.example&port=6002");
    const bare = ClientOptionsParser.parse("postgres://app@db.example");

    Assert.areEqual("::1", bracketed.connection.host);
    Assert.areEqual(6000, bracketed.connection.port);
    Assert.areEqual("%E0%A4%A", bracketed.connection.password);
    Assert.areEqual("%ZZ", bracketed.connection.database);
    Assert.areEqual("localhost", portOnly.connection.host);
    Assert.areEqual(6001, portOnly.connection.port);
    Assert.areEqual("db.example", fromQuery.connection.host);
    Assert.areEqual(6002, fromQuery.connection.port);
    Assert.areEqual("db.example", bare.connection.host);
    Assert.areEqual(5432, bare.connection.port);
  }

  @TestMethod
  public splitsHostListsAsPostgresJsDoes(): void {
    const url = ClientOptionsParser.parseUrl("postgres://u@a:1,[b::2]:3,::4,c:/d");
    const given = ClientOptionsParser.parseHosts(["x", "y"], undefined, url);
    const empty = ClientOptionsParser.parseHosts(undefined, undefined, ClientOptionsParser.parseUrl("postgres://u@/d"));

    Assert.areEqual(JSON.stringify([["a", 1], ["b::2", 3], ["::4", null], ["c", null]]), JSON.stringify(url.targets));
    Assert.areEqual(JSON.stringify([["x", null], ["y", null]]), JSON.stringify(given));
    Assert.areEqual(JSON.stringify([["localhost", null]]), JSON.stringify(empty));
  }

  @TestMethod
  @TestData("false", "disable")
  @TestData("disable", "disable")
  @TestData("", "disable")
  @TestData("prefer", "prefer")
  @TestData("allow", "prefer")
  @TestData("require", "require")
  @TestData("verify-ca", "verify-ca")
  @TestData("verify-full", "verify-full")
  @TestData("true", "verify-full")
  public mapsTheSslSettingOntoAMode(ssl: string, mode: string): void {
    Assert.areEqual(mode, ClientOptionsParser.parseSslMode(ssl));
  }

  @TestMethod
  public readsTheSslModeFromTheQueryOrTheSystemCertificates(): void {
    Assert.areEqual("disable", ClientOptionsParser.parseSslMode(false));
    Assert.areEqual("prefer", ClientOptionsParser.parse("postgres://app@host?ssl=prefer").connection.sslMode);
    Assert.areEqual("require", ClientOptionsParser.parse("postgres://app@host?ssl=prefer&sslmode=require").connection.sslMode);
    Assert.areEqual("verify-full", ClientOptionsParser.parse("postgres://app@host?sslrootcert=system").connection.sslMode);
  }

  @TestMethod
  public readsTheCertificateFilesWithoutSendingThem(): void {
    const files = ClientOptionsParser.parse(
      "postgres://app@host/notes?sslmode=verify-ca&sslrootcert=/ca.pem&sslcert=/c.pem&sslkey=/c.key&sslpassword=word&search_path=app").connection;
    const system = ClientOptionsParser.parse("postgres://app@host/notes?sslmode=require&sslrootcert=system").connection;
    const none = ClientOptionsParser.parse("postgres://app@host/notes").connection;

    Assert.areEqual("verify-ca", files.sslMode);
    Assert.areEqual("/ca.pem", files.rootCertificate);
    Assert.areEqual("/c.pem", files.sslCertificate);
    Assert.areEqual("/c.key", files.sslKey);
    Assert.areEqual("word", files.sslPassword);
    Assert.areEqual(JSON.stringify([["application_name", "noldova.context"], ["search_path", "app"]]), JSON.stringify([...files.parameters]));
    Assert.areEqual("verify-full", system.sslMode);
    Assert.isNull(system.rootCertificate);
    Assert.isFalse(system.parameters.has("sslrootcert"));
    Assert.isNull(none.rootCertificate);
    Assert.isNull(none.sslCertificate);
    Assert.isNull(none.sslKey);
    Assert.isNull(none.sslPassword);
  }

  @TestMethod
  public parsesTransformsInBothForms(): void {
    const column = (name: string): string => name.toUpperCase();
    const value = (item: unknown): unknown => item;
    const row = (item: unknown): unknown => item;
    const functions = ClientOptionsParser.parseTransform({ column, value, row, json: true, undefined: null });
    const objects = ClientOptionsParser.parseTransform({ column: { from: column, to: column }, value: { from: value, to: value }, row: { from: row, to: row } });
    const none = ClientOptionsParser.parseTransform({});

    Assert.areEqual(column, functions.columnFrom);
    Assert.isNull(functions.columnTo);
    Assert.areEqual(value, functions.valueFrom);
    Assert.isNull(functions.valueTo);
    Assert.areEqual(row, functions.rowFrom);
    Assert.isNull(functions.rowTo);
    Assert.isTrue(functions.json === true);
    Assert.isNull(functions.undefinedValue);
    Assert.areEqual(column, objects.columnTo);
    Assert.areEqual(value, objects.valueTo);
    Assert.areEqual(row, objects.rowTo);
    Assert.areEqual(column, objects.columnFrom);
    Assert.areEqual(value, objects.valueFrom);
    Assert.areEqual(row, objects.rowFrom);
    Assert.isNull(none.columnFrom);
    Assert.isNull(none.json);
    Assert.isUndefined(none.undefinedValue);
  }

  @TestMethod
  public acceptsTheKnownChannelBindingsAndSessionAttributes(): void {
    Assert.areEqual("prefer", ClientOptionsParser.parseBinding(null));
    Assert.doesNotThrow(() => ClientOptionsParser.validateTargetSession(null));
    Assert.doesNotThrow(() => ClientOptionsParser.validateTargetSession(""));
  }

  @TestMethod
  @TestData("postgres://app@a,b/notes", "host")
  @TestData("postgres://app@/notes?host=/var/run", "host")
  @TestData("postgres://app@host/notes?target_session_attrs=primary", "targetSessionAttrs")
  @TestData("postgres://app@host/notes?target_session_attrs=any", "targetSessionAttrs")
  @TestData("postgres://app@host/notes?channel_binding=always", "channelBinding")
  @TestData("postgres://app@host/notes?sslnegotiation=direct", "sslnegotiation")
  @TestData("postgres://app@host/notes?sslcert=/c.pem", "sslkey")
  @TestData("postgres://app@host/notes?sslkey=/c.key", "sslcert")
  @TestData("postgres://host/notes", "user")
  public refusesWhatTheConnectionCannotHonour(location: string, parameter: string): void {
    const failure = Assert.throws(() => ClientOptionsParser.parse(location), ArgumentException);

    Assert.areEqual(parameter, failure.parameterName);
  }

  @TestMethod
  public refusesAnEmptyHostList(): void {
    const failure = Assert.throws(() => ClientOptionsParser.parse(null, { host: [], user: "app" }), ArgumentException);

    Assert.areEqual("host", failure.parameterName);
  }

  @TestMethod
  @TestData("connect_timeout", "10s")
  @TestData("connect_timeout", "-1")
  @TestData("port", "")
  @TestData("max", "1.5")
  @TestData("idle_timeout", "99999999999999999999")
  public refusesANumberOptionThatIsNotAWholeNumber(name: string, value: string): void {
    const failure = Assert.throws(() => ClientOptionsParser.parse(`postgres://app@db.example/notes?${name}=${value}`), ArgumentException);

    Assert.areEqual(name, failure.parameterName);
    Assert.areEqual(`The connection string's ${name} is not a whole number of zero or more. (Parameter '${name}')`, failure.message);
  }
}
