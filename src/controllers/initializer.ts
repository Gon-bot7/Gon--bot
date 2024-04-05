import { Whatsapp } from '../api/whatsapp'
import { CreateConfig, defaultOptions } from '../config/create-config'
import { initWhatsapp, initBrowser, statusLog } from './browser'
import {
  SocketState,
  SocketStream,
  InterfaceMode,
  InterfaceState,
} from '../api/model/enum'
import { InterfaceChangeMode } from '../api/model'
import { checkingCloses } from '../api/helpers'
import { Browser, Page } from 'puppeteer'
import { checkUpdates } from './check-up-to-date'
import { logger } from '../utils/logger'

declare global {
  interface Window {
    updater
  }
}

/**
 * A callback will be received, informing the status of the qrcode
 */
export type CatchQR = (
  qrCode: string,
  asciiQR: string,
  attempt?: number,
  urlCode?: string
) => void

/**
 * A callback will be received, informing the customer's status
 */
export type StatusFind = (
  statusGet: string,
  session: string,
  info?: string
) => void

/**
 * A callback will be received, informing user about browser and page instance
 */
export type BrowserInstance = (
  browser: string | Browser,
  waPage: false | Page,
  client: Whatsapp
) => void

export type interfaceChange = (
  statusGet: InterfaceStateChange | string,
  session: string
) => void

export enum InterfaceStateChange {
  /**
   * Client interface is loading page from qrcode
   */
  qrcodeOpening = 'qrcodeOpening',
  /**
   * Client interface is loading qrcode
   */
  qrcodeLoading = 'qrcodeLoading',
  /**
   * QR code ready to be read!
   */
  qrcodeNormal = 'qrcodeNormal',
  /**
   * Client interface is loading page from syncing
   */
  syncingOpening = 'syncingOpening',
  /**
   * Client interface is loading syncing
   */
  syncingLoading = 'syncingLoading',
  /**
   * Syncing ready to be read!
   */
  syncingNormal = 'syncingNormal',
  /**
   * The customer is in the chat
   */
  chatsAvailable = 'chatsAvailable',
}

export type ReconnectQrcode = (client: Whatsapp) => void

export interface CreateOptions extends CreateConfig {
  /**
   * You must pass a string type parameter, this parameter will be the name of the client's session. If the parameter is not passed, the section name will be "session".
   */
  session: string
  /**
   * A callback will be received, informing the status of the qrcode
   */
  catchQR?: CatchQR
  /**
   * A callback will be received, informing the customer's status
   */
  statusFind?: StatusFind
  /**
   * A callback will be received, informing user about browser and page instance
   */
  browserInstance?: BrowserInstance
  /**
   * A callback will be received, customer interface information
   */
  interfaceChange?: interfaceChange
}

/**
 * Start the bot
 * @returns Whatsapp page, with this parameter you will be able to access the bot functions
 */
export async function create(createOption: CreateOptions): Promise<Whatsapp>
/**
 * Start the bot
 * You must pass a string type parameter, this parameter will be the name of the client's session. If the parameter is not passed, the section name will be "session".
 * @returns Whatsapp page, with this parameter you will be able to access the bot functions
 */

export async function create(
  sessionName: string,
  catchQR?: CatchQR,
  statusFind?: StatusFind,
  options?: CreateConfig,
  browserInstance?: BrowserInstance,
  reconnectQrcode?: ReconnectQrcode,
  interfaceChange?: interfaceChange
): Promise<Whatsapp>

export async function create(
  sessionOrOption: string | CreateOptions,
  catchQR?: CatchQR,
  statusFind?: StatusFind,
  options?: CreateConfig,
  browserInstance?: BrowserInstance,
  reconnectQrcode?: ReconnectQrcode,
  interfaceChange?: interfaceChange
): Promise<any> {
  let session = 'session'
  return new Promise(async (resolve, reject) => {
    if (
      typeof sessionOrOption === 'string' &&
      sessionOrOption.replace(/\s/g, '').length
    ) {
      session = sessionOrOption.replace(/\s/g, '')
      options['session'] = session
    } else if (typeof sessionOrOption === 'object') {
      session = sessionOrOption.session || session
      catchQR = sessionOrOption.catchQR || catchQR
      statusFind = sessionOrOption.statusFind || statusFind
      browserInstance = sessionOrOption.browserInstance || browserInstance
      options = sessionOrOption
    }

    logger.debug(`[node-version-${session}] check nodeJs version...`)

    const requiredNodeVersion = 16
    const currentNodeVersion = Number(process.versions.node.split('.')[0])
    if (currentNodeVersion < requiredNodeVersion) {
      logger.error(
        `[node-version-${session}] update Node.js, the version you are using doesn't work for this system!`
      )
      return reject(
        `Outdated Node.js version. Node.js ${requiredNodeVersion} or higher is required. Please update Node.js.`
      )
    }

    logger.debug(
      `[node-version-${session}] Node.js version verified successfully!`
    )

    await checkUpdates()

    const mergedOptions = { ...defaultOptions, ...options }

    statusFind && statusFind('initBrowser', session)

    // Initialize whatsapp
    if (mergedOptions.browserWS) {
      logger.debug(`[browser-${session}] Waiting... checking the wss server...`)
    } else {
      logger.debug(`[browser-${session}] Waiting... checking the browser...`)
    }

    const browser: Browser | boolean = await initBrowser(mergedOptions)

    if (typeof browser === 'boolean') {
      logger.error(`[browser-${session}] Error no open browser....`)
      statusFind && statusFind('noOpenBrowser', session)
      return reject(`Error no open browser....`)
    }

    if (mergedOptions.browserWS) {
      statusFind && statusFind('connectBrowserWs', session)
      logger.debug(
        `[browser-${session}] Has been properly connected to the wss server`
      )
    } else {
      statusFind && statusFind('openBrowser', session)
      logger.debug(`[browser-${session}] Browser successfully opened`)
    }

    if (!mergedOptions.browserWS) {
      logger.debug(`[browser-${session}] checking headless...`)

      if (mergedOptions.headless) {
        logger.debug(
          `[browser-${session}] headless option is active, browser hidden`
        )
      } else {
        logger.debug(
          `[browser-${session}] headless option is disabled, browser visible`
        )
      }
    }

    if (typeof browser === 'object') {
      if (!mergedOptions.browserWS && browser['_process']) {
        browser['_process'].once('close', () => {
          browser['isClose'] = true
        })
      }

      checkingCloses(browser, mergedOptions, (result) => {
        statusFind && statusFind(result, session)
      }).catch(() => {
        logger.error(`[whatzapp-${session}] Closed Browser`)
        return reject('The client has been closed')
      })

      logger.debug(`[whatzapp-${session}] Checking page to whatzapp...`)

      statusFind && statusFind('initWhatsapp', session)
      // Initialize whatsapp
      const page: false | Page = await initWhatsapp(mergedOptions, browser)

      if (page === false) {
        logger.error(
          `[whatzapp-${session}] Error accessing the page: "https://web.whatsapp.com"`
        )
        statusFind && statusFind('erroPageWhatsapp', session)
        return reject(
          'Error when trying to access the page: "https://web.whatsapp.com"'
        )
      }

      statusFind && statusFind('successPageWhatsapp', session)

      logger.debug(`[whatzapp-${session}] Page successfully accessed`)

      // FIXME - verificar memory leak, é uma função async que fica rodando um while(true)
      statusLog(page, session, (event) => {
        logger.debug(`[whatzapp-${session}] event=${event}`)
        statusFind && statusFind('introductionHistory', session, event)
      })

      const client = new Whatsapp(browser, page, session, mergedOptions)

      if (browserInstance) {
        browserInstance(browser, page, client)
      }

      client.onInterfaceChange(async (interFace: InterfaceChangeMode) => {
        if (interFace.mode === InterfaceMode.MAIN) {
          interfaceChange && interfaceChange('chatsAvailable', session)

          logger.debug(`[whatzapp-${session}] Successfully load main page!`)

          // FIXME - chamada duplicada
          // await client.initService()
          // await client.addChatWapi()
        }

        if (interFace.mode === InterfaceMode.SYNCING) {
          if (interFace.info === InterfaceState.OPENING) {
            logger.info(
              `[whatzapp-${session}:onInterfaceChange] Syncing page...`
            )
            interfaceChange && interfaceChange('syncingOpening', session)
          }

          if (interFace.info === InterfaceState.PAIRING) {
            logger.info(
              `[whatzapp-${session}:onInterfaceChange] Pairing devide...`
            )
            interfaceChange && interfaceChange('syncingLoading', session)
          }

          if (interFace.info === InterfaceState.NORMAL) {
            logger.info(
              `[whatzapp-${session}:onInterfaceChange] Interface state normal...`
            )
            interfaceChange && interfaceChange('syncingNormal', session)
          }
        }

        if (interFace.mode === InterfaceMode.QR) {
          try {
            const status = await page.evaluate(
              () => window?.Store?.State?.Socket?.stream
            )

            if (status === SocketStream.DISCONNECTED) {
              logger.warn(`[whatzapp-${session}] Disconnected!`)
              // FIXME - entender o que está fazendo com esse código
              // document.querySelectorAll('.MLTJU p')[0].textContent
              statusFind && statusFind('disconnected', session)
            }

            if (interFace.info === InterfaceState.OPENING) {
              logger.info(
                `[whatzapp-${session}:onInterfaceChange] Opening QR Code page...`
              )
              interfaceChange && interfaceChange('qrcodeOpening', session)
            }

            if (interFace.info === InterfaceState.PAIRING) {
              logger.info(
                `[whatzapp-${session}:onInterfaceChange] Pairing device...`
              )
              interfaceChange && interfaceChange('qrcodeLoading', session)
            }

            if (interFace.info === InterfaceState.NORMAL) {
              logger.info(
                `[whatzapp-${session}:onInterfaceChange] Device connected...`
              )
              interfaceChange && interfaceChange('qrcodeNormal', session)
            }
          } catch (error) {
            logger.error(
              `[whatzapp-${session}:onInterfaceChange] error=${JSON.stringify(
                error
              )}`
            )
          }
        }
      })

      client
        .onStreamChange(async (stateStream: SocketStream) => {
          if (stateStream === SocketStream.CONNECTED) {
            logger.debug(
              `[whatzapp-${session}:onStreamChange] Successfully connected!`
            )
          }

          if (stateStream === SocketStream.DISCONNECTED) {
            try {
              logger.warn(`[whatzapp-${session}:onStreamChange] Disconnected!`)

              const mode = await page.evaluate(
                () => window?.Store?.Stream?.mode
              )

              if (
                mode === InterfaceMode.QR
                // && checkFileJson(mergedOptions, session)
              ) {
                if (statusFind) {
                  statusFind('disconnectedMobile', session)
                }
              }
            } catch (error) {
              logger.error(
                `[whatzapp-${session}:onStreamChange] error=${JSON.stringify(
                  error
                )}`
              )
            }
          }
        })
        .catch()

      client
        .onStateChange(async (state) => {
          if (state === SocketState.PAIRING) {
            try {
              const device: Boolean = await page.evaluate(() => {
                // TODO verificar se a Store ja foi carregada ou não.
                const isInterfaceSyncing =
                  !!document.querySelector('[tabindex="-1"]') &&
                  window?.Store?.Stream?.mode === InterfaceMode.SYNCING &&
                  window?.Store?.Stream?.obscurity === 'SHOW'

                return isInterfaceSyncing
              })

              if (device === true) {
                if (statusFind) {
                  statusFind('deviceNotConnected', session)
                }
              }
            } catch (error) {
              logger.error(
                `[whatzapp-${session}:onStateChange] error=${JSON.stringify(
                  error
                )}`
              )
            }
          }
        })
        .catch()

      page.on('dialog', async (dialog) => {
        await dialog.accept()
      })

      if (mergedOptions.waitForLogin) {
        const isLogged = await client.waitForLogin(catchQR, statusFind)

        statusFind && statusFind('waitForLogin', session)

        if (!isLogged) {
          return reject('Not Logged')
        }

        // TODO entender por que não ta funcionando ou se esta
        let waitLoginPromise = null
        client.onStateChange(async (state) => {
          if (
            state === SocketState.UNPAIRED ||
            state === SocketState.UNPAIRED_IDLE
          ) {
            try {
              if (!waitLoginPromise) {
                logger.info(
                  `[whatzapp-${session}:onStateChange] reconnecting to device}`
                )
                waitLoginPromise = client.waitForLogin(catchQR, statusFind)

                await waitLoginPromise

                if (reconnectQrcode) {
                  reconnectQrcode(client)
                }
              }
            } catch (error) {
              logger.error(
                `[whatzapp-${session}:onStateChange] reconnect failed with error=${JSON.stringify(
                  error
                )}`
              )
            }

            waitLoginPromise = null
          }
        })
      }

      statusFind && statusFind('waitChat', session)

      logger.debug(`[whatzapp-${session}] waiting for app load...`)

      await page
        .waitForSelector('#app .two', { visible: true }) // , timeout: 60000
        .catch(() => {})

      logger.debug(`[whatzapp-${session}] Successfully connected!`)

      // FIXME - chamada duplicada
      // await client.initService()
      // await client.addChatWapi()

      statusFind && statusFind('successChat', session)

      return resolve(client)
    }
  })
}
