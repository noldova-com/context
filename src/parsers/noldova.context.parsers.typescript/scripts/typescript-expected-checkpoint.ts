/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { appendFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

import TypeScriptExpectedCheckpointEntry from "./typescript-expected-checkpoint-entry.ts";
import type TypeScriptExpectedRecord from "./typescript-expected-record.ts";
import TypeScriptExpectedRetry from "./typescript-expected-retry.ts";

export default class TypeScriptExpectedCheckpoint {
  private static readonly ATTEMPTS_FILE_NAME: string = "attempts.jsonl";
  private static readonly EXCEEDED_FILE_NAME: string = "exceeded.jsonl";
  private static readonly IDENTITY_FILE_NAME: string = "identity.json";
  private static readonly LINE_FEED: string = "\n";
  private static readonly RESULTS_FILE_NAME: string = "results.jsonl";
  private static readonly TEXT_ENCODING: BufferEncoding = "utf8";

  private readonly resultsPath: string;
  private readonly exceededPath: string;
  private readonly attemptsPath: string;
  private readonly results: Map<string, string> = new Map<string, string>();
  private readonly exceeded: Map<string, string> = new Map<string, string>();
  private readonly attempts: Map<string, string[]> = new Map<string, string[]>();

  private constructor(directory: string) {
    this.resultsPath = path.join(directory, TypeScriptExpectedCheckpoint.RESULTS_FILE_NAME);
    this.exceededPath = path.join(directory, TypeScriptExpectedCheckpoint.EXCEEDED_FILE_NAME);
    this.attemptsPath = path.join(directory, TypeScriptExpectedCheckpoint.ATTEMPTS_FILE_NAME);
  }

  public get accountedCount(): number {
    return this.results.size + this.exceeded.size;
  }

  public get resultLines(): ReadonlyMap<string, string> {
    return this.results;
  }

  public get exceededReasons(): ReadonlyMap<string, string> {
    return this.exceeded;
  }

  public get retries(): readonly TypeScriptExpectedRetry[] {
    return [...this.attempts.keys()]
      .filter(t => this.results.has(t))
      .sort()
      .map(t => new TypeScriptExpectedRetry(t, this.attempts.get(t)!));
  }

  public static open(directory: string, identity: string): TypeScriptExpectedCheckpoint {
    const identityPath = path.join(directory, TypeScriptExpectedCheckpoint.IDENTITY_FILE_NAME);
    if (existsSync(identityPath) && readFileSync(identityPath, TypeScriptExpectedCheckpoint.TEXT_ENCODING) !== identity)
      rmSync(directory, { recursive: true, force: true });

    mkdirSync(directory, { recursive: true });
    writeFileSync(identityPath, identity);

    const checkpoint = new TypeScriptExpectedCheckpoint(directory);
    for (const line of TypeScriptExpectedCheckpoint.readLines(checkpoint.resultsPath))
      checkpoint.results.set((JSON.parse(line) as TypeScriptExpectedRecord).path, line);
    for (const line of TypeScriptExpectedCheckpoint.readLines(checkpoint.exceededPath)) {
      const entry: TypeScriptExpectedCheckpointEntry = JSON.parse(line);
      checkpoint.exceeded.set(entry.path, entry.reason);
    }
    for (const line of TypeScriptExpectedCheckpoint.readLines(checkpoint.attemptsPath)) {
      const entry: TypeScriptExpectedCheckpointEntry = JSON.parse(line);
      checkpoint.attempts.set(entry.path, [...checkpoint.attempts.get(entry.path) ?? [], entry.reason]);
    }

    return checkpoint;
  }

  public isAccounted(casePath: string): boolean {
    return this.results.has(casePath) || this.exceeded.has(casePath);
  }

  public addResult(record: TypeScriptExpectedRecord): void {
    const line = JSON.stringify(record);
    appendFileSync(this.resultsPath, `${line}${TypeScriptExpectedCheckpoint.LINE_FEED}`);
    this.results.set(record.path, line);
  }

  public addExceeded(casePath: string, reason: string): void {
    appendFileSync(this.exceededPath, `${JSON.stringify(new TypeScriptExpectedCheckpointEntry(casePath, reason))}${TypeScriptExpectedCheckpoint.LINE_FEED}`);
    this.exceeded.set(casePath, reason);
  }

  public recordAttempt(casePath: string, reason: string): number {
    appendFileSync(this.attemptsPath, `${JSON.stringify(new TypeScriptExpectedCheckpointEntry(casePath, reason))}${TypeScriptExpectedCheckpoint.LINE_FEED}`);
    const reasons = [...this.attempts.get(casePath) ?? [], reason];
    this.attempts.set(casePath, reasons);

    return reasons.length;
  }

  private static readLines(filePath: string): readonly string[] {
    if (!existsSync(filePath))
      return [];

    return readFileSync(filePath, TypeScriptExpectedCheckpoint.TEXT_ENCODING).split(TypeScriptExpectedCheckpoint.LINE_FEED).filter(t => t.length !== 0);
  }
}
