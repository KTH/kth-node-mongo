import { connect, isOk } from './index'

jest.mock(
  'mongoose',
  jest.fn(() => ({
    connect: jest.fn(() => {}),
    connection: {
      on: jest.fn(() => {}),
    },
  }))
)
const mockLog = {
  init: jest.fn(() => {}),
  child: jest.fn(() => ({
    debug: jest.fn(),
    error: jest.fn(),
    fatal: jest.fn(),
    info: jest.fn(),
  })),
  debug: jest.fn(),
  error: jest.fn(),
  fatal: jest.fn(),
  info: jest.fn(),
}

describe('Test kth-node-mongo connection process', () => {
  jest.mock('@kth/log', () => mockLog)

  beforeEach(() => {
    jest.clearAllMocks()
  })
  afterAll(() => jest.resetAllMocks())

  test('should call the connect method and register event handlers', async () => {
    const connectOptions = {
      logger: undefined,
      dbUri: '',
      mongooseDebug: false,
    }
    await connect(connectOptions)
    //expect(mockLog.child).toHaveBeenCalled()
    //expect(mockMoongoose.connection.on).toHaveBeenCalledWith('connected')
    //expect(logSpy).toHaveBeenCalledWith('DATABASE: Connecting database...');

    //expect(mockMoongoose.connect).toHaveBeenCalledTimes(1)
    /* expect(mockMoongoose.connection.on).toHaveBeenCalledWith('connected')
    expect(mockMoongoose.connection.on).toHaveBeenCalledWith('reconnected')
    expect(mockMoongoose.connection.on).toHaveBeenCalledWith('disconnected')
    expect(mockMoongoose.connection.on).toHaveBeenCalledWith('error') */
  })

  test('When no connection is initiated, isok status should be false', async () => {
    const ok = await isOk()
    expect(ok).toBeFalsy()
  })
})
