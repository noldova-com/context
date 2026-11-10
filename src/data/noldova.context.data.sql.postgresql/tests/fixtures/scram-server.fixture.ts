/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { Buffer } from "node:buffer";
import { createHash, createHmac, pbkdf2Sync, randomBytes } from "node:crypto";

export class ScramServer {
  public mechanism: string = "";
  public header: string = "";
  public binding: Buffer = Buffer.alloc(0);
  public verified: boolean = false;
  private readonly password: string;
  private readonly salt: Buffer = randomBytes(16);
  private readonly iterations: number = 4096;
  private clientFirst: string = "";
  private serverFirst: string = "";
  private nonce: string = "";

  public constructor(password: string) {
    this.password = password;
  }

  public first(body: Buffer): string {
    const end = body.indexOf(0);
    this.mechanism = body.toString("utf8", 0, end);
    const message = body.toString("utf8", end + 5);
    const bare = message.indexOf("n=");
    this.header = message.slice(0, bare);
    this.clientFirst = message.slice(bare);
    this.nonce = this.clientFirst.slice(this.clientFirst.indexOf("r=") + 2) + randomBytes(9).toString("base64");
    this.serverFirst = `r=${this.nonce},s=${this.salt.toString("base64")},i=${this.iterations.toString()}`;
    return this.serverFirst;
  }

  public final(body: Buffer): string | null {
    const message = body.toString("utf8");
    const proofAt = message.lastIndexOf(",p=");
    const withoutProof = message.slice(0, proofAt);
    const fields = new Map(withoutProof.split(",").map(field => [field.slice(0, 1), field.slice(2)]));
    const channel = Buffer.from(fields.get("c") ?? "", "base64");
    this.binding = channel.subarray(Buffer.byteLength(this.header));
    const auth = `${this.clientFirst},${this.serverFirst},${withoutProof}`;
    const salted = pbkdf2Sync(this.password, this.salt, this.iterations, 32, "sha256");
    const clientKey = createHmac("sha256", salted).update("Client Key").digest();
    const stored = createHash("sha256").update(clientKey).digest();
    const signature = createHmac("sha256", stored).update(auth).digest();
    const proof = Buffer.from(message.slice(proofAt + 3), "base64");
    const recovered = Buffer.from(proof.map((byte, index) => byte ^ (signature[index] ?? 0)));
    this.verified = channel.toString("utf8", 0, Buffer.byteLength(this.header)) === this.header && fields.get("r") === this.nonce
      && createHash("sha256").update(recovered).digest().equals(stored);
    if (!this.verified)
      return null;

    const serverKey = createHmac("sha256", salted).update("Server Key").digest();
    return `v=${createHmac("sha256", serverKey).update(auth).digest("base64")}`;
  }
}
