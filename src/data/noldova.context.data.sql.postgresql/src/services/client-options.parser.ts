/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import { ArgumentException } from "@noldova/context.exceptions";

import { ChannelBinding } from "../enums/channel-binding.js";
import { SslMode } from "../enums/ssl-mode.js";
import { ClientConfiguration } from "../models/client-configuration.js";
import { ClientOptions } from "../models/client-options.js";
import { ConnectionOptions } from "../models/connection-options.js";
import { ParsedUrl } from "../models/parsed-url.js";
import { TransformOptions } from "../models/transform-options.js";
import { Resources } from "../resources.js";
import type { ClientSettings } from "../types/client-settings.js";
import type { HostTarget } from "../types/host-target.js";
import type { OptionValues } from "../types/option-values.js";
import type { TransformSettings } from "../types/transform-settings.js";

export class ClientOptionsParser {
  private static readonly defaultPort: number = 5432;
  private static readonly defaultConnectTimeout: number = 30;
  private static readonly integers: ReadonlyMap<string, "max" | "min" | "idleTimeout" | "queueTimeout" | "queryTimeout" | "cancelTimeout" | "maxLifetime"
    | "maxPipeline" | "backoff" | "keepAlive"> = new Map([
      ["max", "max"], ["min", "min"], ["idle_timeout", "idleTimeout"], ["queue_timeout", "queueTimeout"], ["query_timeout", "queryTimeout"],
      ["cancel_timeout", "cancelTimeout"], ["max_lifetime", "maxLifetime"], ["max_pipeline", "maxPipeline"], ["backoff", "backoff"], ["keep_alive", "keepAlive"]
    ]);

  private static readonly switches: ReadonlyMap<string, "scheduler" | "prepare" | "debug" | "fetchTypes"> = new Map([
    ["scheduler", "scheduler"], ["prepare", "prepare"], ["debug", "debug"], ["fetch_types", "fetchTypes"]
  ]);

  private static readonly handled: ReadonlySet<string> = new Set([
    "max", "min", "ssl", "sslmode", "sslnegotiation", "channel_binding", "idle_timeout", "connect_timeout", "queue_timeout", "query_timeout", "cancel_timeout",
    "max_lifetime", "max_pipeline", "scheduler", "backoff", "keep_alive", "prepare", "debug", "fetch_types", "infer", "publications", "slot",
    "target_session_attrs", "host", "port", "sslrootcert", "sslcert", "sslkey", "sslpassword"
  ]);

  private static readonly channelBindings: ReadonlyMap<string, ChannelBinding> = new Map([
    ["disable", ChannelBinding.Disable], ["prefer", ChannelBinding.Prefer], ["require", ChannelBinding.Require]
  ]);

  private static readonly bracketed: RegExp = /^\[(?<host>[^\]]*)\](?::(?<port>\d*))?$/u;
  private static readonly plain: RegExp = /^(?<host>[^:]*)(?::(?<port>\d*))?$/u;

  public static parse(location: string | null, settings: ClientSettings = {}): ClientConfiguration {
    const {
      host, port, database, user, password, ssl, sslnegotiation, channelBinding, targetSessionAttrs, connectTimeout, connection, transform, ...rest
    } = settings;
    const url = ClientOptionsParser.parseUrl(location);
    const query = url.searchParams;
    const targets = ClientOptionsParser.parseHosts(host, query.get(Resources.hostOption), url);
    const target = ClientOptionsParser.pickSingle(targets);
    ClientOptionsParser.validateTargetSession(targetSessionAttrs ?? query.get(Resources.targetSessionAttrsOption) ?? null);
    if ((sslnegotiation ?? query.get(Resources.sslNegotiationOption)) === Resources.directNegotiation)
      throw new ArgumentException(Resources.directSslUnsupported, Resources.sslNegotiationParameterName);

    const given = port ?? ClientOptionsParser.parseInteger(query.get(Resources.portOption)) ?? target[1] ?? ClientOptionsParser.defaultPort;
    const name = ClientOptionsParser.pickFirst(user, url.username);
    if (Object.isNull(name))
      throw new ArgumentException(Resources.userMissing, Resources.userParameterName);

    const options = new ClientOptions({ ...ClientOptionsParser.fromQuery(query), ...rest, transform: ClientOptionsParser.parseTransform(transform ?? {}) });
    return new ClientConfiguration(options, new ConnectionOptions(
      target[0],
      given,
      ClientOptionsParser.pickFirst(database, url.pathname.slice(1)) ?? name,
      name,
      ClientOptionsParser.pickFirst(password, url.password) ?? String.empty,
      ClientOptionsParser.parseSslMode(ssl ?? ClientOptionsParser.readSslSwitch(query)),
      ClientOptionsParser.parseBinding(channelBinding ?? query.get(Resources.channelBindingOption) ?? null),
      connectTimeout ?? ClientOptionsParser.parseInteger(query.get(Resources.connectTimeoutOption)) ?? ClientOptionsParser.defaultConnectTimeout,
      ClientOptionsParser.mergeParameters(connection, query),
      ClientOptionsParser.readRootCertificate(query),
      query.get(Resources.sslCertOption) ?? null,
      query.get(Resources.sslKeyOption) ?? null,
      query.get(Resources.sslPasswordOption) ?? null));
  }

  public static parseUrl(location: string | null): ParsedUrl {
    if (Object.isNull(location))
      return new ParsedUrl(String.empty, String.empty, String.empty, new Map(), []);

    const rest = location.slice(location.indexOf(Resources.schemeSeparator) + Resources.schemeSeparator.length);
    const end = rest.search(/[/?]/u);
    const authority = end === -1 ? rest : rest.slice(0, end);
    const at = authority.lastIndexOf(Resources.userInfoSeparator);
    const userinfo = at === -1 ? String.empty : authority.slice(0, at);
    const colon = userinfo.indexOf(Resources.passwordSeparator);
    const tail = new URL(Resources.placeholderUrl + (end === -1 ? String.empty : rest.slice(end)));
    const hosts = authority.slice(at + 1);
    return new ParsedUrl(
      ClientOptionsParser.decode(colon === -1 ? userinfo : userinfo.slice(0, colon)),
      colon === -1 ? String.empty : ClientOptionsParser.decode(userinfo.slice(colon + 1)),
      ClientOptionsParser.decode(tail.pathname),
      new Map(tail.searchParams),
      hosts.length > 0 ? ClientOptionsParser.split(hosts, text => ClientOptionsParser.decode(text)) : []);
  }

  public static parseHosts(given: string | readonly string[] | undefined, query: string | undefined, url: ParsedUrl): readonly HostTarget[] {
    const named = given ?? query;
    if (Array.isArray(named))
      return named.map(host => [host, null]);
    if (Object.isString(named) && named.length > 0)
      return ClientOptionsParser.split(named);
    if (url.targets.some(([host]) => host.length > 0))
      return url.targets;

    return [[Resources.localhost, url.targets[0]?.[1] ?? null]];
  }

  public static split(text: string, decode: (text: string) => string = value => value): readonly HostTarget[] {
    return text.split(Resources.arrayDelimiter).filter(part => part.length > 0).map(part => {
      const groups = (ClientOptionsParser.bracketed.exec(part) ?? ClientOptionsParser.plain.exec(part))?.groups;
      const port = groups?.[Resources.portOption] ?? String.empty;
      return [decode(groups?.[Resources.hostOption] ?? part), port.length > 0 ? Number(port) : null];
    });
  }

  public static validateTargetSession(value: string | null): void {
    if (Object.isNull(value) || value.length === 0)
      return;
    if (!Resources.targetSessionAttrsValues.has(value))
      throw new ArgumentException(Resources.formatTargetSessionAttrsUnsupported(value), Resources.targetSessionAttrsParameterName);

    throw new ArgumentException(Resources.targetSessionAttrsUnsupported, Resources.targetSessionAttrsParameterName);
  }

  public static parseBinding(value: string | null): ChannelBinding {
    const text = value ?? ChannelBinding.Prefer;
    const binding = ClientOptionsParser.channelBindings.get(text);
    if (Object.isUndefined(binding))
      throw new ArgumentException(Resources.formatChannelBindingUnsupported(text), Resources.channelBindingParameterName);

    return binding;
  }

  public static parseSslMode(ssl: boolean | string): SslMode {
    if (ssl === false || ssl === String.empty || ssl === SslMode.Disable || ssl === String(false))
      return SslMode.Disable;
    if (ssl === SslMode.Prefer || ssl === Resources.allowMode)
      return SslMode.Prefer;

    if (ssl === SslMode.Require)
      return SslMode.Require;

    return ssl === SslMode.VerifyCa ? SslMode.VerifyCa : SslMode.VerifyFull;
  }

  public static parseTransform(settings: TransformSettings): TransformOptions {
    const column = settings.column;
    const value = settings.value;
    const row = settings.row;
    return new TransformOptions({
      undefinedValue: settings.undefined,
      json: settings.json ?? null,
      columnFrom: Object.isFunction(column) ? column : column?.from ?? null,
      columnTo: Object.isFunction(column) ? null : column?.to ?? null,
      valueFrom: Object.isFunction(value) ? value : value?.from ?? null,
      valueTo: Object.isFunction(value) ? null : value?.to ?? null,
      rowFrom: Object.isFunction(row) ? row : row?.from ?? null,
      rowTo: Object.isFunction(row) ? null : row?.to ?? null
    });
  }

  private static pickSingle(targets: readonly HostTarget[]): HostTarget {
    const [target, ...others] = targets;
    if (Object.isUndefined(target) || others.length > 0)
      throw new ArgumentException(Resources.severalHostsUnsupported, Resources.hostParameterName);
    if (target[0].includes(Resources.pathSeparator))
      throw new ArgumentException(Resources.socketPathUnsupported, Resources.hostParameterName);

    return target;
  }

  private static readRootCertificate(query: ReadonlyMap<string, string>): string | null {
    const root = query.get(Resources.sslRootCertOption) ?? null;
    return root === Resources.systemCertificates ? null : root;
  }

  private static readSslSwitch(query: ReadonlyMap<string, string>): boolean | string {
    if (query.get(Resources.sslRootCertOption) === Resources.systemCertificates)
      return SslMode.VerifyFull;

    return query.get(Resources.sslModeOption) ?? query.get(Resources.sslOption) ?? false;
  }

  private static fromQuery(query: ReadonlyMap<string, string>): OptionValues {
    const values: OptionValues = {};
    for (const [name, key] of ClientOptionsParser.integers) {
      const value = ClientOptionsParser.parseInteger(query.get(name));
      if (!Object.isUndefined(value))
        values[key] = value;
    }

    for (const [name, key] of ClientOptionsParser.switches) {
      const value = query.get(name);
      if (!Object.isUndefined(value))
        values[key] = value !== SslMode.Disable && value !== String(false);
    }

    const infer = query.get(Resources.inferOption);
    if (!Object.isUndefined(infer))
      values.infer = infer === String(true);
    return values;
  }

  private static mergeParameters(connection: ReadonlyMap<string, string> | undefined, query: ReadonlyMap<string, string>): ReadonlyMap<string, string> {
    const parameters = new Map([[Resources.applicationNameParameter, Resources.applicationName], ...connection ?? []]);
    for (const [name, value] of query)
      if (!ClientOptionsParser.handled.has(name))
        parameters.set(name, value);

    return parameters;
  }

  private static parseInteger(text: string | undefined): number | undefined {
    return Object.isUndefined(text) ? undefined : Number(text);
  }

  private static pickFirst(given: string | undefined, parsed: string): string | null {
    if (!Object.isUndefined(given) && given.length > 0)
      return given;

    return parsed.length > 0 ? parsed : null;
  }

  private static decode(text: string): string {
    try {
      return decodeURIComponent(text);
    }
    catch {
      return text;
    }
  }
}
