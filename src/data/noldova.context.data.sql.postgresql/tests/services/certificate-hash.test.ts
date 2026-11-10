/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";

import { CertificateHash } from "@noldova/context.data.sql.postgresql/services/certificate-hash.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { Der } from "../fixtures/der.fixture.js";

@TestClass
export class CertificateHashTests {
  private static readonly rsaPss: string = "2a864886f70d01010a";

  @TestMethod
  @TestData("2a864886f70d01010b", "sha256")
  @TestData("2a864886f70d010105", "sha256")
  @TestData("2a864886f70d01010c", "sha384")
  @TestData("2a864886f70d01010d", "sha512")
  @TestData("2a8648ce3d040302", "sha256")
  @TestData("2a8648ce3d040303", "sha384")
  @TestData("2a8648ce3d040304", "sha512")
  public hashesWithTheSignatureDigestOrSha256ForWeakerOnes(identifier: string, digest: string): void {
    const certificate = Der.certificate(Der.algorithm(identifier));

    CertificateHashTests.assertHash(digest, certificate);
  }

  @TestMethod
  public readsLongLengthsOfALargeCertificate(): void {
    const certificate = Der.certificate(Der.algorithm("2a8648ce3d040303"), "x".repeat(300));

    Assert.areEqual(0x82, certificate.readUInt8(1));
    CertificateHashTests.assertHash("sha384", certificate);
  }

  @TestMethod
  public hashesRsaPssWithTheDigestOfItsParameters(): void {
    const digest = (hex: string): Buffer => Der.element(0xa0, Der.algorithm(hex));

    CertificateHashTests.assertHash("sha256", Der.certificate(Der.algorithm(CertificateHashTests.rsaPss)));
    CertificateHashTests.assertHash("sha256", Der.certificate(Der.algorithm(CertificateHashTests.rsaPss, Der.sequence())));
    CertificateHashTests.assertHash("sha256", Der.certificate(Der.algorithm(CertificateHashTests.rsaPss, Der.sequence(Der.element(0xa1, Der.algorithm("2a864886f70d010108"))))));
    CertificateHashTests.assertHash("sha384", Der.certificate(Der.algorithm(CertificateHashTests.rsaPss, Der.sequence(digest("608648016503040202")))));
    CertificateHashTests.assertHash("sha512", Der.certificate(Der.algorithm(CertificateHashTests.rsaPss, Der.sequence(digest("608648016503040203")))));
    CertificateHashTests.assertHash("sha224", Der.certificate(Der.algorithm(CertificateHashTests.rsaPss, Der.sequence(digest("608648016503040204")))));
    CertificateHashTests.assertHash("sha256", Der.certificate(Der.algorithm(CertificateHashTests.rsaPss, Der.sequence(digest("2b0e03021a")))));
    Assert.isNull(CertificateHash.hashEndpoint(Der.certificate(Der.algorithm(CertificateHashTests.rsaPss, Der.sequence(digest("2a0304"))))));
  }

  @TestMethod
  public givesNoHashForAnUnknownOrMalformedSignature(): void {
    const unknown = Der.certificate(Der.algorithm("2a0304"));
    const notIdentifier = Der.certificate(Der.sequence(Der.element(0x05)));
    const whole = Der.certificate(Der.algorithm("2a8648ce3d040302"));

    Assert.isNull(CertificateHash.hashEndpoint(unknown));
    Assert.isNull(CertificateHash.hashEndpoint(notIdentifier));
    Assert.isNull(CertificateHash.hashEndpoint(whole.subarray(0, whole.length - 1)));
    Assert.isNull(CertificateHash.hashEndpoint(Buffer.from([0x30])));
  }

  private static assertHash(digest: string, certificate: Buffer): void {
    const hash = CertificateHash.hashEndpoint(certificate);

    Assert.isNotNull(hash);
    Assert.areEqual(createHash(digest).update(certificate).digest("hex"), hash.toString("hex"));
  }
}
