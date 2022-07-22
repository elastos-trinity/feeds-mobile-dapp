import { Injectable } from '@angular/core';
import { ActionSheetController, ActionSheetButton, ActionSheetOptions } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { NativeService } from './NativeService';
import { PopupProvider } from 'src/app/services/popup';
import { IntentService } from 'src/app/services/IntentService';
import { ViewHelper } from 'src/app/services/viewhelper.service';
import { NFTContractControllerService } from 'src/app/services/nftcontract_controller.service';
import { Events } from 'src/app/services/events.service';
import { Config } from './config';
import { Logger } from './logger';
import { DataHelper } from 'src/app/services/DataHelper';
import { HiveVaultController } from './hivevault_controller.service';

@Injectable()
export class MenuService {
  private actionSheetMenu: HTMLIonActionSheetElement = null;
  private popover: HTMLIonPopoverElement = null;
  constructor(
    private actionSheetController: ActionSheetController,
    private translate: TranslateService,
    private native: NativeService,
    public popupProvider: PopupProvider,
    private intentService: IntentService,
    private viewHelper: ViewHelper,
    private nftContractControllerService: NFTContractControllerService,
    private events: Events,
    private dataHelper: DataHelper,
    private hiveVaultController: HiveVaultController
  ) { }

  async showChannelItemMenu(destDid: string, channelId: string, channelName: string, postId: string, isMineAndCanEdit: boolean) {
    if (this.actionSheetMenu != null) {
      return;
    }

    const sharePostButton = this.createSharePostButton(destDid, postId);
    const cancelButton = this.createCancelButton();
    let buttons: ActionSheetButton[] = [sharePostButton, cancelButton];
    if (isMineAndCanEdit) {
      const editPostButton = this.createEditPostButton(destDid, channelId, channelName, postId);
      const removePostButton = this.createRemovePostButton(destDid, channelId, channelName, postId);
      buttons = [sharePostButton, editPostButton, removePostButton, cancelButton];
    }

    await this.createActionSheetMenu({
      cssClass: 'editPost',
      buttons: buttons
    })
  }

  async showChannelMenu(destDid: string, channelId: string) {
    if (this.actionSheetMenu != null) {
      return;
    }

    const unsubscribeButton = this.createUnsubscribeButton(destDid, channelId, null);
    const cancelButton = this.createCancelButton();

    await this.createActionSheetMenu({
      cssClass: 'editPost',
      buttons: [unsubscribeButton, cancelButton],
    });
  }

  async showOtherChannelMenu(destDid: string, channelId: string, channelName: string, postId: string) {
    if (this.actionSheetMenu != null) {
      return;
    }

    const sharePostButton: ActionSheetButton = this.createSharePostButton(destDid, postId);
    const unsubscribeButton: ActionSheetButton = this.createUnsubscribeButton(destDid, channelId);
    const cancelButton = this.createCancelButton();

    await this.createActionSheetMenu({
      cssClass: 'editPost',
      buttons: [sharePostButton, unsubscribeButton, cancelButton],
    });
  }

  async showShareMenu(destDid?: string, channelId?: string, channelName?: string, postId?: string) {
    if (this.actionSheetMenu != null) {
      return;
    }

    const sharePostButton = this.createSharePostButton(destDid, postId);
    const cancelButton = this.createCancelButton();

    await this.createActionSheetMenu({
      cssClass: 'editPost',
      buttons: [sharePostButton, cancelButton]
    });
  }

  async showQRShareMenu(title: string, qrCodeString: string) {
    if (this.actionSheetMenu != null) {
      return;
    }

    const cancelButton = this.createCancelButton();

    await this.createActionSheetMenu({
      cssClass: 'editPost',
      buttons: [cancelButton],
    });
  }

  async showUnsubscribeMenu(destDid: string, channelId: string, channelName: string) {
    if (this.actionSheetMenu != null) {
      return;
    }

    const cancelButton = this.createCancelButton();
    const unsubscribeButton = this.createUnsubscribeButton(destDid, channelId, channelName);

    await this.createActionSheetMenu({
      cssClass: 'editPost',
      buttons: [unsubscribeButton, cancelButton],
    });
  }

  async showUnsubscribeMenuWithoutName(destDid: string, channelId: string): Promise<string> {
    if (this.actionSheetMenu != null) {
      return;
    }

    const unsubscribeButton = this.createUnsubscribeButton(destDid, channelId, null);
    const cancelButton = this.createCancelButton();

    await this.createActionSheetMenu({
      cssClass: 'editPost',
      buttons: [unsubscribeButton, cancelButton],
    });
  }

  async showPostDetailMenu(destDid: string, channelId: string, channelName: string, postId: string) {
    if (this.actionSheetMenu != null) {
      return;
    }

    const sharePostButton = this.createSharePostButton(destDid, postId);
    const editPostButton = this.createEditPostButton(destDid, channelId, channelName, postId);
    const removePostButton = this.createRemovePostButton(destDid, channelId, channelName, postId);
    const cancelButton = this.createCancelButton();

    await this.createActionSheetMenu({
      cssClass: 'editPost',
      buttons: [sharePostButton, editPostButton, removePostButton, cancelButton]
    })
  }

  async showHomeMenu(destDid: string, channelId: string, channelName: string, postId: string) {
    if (this.actionSheetMenu != null) {
      return;
    }

    const sharePostButton = this.createSharePostButton(destDid, postId);
    const editPostButton = this.createEditPostButton(destDid, channelId, channelName, postId);
    const removePostButton = this.createRemovePostButton(destDid, channelId, channelName, postId);
    const unsubscribeButton = this.createUnsubscribeButton(destDid, channelId, null);
    const cancenButton = this.createCancelButton();

    await this.createActionSheetMenu({
      cssClass: 'editPost',
      buttons: [sharePostButton, editPostButton, removePostButton, unsubscribeButton, cancenButton],
    })
  }

  async showPictureMenu(that: any, openCamera: any, openGallery: any, openNft: any) {
    if (this.actionSheetMenu != null) {
      return;
    }

    const takePictureButton = this.createTakePictureButton(that, openCamera);
    const photoGalleryButton = this.createPhotoGalleryButton(that, openGallery);
    const openNFTButton = this.createOpenNFTButton(that, openNft);
    const cancelButton = this.createCancelButton();

    await this.createActionSheetMenu({
      cssClass: 'editPost',
      buttons: [takePictureButton, photoGalleryButton, cancelButton]
    });
  }

  async showCommentDetailMenu(comment: FeedsData.CommentV3) {
    if (this.actionSheetMenu != null) {
      return;
    }

    const editCommentButton = this.createEditCommentButton(comment.destDid, comment.channelId, comment.postId, comment.refcommentId, comment.commentId, comment.content);
    const removeCommentButton = this.createRemoveCommentButton();
    const cancelButton = this.createCancelButton();

    await this.createActionSheetMenu({
      cssClass: 'editPost',
      buttons: [editCommentButton, removeCommentButton, cancelButton]
    });
  }

  async showReplyDetailMenu(reply: FeedsData.CommentV3) {
    if (this.actionSheetMenu != null) {
      return;
    }

    const editReplyButton = this.createEditReplyButton(reply.destDid, reply.channelId, reply.postId, reply.refcommentId, reply.commentId, reply.content);
    const removeReplyButton = this.createRemoveReplyButton();
    const cancelButton = this.createCancelButton();

    await this.createActionSheetMenu({
      cssClass: 'editPost',
      buttons: [editReplyButton, removeReplyButton, cancelButton]
    });
  }

  async showOnSaleMenu(assItem: any) {
    if (this.actionSheetMenu != null) {
      return;
    }

    const changePriceButton = this.createNFTChangePriceButton(assItem);
    const cancelOrderButton = this.createNFTCancelOrderButton();
    const assetDetailsButton = this.createAssetDetailsButton(assItem);
    const cancelButton = this.createCancelButton();

    await this.createActionSheetMenu({
      cssClass: 'editPost',
      buttons: [changePriceButton, cancelOrderButton, assetDetailsButton, cancelButton]
    });
  }

  async showChannelCollectionsMenu(channelItem: FeedsData.ChannelCollections) {
    if (this.actionSheetMenu != null) {
      return;
    }

    const openCollectionButton = this.createOpenCollectionButton(channelItem);
    const burnNFTButton = this.createBurnNFTButton(channelItem);
    const cancelButton = this.createCancelButton();

    await this.createActionSheetMenu({
      cssClass: 'editPost',
      buttons: [openCollectionButton, burnNFTButton, cancelButton]
    });
  }

  async showChannelCollectionsPublishedMenu(channelItem: FeedsData.ChannelCollections) {
    if (this.actionSheetMenu != null) {
      return;
    }

    const cancelPublicCollectionsButton = this.createCancelPublicCollectionsButton();
    const cancelButton = this.createCancelButton();

    await this.createActionSheetMenu({
      cssClass: 'editPost',
      buttons: [cancelPublicCollectionsButton, cancelButton]
    });
  }

  async showCreatedMenu(assItem: any) {
    if (this.actionSheetMenu != null) {
      return;
    }

    const onSaleButton = this.createOnSaleButton(assItem);
    const transCollectibleButton = this.createTransCollectibleButton(assItem);
    const assetDetailsButton = this.createAssetDetailsButton(assItem);
    const burnNFTButton = this.createBurnNFTButton(assItem);
    const cancelButton = this.createCancelButton();

    await this.createActionSheetMenu({
      cssClass: 'editPost',
      buttons: [onSaleButton, transCollectibleButton, assetDetailsButton, burnNFTButton, cancelButton]
    })
  }

  async showShareOnSaleMenu(assItem: any) {
    if (this.actionSheetMenu != null) {
      return;
    }

    const collectionDetailsButton = this.createCollectionDetailsButton(assItem);
    const cancelButton = this.createCancelButton();

    await this.createActionSheetMenu({
      cssClass: 'editPost',
      buttons: [collectionDetailsButton, cancelButton]
    });
  }

  async hideActionSheet() {
    if (this.actionSheetMenu != null) {
      await this.actionSheetMenu.dismiss();
    }
  }

  ////
  private async createActionSheetMenu(opts?: ActionSheetOptions) {
    this.actionSheetMenu = await this.actionSheetController.create(opts);

    this.actionSheetMenu.onWillDismiss().then(() => {
      if (this.actionSheetMenu != null) {
        this.actionSheetMenu = null;
      }
    });
    await this.actionSheetMenu.present();
  }

  private createSharePostButton(destDid: string, postId: string): ActionSheetButton {
    return {
      text: this.translate.instant('common.share'),
      icon: 'ios-share1',
      handler: async () => {
        let post: FeedsData.PostV3 = await this.dataHelper.getPostV3ById(destDid, postId) || null;
        await this.native.showLoading("common.generateSharingLink");
        try {
          const sharedLink = await this.intentService.createPostShareLink(post);
          this.intentService.share(this.intentService.createSharePostTitle(post), sharedLink);
        } catch (error) {
        }
        this.native.hideLoading();
      },
    };
  }

  private createUnsubscribeButton(destDid: string, channelId: string, channelName: string = null): ActionSheetButton {
    let unsubscribeText = this.translate.instant('common.unsubscribe')
    if (channelName) unsubscribeText = this.translate.instant('common.unsubscribe') + ' @' + channelName;

    return {
      text: unsubscribeText,
      role: 'destructive',
      icon: 'ios-unsubscribe',
      handler: async () => {
        let connect = this.dataHelper.getNetworkStatus();
        if (connect === FeedsData.ConnState.disconnected) {
          this.native.toastWarn('common.connectionError');
          return;
        }

        await this.native.showLoading("common.waitMoment");
        try {
          this.hiveVaultController.unSubscribeChannel(
            destDid, channelId
          ).then(async (result) => {
            let channel: FeedsData.SubscribedChannelV3 = {
              destDid: destDid,
              channelId: channelId
            };
            //await this.hiveVaultController.removePostListByChannel(destDid, channelId);
            this.events.publish(FeedsEvent.PublishType.unfollowFeedsFinish, channel);
            this.events.publish(FeedsEvent.PublishType.unsubscribeFinish, channel);
            this.native.hideLoading();
          }).catch(() => {
            this.native.hideLoading();
          });
        } catch (error) {
          this.native.hideLoading();
        }
      },
    };
  }


  private createCancelButton(): ActionSheetButton {
    return {
      text: this.translate.instant('common.cancel'),
      icon: 'ios-cancel',
      handler: () => {
        if (this.actionSheetMenu != null) {
          this.actionSheetMenu.dismiss();
        }
      },
    }
  }

  private createEditPostButton(destDid: string, channelId: string, channelName: string, postId: string): ActionSheetButton {
    return {
      text: this.translate.instant('common.editpost'),
      icon: 'ios-edit1',
      handler: () => {
        this.handlePostDetailMenu(destDid, channelId, channelName, postId, 'editPost');
      },
    };
  }

  private createRemovePostButton(destDid: string, channelId: string, channelName: string, postId: string): ActionSheetButton {
    return {
      text: this.translate.instant('common.removepost'),
      role: 'destructive',
      icon: 'ios-delete',
      handler: () => {
        this.handlePostDetailMenu(destDid, channelId, channelName, postId, 'removePost');
      },
    }
  }

  private createCollectionDetailsButton(assItem: any): ActionSheetButton {
    return {
      text: this.translate.instant('CollectionsPage.details'),
      icon: 'information-circle',
      handler: () => {
        assItem['showType'] = 'buy';
        this.native.navigateForward(['bid'], {
          queryParams: assItem,
        });
      },
    };
  }

  private createAssetDetailsButton(assItem: any): ActionSheetButton {
    return {
      text: this.translate.instant('CollectionsPage.details'),
      icon: 'information-circle',
      handler: () => {
        this.dataHelper.setAssetPageAssetItem(assItem);
        this.native.navigateForward(['assetdetails'], {});
      },
    };
  }

  private createTakePictureButton(that: any, openCamera: any): ActionSheetButton {
    return {
      text: this.translate.instant('common.takePicture'),
      icon: 'ios-take-photo',
      handler: () => {
        openCamera(that);
      },
    }
  }

  private createPhotoGalleryButton(that: any, openCamera: any): ActionSheetButton {
    return {
      text: this.translate.instant('common.takePicture'),
      icon: 'ios-take-photo',
      handler: () => {
        openCamera(that);
      },
    }
  }

  private createOpenNFTButton(that: any, openNft: any): ActionSheetButton {
    return {
      text: this.translate.instant('common.collectibles'),
      icon: 'ios-nft',
      handler: () => {
        let accountAddress =
          this.nftContractControllerService.getAccountAddress() || '';
        if (accountAddress === '') {
          this.native.toastWarn('common.connectWallet');
          return false;
        }
        openNft(that);
      }
    }
  }

  private createEditCommentButton(destDid: string, channelId: string, postId: string, refcommentId: string, commentId: string, content: string) {
    return {
      text: this.translate.instant('common.editcomment'),
      icon: 'ios-edit1',
      handler: () => {
        this.native.go('editcomment', {
          destDid: destDid,
          channelId: channelId,
          postId: postId,
          refcommentId: refcommentId,
          commentId: commentId,
          content: content,
          titleKey: 'common.editcomment',
        });
      }
    }
  }

  private createRemoveCommentButton(): ActionSheetButton {
    return {
      text: this.translate.instant('common.removecomment'),
      role: 'destructive',
      icon: 'ios-delete',
      handler: async () => {
        this.popover = await this.popupProvider.ionicConfirm(
          this,
          'common.deleteComment',
          'common.confirmdeletion1',
          this.cancelPopupOver,
          this.confirmRemoveComment,
          './assets/images/shanchu.svg',
        );
      }
    }
  }

  private createEditReplyButton(destDid: string, channelId: string, postId: string, refcommentId: string, commentId: string, content: string): ActionSheetButton {
    return {
      text: this.translate.instant('CommentlistPage.editreply'),
      icon: 'ios-edit1',
      handler: () => {
        this.native.go('editcomment', {
          destDid: destDid,
          channelId: channelId,
          postId: postId,
          refcommentId: refcommentId,
          commentId: commentId,
          content: content,
          titleKey: 'CommentlistPage.editreply',
        });
      }
    }
  }

  private createRemoveReplyButton(): ActionSheetButton {
    return {
      text: this.translate.instant('CommentlistPage.deletereply'),
      role: 'destructive',
      icon: 'ios-delete',
      handler: async () => {
        this.popover = await this.popupProvider.ionicConfirm(
          this,
          'common.deleteReply',
          'common.confirmdeletion2',
          this.cancelPopupOver,
          this.confirmRemoveComment,
          './assets/images/shanchu.svg',
        );
      }
    }
  }

  private createNFTChangePriceButton(assItem: any): ActionSheetButton {
    return {
      text: this.translate.instant('BidPage.changePrice'),
      icon: 'create',
      handler: () => {
        this.viewHelper.showNftPrompt(assItem, 'BidPage.changePrice', 'sale');
      }
    }
  }

  private createNFTCancelOrderButton(): ActionSheetButton {
    return {
      text: this.translate.instant('BidPage.cancelOrder'),
      role: 'destructive',
      icon: 'arrow-redo-circle',
      handler: async () => {
        this.popover = await this.popupProvider.ionicConfirm(
          this,
          'BidPage.cancelOrder',
          'BidPage.cancelOrder',
          this.cancelOnSaleMenu,
          this.confirmOnSaleMenu,
          './assets/images/shanchu.svg',
        );
      }
    };
  }

  private createOpenCollectionButton(channelItem: FeedsData.ChannelCollections): ActionSheetButton {
    return {
      text: this.translate.instant('ChannelcollectionsPage.openCollections'),
      icon: 'create',
      handler: () => {
        this.viewHelper.showNftPrompt(channelItem, 'ChannelcollectionsPage.openCollections', 'created');
      }
    };
  }

  private createBurnNFTButton(channelItem: FeedsData.ChannelCollections): ActionSheetButton {
    return {
      text: this.translate.instant('common.burnNFTs'),
      role: 'destructive',
      icon: 'ios-delete',
      handler: () => {
        this.viewHelper.showNftPrompt(channelItem, 'common.burnNFTs', 'burn');
      }
    }
  }

  private createCancelPublicCollectionsButton(): ActionSheetButton {
    return {
      text: this.translate.instant('ChannelcollectionsPage.cancelPublicCollections'),
      role: 'destructive',
      icon: 'arrow-redo-circle',
      handler: async () => {
        this.popover = await this.popupProvider.ionicConfirm(
          this,
          'ChannelcollectionsPage.cancelPublicCollections',
          'ChannelcollectionsPage.cancelPublicCollections',
          this.cancelChannelCollectionMenu,
          this.confirmChannelCollectionMenu,
          './assets/images/shanchu.svg',
        );
      }
    }
  }

  private createOnSaleButton(assetItem: any): ActionSheetButton {
    return {
      text: this.translate.instant('CollectionsPage.onSale'),
      icon: 'create',
      handler: () => {
        this.viewHelper.showNftPrompt(assetItem, 'CollectionsPage.putOnSale', 'created');
      }
    }
  }

  private createTransCollectibleButton(assetItem: any): ActionSheetButton {
    return {
      text: this.translate.instant('common.transferCollectible'),
      icon: 'swap-horizontal',
      handler: () => {
        this.viewHelper.showTransferPrompt(assetItem, 'common.transferCollectible');
      }
    }
  }

  private async handlePostDetailMenu(destDid: string, channelId: string, channelName: string, postId: string, clickName: string) {
    switch (clickName) {
      case 'editPost':
        this.native.go('/editpost', {
          destDid: destDid,
          channelId: channelId,
          postId: postId,
          channelName: channelName,
        });
        break;
      case 'sharepost':
        let post: FeedsData.PostV3 = await this.dataHelper.getPostV3ById(destDid, postId) || null;
        //home share post
        await this.native.showLoading("common.generateSharingLink");
        try {
          const sharedLink = await this.intentService.createPostShareLink(post);
          this.intentService.share(this.intentService.createSharePostTitle(post), sharedLink);
        } catch (error) {
        }
        this.native.hideLoading();

        break;
      case 'removePost':
        this.popover = await this.popupProvider.ionicConfirm(
          this,
          'common.deletePost',
          'common.confirmdeletion',
          this.cancelPopupOver,
          this.confirmRemovePost,
          './assets/images/shanchu.svg',
        );
        break;
    }
  }

  private cancelPopupOver(that: any) {
    if (this.popover != null) {
      this.popover.dismiss();
    }
  }

  private confirmRemovePost(that: any) {
    this.cancelPopupOver(that);
    that.events.publish(FeedsEvent.PublishType.deletePostFinish, { 'destDid': that.destDid, 'channelId': that.channelId, 'postId': that.postId });
  }


  private confirmRemoveComment(that: any) {
    this.cancelPopupOver(that);
    that.events.publish(FeedsEvent.PublishType.deleteCommentFinish, that.comment);
  }

  private cancelOnSaleMenu() {
    if (this.popover != null) {
      this.popover.dismiss();
    }
  }

  private cancelChannelCollectionMenu() {
    if (this.popover != null) {
      this.popover.dismiss();
    }
  }

  private async confirmChannelCollectionMenu(that: any, assetItem: any) {
    if (this.popover != null) {
      this.popover.dismiss();
    }
    that.events.publish(FeedsEvent.PublishType.startLoading, { des: "common.cancelingOrderDesc", title: "common.waitMoment", curNum: "1", maxNum: "1", type: "changePrice" });
    let sId = setTimeout(() => {
      that.nftContractControllerService.getGalleria().cancelRemovePanelProcess();
      this.events.publish(FeedsEvent.PublishType.endLoading);
      clearTimeout(sId);
      that.popupProvider.showSelfCheckDialog('common.cancelOrderTimeoutDesc');
    }, Config.WAIT_TIME_CANCEL_ORDER)

    that.doCancelChannelOrder(that, assetItem)
      .then(() => {
        that.nftContractControllerService.getGalleria().cancelRemovePanelProcess();;
        that.events.publish(FeedsEvent.PublishType.endLoading);
        clearTimeout(sId);
        that.native.toast_trans('common.cancelSuccessfully');
      })
      .catch(() => {
        // cancel order error
        that.events.publish(FeedsEvent.PublishType.endLoading);
        clearTimeout(sId);
        that.native.toast_trans('common.cancellationFailed');
        that.nftContractControllerService.getPasar().cancelCancelOrderProcess();
      });
  }

  private async confirmOnSaleMenu(that: any, assetItem: any) {
    if (this.popover != null) {
      this.popover.dismiss();
    }
    that.events.publish(FeedsEvent.PublishType.startLoading, { des: "common.cancelingOrderDesc", title: "common.waitMoment", curNum: "1", maxNum: "1", type: "changePrice" });
    let sId = setTimeout(() => {
      that.nftContractControllerService.getPasar().cancelCancelOrderProcess();
      this.events.publish(FeedsEvent.PublishType.endLoading);
      clearTimeout(sId);
      that.popupProvider.showSelfCheckDialog('common.cancelOrderTimeoutDesc');
    }, Config.WAIT_TIME_CANCEL_ORDER)

    that.doCancelOrder(that, assetItem)
      .then(() => {
        that.nftContractControllerService.getPasar().cancelCancelOrderProcess();
        that.events.publish(FeedsEvent.PublishType.endLoading);
        clearTimeout(sId);
        that.native.toast_trans('common.cancelSuccessfully');
      })
      .catch(() => {
        // cancel order error
        that.events.publish(FeedsEvent.PublishType.endLoading);
        clearTimeout(sId);
        that.native.toast_trans('common.cancellationFailed');
        that.nftContractControllerService.getPasar().cancelCancelOrderProcess();
      });
  }

  async cancelOrder(that: any, saleOrderId: string) {
    return await that.nftContractControllerService
      .getPasar()
      .cancelOrder(saleOrderId);
  }

  async doCancelOrder(that: any, assetItem: any): Promise<string> {
    return new Promise(async (resolve, reject) => {
      let saleOrderId = assetItem['saleOrderId'] || '';
      if (saleOrderId === '') {
        reject('error');
        return;
      }
      let cancelStatus = await that.cancelOrder(that, saleOrderId);
      this.dataHelper.deletePasarItem(saleOrderId);

      if (!cancelStatus) {
        reject('error');
        return;
      }

      that.events.publish(FeedsEvent.PublishType.nftCancelOrder, assetItem);
      resolve('Success');
    });
  }

  async cancelChannelOrder(that: any, panelId: string) {
    return await that.nftContractControllerService.getGalleria().removePanel(panelId);
  }

  async doCancelChannelOrder(that: any, assetItem: any): Promise<string> {
    return new Promise(async (resolve, reject) => {

      let panelId = assetItem['panelId'] || '';
      if (panelId === '') {
        reject('error');
        return;
      }
      try {
        let cancelStatus = await that.cancelChannelOrder(that, panelId) || null;
        if (cancelStatus === null) {
          reject('error');
          return;
        }
        that.events.publish(FeedsEvent.PublishType.nftCancelChannelOrder, assetItem);
        resolve('Success');
      } catch (error) {
        reject('error');
      }
    });
  }

  async sharePasarLink(assItem: any) {
    await this.native.showLoading("common.generateSharingLink");
    try {
      const saleOrderId = assItem.saleOrderId;
      Logger.log('Share pasar orderId is', saleOrderId);
      const sharedLink = await this.intentService.createSharePasarLink(saleOrderId);
      this.intentService
        .share(this.intentService.createSharePasarTitle(), sharedLink);
    } catch (error) {
    }
    this.native.hideLoading();
  }
}
