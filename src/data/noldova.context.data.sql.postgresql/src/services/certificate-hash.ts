/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import type { Buffer } from "node:buffer";
import { createHash } from "node:crypto";

import "@noldova/context.core";
import { DataException } from "@noldova/context.data";

import { DerElement } from "../models/der-element.js";
import { Resources } from "../resources.js";

export class CertificateHash {
  private static readonly rsaPss: string = "2a864886f70d01010a";
  private static readonly sha256: string = "sha256";
  private static readonly sequenceTag: number = 0xa0;
  private static readonly objectIdentifierTag: number = 0x06;
  private static readonly signatures: ReadonlyMap<string, string> = new Map([
    ["2a864886f70d010104", "sha256"],
    ["2a864886f70d010105", "sha256"],
    ["2a864886f70d01010e", "sha224"],
    ["2a864886f70d01010b", "sha256"],
    ["2a864886f70d01010c", "sha384"],
    ["2a864886f70d01010d", "sha512"],
    ["2a8648ce3d0401", "sha256"],
    ["2a8648ce3d040301", "sha224"],
    ["2a8648ce3d040302", "sha256"],
    ["2a8648ce3d040303", "sha384"],
    ["2a8648ce3d040304", "sha512"],
    ["2a8648ce380403", "sha256"],
    ["608648016503040302", "sha256"]
  ]);
  private static readonly digests: ReadonlyMap<string, string> = new Map([
    ["2b0e03021a", "sha256"],
    ["608648016503040201", "sha256"],
    ["608648016503040202", "sha384"],
    ["608648016503040203", "sha512"],
    ["608648016503040204", "sha224"]
  ]);

  public static hashEndpoint(certificate: Buffer): Buffer | null {
    try {
      const algorithm = CertificateHash.readSignature(certificate);
      return Object.isUndefined(algorithm) ? null : createHash(algorithm).update(certificate).digest();
    }
    catch {
      return null;
    }
  }

  private static readSignature(data: Buffer): string | undefined {
    const certificate = CertificateHash.readDer(data, 0);
    const signed = CertificateHash.readDer(data, certificate.body);
    const algorithm = CertificateHash.readDer(data, signed.end);
    const identifier = CertificateHash.readDer(data, algorithm.body);
    const name = data.readUInt8(identifier.start) === CertificateHash.objectIdentifierTag ? data.toString("hex", identifier.body, identifier.end) : "";
    if (name !== CertificateHash.rsaPss)
      return CertificateHash.signatures.get(name);
    if (identifier.end >= algorithm.end)
      return CertificateHash.sha256;

    const parameters = CertificateHash.readDer(data, identifier.end);
    const first = parameters.body < parameters.end ? CertificateHash.readDer(data, parameters.body) : null;
    if (Object.isNull(first) || data.readUInt8(first.start) !== CertificateHash.sequenceTag)
      return CertificateHash.sha256;

    const hash = CertificateHash.readDer(data, CertificateHash.readDer(data, first.body).body);
    return CertificateHash.digests.get(data.toString("hex", hash.body, hash.end));
  }

  private static readDer(data: Buffer, start: number): DerElement {
    let length = data.readUInt8(start + 1);
    let body = start + 2;
    if ((length & 0x80) !== 0) {
      const count = length & 0x7f;
      length = 0;
      for (let index = 0; index < count; index += 1)
        length = length * 256 + data.readUInt8(body + index);
      body += count;
    }

    if (body + length > data.length)
      throw new DataException(Resources.truncatedCertificate);

    return new DerElement(start, body, body + length);
  }
}
