/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import type { Buffer } from "node:buffer";
import { createPrivateKey } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createSecureContext, getCACertificates, type ConnectionOptions as TlsOptions, type SecureContext, type SecureContextOptions } from "node:tls";

import "@noldova/context.core";
import { DataException } from "@noldova/context.data";
import { ExceptionOptions } from "@noldova/context.exceptions";

import { SslMode } from "../enums/ssl-mode.js";
import type { ConnectionOptions } from "../models/connection-options.js";
import { Resources } from "../resources.js";

export class TlsOptionsReader {
  public static async readAsync(options: ConnectionOptions): Promise<TlsOptions> {
    const [ca, cert, key] = await Promise.all([
      TlsOptionsReader.readOptionalFileAsync(Resources.sslRootCertOption, options.rootCertificate),
      TlsOptionsReader.readOptionalFileAsync(Resources.sslCertOption, options.sslCertificate),
      TlsOptionsReader.readKeyAsync(options.sslKey, options.sslPassword)
    ]);
    return {
      secureContext: TlsOptionsReader.createContext({ ca: TlsOptionsReader.readRoots(ca), cert, key }),
      rejectUnauthorized: options.sslMode === SslMode.VerifyCa || options.sslMode === SslMode.VerifyFull,
      ...options.sslMode === SslMode.VerifyCa ? { checkServerIdentity: () => undefined } : {}
    };
  }

  public static readRoots(file: Buffer | undefined): Buffer | string[] {
    return file ?? getCACertificates(Resources.systemCertificates);
  }

  private static readOptionalFileAsync(option: string, path: string | null): Promise<Buffer | undefined> {
    return Object.isNull(path) ? Promise.resolve(undefined) : TlsOptionsReader.readFileAsync(option, path);
  }

  private static async readKeyAsync(path: string | null, passphrase: string | null): Promise<string | Buffer | undefined> {
    if (Object.isNull(path))
      return undefined;

    const data = await TlsOptionsReader.readFileAsync(Resources.sslKeyOption, path);
    try {
      return createPrivateKey({ key: data, passphrase: passphrase ?? undefined }).export({ type: "pkcs8", format: "pem" });
    }
    catch {
      throw new DataException(Resources.formatSslKeyUnreadable(path));
    }
  }

  private static async readFileAsync(option: string, path: string): Promise<Buffer> {
    try {
      return await readFile(path);
    }
    catch (error) {
      throw new DataException(Resources.formatSslFileUnreadable(option, path), new ExceptionOptions(error));
    }
  }

  private static createContext(files: SecureContextOptions): SecureContext {
    try {
      return createSecureContext(files);
    }
    catch {
      throw new DataException(Resources.sslFilesUnusable);
    }
  }
}
