/**
 * These tests run under Bun runtime
 */
import { describe, it, beforeEach, afterEach, expect } from "bun:test";
import { createReadStream, type ReadStream } from "node:fs";
import { Pipelog } from "./index.js";

describe("Pipelog Tests", () => {
  let pipelog: Pipelog;
  let pipepath: string;
  let readStream: ReadStream;

  beforeEach(async () => {
    pipepath = `/tmp/${Bun.randomUUIDv7()}`;
    await Bun.$`mkfifo ${pipepath}`;

    // 创建读取流
    readStream = createReadStream(pipepath, { encoding: "utf8" });

    // 创建Pipelog实例
    pipelog = Pipelog.factory(pipepath);
  });

  afterEach(async () => {
    readStream.close();
    Pipelog.getInstance()?.destroy();
    await Bun.$`rm ${pipepath}`;
  });

  it("should initialize instance successfully", () => {
    expect(pipelog).toBeDefined();
  });

  it("should write string message to pipe", async () => {
    const message = "Hello, Pipelog!";
    const promise = new Promise<string>((resolve) => {
      readStream.once("data", (chunk) => {
        resolve(chunk as string);
      });
    });

    pipelog.log(message);
    const received = await promise;

    expect(received).toContain(message);
    expect(received).toMatch(
      /^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/,
    ); // 验证时间戳
  });

  it("should write object message to pipe", async () => {
    const obj = { name: "Test Object", value: 123, nested: { key: "value" } };
    const promise = new Promise<string>((resolve) => {
      readStream.once("data", (chunk) => {
        resolve(chunk as string);
      });
    });

    pipelog.log(obj);
    const received = await promise;

    expect(received).toContain("name: 'Test Object'");
    expect(received).toContain("value: 123");
    expect(received).toContain("nested: { key: 'value' }");
  });

  it("should write multiple messages to pipe", async () => {
    const messages = ["Message 1", "Message 2", "Message 3"];
    const receivedMessages: string[] = [];
    const promise = new Promise<string[]>((resolve) => {
      readStream.on("data", (chunk) => {
        receivedMessages.push(chunk as string);
        if (receivedMessages.length === messages.length) {
          resolve(receivedMessages);
        }
      });
    });

    messages.forEach((msg) => pipelog.log(msg));
    const received = await promise;

    messages.forEach((msg) => {
      const match = received.find((receivedMsg) => receivedMsg.includes(msg));
      expect(match).not.toBeNil();
    });
  });

  it("should handle empty pipepath error", () => {
    expect(() => Pipelog.factory("")).toThrow(Error);
  });
});
