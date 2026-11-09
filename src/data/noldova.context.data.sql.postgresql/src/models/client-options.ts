/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { ClientTimers } from "./client/client-timers.js";
import { TransformOptions } from "./transform-options.js";
import type { TypeDefinition } from "./type-definition.js";

export class ClientOptions {
  public readonly max: number;
  public readonly min: number;
  public readonly idleTimeout: number | null;
  public readonly queueTimeout: number;
  public readonly queryTimeout: number;
  public readonly cancelTimeout: number;
  public readonly maxLifetime: number | (() => number) | null;
  public readonly maxPipeline: number;
  public readonly scheduler: boolean;
  public readonly backoff: number | ((retries: number) => number);
  public readonly keepAlive: number;
  public readonly prepare: boolean;
  public readonly debug: boolean | ((connection: number, text: string, values: readonly unknown[], oids: readonly number[]) => void);
  public readonly fetchTypes: boolean;
  public readonly eagerTypes: boolean;
  public readonly infer: boolean;
  public readonly unrefSockets: boolean;
  public readonly types: readonly TypeDefinition[];
  public readonly transform: TransformOptions;
  public readonly onnotice: ((notice: ReadonlyMap<string, string>) => void) | false | null;
  public readonly onnotify: ((channel: string, payload: string, pid: number) => void) | null;
  public readonly onclose: ((connection: number) => void) | null;
  public readonly onparameter: ((name: string, value: string) => void) | null;
  public readonly timers: ClientTimers;

  public constructor(values: Partial<ClientOptions> = {}) {
    this.max = values.max ?? 10;
    this.min = values.min ?? 0;
    this.idleTimeout = values.idleTimeout ?? null;
    this.queueTimeout = values.queueTimeout ?? 0;
    this.queryTimeout = values.queryTimeout ?? 0;
    this.cancelTimeout = values.cancelTimeout ?? 5;
    this.maxLifetime = Object.isUndefined(values.maxLifetime) ? (): number => ClientOptions.computeLifetime() : values.maxLifetime;
    this.maxPipeline = values.maxPipeline ?? 100;
    this.scheduler = this.max !== 1 && (values.scheduler ?? true);
    this.backoff = values.backoff ?? ((retries: number): number => ClientOptions.computeBackoff(retries));
    this.keepAlive = values.keepAlive ?? 60;
    this.prepare = values.prepare ?? true;
    this.debug = values.debug ?? false;
    this.fetchTypes = values.fetchTypes ?? true;
    this.eagerTypes = values.eagerTypes ?? false;
    this.infer = values.infer ?? false;
    this.unrefSockets = values.unrefSockets ?? false;
    this.types = values.types ?? [];
    this.transform = values.transform ?? new TransformOptions();
    this.onnotice = values.onnotice ?? null;
    this.onnotify = values.onnotify ?? null;
    this.onclose = values.onclose ?? null;
    this.onparameter = values.onparameter ?? null;
    this.timers = values.timers ?? new ClientTimers();
  }

  public static computeLifetime(): number {
    return 60 * (30 + Math.random() * 30);
  }

  public static computeBackoff(retries: number): number {
    return (0.5 + Math.random() / 2) * Math.min(3 ** retries / 100, 20);
  }
}
