import { Injectable } from '@angular/core';
import { Executable, InsertOptions, File as HiveFile, ScriptRunner, Vault, AppContext, Logger as HiveLogger, UpdateResult, UpdateOptions, Condition, InsertResult } from "@elastosfoundation/hive-js-sdk";
import { Claims, DIDDocument, JWTParserBuilder, DID, DIDBackend, DefaultDIDAdapter, JSONObject, VerifiableCredential } from '@elastosfoundation/did-js-sdk';
import { StandardAuthService } from 'src/app/services/StandardAuthService';
import { Console } from 'console';
import { resolve } from 'url';
import { FileService } from 'src/app/services/FileService';
import { Logger } from 'src/app/services/logger';
import { DataHelper } from 'src/app/services/DataHelper';
// import { InsertResult } from '@dchagastelles/elastos-hive-js-sdk/typings/restclient/database/insertresult';
import { } from '@elastosfoundation/hive-js-sdk'
import { isEqual, isNil, reject } from 'lodash';
let TAG: string = 'Feeds-HiveService';
import { Events } from 'src/app/services/events.service';
import { on } from 'process';

@Injectable()
export class HiveService {
  public static CREATEALLCollECTION = "feeds_createALLCollections" // 本地标识是否创建了Collection
  public static readonly CHANNEL = "channels"
  public static readonly TARGETDID = "targetDid"
  public static readonly postId = "channelId"
  private static readonly RESOLVE_CACHE = "data/didCache"

  public image = null
  public appinstanceDid: string
  private vault: Vault
  private scriptRunner: ScriptRunner
  private avatarScriptName: string
  private tarDID: string
  private tarAppDID: string
  private avatarParam: string
  private scriptRunners: { [key: string]: ScriptRunner } = {}

  constructor(
    private standardAuthService: StandardAuthService,
    private fileService: FileService,
    private dataHelper: DataHelper,
    private events: Events,
  ) {
  }

  public async creatAppContext(appInstanceDocumentString: string, userDidString: string): Promise<AppContext> {
    return new Promise(async (resolve, reject) => {
      try {
        //const currentNet = this.dataHelper.getDevelopNet().toLowerCase();
        const currentNet = "MainNet".toLowerCase();
        HiveLogger.setDefaultLevel(HiveLogger.TRACE)
        DIDBackend.initialize(new DefaultDIDAdapter(currentNet))
        try {
          AppContext.setupResolver(currentNet, HiveService.RESOLVE_CACHE)
        } catch (error) {
        }
        const rootDirEntry = await this.fileService.resolveLocalFileSystemURL()
        const path = rootDirEntry.fullPath
        // auth
        let self = this
        let cachedAuthToken = '';
        const context = await AppContext.build({
          getLocalDataDir(): string {
            return path
          },
          getAppInstanceDocument(): Promise<DIDDocument> {
            return new Promise(async (resolve, reject) => {
              try {
                let appInstanceDidDocument = DIDDocument._parseOnly(appInstanceDocumentString)
                resolve(appInstanceDidDocument)
              } catch (error) {
                Logger.error(TAG, "get AppInstanceDocument Error: ", error)
                reject(error)
              }
            })
          },
          getAuthorization(jwtToken: string): Promise<string> {
            return new Promise(async (resolve, reject) => {
              try {
                const authToken = await self.standardAuthService.generateHiveAuthPresentationJWT(jwtToken)
                resolve(authToken)
              } catch (error) {
                Logger.error(TAG, "get Authorization Error: ", error)
                reject(error)
              }
            })
          }
        }, userDidString);
        resolve(context)
      } catch (error) {
        // Logger.error(TAG, "creat Error: ", error)
        reject(error)
      }
    })
  }
  async creatScriptRunner(userDid: string) {
    let appinstanceDocument = await this.standardAuthService.getInstanceDIDDoc()
    const context = await this.creatAppContext(appinstanceDocument, userDid)
    let scriptRunner = new ScriptRunner(context)
    this.scriptRunners[userDid] = scriptRunner

    return scriptRunner
  }

  async creatVault() {
    try {
      const userDid = (await this.dataHelper.getSigninData()).did
      let appinstanceDocument = await this.standardAuthService.getInstanceDIDDoc()
      const context = await this.creatAppContext(appinstanceDocument, userDid)
      let scriptRunner = await this.creatScriptRunner(userDid)
      this.scriptRunners[userDid] = scriptRunner
      const vault = new Vault(context)
      const userDID = DID.from(userDid)
      const userDIDDocument = await userDID.resolve()

      this.parseUserDIDDocument(userDid, userDIDDocument)
      Logger.log(TAG, 'Create vault ', userDid, this.vault)
      return vault
    }
    catch (error) {
      Logger.error(TAG, 'Create vault error:', error);
      this.events.publish(FeedsEvent.PublishType.authEssentialFail, { type: 1 });
      throw error
    }
  }

  parseUserDIDDocument(userDid: string, userDIDDocument: DIDDocument) {
    const avatarDid = userDid + "#avatar"
    const avatarVC = userDIDDocument.getCredential(avatarDid)
    if (avatarVC != null) { // 有头像
      const sub = avatarVC.getSubject()
      const pro = sub.getProperty("avatar")
      const data: string = pro["data"]
      const type = pro["type"]
      const prefix = "hive://"
      const avatarParam = data.substr(prefix.length)
      this.avatarParam = avatarParam
      const parts = avatarParam.split("/")
      if (parts.length < 2) // TODO 验证parts是否大于2个 ，否则 抛出异常
        throw "userDIDDocument 中缺少参数"

      const dids = parts[0].split("@")
      if (dids.length != 2) // TODO 验证dids是否等于2个 ，否则 抛出异常
        throw "userDIDDocument 中缺少参数"

      const star = data.length - (prefix.length + parts[0].length + 1)
      const values = parts[1].split("?")
      if (values.length != 2) // TODO 验证values是否等于2个 ，否则 抛出异常
        throw "userDIDDocument 中缺少参数"

      const avatarScriptName = values[0]
      this.avatarScriptName = avatarScriptName
      const paramStr = values[1]
      const scriptParam = JSON.parse(paramStr.substr(7))
      const tarDID = dids[0]
      const tarAppDID = dids[1]
      this.tarDID = tarDID
      this.tarAppDID = tarAppDID
    }
    const serviceDid = userDid + "#hivevault"
    const service = userDIDDocument.getService(serviceDid)
    const provider = service.getServiceEndpoint() + ":443"
    return provider
  }

  async getScriptRunner(userDid: string): Promise<ScriptRunner> {
    this.scriptRunner = this.scriptRunners[userDid]

    if (this.scriptRunner === undefined || this.scriptRunner === null) {
      this.scriptRunner = await this.creatScriptRunner(userDid)
     }
    return this.scriptRunner
  }

  async getVault(): Promise<Vault> {
    if (this.vault === undefined || this.vault === null) {
      this.vault = await this.creatVault()
    }
    Logger.log(TAG, 'Get vault from', 'vault is', this.vault)
    return this.vault
  }

  async getDatabaseService() {
    return (await this.getVault()).getDatabaseService()
  }

  async getFilesService() {
    return (await this.getVault()).getFilesService()
  }

  async getScriptingService() {
    return (await this.getVault()).getScriptingService()
  }

  async createCollection(channelName: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const databaseService = await this.getDatabaseService()
        const result = await databaseService.createCollection(channelName);
        resolve(result)
      } catch (error) {
        Logger.error(TAG, 'createCollection error', error);
        reject(error);
      }
    })
  }

  async deleteCollection(collectionName: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const databaseService = await this.getDatabaseService()
        const result = await databaseService.deleteCollection(collectionName);
        resolve(result)
      } catch (error) {
        Logger.error(TAG, 'delete collection error', error);
        reject(error);
      }
    })
  }

  registerScript(scriptName: string, executable: Executable, condition?: Condition, allowAnonymousUser?: boolean, allowAnonymousApp?: boolean): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        let scriptingService = await this.getScriptingService()
        await scriptingService.registerScript(scriptName, executable,
          condition, allowAnonymousUser, allowAnonymousApp)
        resolve()
      } catch (error) {
        Logger.error(TAG, 'register error:', error)
        this.events.publish(FeedsEvent.PublishType.authEssentialFail, { type: 0 })
        reject(error)
      }
    })
  }

  async callScript(scriptName: string, document: any, targetDid: string, appid: string): Promise<any> {
    let scriptRunner = await this.getScriptRunner(targetDid)
    let result = await scriptRunner.callScript<any>(scriptName, document, targetDid, appid)
    return result
  }

  async getMyChannelList(userDid: string) {
    this.dataHelper.getMyChannelListWithHive(userDid)
  }

  async uploadScriting(transactionId: string, data: string) {
    let userDid = (await this.dataHelper.getSigninData()).did
    const scriptRunner = await this.getScriptRunner(userDid)
    return scriptRunner.uploadFile(transactionId, data)
  }

  async downloadEssAvatarTransactionId() {
    try {
      const avatarParam = this.avatarParam
      if (avatarParam === null || avatarParam === undefined) {
        return
      }
      let userDid = (await this.dataHelper.getSigninData()).did
      const scriptRunner = await this.getScriptRunner(userDid)
      const avatarScriptName = this.avatarScriptName
      const tarDID = this.tarDID
      const tarAppDID = this.tarAppDID
      return await scriptRunner.callScript(avatarScriptName, avatarParam, tarDID, tarAppDID)
    } catch (error) {
      Logger.error(TAG, "Download Ess Avatar transactionId error: ", error)
      reject(error)
    }
  }

  async downloadScripting(targetDid: string, transaction_id: string) {
    try {
      const scriptRunner = await this.getScriptRunner(targetDid)
      return await scriptRunner.downloadFile(transaction_id)
    } catch (error) {
      console.log("scriptingService.downloadFile error: ==== ", error)
      throw error
    }
  }

  async downloadFile(remotePath: string) {
    const fileService = await this.getFilesService()
    return await fileService.download(remotePath)
  }

  async getUploadDataFromScript(targetDid: string, transactionId: string, img: any) {
    try {
      const scriptRunner = await this.getScriptRunner(targetDid)
      return scriptRunner.uploadFile(transactionId, img)
    }
    catch (error) {
      Logger.error(TAG, "getUploadDataFromScript error: ", error);
      throw error
    }
  }

  async uploadDataFromScript(targetDid: string, transactionId: string, img: any) {
    try {
      const scriptRunner = await this.getScriptRunner(targetDid)
      return scriptRunner.uploadFile(transactionId, img)
    }
    catch (error) {
      Logger.error(TAG, "uploadDataFromScript error: ", error);
      throw error
    }
  }

  async uploadScriptWithBuffer(remotePath: string, img: Buffer) {
    try {
      const fileService = await this.getFilesService()
      return await fileService.upload(remotePath, img)
    }
    catch (error) {
      Logger.error(TAG, "Upload script blob error: ", error);
      throw error
    }
  }

  async uploadScriptWithString(remotePath: string, img: any) {
    try {
      const fileService = await this.getFilesService()
      return await fileService.upload(remotePath, Buffer.from(img, 'utf8'))
    }
    catch (error) {
      Logger.error(TAG, "uploadScriptWithString error: ", error);
      throw error
    }
  }

  insertDBData(collectName: string, doc: any,): Promise<InsertResult> {
    return new Promise(async (resolve, reject) => {
      try {
        const dbService = await this.getDatabaseService()
        const insertResult = await dbService.insertOne(collectName, doc, new InsertOptions(false, true));
        resolve(insertResult)
      } catch (error) {
        Logger.error(TAG, 'Insert error:', error);
        reject(error)
      }
    })
  }

  updateOneDBData(collectName: string, filter: JSONObject, update: JSONObject, option: UpdateOptions): Promise<UpdateResult> {
    return new Promise(async (resolve, reject) => {
      try {
        const dbService = await this.getDatabaseService()
        const result = await dbService.updateOne(collectName, filter, update, option)
        resolve(result)
      } catch (error) {
        Logger.error(TAG, 'update one error:', error)
        reject(error)
      }
    })
  }

  deleateOneDBData(collectName: string, fillter: JSONObject): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const dbService = await this.getDatabaseService()
        await dbService.deleteOne(collectName, fillter)
        resolve()
      } catch (error) {
        Logger.error(TAG, 'delete one error:', error)
        reject(error)
      }
    })
  }

  queryDBData(collectionName: string, filter: any): Promise<JSONObject[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const dbService = await this.getDatabaseService()
        const result = dbService.findMany(collectionName, filter)
        resolve(result)
      } catch (error) {
        Logger.error(TAG, 'listPostDB error:', error)
        reject(error)
      }
    })
  }

  newInsertOptions() {
    return new InsertOptions(false, true);
  }
}