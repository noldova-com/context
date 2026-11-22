/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { Buffer } from "node:buffer";
import { createHash, createHmac, pbkdf2Sync, randomUUID } from "node:crypto";

import { DataException } from "@noldova/context.data";
import { Authenticator } from "@noldova/context.data.sql.postgresql/services/authenticator.js";
import { DerivedKeys } from "@noldova/context.data.sql.postgresql/services/derived-keys.js";
import { Frontend } from "@noldova/context.data.sql.postgresql/services/protocol/frontend.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { Der } from "../fixtures/der.fixture.js";

@TestClass
export class AuthenticatorTests {
  private static readonly password: string = "pencil";
  private static readonly salt: string = Buffer.from("salt-for-tests").toString("base64");
  private static readonly iterations: number = 4096;
  private static readonly microtaskTurns: number = 1000;
  private static readonly both: string = "SCRAM-SHA-256\0SCRAM-SHA-256-PLUS\0\0";
  private static readonly certificate: Buffer = Der.certificate(Der.algorithm("2a8648ce3d040302"));

  @TestMethod
  public async signsInWithScramAndVerifiesTheServer(): Promise<void> {
    const authenticator = new Authenticator("app", AuthenticatorTests.password, "prefer", null, new Frontend(), new DerivedKeys());

    const first = AuthenticatorTests.saslInitial(await AuthenticatorTests.respondAsync(authenticator, 10, "SCRAM-SHA-256\0\0"));
    Assert.isTrue(first.startsWith("n,,n=*,r="));
    const clientNonce = first.slice("n,,n=*,r=".length);
    const serverFirst = `r=${clientNonce}server,s=${AuthenticatorTests.salt},i=${AuthenticatorTests.iterations}`;
    const final = AuthenticatorTests.saslResponse(await AuthenticatorTests.respondAsync(authenticator, 11, serverFirst));
    const [expectedProof, serverSignature] = AuthenticatorTests.expected(`n=*,r=${clientNonce},${serverFirst},c=biws,r=${clientNonce}server`);

    Assert.areEqual(`c=biws,r=${clientNonce}server,p=${expectedProof}`, final);
    Assert.isNull(await authenticator.respondAsync(12, Buffer.from(`v=${serverSignature}`)));
    Assert.isFalse(authenticator.isAuthenticated);
    Assert.isNull(await authenticator.respondAsync(0, Buffer.alloc(0)));
    Assert.isTrue(authenticator.isAuthenticated);
  }

  @TestMethod
  public async refusesAServerThatDoesNotProveThePassword(): Promise<void> {
    const wrongSignature = new Authenticator("app", AuthenticatorTests.password, "prefer", null, new Frontend(), new DerivedKeys());
    const nonce = AuthenticatorTests.saslInitial(await AuthenticatorTests.respondAsync(wrongSignature, 10, "SCRAM-SHA-256\0\0")).slice("n,,n=*,r=".length);
    await AuthenticatorTests.respondAsync(wrongSignature, 11, `r=${nonce}x,s=${AuthenticatorTests.salt},i=${AuthenticatorTests.iterations}`);
    await Assert.throwsAsync(() => wrongSignature.respondAsync(12, Buffer.from("v=AAAA")), DataException);

    const skipped = new Authenticator("app", AuthenticatorTests.password, "prefer", null, new Frontend(), new DerivedKeys());
    await AuthenticatorTests.respondAsync(skipped, 10, "SCRAM-SHA-256\0\0");
    await Assert.throwsAsync(() => skipped.respondAsync(0, Buffer.alloc(0)), DataException);

    const foreignNonce = new Authenticator("app", AuthenticatorTests.password, "prefer", null, new Frontend(), new DerivedKeys());
    await AuthenticatorTests.respondAsync(foreignNonce, 10, "SCRAM-SHA-256\0\0");
    await Assert.throwsAsync(() => foreignNonce.respondAsync(11, Buffer.from(`r=other,s=${AuthenticatorTests.salt},i=1`)), DataException);
  }

  @TestMethod
  public async answersPasswordRequestsUnlessChannelBindingIsRequired(): Promise<void> {
    const plain = new Authenticator("app", AuthenticatorTests.password, "prefer", null, new Frontend(), new DerivedKeys());
    const cleartext = await AuthenticatorTests.respondAsync(plain, 3, "");
    const md5 = await AuthenticatorTests.respondAsync(plain, 5, Buffer.from("01020304", "hex"));
    const inner = createHash("md5").update(AuthenticatorTests.password + "app").digest("hex");
    const outer = createHash("md5").update(Buffer.concat([Buffer.from(inner), Buffer.from("01020304", "hex")])).digest("hex");

    Assert.areEqual(AuthenticatorTests.password + "\0", cleartext.toString("utf8", 5));
    Assert.areEqual("md5" + outer + "\0", md5.toString("utf8", 5));
    Assert.isNull(await plain.respondAsync(0, Buffer.alloc(0)));
    Assert.isTrue(plain.isAuthenticated);

    const bound = new Authenticator("app", AuthenticatorTests.password, "require", null, new Frontend(), new DerivedKeys());
    await Assert.throwsAsync(() => bound.respondAsync(3, Buffer.alloc(0)), DataException);
    await Assert.throwsAsync(() => bound.respondAsync(5, Buffer.alloc(4)), DataException);
    await Assert.throwsAsync(() => bound.respondAsync(10, Buffer.from("SCRAM-SHA-256\0SCRAM-SHA-256-PLUS\0\0")), DataException);
  }

  @TestMethod
  public async refusesUnsupportedMechanismsAndTypes(): Promise<void> {
    const authenticator = new Authenticator("app", AuthenticatorTests.password, "prefer", null, new Frontend(), new DerivedKeys());

    await Assert.throwsAsync(() => authenticator.respondAsync(10, Buffer.from("SCRAM-SHA-1\0\0")), DataException);
    await Assert.throwsAsync(() => authenticator.respondAsync(7, Buffer.alloc(0)), DataException);
  }

  @TestMethod
  public async bindsTheChannelToTheServerCertificate(): Promise<void> {
    const hash = createHash("sha256").update(AuthenticatorTests.certificate).digest();
    const expected = Buffer.concat([Buffer.from("p=tls-server-end-point,,"), hash]).toString("hex");

    for (const binding of ["prefer", "require"]) {
      const authenticator = new Authenticator("app", AuthenticatorTests.password, binding, AuthenticatorTests.certificate, new Frontend(), new DerivedKeys());
      const [mechanism, channel] = await AuthenticatorTests.signInAsync(authenticator, AuthenticatorTests.both);

      Assert.areEqual("SCRAM-SHA-256-PLUS", mechanism);
      Assert.areEqual(expected, channel.toString("hex"));
    }
  }

  @TestMethod
  public async saysTheChannelCouldBeBoundWhenTheServerOffersNoBinding(): Promise<void> {
    const authenticator = new Authenticator("app", AuthenticatorTests.password, "prefer", AuthenticatorTests.certificate, new Frontend(), new DerivedKeys());

    const [mechanism, channel] = await AuthenticatorTests.signInAsync(authenticator, "SCRAM-SHA-256\0\0");

    Assert.areEqual("SCRAM-SHA-256", mechanism);
    Assert.areEqual("y,,", channel.toString("utf8"));
  }

  @TestMethod
  public async leavesTheChannelUnboundWhenDisabledOrTheCertificateIsUnknown(): Promise<void> {
    const disabled = new Authenticator("app", AuthenticatorTests.password, "disable", AuthenticatorTests.certificate, new Frontend(), new DerivedKeys());
    const unknown = new Authenticator(
      "app", AuthenticatorTests.password, "prefer", Der.certificate(Der.algorithm("2a0304")), new Frontend(), new DerivedKeys());

    const [disabledMechanism, disabledChannel] = await AuthenticatorTests.signInAsync(disabled, AuthenticatorTests.both);
    const [unknownMechanism, unknownChannel] = await AuthenticatorTests.signInAsync(unknown, AuthenticatorTests.both);

    Assert.areEqual("SCRAM-SHA-256", disabledMechanism);
    Assert.areEqual("n,,", disabledChannel.toString("utf8"));
    Assert.areEqual("SCRAM-SHA-256", unknownMechanism);
    Assert.areEqual("n,,", unknownChannel.toString("utf8"));
  }

  @TestMethod
  public async refusesASignInWithoutBindingWhenBindingIsRequired(): Promise<void> {
    const authenticator = new Authenticator("app", AuthenticatorTests.password, "require", AuthenticatorTests.certificate, new Frontend(), new DerivedKeys());

    await Assert.throwsAsync(() => authenticator.respondAsync(0, Buffer.alloc(0)), DataException);
    Assert.isFalse(authenticator.isAuthenticated);
  }

  @TestMethod
  public async refusesAServerFirstMessageWithoutItsFields(): Promise<void> {
    const noNonce = new Authenticator("app", AuthenticatorTests.password, "prefer", null, new Frontend(), new DerivedKeys());
    await AuthenticatorTests.respondAsync(noNonce, 10, "SCRAM-SHA-256\0\0");
    const noSalt = new Authenticator("app", AuthenticatorTests.password, "prefer", null, new Frontend(), new DerivedKeys());
    const nonce = AuthenticatorTests.saslInitial(await AuthenticatorTests.respondAsync(noSalt, 10, "SCRAM-SHA-256\0\0")).slice("n,,n=*,r=".length);

    await Assert.throwsAsync(() => noNonce.respondAsync(11, Buffer.from(`s=${AuthenticatorTests.salt},i=1`)), DataException);
    await Assert.throwsAsync(() => noSalt.respondAsync(11, Buffer.from(`r=${nonce}server`)), DataException);
  }

  @TestMethod
  public async refusesAServerFirstMessageWithoutAPositiveIterationCount(): Promise<void> {
    for (const fields of ["", ",i=", ",i=0", ",i=-1", ",i=1.5", ",i=x", ",i=99999999999999999999"]) {
      const authenticator = new Authenticator("app", AuthenticatorTests.password, "prefer", null, new Frontend(), new DerivedKeys());
      const nonce = AuthenticatorTests.saslInitial(await AuthenticatorTests.respondAsync(authenticator, 10, "SCRAM-SHA-256\0\0")).slice("n,,n=*,r=".length);

      const failure = await Assert.throwsAsync(
        () => authenticator.respondAsync(11, Buffer.from(`r=${nonce}server,s=${AuthenticatorTests.salt}${fields}`)), DataException);

      Assert.areEqual("The server's SCRAM message has no salt or no positive iteration count.", failure.message);
    }
  }

  @TestMethod
  @TestData(1_000_001)
  @TestData(2_000_000_000)
  public async refusesAnIterationCountAboveTheLimit(iterations: number): Promise<void> {
    const authenticator = new Authenticator("app", AuthenticatorTests.password, "prefer", null, new Frontend(), new DerivedKeys());
    const nonce = AuthenticatorTests.saslInitial(await AuthenticatorTests.respondAsync(authenticator, 10, "SCRAM-SHA-256\0\0")).slice("n,,n=*,r=".length);

    const failure = await Assert.throwsAsync(
      () => authenticator.respondAsync(11, Buffer.from(`r=${nonce}server,s=${AuthenticatorTests.salt},i=${iterations.toString()}`)), DataException);

    Assert.areEqual(`The server's SCRAM iteration count ${iterations.toString()} is above the limit of 1000000.`, failure.message);
    Assert.isFalse(authenticator.isAuthenticated);
  }

  @TestMethod
  public async derivesTheKeyOutsideTheCallingTask(): Promise<void> {
    const authenticator = new Authenticator("app", AuthenticatorTests.password, "prefer", null, new Frontend(), new DerivedKeys());
    const nonce = AuthenticatorTests.saslInitial(await AuthenticatorTests.respondAsync(authenticator, 10, "SCRAM-SHA-256\0\0")).slice("n,,n=*,r=".length);
    const salt = Buffer.from("salt-for-the-event-loop").toString("base64");

    const reply = authenticator.respondAsync(11, Buffer.from(`r=${nonce}server,s=${salt},i=${AuthenticatorTests.iterations.toString()}`));
    let settled = false;
    const settle = (): void => {
      settled = true;
    };
    void reply.then(settle, settle);
    for (let turn = 0; turn < AuthenticatorTests.microtaskTurns; turn += 1)
      await Promise.resolve();

    Assert.isFalse(settled);
    Assert.isNotNull(await reply);
  }

  @TestMethod
  public async keepsSigningInCorrectlyPastTheSaltedPasswordCache(): Promise<void> {
    const salts = Array.from({ length: 70 }, (_value, index) => Buffer.from(`cache-salt-${index.toString()}`).toString("base64"));
    const keys = new DerivedKeys();

    for (const salt of [...salts, salts[0] ?? ""]) {
      const authenticator = new Authenticator("app", AuthenticatorTests.password, "prefer", null, new Frontend(), keys);
      const [mechanism] = await AuthenticatorTests.signInAsync(authenticator, "SCRAM-SHA-256\0\0", salt, 1);

      Assert.areEqual("SCRAM-SHA-256", mechanism);
    }
    Assert.areEqual(64, keys.salted.size);
  }

  @TestMethod
  public async sharesADerivationStillRunningWithAnotherConnection(): Promise<void> {
    const salt = Buffer.from(`shared-${randomUUID()}`).toString("base64");
    const keys = new DerivedKeys();
    const authenticators = [1, 2].map(() => new Authenticator("app", AuthenticatorTests.password, "prefer", null, new Frontend(), keys));
    const nonces = await Promise.all(authenticators.map(async t =>
      AuthenticatorTests.saslInitial(await AuthenticatorTests.respondAsync(t, 10, "SCRAM-SHA-256\0\0")).slice("n,,n=*,r=".length)));

    const replies = authenticators.map((t, index) => t.respondAsync(11, Buffer.from(`r=${nonces[index] ?? ""}server,s=${salt},i=50000`)));
    const runningWhileBothWait = keys.deriving.size;
    const finals = await Promise.all(replies);

    Assert.areEqual(1, runningWhileBothWait);
    Assert.areEqual(0, keys.deriving.size);
    Assert.areEqual(1, keys.salted.size);
    for (const [index, final] of finals.entries()) {
      const nonce = nonces[index] ?? "";
      const serverFirst = `r=${nonce}server,s=${salt},i=50000`;
      const [expectedProof] = AuthenticatorTests.expected(`n=*,r=${nonce},${serverFirst},c=biws,r=${nonce}server`, salt, 50_000);
      Assert.areEqual(`c=biws,r=${nonce}server,p=${expectedProof}`, final?.toString("utf8", 5));
    }
  }

  @TestMethod
  public async matchesTheExchangeOfRfc7677(): Promise<void> {
    const serverNonce = "rOprNGfwEbeRWgbNEkqO%hvYDpWUa2RaTCAfuxFIlj)hNlF$k0";
    const salt = "W22ZaJ0SNY7soEsUEjb6gQ==";
    const authMessage = `n=user,r=rOprNGfwEbeRWgbNEkqO,r=${serverNonce},s=${salt},i=4096,c=biws,r=${serverNonce}`;

    const salted = await new DerivedKeys().deriveAsync("pencil", salt, 4096);
    const clientKey = Authenticator.computeHmac(salted, "Client Key");
    const proof = Authenticator.computeXor(clientKey, Authenticator.computeHmac(Authenticator.computeSha256(clientKey), authMessage)).toString("base64");
    const serverSignature = Authenticator.computeHmac(Authenticator.computeHmac(salted, "Server Key"), authMessage).toString("base64");

    Assert.areEqual("dHzbZapWIk4jUhN+Ute9ytag9zjfMHgsqmmiz7AndVQ=", proof);
    Assert.areEqual("6rriTRBi23WpRR/wtup+mMhUZUn/dB5nLTJRsjl95G4=", serverSignature);
    Assert.areEqual(`${proof},${serverSignature}`, AuthenticatorTests.expected(authMessage, salt, 4096).join());
  }

  private static async signInAsync(
    authenticator: Authenticator, offered: string, salt: string = AuthenticatorTests.salt,
    iterations: number = AuthenticatorTests.iterations): Promise<readonly [string, Buffer]> {
    const initial = await AuthenticatorTests.respondAsync(authenticator, 10, offered);
    const mechanism = initial.toString("utf8", 5, initial.indexOf(0, 5));
    const first = AuthenticatorTests.saslInitial(initial);
    const clientNonce = first.slice(first.indexOf("n=*,r=") + "n=*,r=".length);
    const serverFirst = `r=${clientNonce}server,s=${salt},i=${iterations.toString()}`;
    const final = AuthenticatorTests.saslResponse(await AuthenticatorTests.respondAsync(authenticator, 11, serverFirst));
    const channel = final.slice(2, final.indexOf(","));
    const [proof, signature] = AuthenticatorTests.expected(`n=*,r=${clientNonce},${serverFirst},c=${channel},r=${clientNonce}server`, salt, iterations);

    Assert.areEqual(`c=${channel},r=${clientNonce}server,p=${proof}`, final);
    Assert.isNull(await authenticator.respondAsync(12, Buffer.from(`v=${signature}`)));
    Assert.isNull(await authenticator.respondAsync(0, Buffer.alloc(0)));
    Assert.isTrue(authenticator.isAuthenticated);
    return [mechanism, Buffer.from(channel, "base64")];
  }

  private static async respondAsync(authenticator: Authenticator, type: number, body: string | Buffer): Promise<Buffer> {
    const reply = await authenticator.respondAsync(type, typeof body === "string" ? Buffer.from(body) : body);
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
