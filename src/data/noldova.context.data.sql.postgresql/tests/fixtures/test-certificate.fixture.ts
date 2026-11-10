/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { Buffer } from "node:buffer";
import { generateKeyPairSync, type KeyObject, sign } from "node:crypto";

import { Der } from "./der.fixture.js";

export class TestCertificate {
  public static readonly ecdsaWithSha256: string = "2a8648ce3d040302";
  private static serial: number = 0;
  public readonly der: Buffer;
  public readonly certificate: string;
  public readonly key: string;
  public readonly publicKey: KeyObject;
  private readonly name: Buffer;
  private readonly privateKey: KeyObject;

  private constructor(der: Buffer, name: Buffer, publicKey: KeyObject, privateKey: KeyObject) {
    this.der = der;
    this.certificate = TestCertificate.pem(der);
    this.key = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
    this.name = name;
    this.publicKey = publicKey;
    this.privateKey = privateKey;
  }

  public static create(subject: string = "localhost"): TestCertificate {
    return TestCertificate.build(subject, null, []);
  }

  public static authority(subject: string): TestCertificate {
    const yes = Der.element(0x01, Buffer.from([0xff]));
    const basicConstraints = Der.sequence(Der.identifier("551d13"), yes, Der.element(0x04, Der.sequence(yes)));
    return TestCertificate.build(subject, null, [basicConstraints]);
  }

  public static dnsName(name: string): Buffer {
    return Der.element(0x82, Buffer.from(name));
  }

  public static ipAddress(address: string): Buffer {
    return Der.element(0x87, Buffer.from(address.split(".").map(Number)));
  }

  public issue(subject: string, ...names: Buffer[]): TestCertificate {
    const extensions = names.length > 0 ? [Der.sequence(Der.identifier("551d11"), Der.element(0x04, Der.sequence(...names)))] : [];
    return TestCertificate.build(subject, this, extensions);
  }

  public encryptedKey(passphrase: string): string {
    return this.privateKey.export({ type: "pkcs8", format: "pem", cipher: "aes-256-cbc", passphrase }).toString();
  }

  private static build(subject: string, issuer: TestCertificate | null, extensions: Buffer[]): TestCertificate {
    TestCertificate.serial += 1;
    const pair = generateKeyPairSync("ec", { namedCurve: "P-256" });
    const name = Der.sequence(Der.element(0x31, Der.sequence(Der.identifier("550403"), Der.element(0x0c, Buffer.from(subject)))));
    const signed = Der.sequence(
      Der.element(0xa0, Der.element(0x02, Buffer.from([2]))),
      Der.element(0x02, Buffer.from([TestCertificate.serial % 100 + 1])),
      Der.algorithm(TestCertificate.ecdsaWithSha256),
      issuer?.name ?? name,
      Der.sequence(Der.element(0x17, Buffer.from("250101000000Z")), Der.element(0x17, Buffer.from("491231235959Z"))),
      name,
      pair.publicKey.export({ type: "spki", format: "der" }),
      ...extensions.length > 0 ? [Der.element(0xa3, Der.sequence(...extensions))] : []);
    const signature = sign("sha256", signed, issuer?.privateKey ?? pair.privateKey);
    const der = Der.sequence(signed, Der.algorithm(TestCertificate.ecdsaWithSha256), Der.element(0x03, Buffer.from([0]), signature));
    return new TestCertificate(der, name, pair.publicKey, pair.privateKey);
  }

  private static pem(der: Buffer): string {
    const lines = der.toString("base64").match(/.{1,64}/gu) ?? [];
    return ["-----BEGIN CERTIFICATE-----", ...lines, "-----END CERTIFICATE-----", ""].join("\n");
  }
}
