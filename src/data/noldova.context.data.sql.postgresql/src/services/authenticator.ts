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

import "@noldova/context.core";
import { DataException } from "@noldova/context.data";

import { ChannelBinding } from "../enums/channel-binding.js";
import { Resources } from "../resources.js";
import { CertificateHash } from "./certificate-hash.js";
import type { Frontend } from "./protocol/frontend.js";

export class Authenticator {
  private static readonly ok: number = 0;
  private static readonly cleartext: number = 3;
  private static readonly md5: number = 5;
  private static readonly saslStart: number = 10;
  private static readonly saslContinue: number = 11;
  private static readonly saslFinal: number = 12;
  private static readonly scram: string = "SCRAM-SHA-256";
  private static readonly scramPlus: string = "SCRAM-SHA-256-PLUS";
  private static readonly salted: Map<string, Buffer> = new Map();
  private static readonly saltedLimit: number = 64;

  private readonly user: string;
  private readonly password: string;
  private readonly binding: ChannelBinding;
  private readonly certificate: Buffer | null;
  private readonly frontend: Frontend;
  private nonce: string = "";
  private signature: string = "";
  private verified: boolean = true;
  private bound: Buffer | null = null;
  private header: string = "n,,";
  private authenticated: boolean = false;

  public constructor(user: string, password: string, binding: ChannelBinding, certificate: Buffer | null, frontend: Frontend) {
    this.user = user;
    this.password = password;
    this.binding = binding;
    this.certificate = certificate;
    this.frontend = frontend;
  }

  public get isAuthenticated(): boolean {
    return this.authenticated;
  }

  public respond(type: number, body: Buffer): Buffer | null {
    if ((type === Authenticator.cleartext || type === Authenticator.md5) && this.binding === ChannelBinding.Require)
      throw new DataException(Resources.channelBindingPasswordRequested);

    switch (type) {
      case Authenticator.ok:
        return this.accept();
      case Authenticator.cleartext:
        return this.frontend.createPassword(this.password);
      case Authenticator.md5:
        return this.frontend.createPassword(Resources.md5Prefix + Authenticator.computeMd5Hex(
          Buffer.concat([Buffer.from(Authenticator.computeMd5Hex(Buffer.from(this.password + this.user))), body.subarray(0, 4)])));
      case Authenticator.saslStart:
        return this.start(body);
      case Authenticator.saslContinue:
        return this.proceed(body);
      case Authenticator.saslFinal:
        return this.finish(body);
      default:
        throw new DataException(Resources.formatUnsupportedAuthentication(type));
    }
  }

  private start(body: Buffer): Buffer {
    const offered = body.toString("utf8").split("\0");
    const hash = this.binding !== ChannelBinding.Disable && !Object.isNull(this.certificate) ? CertificateHash.hashEndpoint(this.certificate) : null;
    const plus = !Object.isNull(hash) && offered.includes(Authenticator.scramPlus);
    if (this.binding === ChannelBinding.Require && !plus)
      throw new DataException(Resources.channelBindingUnavailable);
    if (!plus && !offered.includes(Authenticator.scram))
      throw new DataException(Resources.saslMechanismUnsupported);

    this.header = plus ? Resources.channelBindingHeader : Object.isNull(hash) ? Resources.noChannelBindingHeader : Resources.channelBindingUnusedHeader;
    this.bound = plus ? hash : null;
    this.nonce = randomBytes(18).toString("base64");
    this.verified = false;
    return this.frontend.createSasl(plus ? Authenticator.scramPlus : Authenticator.scram, this.header + Resources.scramUser + this.nonce);
  }

  private proceed(body: Buffer): Buffer {
    const fields = new Map(body.toString("utf8").split(",").map(t => [t.slice(0, 1), t.slice(2)] as const));
    const serverNonce = fields.get("r") ?? "";
    const salt = fields.get("s") ?? "";
    const iterations = fields.get("i") ?? "";
    if (!serverNonce.startsWith(this.nonce))
      throw new DataException(Resources.saslNonceMismatch);
    const count = Number(iterations);
    if (salt.length === 0 || !/^[0-9]+$/u.test(iterations) || !Number.isSafeInteger(count) || count < 1)
      throw new DataException(Resources.saslFirstMessageInvalid);

    const saltedPassword = Authenticator.saltPassword(this.password, salt, count);
    const clientKey = Authenticator.computeHmac(saltedPassword, Resources.clientKey);
    const channel = (Object.isNull(this.bound) ? Buffer.from(this.header) : Buffer.concat([Buffer.from(this.header), this.bound])).toString("base64");
    const message = `n=*,r=${this.nonce},r=${serverNonce},s=${salt},i=${iterations},c=${channel},r=${serverNonce}`;
    this.signature = Authenticator.computeHmac(Authenticator.computeHmac(saltedPassword, Resources.serverKey), message).toString("base64");
    const proof = Authenticator.computeXor(clientKey, Authenticator.computeHmac(Authenticator.computeSha256(clientKey), message)).toString("base64");
    return this.frontend.createSaslResponse(`c=${channel},r=${serverNonce},p=${proof}`);
  }

  private finish(body: Buffer): null {
    const signature = body.toString("utf8").split("\0", 1).join("").slice(2);
    if (this.signature.length === 0 || signature !== this.signature)
      throw new DataException(Resources.saslSignatureMismatch);

    this.verified = true;
    return null;
  }

  private accept(): null {
    if (!this.verified)
      throw new DataException(Resources.saslUnverified);
    if (this.binding === ChannelBinding.Require && Object.isNull(this.bound))
      throw new DataException(Resources.channelBindingUnused);

    this.authenticated = true;
    return null;
  }

  private static saltPassword(password: string, salt: string, iterations: number): Buffer {
    const key = Authenticator.computeSha256(Buffer.from(password + "\0" + salt + "\0" + iterations.toString())).toString("base64");
    const known = Authenticator.salted.get(key);
    if (!Object.isUndefined(known))
      return known;

    if (Authenticator.salted.size >= Authenticator.saltedLimit) {
      const oldest = Authenticator.salted.keys().next();
      if (oldest.done !== true)
        Authenticator.salted.delete(oldest.value);
    }

    const salted = pbkdf2Sync(password, Buffer.from(salt, "base64"), iterations, 32, "sha256");
    Authenticator.salted.set(key, salted);
    return salted;
  }

  private static computeMd5Hex(data: Buffer): string {
    return createHash("md5").update(data).digest("hex");
  }

  private static computeHmac(key: Buffer, text: string): Buffer {
    return createHmac("sha256", key).update(text).digest();
  }

  private static computeSha256(data: Buffer): Buffer {
    return createHash("sha256").update(data).digest();
  }

  private static computeXor(left: Buffer, right: Buffer): Buffer {
    const result = Buffer.allocUnsafe(left.length);
    for (let index = 0; index < left.length; index += 1)
      result[index] = left.readUInt8(index) ^ right.readUInt8(index);
    return result;
  }
}
