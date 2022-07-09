import { Injectable } from '@angular/core';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { ModalController } from '@ionic/angular';
import { HTTP } from '@awesome-cordova-plugins/http/ngx';
import { TwitterApi } from './TwitterApi';
import { Logger } from 'src/app/services/logger';
import { DataHelper } from 'src/app/services/DataHelper';
import { Events } from './events.service';

const TAG: string = 'TwitterService';

@Injectable()
export class TwitterService {
  public loading: any = null;
  constructor(
    public modalController: ModalController,
    private inappBrowser: InAppBrowser,
    private http: HTTP,
    private dataHelper: DataHelper,
    private events: Events,

  ) { }

  public getJsonFromUrl(url) {
    if (!url) url = location.search
    var query = url.substr(1)
    var result = {}
    query.split("&").forEach(function (part) {
      var item = part.split("=")
      result[item[0]] = decodeURIComponent(item[1])
    })
    return result
  }

  public getTokenFromCode(code: string) {
    return this.fetchTokenFromTwitter(code, TwitterApi.GRANT_TYPE)
  }

  public async fetchToken(userDid: string) {
    const token = this.dataHelper.getTwitterRefreshToken(userDid)

    return this.fetchTokenFromTwitter(token, TwitterApi.GRANT_TYPE_REFRESH)
  }

  public async fetchTokenFromRefreshToken(refreshToken: string) {
    return this.fetchTokenFromTwitter(refreshToken, TwitterApi.GRANT_TYPE_REFRESH)
  }

  private async fetchTokenFromTwitter(code: string, type: string) {
    let params = {
      code: code,
      grant_type: type,
      client_id: TwitterApi.CLIENT_ID,
      redirect_uri: TwitterApi.REDIRECT_URI,
      code_verifier: TwitterApi.CODE_VERIFIER
    }
    const userDid = (await this.dataHelper.getSigninData()).did
    let header = {} 
    this.http.post(TwitterApi.TOKEN, params, header)
      .then(data => {

        this.events.publish(FeedsEvent.PublishType.twitterLoginSuccess);
        const ddata = JSON.parse(data.data)
        this.dataHelper.UpdateTwitterToken(userDid, ddata)
        const accessToken = ddata.access_token
        return accessToken
      })
      .catch(error => {

        this.events.publish(FeedsEvent.PublishType.twitterLoginFailed);

        console.error(TAG, "auth twitter Error: ", error)
        return error
      })
  }

  public async openTwitterLoginPage() {
    const target = '_system'
    const options = 'location=no'
    Logger.log(TAG, 'inappBrowser star >>>>>>>>>>>>>>>>>>>>>>>>>>>> ')
    this.inappBrowser.create(TwitterApi.AUTH, target, options)
  }

  public async postMedia(base64Encoded: string) {
    Logger.log(TAG, 'post media star >>>>>>>>>>>>>>>>>>>>>>>>>>>> ')
    let params = {
      "text": base64Encoded
    }
    const token = await this.checkIsExpired()
    Logger.log(TAG, 'post media token >>>>>>>>>>>>>>>>>>>>>>>>>>>> ', token)
    let header = {
      "Content-Type": "multipart/form-data",
      "Authorization": "bearer " + token
    }
    this.http.setDataSerializer('multipart')
    // this.http.sendRequest(TwitterApi.MEDIA, {
    //   method: "post",
    //   data: base64Encoded,
    //   headers: header
    // })
    //   .then(data => {
    //     Logger.log(TAG, 'post tweet success >>>>>>>>>>>>>>>>>>>>>>>>>>>> ', data)
    //     return data
    //   })
    //   .catch(error => {
    //     Logger.log(TAG, 'post tweet error >>>>>>>>>>>>>>>>>>>>>>>>>>>> ', error)
    //     return error
    //   })
  }
  public async postTweet(text: string) {
    Logger.log(TAG, 'post tweet star >>>>>>>>>>>>>>>>>>>>>>>>>>>> ')
    let params = {
      "text": text
    }
    const token = await this.checkIsExpired()
    Logger.log(TAG, 'post tweet token >>>>>>>>>>>>>>>>>>>>>>>>>>>> ', token)
    let header = {
      "Content-Type": "application/json",
      "Authorization": "bearer " + token 
    }
    this.http.setDataSerializer('json')
    this.http.post(TwitterApi.TEWWTS, params, header)
      .then(data => {
        Logger.log(TAG, 'post tweet success >>>>>>>>>>>>>>>>>>>>>>>>>>>> ', data)
        return data
      })
      .catch(error => {
        Logger.log(TAG, 'post tweet error >>>>>>>>>>>>>>>>>>>>>>>>>>>> ', error)
        return error
      })
  }

  public async checkIsExpired() {
    try {
    const userDid = (await this.dataHelper.getSigninData()).did
    let token = this.dataHelper.getTwitterAccessToken(userDid)
    if (token === false) {
      // TODO: refreshTOken 同样过期，需要调起重新授权界面
      token = await this.fetchToken(userDid)
      }
      return token
    }
    catch {
      // TODO: 处理refresh token 过期
    }
  }
}
