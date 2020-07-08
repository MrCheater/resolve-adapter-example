enum Status {
  NOT_CONNECTED,
  CONNECTED,
  DISPOSED,
}

interface IAdapterOptions {}

interface IAdapterImplementation<
  AdapterConnection extends any,
  AdapterOptions extends IAdapterOptions
> {
  connect(options: AdapterOptions): Promise<AdapterConnection>;
  dispose(connection: AdapterConnection): Promise<void>;
  init(connection: AdapterConnection): Promise<void>;
  get(connection: AdapterConnection): Promise<number>;
  set(connection: AdapterConnection, value: number): Promise<void>;
}

export interface IAdapter {
  init(): Promise<void>;
  get(): Promise<number>;
  set(value: number): Promise<void>;
  dispose(): Promise<void>;
}

interface AdapterState<AdapterConnection extends any> {
  connection: AdapterConnection | null;
  status: Status;
}

function throwWhenDisposed<AdapterConnection extends any>(
  state: AdapterState<AdapterConnection>
): void {
  if (state.status === Status.DISPOSED) {
    throw new Error("Adapter is already disposed");
  }
}

async function connectOnDemand<
  AdapterConnection extends any,
  AdapterImplementation extends IAdapterImplementation<
    AdapterConnection,
    AdapterOptions
  >,
  AdapterOptions extends IAdapterOptions
>(
  options: AdapterOptions,
  state: AdapterState<AdapterConnection>,
  implementation: AdapterImplementation
): Promise<void> {
  throwWhenDisposed(state);
  if (state.status === Status.NOT_CONNECTED) {
    state.connection = await implementation.connect(options);
    state.status = Status.CONNECTED;
  }
}

function wrapMethod<
  Args extends Array<any>,
  Result extends any,
  AdapterConnection extends any,
  AdapterImplementation extends IAdapterImplementation<
    AdapterConnection,
    AdapterOptions
  >,
  Adapter extends IAdapter,
  AdapterOptions extends IAdapterOptions
>(
  state: AdapterState<AdapterConnection>,
  options: AdapterOptions,
  implementation: AdapterImplementation,
  method: (connection: AdapterConnection, ...args: Args) => Promise<Result>
): (...args: Args) => Promise<Result> {
  return async (...args: Args) => {
    throwWhenDisposed(state);
    await connectOnDemand(options, state, implementation);
    const connection = state.connection;
    if (connection == null) {
      throw new Error("Bad connection");
    }
    return method(connection, ...args);
  };
}

function wrapDispose<
  Args extends Array<any>,
  Result extends any,
  AdapterConnection extends any,
  AdapterImplementation extends IAdapterImplementation<
    AdapterConnection,
    AdapterOptions
  >,
  Adapter extends IAdapter,
  AdapterOptions extends IAdapterOptions
>(
  state: AdapterState<AdapterConnection>,
  options: AdapterOptions,
  dispose: (connection: AdapterConnection, ...args: Args) => Promise<void>
): (...args: Args) => Promise<void> {
  return async (...args: Args) => {
    throwWhenDisposed(state);
    state.status = Status.DISPOSED;
    const connection = state.connection;
    if (connection == null) {
      return;
    }
    await dispose(connection, ...args);
  };
}

function createAdapter<
  AdapterConnection extends any,
  AdapterImplementation extends IAdapterImplementation<
    AdapterConnection,
    AdapterOptions
  >,
  Adapter extends IAdapter,
  AdapterOptions extends IAdapterOptions
>(implementation: AdapterImplementation, options: AdapterOptions): IAdapter {
  const state: AdapterState<AdapterConnection> = {
    status: Status.NOT_CONNECTED,
    connection: null,
  };

  const adapter: IAdapter = {
    init: wrapMethod(state, options, implementation, implementation.init),
    get: wrapMethod(state, options, implementation, implementation.get),
    set: wrapMethod(state, options, implementation, implementation.set),
    dispose: wrapDispose(state, options, implementation.dispose),
  };

  return adapter;
}

export default createAdapter;
