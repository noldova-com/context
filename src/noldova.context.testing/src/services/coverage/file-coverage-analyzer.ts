/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { readFile } from "node:fs/promises";
import { dirname, isAbsolute, relative } from "node:path";

import { BinarySearchService } from "@noldova/context.collections";
import { nameof } from "@noldova/context.core";
import { ExceptionOptions } from "@noldova/context.exceptions";
import { EcmaScriptLineTerminator } from "@noldova/context.text";

import { TestingException } from "../../exceptions/testing.exception.js";
import type { ISourceMapData } from "../../interfaces/i-source-map-data.js";
import { BlockCoverage } from "../../models/coverage/block-coverage.js";
import type { CoverageProject } from "../../models/coverage/coverage-project.js";
import { CoverageRange } from "../../models/coverage/coverage-range.js";
import { FileCoverage } from "../../models/coverage/file-coverage.js";
import type { FunctionCoverage } from "../../models/coverage/function-coverage.js";
import { LineRange } from "../../models/coverage/line-range.js";
import { Resources } from "../../resources.js";
import { SourceMap } from "./source-map.js";

export class FileCoverageAnalyzer {

  private readonly lineTerminator: EcmaScriptLineTerminator = new EcmaScriptLineTerminator();
  private readonly project: CoverageProject;

  public constructor(project: CoverageProject) {
    this.project = project;
  }

  public async analyzeAsync(filePath: string, scriptEntries: readonly (readonly FunctionCoverage[])[]): Promise<FileCoverage> {
    const fileText = await readFile(filePath, Resources.textEncoding);
    const lineStartOffsets = this.computeLineStartOffsets(fileText);
    const sourceMap = await this.tryLoadSourceMapAsync(filePath);
    const sourcePath = this.tryDetermineSourcePath(lineStartOffsets, sourceMap);
    const relativePath = Object.isUndefined(sourcePath)
      ? this.toRelativePath(filePath, this.project.productionDirectory)
      : this.toRelativePath(sourcePath, this.project.sourceDirectory);
    const toLine = (t: number): number => this.toSourceLine(t, lineStartOffsets, sourceMap);

    if (this.isInertModule(fileText))
      return new FileCoverage(this.project.name, relativePath, [], 0, 0, []);

    if (scriptEntries.length === 0)
      return this.toNeverLoadedFileCoverage(relativePath, fileText, toLine);

    const coveredPositions = this.computeCoveredPositions(scriptEntries, fileText);
    const blockCoverages = this.computeBlockCoverages(scriptEntries, fileText, coveredPositions, toLine);
    const uncoveredRanges = this.toUncoveredRanges(coveredPositions);

    if (uncoveredRanges.length === 0)
      return new FileCoverage(this.project.name, relativePath, [], fileText.length, 0, blockCoverages);

    const uncoveredLength = uncoveredRanges.reduce((sum, range) => sum + range.endOffset - range.startOffset, 0);
    const uncoveredLineRanges = uncoveredRanges
      .map(t => {
        const startLine = toLine(t.startOffset);

        return new LineRange(startLine, Math.max(startLine, toLine(Math.max(t.startOffset, t.endOffset - 1))));
      })
      .sort((first, second) => first.startLine - second.startLine);

    return new FileCoverage(this.project.name, relativePath, this.mergeLineRanges(uncoveredLineRanges), fileText.length, uncoveredLength, blockCoverages);
  }

  private toNeverLoadedFileCoverage(relativePath: string, fileText: string, toLine: (offset: number) => number): FileCoverage {
    const firstLine = toLine(0);
    const lastLine = toLine(fileText.length - 1);

    return new FileCoverage(
      this.project.name,
      relativePath,
      [new LineRange(Math.min(firstLine, lastLine), Math.max(firstLine, lastLine))],
      fileText.length,
      fileText.length,
      []);
  }

  private isInertModule(fileText: string): boolean {
    const strippedText = fileText.replace(Resources.blockCommentPattern, String.empty);

    return strippedText.split(Resources.lineFeed).every(t => {
      const trimmedLine = t.trim();

      return trimmedLine === String.empty
        || trimmedLine.startsWith(Resources.lineCommentPrefix)
        || trimmedLine === Resources.emptyExport;
    });
  }

  private computeBlockCoverages(
    scriptEntries: readonly (readonly FunctionCoverage[])[],
    fileText: string,
    coveredPositions: Uint8Array,
    toLine: (offset: number) => number): BlockCoverage[] {
    const blockRangesByKey = new Map<string, CoverageRange>();
    for (const functionCoverages of scriptEntries)
      for (const functionCoverage of functionCoverages)
        for (const range of functionCoverage.ranges.slice(1))
          if (!this.isWhitespaceOnlyRange(range, fileText))
            blockRangesByKey.set(`${range.startOffset}:${range.endOffset}`, range);

    const sortedRanges = [...blockRangesByKey.values()].sort((first, second) => first.startOffset - second.startOffset || first.endOffset - second.endOffset);

    return sortedRanges.map(t => new BlockCoverage(
      toLine(t.startOffset),
      this.spanHasCoveredPosition(t, coveredPositions)));
  }

  private async tryLoadSourceMapAsync(filePath: string): Promise<SourceMap | undefined> {
    const sourceMapText = await readFile(`${filePath}${Resources.sourceMapSuffix}`, Resources.textEncoding)
      .catch((error: NodeJS.ErrnoException): string | undefined => {
        if (error.code === Resources.missingFileErrorCode)
          return undefined;

        throw error;
      });
    if (Object.isUndefined(sourceMapText))
      return undefined;

    try {
      const data: unknown = JSON.parse(sourceMapText);
      this.validateSourceMapData(data);
      return new SourceMap(data, dirname(filePath));
    }
    catch (error) {
      throw new TestingException(Resources.sourceMapMalformed(filePath), new ExceptionOptions(error));
    }
  }

  private validateSourceMapData(data: unknown): asserts data is ISourceMapData {
    if (!Object.isObject(data) || Array.isArray(data))
      throw new TestingException(Resources.sourceMapShapeInvalid);

    const version: unknown = Object.getOwnPropertyDescriptor(data, nameof<ISourceMapData>(t => t.version))?.value;
    const sources: unknown = Object.getOwnPropertyDescriptor(data, nameof<ISourceMapData>(t => t.sources))?.value;
    const mappings: unknown = Object.getOwnPropertyDescriptor(data, nameof<ISourceMapData>(t => t.mappings))?.value;
    const sourceRoot: unknown = Object.getOwnPropertyDescriptor(data, nameof<ISourceMapData>(t => t.sourceRoot))?.value;
    const names: unknown = Object.getOwnPropertyDescriptor(data, nameof<ISourceMapData>(t => t.names))?.value;

    if (!Object.isNumber(version)
      || !Array.isArray(sources) || !sources.every(Object.isString)
      || !Object.isString(mappings)
      || !Object.isUndefined(sourceRoot) && !Object.isString(sourceRoot)
      || !Object.isUndefined(names) && (!Array.isArray(names) || !names.every(Object.isString)))
      throw new TestingException(Resources.sourceMapShapeInvalid);
  }

  private tryDetermineSourcePath(lineStartOffsets: readonly number[], sourceMap: SourceMap | undefined): string | undefined {
    if (Object.isUndefined(sourceMap))
      return undefined;

    for (let line = 1; line <= lineStartOffsets.length; line++) {
      const position = sourceMap.mapToSource(line, Number.MAX_SAFE_INTEGER);
      if (!Object.isUndefined(position))
        return position.sourcePath;
    }

    return undefined;
  }

  private toSourceLine(offset: number, lineStartOffsets: readonly number[], sourceMap: SourceMap | undefined): number {
    const lineIndex = BinarySearchService.floorIndex(lineStartOffsets, offset);
    const generatedLine = lineIndex + 1;
    if (Object.isUndefined(sourceMap))
      return generatedLine;

    const generatedColumn = offset - lineStartOffsets[lineIndex]!;
    const position = sourceMap.mapToSource(generatedLine, generatedColumn);

    return Object.isUndefined(position) ? generatedLine : position.line;
  }

  private spanHasCoveredPosition(range: CoverageRange, coveredPositions: Uint8Array): boolean {
    for (let position = range.startOffset; position < range.endOffset && position < coveredPositions.length; position++)
      if (coveredPositions[position] === 1)
        return true;

    return false;
  }

  private isWhitespaceOnlyRange(range: CoverageRange, fileText: string): boolean {
    return range.endOffset > range.startOffset && String.isNullOrWhitespace(fileText.slice(range.startOffset, range.endOffset));
  }

  private computeCoveredPositions(scriptEntries: readonly (readonly FunctionCoverage[])[], fileText: string): Uint8Array {
    for (const functionCoverages of scriptEntries)
      for (const functionCoverage of functionCoverages)
        for (const range of functionCoverage.ranges)
          if (range.endOffset > fileText.length)
            throw new TestingException(Resources.coverageRangeBeyondFile(range.endOffset, fileText.length));

    const coveredPositions = new Uint8Array(fileText.length);
    const paintedCoverage = new Uint8Array(fileText.length);

    for (const functionCoverages of scriptEntries) {
      paintedCoverage.fill(0);

      const paintOrder = functionCoverages
        .flatMap(t => t.ranges)
        .sort((first, second) => first.startOffset - second.startOffset || second.endOffset - first.endOffset);
      for (const range of paintOrder)
        if (!this.isWhitespaceOnlyRange(range, fileText))
          paintedCoverage.fill(range.count > 0 ? 1 : 0, range.startOffset, range.endOffset);

      for (const [position, isCovered] of paintedCoverage.entries())
        if (isCovered === 1)
          coveredPositions[position] = 1;
    }

    return coveredPositions;
  }

  private toUncoveredRanges(coveredPositions: Uint8Array): CoverageRange[] {
    const uncoveredRanges: CoverageRange[] = [];
    let runStart = -1;

    for (let position = 0; position <= coveredPositions.length; position++) {
      const isUncovered = position < coveredPositions.length && coveredPositions[position] === 0;

      if (isUncovered && runStart === -1)
        runStart = position;

      if (!isUncovered && runStart !== -1) {
        uncoveredRanges.push(new CoverageRange(runStart, position, 0));
        runStart = -1;
      }
    }

    return uncoveredRanges;
  }

  private toRelativePath(filePath: string, rootDirectory: string): string {
    const relativePath = relative(rootDirectory, filePath).replaceAll(Resources.windowsDirectorySeparator, Resources.directorySeparator);
    if (relativePath === Resources.parentDirectory || relativePath.startsWith(`${Resources.parentDirectory}${Resources.directorySeparator}`) || isAbsolute(relativePath))
      throw new TestingException(Resources.coverageFileOutsideProject(filePath, this.project.name));

    return relativePath;
  }

  private computeLineStartOffsets(fileText: string): number[] {
    const lineStartOffsets = [0];
    for (let offset = 0; offset < fileText.length; offset++) {
      const lineBreakLength = this.lineTerminator.getLength(fileText, offset);
      if (lineBreakLength === 0)
        continue;

      offset += lineBreakLength - 1;
      lineStartOffsets.push(offset + 1);
    }

    return lineStartOffsets;
  }

  private mergeLineRanges(sortedLineRanges: readonly LineRange[]): LineRange[] {
    const mergedLineRanges: LineRange[] = [];
    for (const lineRange of sortedLineRanges) {
      const lastLineRange = mergedLineRanges[mergedLineRanges.length - 1];
      if (!Object.isUndefined(lastLineRange) && lineRange.startLine <= lastLineRange.endLine + 1) {
        mergedLineRanges[mergedLineRanges.length - 1] = new LineRange(lastLineRange.startLine, Math.max(lastLineRange.endLine, lineRange.endLine));
        continue;
      }

      mergedLineRanges.push(lineRange);
    }

    return mergedLineRanges;
  }
}
