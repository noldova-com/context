/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import { ArgumentException } from "@noldova/context.exceptions";

import type { ChannelBinding } from "../enums/channel-binding.js";
import type { SslMode } from "../enums/ssl-mode.js";
import { Resources } from "../resources.js";

export class ConnectionOptions {
  public readonly host: string;
  public readonly port: number;
  public readonly database: string;
  public readonly user: string;
  public readonly password: string;
  public readonly sslMode: SslMode;
  public readonly channelBinding: ChannelBinding;
  public readonly connectTimeout: number;
  public readonly parameters: ReadonlyMap<string, string>;
  public readonly rootCertificate: string | null;
  public readonly sslCertificate: string | null;
  public readonly sslKey: string | null;
  public readonly sslPassword: string | null;

  public constructor(
    host: string, port: number, database: string, user: string, password: string, sslMode: SslMode, channelBinding: ChannelBinding,
    connectTimeout: number, parameters: ReadonlyMap<string, string>, rootCertificate: string | null = null, sslCertificate: string | null = null,
    sslKey: string | null = null, sslPassword: string | null = null) {
    if (Object.isNull(sslCertificate) && !Object.isNull(sslKey))
      throw new ArgumentException(Resources.sslKeyWithoutCertificate, Resources.sslCertOption);
    if (!Object.isNull(sslCertificate) && Object.isNull(sslKey))
      throw new ArgumentException(Resources.sslCertWithoutKey, Resources.sslKeyOption);

    this.host = host;
    this.port = port;
    this.database = database;
    this.user = user;
    this.password = password;
    this.sslMode = sslMode;
    this.channelBinding = channelBinding;
    this.connectTimeout = connectTimeout;
    this.parameters = parameters;
    this.rootCertificate = rootCertificate;
    this.sslCertificate = sslCertificate;
    this.sslKey = sslKey;
    this.sslPassword = sslPassword;
  }
}
