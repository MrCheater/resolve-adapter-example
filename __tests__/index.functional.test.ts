import createSQLiteAdapter from "../src/create-sqlite-adapter";

describe("functional test", () => {
  const options = { fileName: ":memory:" };

  test("get, set, dispose", async () => {
    const adapter = createSQLiteAdapter(options);

    await adapter.init();

    const value = await adapter.get();
    expect(value).toEqual(0);

    await adapter.set(value + 1);

    expect(await adapter.get()).toEqual(value + 1);

    await adapter.dispose();
  });

  test("dispose", async () => {
    const adapter = createSQLiteAdapter(options);

    await adapter.dispose();
  });

  test("dispose, dispose", async () => {
    const adapter = createSQLiteAdapter(options);

    await adapter.dispose();

    await expect(adapter.dispose()).rejects.toThrow(
      "Adapter is already disposed"
    );
  });

  test("get, dispose, dispose", async () => {
    const adapter = createSQLiteAdapter(options);

    await adapter.init();

    const value = await adapter.get();
    expect(value).toEqual(0);

    await adapter.dispose();

    await expect(adapter.dispose()).rejects.toThrow(
      "Adapter is already disposed"
    );
  });
});
