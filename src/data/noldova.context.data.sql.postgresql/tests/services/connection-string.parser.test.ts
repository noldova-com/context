/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DataException } from "@noldova/context.data";
import { ArgumentException } from "@noldova/context.exceptions";
import { ConnectionStringParser } from "@noldova/context.data.sql.postgresql/services/connection-string.parser.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

@TestClass
export class ConnectionStringParserTests {
  @TestMethod
  public readsEveryPartOfTheConnectionString(): void {
    const options = ConnectionStringParser.parse(
      "postgresql://app%40user:p%3Ass@db.example:6543/notes?sslmode=verify-full&channel_binding=require&connect_timeout=5&application_name=notes&search_path=app");

    Assert.areEqual("db.example", options.host);
    Assert.areEqual(6543, options.port);
    Assert.areEqual("notes", options.database);
    Assert.areEqual("app@user", options.user);
    Assert.areEqual("p:ss", options.password);
    Assert.areEqual("verify-full", options.sslMode);
    Assert.areEqual("require", options.channelBinding);
    Assert.areEqual(5, options.connectTimeout);
    Assert.areEqual("notes", options.parameters.get("application_name"));
    Assert.areEqual("app", options.parameters.get("search_path"));
    Assert.isFalse(options.parameters.has("sslmode"));
  }

  @TestMethod
  public appliesTheDefaults(): void {
    const options = ConnectionStringParser.parse("postgres://app@[::1]");

    Assert.areEqual("::1", options.host);
    Assert.areEqual(5432, options.port);
    Assert.areEqual("app", options.database);
    Assert.areEqual("", options.password);
    Assert.areEqual("disable", options.sslMode);
    Assert.areEqual("prefer", options.channelBinding);
    Assert.areEqual(30, options.connectTimeout);
    Assert.areEqual("noldova.context", options.parameters.get("application_name"));
  }

  @TestMethod
  public readsTheCertificateFilesWithoutSendingThem(): void {
    const files = ConnectionStringParser.parse(
      "postgres://app@host/notes?sslmode=verify-ca&sslrootcert=/ca.pem&sslcert=/c.pem&sslkey=/c.key&sslpassword=word&search_path=app");
    const system = ConnectionStringParser.parse("postgres://app@host/notes?sslrootcert=system");
    const none = ConnectionStringParser.parse("postgres://app@host/notes?sslmode=require");

    Assert.areEqual("verify-ca", files.sslMode);
    Assert.areEqual("/ca.pem", files.rootCertificate);
    Assert.areEqual("/c.pem", files.sslCertificate);
    Assert.areEqual("/c.key", files.sslKey);
    Assert.areEqual("word", files.sslPassword);
    Assert.areEqual(JSON.stringify([["application_name", "noldova.context"], ["search_path", "app"]]), JSON.stringify([...files.parameters]));
    Assert.areEqual("verify-full", system.sslMode);
    Assert.isNull(system.rootCertificate);
    Assert.isFalse(system.parameters.has("sslrootcert"));
    Assert.areEqual("require", none.sslMode);
    Assert.isNull(none.rootCertificate);
    Assert.isNull(none.sslCertificate);
    Assert.isNull(none.sslKey);
    Assert.isNull(none.sslPassword);
  }

  @TestMethod
  @TestData("postgres://app@host/notes?sslcert=/c.pem", "sslkey")
  @TestData("postgres://app@host/notes?sslkey=/c.key", "sslcert")
  public refusesHalfAClientCertificate(location: string, parameter: string): void {
    const failure = Assert.throws(() => ConnectionStringParser.parse(location), ArgumentException);

    Assert.areEqual(parameter, failure.parameterName);
  }

  @TestMethod
  @TestData("notes.db")
  @TestData("mysql://app@host/notes")
  @TestData("postgres://host/notes")
  @TestData("postgres://app@host/notes?sslmode=sometimes")
  @TestData("postgres://app@host/notes?connect_timeout=-1")
  @TestData("postgres://app:secret@host/notes?channel_binding=always")
  public refusesAnythingElseWithoutRepeatingIt(location: string): void {
    const failure = Assert.throws(() => ConnectionStringParser.parse(location), DataException);

    Assert.isFalse(failure.message.includes("secret"));
    Assert.isFalse(failure.message.includes(location));
  }
}
