/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import { DataException } from "@noldova/context.data";

import { ChannelBinding } from "../enums/channel-binding.js";
import { SslMode } from "../enums/ssl-mode.js";
import { ConnectionOptions } from "../models/connection-options.js";
import { SystemCertificates } from "../models/system-certificates.js";
import { Resources } from "../resources.js";

export class ConnectionStringParser {
  private static readonly protocols: ReadonlySet<string> = new Set(["postgres:", "postgresql:"]);
  private static readonly defaultPort: number = 5432;
  private static readonly defaultConnectTimeout: number = 30;

  public static parse(location: string): ConnectionOptions {
    const url = URL.parse(location);
    if (Object.isNull(url) || !ConnectionStringParser.protocols.has(url.protocol) || url.hostname.length === 0 || url.username.length === 0)
      throw new DataException(Resources.invalidConnectionString);

    const query = new Map(url.searchParams);
    const user = decodeURIComponent(url.username);
    const database = decodeURIComponent(url.pathname.slice(1));
    const root = query.get(Resources.sslRootCertOption) ?? null;
    const system = root === Resources.systemCertificates;
    const sslMode = ConnectionStringParser.parseEnum(Object.values(SslMode), query.get(Resources.sslModeOption), SslMode.Disable);
    const parameters = new Map([[Resources.applicationNameParameter, Resources.applicationName]]);
    for (const [name, value] of query)
      if (!Resources.connectionStringOptions.has(name))
        parameters.set(name, value);

    return new ConnectionOptions(
      url.hostname.replace(/^\[|\]$/gu, ""),
      ConnectionStringParser.parseInteger(url.port, ConnectionStringParser.defaultPort),
      database.length > 0 ? database : user,
      user,
      decodeURIComponent(url.password),
      system ? SslMode.VerifyFull : sslMode,
      ConnectionStringParser.parseEnum(Object.values(ChannelBinding), query.get(Resources.channelBindingOption), ChannelBinding.Prefer),
      ConnectionStringParser.parseInteger(query.get(Resources.connectTimeoutOption) ?? "", ConnectionStringParser.defaultConnectTimeout),
      parameters,
      new SystemCertificates(),
      system ? null : root,
      query.get(Resources.sslCertOption) ?? null,
      query.get(Resources.sslKeyOption) ?? null,
      query.get(Resources.sslPasswordOption) ?? null);
  }

  private static parseInteger(text: string, fallback: number): number {
    if (text.length === 0)
      return fallback;

    const value = Number(text);
    if (!Number.isSafeInteger(value) || value < 0)
      throw new DataException(Resources.invalidConnectionString);

    return value;
  }

  private static parseEnum<T extends string>(values: readonly T[], text: string | undefined, fallback: T): T {
    if (Object.isUndefined(text))
      return fallback;

    const value = values.find(t => t === text);
    if (Object.isUndefined(value))
      throw new DataException(Resources.invalidConnectionString);

    return value;
  }
}
