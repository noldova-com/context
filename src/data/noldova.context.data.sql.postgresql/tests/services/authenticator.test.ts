/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { Buffer } from "node:buffer";
import { createHash, createHmac, pbkdf2Sync } from "node:crypto";

import { DataException } from "@noldova/context.data";
import { Authenticator } from "@noldova/context.data.sql.postgresql/services/authenticator.js";
import { Frontend } from "@noldova/context.data.sql.postgresql/services/protocol/frontend.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { Der } from "../fixtures/der.fixture.js";

@TestClass
export class AuthenticatorTests {
  private static readonly password: string = "pencil";
  private static readonly salt: string = Buffer.from("salt-for-tests").toString("base64");
  private static readonly iterations: number = 4096;
  private static readonly both: string = "SCRAM-SHA-256\0SCRAM-SHA-256-PLUS\0\0";
  private static readonly certificate: Buffer = Der.certificate(Der.algorithm("2a8648ce3d040302"));

  @TestMethod
  public signsInWithScramAndVerifiesTheServer(): void {
    const authenticator = new Authenticator("app", AuthenticatorTests.password, "prefer", null, new Frontend());

    const first = AuthenticatorTests.saslInitial(AuthenticatorTests.respond(authenticator, 10, "SCRAM-SHA-256\0\0"));
    Assert.isTrue(first.startsWith("n,,n=*,r="));
    const clientNonce = first.slice("n,,n=*,r=".length);
    const serverFirst = `r=${clientNonce}server,s=${AuthenticatorTests.salt},i=${AuthenticatorTests.iterations}`;
    const final = AuthenticatorTests.saslResponse(AuthenticatorTests.respond(authenticator, 11, serverFirst));
    const [expectedProof, serverSignature] = AuthenticatorTests.expected(`n=*,r=${clientNonce},${serverFirst},c=biws,r=${clientNonce}server`);

    Assert.areEqual(`c=biws,r=${clientNonce}server,p=${expectedProof}`, final);
    Assert.isNull(authenticator.respond(12, Buffer.from(`v=${serverSignature}`)));
    Assert.isFalse(authenticator.isAuthenticated);
    Assert.isNull(authenticator.respond(0, Buffer.alloc(0)));
    Assert.isTrue(authenticator.isAuthenticated);
  }

  @TestMethod
  public refusesAServerThatDoesNotProveThePassword(): void {
    const wrongSignature = new Authenticator("app", AuthenticatorTests.password, "prefer", null, new Frontend());
    const nonce = AuthenticatorTests.saslInitial(AuthenticatorTests.respond(wrongSignature, 10, "SCRAM-SHA-256\0\0")).slice("n,,n=*,r=".length);
    AuthenticatorTests.respond(wrongSignature, 11, `r=${nonce}x,s=${AuthenticatorTests.salt},i=${AuthenticatorTests.iterations}`);
    Assert.throws(() => wrongSignature.respond(12, Buffer.from("v=AAAA")), DataException);

    const skipped = new Authenticator("app", AuthenticatorTests.password, "prefer", null, new Frontend());
    AuthenticatorTests.respond(skipped, 10, "SCRAM-SHA-256\0\0");
    Assert.throws(() => skipped.respond(0, Buffer.alloc(0)), DataException);

    const foreignNonce = new Authenticator("app", AuthenticatorTests.password, "prefer", null, new Frontend());
    AuthenticatorTests.respond(foreignNonce, 10, "SCRAM-SHA-256\0\0");
    Assert.throws(() => foreignNonce.respond(11, Buffer.from(`r=other,s=${AuthenticatorTests.salt},i=1`)), DataException);
  }

  @TestMethod
  public answersPasswordRequestsUnlessChannelBindingIsRequired(): void {
    const plain = new Authenticator("app", AuthenticatorTests.password, "prefer", null, new Frontend());
    const cleartext = AuthenticatorTests.respond(plain, 3, "");
    const md5 = AuthenticatorTests.respond(plain, 5, Buffer.from("01020304", "hex"));
    const inner = createHash("md5").update(AuthenticatorTests.password + "app").digest("hex");
    const outer = createHash("md5").update(Buffer.concat([Buffer.from(inner), Buffer.from("01020304", "hex")])).digest("hex");

    Assert.areEqual(AuthenticatorTests.password + "\0", cleartext.toString("utf8", 5));
    Assert.areEqual("md5" + outer + "\0", md5.toString("utf8", 5));
    Assert.isNull(plain.respond(0, Buffer.alloc(0)));
    Assert.isTrue(plain.isAuthenticated);

    const bound = new Authenticator("app", AuthenticatorTests.password, "require", null, new Frontend());
    Assert.throws(() => bound.respond(3, Buffer.alloc(0)), DataException);
    Assert.throws(() => bound.respond(5, Buffer.alloc(4)), DataException);
    Assert.throws(() => bound.respond(10, Buffer.from("SCRAM-SHA-256\0SCRAM-SHA-256-PLUS\0\0")), DataException);
  }

  @TestMethod
  public refusesUnsupportedMechanismsAndTypes(): void {
    const authenticator = new Authenticator("app", AuthenticatorTests.password, "prefer", null, new Frontend());

    Assert.throws(() => authenticator.respond(10, Buffer.from("SCRAM-SHA-1\0\0")), DataException);
    Assert.throws(() => authenticator.respond(7, Buffer.alloc(0)), DataException);
  }

  @TestMethod
  public bindsTheChannelToTheServerCertificate(): void {
    const hash = createHash("sha256").update(AuthenticatorTests.certificate).digest();
    const expected = Buffer.concat([Buffer.from("p=tls-server-end-point,,"), hash]).toString("hex");

    for (const binding of ["prefer", "require"]) {
      const authenticator = new Authenticator("app", AuthenticatorTests.password, binding, AuthenticatorTests.certificate, new Frontend());
      const [mechanism, channel] = AuthenticatorTests.signIn(authenticator, AuthenticatorTests.both);

      Assert.areEqual("SCRAM-SHA-256-PLUS", mechanism);
      Assert.areEqual(expected, channel.toString("hex"));
    }
  }

  @TestMethod
  public saysTheChannelCouldBeBoundWhenTheServerOffersNoBinding(): void {
    const authenticator = new Authenticator("app", AuthenticatorTests.password, "prefer", AuthenticatorTests.certificate, new Frontend());

    const [mechanism, channel] = AuthenticatorTests.signIn(authenticator, "SCRAM-SHA-256\0\0");

    Assert.areEqual("SCRAM-SHA-256", mechanism);
    Assert.areEqual("y,,", channel.toString("utf8"));
  }

  @TestMethod
  public leavesTheChannelUnboundWhenDisabledOrTheCertificateIsUnknown(): void {
    const disabled = new Authenticator("app", AuthenticatorTests.password, "disable", AuthenticatorTests.certificate, new Frontend());
    const unknown = new Authenticator(
      "app", AuthenticatorTests.password, "prefer", Der.certificate(Der.algorithm("2a0304")), new Frontend());

    const [disabledMechanism, disabledChannel] = AuthenticatorTests.signIn(disabled, AuthenticatorTests.both);
    const [unknownMechanism, unknownChannel] = AuthenticatorTests.signIn(unknown, AuthenticatorTests.both);

    Assert.areEqual("SCRAM-SHA-256", disabledMechanism);
    Assert.areEqual("n,,", disabledChannel.toString("utf8"));
    Assert.areEqual("SCRAM-SHA-256", unknownMechanism);
    Assert.areEqual("n,,", unknownChannel.toString("utf8"));
  }

  @TestMethod
  public refusesASignInWithoutBindingWhenBindingIsRequired(): void {
    const authenticator = new Authenticator("app", AuthenticatorTests.password, "require", AuthenticatorTests.certificate, new Frontend());

    Assert.throws(() => authenticator.respond(0, Buffer.alloc(0)), DataException);
    Assert.isFalse(authenticator.isAuthenticated);
  }

  @TestMethod
  public refusesAServerFirstMessageWithoutItsFields(): void {
    const noNonce = new Authenticator("app", AuthenticatorTests.password, "prefer", null, new Frontend());
    AuthenticatorTests.respond(noNonce, 10, "SCRAM-SHA-256\0\0");
    const noSalt = new Authenticator("app", AuthenticatorTests.password, "prefer", null, new Frontend());
    const nonce = AuthenticatorTests.saslInitial(AuthenticatorTests.respond(noSalt, 10, "SCRAM-SHA-256\0\0")).slice("n,,n=*,r=".length);

    Assert.throws(() => noNonce.respond(11, Buffer.from(`s=${AuthenticatorTests.salt},i=1`)), DataException);
    Assert.throws(() => noSalt.respond(11, Buffer.from(`r=${nonce}server`)), RangeError);
  }

  @TestMethod
  public keepsSigningInCorrectlyPastTheSaltedPasswordCache(): void {
    const salts = Array.from({ length: 70 }, (_value, index) => Buffer.from(`cache-salt-${index.toString()}`).toString("base64"));

    for (const salt of [...salts, salts[0] ?? ""]) {
      const authenticator = new Authenticator("app", AuthenticatorTests.password, "prefer", null, new Frontend());
      const [mechanism] = AuthenticatorTests.signIn(authenticator, "SCRAM-SHA-256\0\0", salt, 1);

      Assert.areEqual("SCRAM-SHA-256", mechanism);
    }
  }

  private static signIn(
    authenticator: Authenticator, offered: string, salt: string = AuthenticatorTests.salt,
    iterations: number = AuthenticatorTests.iterations): readonly [string, Buffer] {
    const initial = AuthenticatorTests.respond(authenticator, 10, offered);
    const mechanism = initial.toString("utf8", 5, initial.indexOf(0, 5));
    const first = AuthenticatorTests.saslInitial(initial);
    const clientNonce = first.slice(first.indexOf("n=*,r=") + "n=*,r=".length);
    const serverFirst = `r=${clientNonce}server,s=${salt},i=${iterations.toString()}`;
    const final = AuthenticatorTests.saslResponse(AuthenticatorTests.respond(authenticator, 11, serverFirst));
    const channel = final.slice(2, final.indexOf(","));
    const [proof, signature] = AuthenticatorTests.expected(`n=*,r=${clientNonce},${serverFirst},c=${channel},r=${clientNonce}server`, salt, iterations);

    Assert.areEqual(`c=${channel},r=${clientNonce}server,p=${proof}`, final);
    Assert.isNull(authenticator.respond(12, Buffer.from(`v=${signature}`)));
    Assert.isNull(authenticator.respond(0, Buffer.alloc(0)));
    Assert.isTrue(authenticator.isAuthenticated);
    return [mechanism, Buffer.from(channel, "base64")];
  }

  private static respond(authenticator: Authenticator, type: number, body: string | Buffer): Buffer {
    const reply = authenticator.respond(type, typeof body === "string" ? Buffer.from(body) : body);
    Assert.isNotNull(reply);
    return reply;
  }

  private static saslInitial(message: Buffer): string {
    const mechanismEnd = message.indexOf(0, 5);
    return message.toString("utf8", mechanismEnd + 5);
  }

  private static saslResponse(message: Buffer): string {
    return message.toString("utf8", 5);
  }

  private static expected(
    authMessage: string, salt: string = AuthenticatorTests.salt, iterations: number = AuthenticatorTests.iterations): readonly [string, string] {
    const salted = pbkdf2Sync(AuthenticatorTests.password, Buffer.from(salt, "base64"), iterations, 32, "sha256");
    const clientKey = createHmac("sha256", salted).update("Client Key").digest();
    const storedKey = createHash("sha256").update(clientKey).digest();
    const clientSignature = createHmac("sha256", storedKey).update(authMessage).digest();
    const proof = Buffer.from(clientKey.map((t, i) => t ^ (clientSignature[i] ?? 0)));
    const serverKey = createHmac("sha256", salted).update("Server Key").digest();
    return [proof.toString("base64"), createHmac("sha256", serverKey).update(authMessage).digest("base64")];
  }
}
