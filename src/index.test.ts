jest.mock('@kth/log', () => ({
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
}))

const mockMoongoose = {
  connect: jest.fn(() => {}),
  connection: {
    on: jest.fn(() => {}),
  },
}
describe('Test kth-node-mongo connection process', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterAll(() => jest.resetAllMocks())

  test('should call the connect method and register event handlers', async () => {
    jest.mock('mongoose', () => mockMoongoose)
    const { connect } = require('./index')

    await connect({})

    expect(mockMoongoose.connect).toHaveBeenCalledTimes(1)
    expect(mockMoongoose.connection.on).toHaveBeenCalledWith('connected', expect.toBeFunction())
    expect(mockMoongoose.connection.on).toHaveBeenCalledWith('reconnected', expect.toBeFunction())
    expect(mockMoongoose.connection.on).toHaveBeenCalledWith('disconnected', expect.toBeFunction())
    expect(mockMoongoose.connection.on).toHaveBeenCalledWith('error', expect.toBeFunction())
  })

  test('When no connection is initiated, isok status should be false', async () => {
    jest.mock('mongoose', () => mockMoongoose)
    const { isOk } = require('./index')

    const ok = await isOk()
    expect(ok).toBeFalsy()
  })
})
