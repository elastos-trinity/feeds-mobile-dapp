import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Platform } from '@ionic/angular';
import { ThemeService } from '../../services/theme.service';
import { FeedService } from '../../services/FeedService';
import { NativeService } from '../../services/NativeService';
import { MenuService } from '../../services/MenuService';
import { PopoverController } from '@ionic/angular';
import { PaypromptComponent } from '../../components/payprompt/payprompt.component';
import { AppService } from '../../services/AppService';
import { UtilService } from '../../services/utilService';
import { ViewHelper } from 'src/app/services/viewhelper.service';
import { Events } from 'src/app/services/events.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { IntentService } from 'src/app/services/IntentService';
import { FeedsServiceApi } from 'src/app/services/api_feedsservice.service';
import { HiveVaultController } from 'src/app/services/hivevault_controller.service';

import _ from 'lodash';
import { DataHelper } from 'src/app/services/DataHelper';
import { PopupProvider } from 'src/app/services/popup';

@Component({
  selector: 'app-feedinfo',
  templateUrl: './feedinfo.page.html',
  styleUrls: ['./feedinfo.page.scss'],
})

export class FeedinfoPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public destDid: string = '';
  private ownerDid: string = '';
  public channelId: string = '';
  public name: string = '';
  public des: string = '';
  public channelAvatar = '';
  public oldChannelInfo: any = {};
  public oldChannelAvatar: string = '';
  public serverInfo: any = {};
  public feedsUrl: string = null;
  public qrcodeString: string = null;
  public severVersion: string = '';
  public tippingAddress: string = '';
  public developerMode: boolean = false;
  public channelSubscribes: number = 0;
  public followStatus: boolean = false;
  public isShowPrompt: boolean = false;
  public popover: any;
  public isPress: boolean = false;
  public updatedTime: number = 0;
  public isMine: boolean = null;
  public channelOwner: string = '';
  public type: string = '';
  public serverDid: string = '';
  private confirmdialog: any = null;
  public lightThemeType: number = 3;
  public clickButton: boolean = false;
  constructor(
    private popoverController: PopoverController,
    private feedService: FeedService,
    public theme: ThemeService,
    private translate: TranslateService,
    private events: Events,
    private native: NativeService,
    private zone: NgZone,
    private menuService: MenuService,
    private appService: AppService,
    private platform: Platform,
    private titleBarService: TitleBarService,
    private viewHelper: ViewHelper,
    private intentService: IntentService,
    private popupProvider: PopupProvider,
    private hiveVaultController: HiveVaultController,
    private dataHelper: DataHelper
  ) { }

  ngOnInit() {

  }

  initChannelInfo() {
    let item = this.dataHelper.getChannelInfo();
    this.oldChannelInfo = item;
    let channelInfo = _.cloneDeep(item);
    this.type = channelInfo['type'] || "";
    this.updatedTime = channelInfo['updatedTime'] || 0;
    this.destDid = channelInfo['destDid'] || '';
    this.channelId = channelInfo['channelId'] || '';
    this.tippingAddress = channelInfo['tippingAddress'] || '';
    this.name = channelInfo['name'] || '';
    this.des = channelInfo['des'] || '';
    this.ownerDid = channelInfo["ownerDid"] || "";
    this.qrcodeString = UtilService.generateFeedsQrCodeString(this.destDid, this.channelId);
    this.oldChannelAvatar = this.dataHelper.getProfileIamge();
    this.followStatus = channelInfo['followStatus'] || null;
    if (this.followStatus == null) this.followStatus = false;

    this.channelSubscribes = channelInfo['channelSubscribes'] || 0;
    //this.channelOwner = channelInfo.channelOwner || "";

    let text = this.destDid.replace('did:elastos:', '');
    this.channelOwner = UtilService.resolveAddress(text);
    try {
      this.hiveVaultController.getDisplayName(this.destDid, this.channelId, this.destDid).
        then((result: string) => {
          let name = result || "";
          if (name != "") {
            this.channelOwner = name;
          }
        }).catch(() => {
        });
    } catch (error) {

    }
  }

  ionViewWillEnter() {
    document.body.addEventListener('touchmove', this.preventDefault, { passive: false });
    this.theme.setTheme1();
    this.developerMode = this.feedService.getDeveloperMode();
    this.initChannelInfo();
    this.initTitle();

    let avatar = this.dataHelper.getProfileIamge();
    this.channelAvatar = this.feedService.parseChannelAvatar(avatar);
    this.addEvents();
  }

  addEvents() {

    this.events.subscribe(FeedsEvent.PublishType.channelInfoRightMenu, () => {
      this.clickEdit();
    });

    this.events.subscribe(
      FeedsEvent.PublishType.unsubscribeFinish,
      () => {
        this.zone.run(() => {
          this.native.setRootRouter(['/tabs/home']);
        });
      },
    );
  }

  removeEvents() {
    this.events.unsubscribe(FeedsEvent.PublishType.channelInfoRightMenu);
    this.events.unsubscribe(FeedsEvent.PublishType.unsubscribeFinish);
    this.native.handleTabsEvents();
  }

  async checkFollowStatus(destDid: string, channelId: string) {

    let subscribedChannel: FeedsData.SubscribedChannelV3[] = await this.dataHelper.getSubscribedChannelV3List(FeedsData.SubscribedChannelType.ALL_CHANNEL);
    if (subscribedChannel.length === 0) {
      this.followStatus = false;
      return;
    }

    let channelIndex = _.find(subscribedChannel, (item: FeedsData.SubscribedChannelV3) => {
      return item.destDid === destDid && item.channelId === channelId;
    }) || '';
    if (channelIndex === '') {
      this.followStatus = false;
      return;
    }
    this.followStatus = true;
  }

  initTitle() {
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
    //this.titleBarService.setTitleBarMoreMemu(this.titleBar);
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('FeedinfoPage.title'),
    );

    if (this.destDid === this.ownerDid) {
      this.isMine = true;
    } else {
      this.isMine = false;
    }

    if (this.isMine && this.type === "") {
      if (!this.theme.darkMode) {
        this.titleBarService.setTitleBarMoreMemu(this.titleBar, "channelInfoRightMenu", "assets/icon/edit.ico");
      } else {
        this.titleBarService.setTitleBarMoreMemu(this.titleBar, "channelInfoRightMenu", "assets/icon/dark/edit.ico");
      }
    }

  }

  ionViewWillLeave() {
    this.clickButton = false;
    document.body.removeEventListener("touchmove", this.preventDefault, false);
    this.theme.restTheme();
    this.removeEvents();
  }

  clickEdit() {

    if (!this.isMine) {
      return;
    }

    let connect = this.dataHelper.getNetworkStatus();
    if (connect === FeedsData.ConnState.disconnected) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    this.native.navigateForward(['/eidtchannel'], {});
  }

  async subscribe() {

    if (this.clickButton) {
      return;
    }

    let connect = this.dataHelper.getNetworkStatus();
    if (connect === FeedsData.ConnState.disconnected) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    // const signinData = await this.dataHelper.getSigninData();
    // let userDid = signinData.did
    this.clickButton = true;
    await this.native.showLoading('common.waitMoment');
    try {
      await this.hiveVaultController.subscribeChannel(this.destDid, this.channelId);
      await this.hiveVaultController.syncPostFromChannel(this.destDid, this.channelId);
      await this.hiveVaultController.syncCommentFromChannel(this.destDid, this.channelId);
      await this.hiveVaultController.syncLikeDataFromChannel(this.destDid, this.channelId);
      this.followStatus = true;
      this.clickButton = false;
      this.native.hideLoading();
    } catch (error) {
      this.followStatus = false;
      this.clickButton = false;
      this.native.hideLoading();
    }
  }

  async unsubscribe() {
    try {
      this.menuService.showUnsubscribeMenuWithoutName(this.destDid, this.channelId,);
      this.followStatus = true;
    } catch (error) {
      //TODO show unsubscribe error ui
    }
  }

  showPreviewQrcode(feedsUrl: string) {

    if (this.isPress) {
      this.isPress = false;
      return;
    }

    let isOwner = false;
    if (this.destDid === this.ownerDid) {
      isOwner = true;
    }

    if (isOwner) {
      this.titleBarService.setIcon(
        this.titleBar,
        FeedsData.TitleBarIconSlot.INNER_RIGHT,
        null,
        null,
      );
    }
    this.viewHelper.showPreviewQrcode(
      this.titleBar,
      feedsUrl,
      'common.qRcodePreview',
      'FeedinfoPage.title',
      'feedinfo',
      this.appService,
      isOwner,
    );
  }

  menuMore(feedsUrl: string) {
    if (this.platform.is('ios')) {
      this.isPress = true;
    }
    //@Deprecated
    this.intentService.share('', feedsUrl);
  }

  handleTime(updatedTime: number) {
    let updateDate = new Date(updatedTime);
    return UtilService.dateFormat(updateDate, 'yyyy-MM-dd HH:mm:ss');
  }

  copyText(text: any) {
    this.native
      .copyClipboard(text)
      .then(() => {
        this.native.toast_trans('common.textcopied');
      })
      .catch(() => { });
  }

  preventDefault(e: any) { e.preventDefault(); };

}
