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
  });

  afterEach(async () => {
    Pipelog.getInstance()?.destroy();
    await Bun.$`rm ${pipepath}`;
  });

  it("should initialize instance successfully", () => {
    pipelog = Pipelog.factory(pipepath);
    expect(pipelog).toBeDefined();
  });

  it("should get singleton instance correctly", () => {
    const instance1 = Pipelog.factory(pipepath);
    const instance2 = Pipelog.getInstance();
    expect(instance1).toBe(instance2);
  });

  it("should return undefined when getInstance called before factory", () => {
    const instance = Pipelog.getInstance();
    expect(instance).toBeUndefined();
  });

  it("should handle empty pipepath error", () => {
    expect(() => Pipelog.factory("")).toThrow(Error);
    expect(() => Pipelog.factory("")).toThrow("The pipepath is required");
  });

  it("should write string message to pipe without timestamp", async () => {
    // 创建读取流
    readStream = createReadStream(pipepath, { encoding: "utf8" });
    pipelog = Pipelog.factory(pipepath, { timeformat: "none" });
    const message = "Hello, Pipelog!";
    const promise = new Promise<string>((resolve) => {
      readStream.once("data", (chunk) => {
        resolve(chunk as string);
      });
    });

    pipelog.log(message);
    const received = await promise;
    readStream.close();

    expect(received).toBe(`${message}\n`);
  });

  it("should write string message with short timestamp", async () => {
    // 创建读取流
    readStream = createReadStream(pipepath, { encoding: "utf8" });
    pipelog = Pipelog.factory(pipepath, { timeformat: "short" });
    const message = "Hello, Pipelog!";
    const promise = new Promise<string>((resolve) => {
      readStream.once("data", (chunk) => {
        resolve(chunk as string);
      });
    });

    pipelog.log(message);
    const received = await promise;
    readStream.close();

    expect(received).toContain(message);
    expect(received).toMatch(/^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\] /);
  });

  it("should write string message with long timestamp", async () => {
    // 创建读取流
    readStream = createReadStream(pipepath, { encoding: "utf8" });
    pipelog = Pipelog.factory(pipepath, { timeformat: "long" });
    const message = "Hello, Pipelog!";
    const promise = new Promise<string>((resolve) => {
      readStream.once("data", (chunk) => {
        resolve(chunk as string);
      });
    });

    pipelog.log(message);
    const received = await promise;
    readStream.close();

    expect(received).toContain(message);
    expect(received).toMatch(
      /^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] /,
    );
  });

  it("should write object message to pipe", async () => {
    // 创建读取流
    readStream = createReadStream(pipepath, { encoding: "utf8" });
    pipelog = Pipelog.factory(pipepath);
    const obj = { name: "Test Object", value: 123, nested: { key: "value" } };
    const promise = new Promise<string>((resolve) => {
      readStream.once("data", (chunk) => {
        resolve(chunk as string);
      });
    });

    pipelog.log(obj);
    const received = await promise;
    readStream.close();

    expect(received).toContain("name: 'Test Object'");
    expect(received).toContain("value: 123");
    expect(received).toContain("nested: { key: 'value' }");
  });

  it("should write deep nested objects correctly", async () => {
    // 创建读取流
    readStream = createReadStream(pipepath, { encoding: "utf8" });
    pipelog = Pipelog.factory(pipepath);
    const deepObj = {
      level1: {
        level2: {
          level3: {
            level4: {
              value: "deep value",
            },
          },
        },
      },
    };
    const promise = new Promise<string>((resolve) => {
      readStream.once("data", (chunk) => {
        resolve(chunk as string);
      });
    });

    pipelog.log(deepObj);
    const received = await promise;
    readStream.close();

    expect(received).toContain("deep value");
  });

  it("should write multiple messages of different types", async () => {
    // 创建读取流
    readStream = createReadStream(pipepath, { encoding: "utf8" });
    pipelog = Pipelog.factory(pipepath, { timeformat: "none" });
    const messages = [
      "String message",
      12345,
      null,
      undefined,
      true,
      false,
      { key: "value" },
      [1, 2, 3],
    ];
    let received = "";
    const promise = new Promise<string>((resolve) => {
      readStream.on("data", (chunk) => {
        received += chunk as string;
        // 等待所有数据写入
        setTimeout(() => {
          resolve(received);
        }, 10);
      });
    });

    messages.forEach((msg) => pipelog.log(msg));
    const result = await promise;
    readStream.close();

    expect(result).toContain("String message");
    expect(result).toContain("12345");
    expect(result).toContain("null");
    expect(result).toContain("undefined");
    expect(result).toContain("true");
    expect(result).toContain("false");
    expect(result).toContain("key: 'value'");
    expect(result).toContain("[ 1, 2, 3 ]");
  });

  it("should write multiple arguments in one log call", async () => {
    // 创建读取流
    readStream = createReadStream(pipepath, { encoding: "utf8" });
    pipelog = Pipelog.factory(pipepath, { timeformat: "none" });
    const promise = new Promise<string>((resolve) => {
      readStream.once("data", (chunk) => {
        resolve(chunk as string);
      });
    });

    pipelog.log("first", "second", "third");
    // 由于每个参数都会单独换行，我们需要收集多个data事件
    let received = "";
    readStream.on("data", (chunk) => {
      received += chunk as string;
    });

    await new Promise((resolve) => setTimeout(resolve, 10));
    readStream.close();

    expect(received).toContain("first\n");
    expect(received).toContain("second\n");
    expect(received).toContain("third\n");
  });

  it("should use custom encoding correctly", async () => {
    // 创建读取流
    readStream = createReadStream(pipepath, { encoding: "hex" });
    pipelog = Pipelog.factory(pipepath, { encoding: "utf8" });
    const message = "Hello";
    const promise = new Promise<string>((resolve) => {
      readStream.once("data", (chunk) => {
        resolve(chunk as string);
      });
    });

    pipelog.log(message);
    const received = await promise;
    readStream.close();

    // 当读取为hex时，utf8的"Hello\n"应该变成对应的十六进制表示
    expect(received).toBe("48656c6c6f0a");
  });

  it("should destroy instance correctly", () => {
    pipelog = Pipelog.factory(pipepath);
    const instance = Pipelog.getInstance();
    expect(instance).toBeDefined();

    pipelog.destroy();
    const instanceAfterDestroy = Pipelog.getInstance();
    expect(instanceAfterDestroy).toBeUndefined();
  });

  it("should create new instance after destroy", () => {
    pipelog = Pipelog.factory(pipepath);
    const instance1 = Pipelog.getInstance();
    pipelog.destroy();

    const newPipepath = `/tmp/${Bun.randomUUIDv7()}`;
    Bun.$`mkfifo ${newPipepath}`.then(() => {
      const instance2 = Pipelog.factory(newPipepath);
      expect(instance2).toBeDefined();
      expect(instance2).not.toBe(instance1);
      instance2.destroy();
      Bun.$`rm ${newPipepath}`;
    });
  });
});
