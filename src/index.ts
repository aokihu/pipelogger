/**
 * Pipelog
 * @author aokihu <aokihu@gmail.com>
 * @version 1.1.0
 */

import { createWriteStream, type WriteStream } from "node:fs";
import { inspect } from "node:util";

/**
 * @class Pipelog
 */
export class Pipelog {
  private static instance: Pipelog | null = null;

  private readonly _pipepath: string;
  private readonly _pipeStream: WriteStream;
  private readonly _encoding: BufferEncoding;
  private readonly _timeformat: "long" | "short" | "none";

  private constructor(
    pipepath: string,
    options: {
      encoding?: BufferEncoding;
      timeformat?: "long" | "short" | "none";
    } = {},
  ) {
    this._pipepath = pipepath;
    this._encoding = options.encoding ?? "utf8";
    this._timeformat = options.timeformat ?? "none";

    this._pipeStream = createWriteStream(pipepath, {
      flags: "a",
      encoding: this._encoding,
    });
  }

  static factory(pipepath: string, options?: { encoding?: BufferEncoding }) {
    if (!pipepath) {
      throw new Error("The pipepath is required");
    }

    if (!Pipelog.instance) {
      Pipelog.instance = new Pipelog(pipepath, options);
    }

    return Pipelog.instance;
  }

  static getInstance() {
    return Pipelog.instance ?? undefined;
  }

  private _formatPayload(payload: unknown) {
    if (typeof payload === "string") return payload;
    return inspect(payload, { depth: null });
  }

  private _writeStream(content: string) {
    this._pipeStream.write(content, this._encoding);
  }

  private _getTimestamp() {
    if (this._timeformat === "none") return;
    const date = new Date();
    return this._timeformat === "short"
      ? date.toISOString().slice(0, 19).replace("T", " ")
      : date.toISOString();
  }

  /**
   * Print log output
   * @param message {any[]} The print message;
   */
  log(...message: unknown[]) {
    message.forEach((payload) => {
      const formatted = this._formatPayload(payload);
      this._writeStream(
        this._timeformat === "none"
          ? formatted + "\n"
          : `[${this._getTimestamp()}] ${formatted}\n`,
      );
    });
  }

  destroy() {
    this._pipeStream.end();
    Pipelog.instance = null;
  }
}
