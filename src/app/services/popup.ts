import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AlertController } from '@ionic/angular';
import { ConfirmdialogComponent } from '../components/confirmdialog/confirmdialog.component';
import { AlertdialogComponent } from '../components/alertdialog/alertdialog.component';
import { PopoverController, ModalController } from '@ionic/angular';
import { ScanPage } from '../pages/scan/scan.page';
@Injectable()
export class PopupProvider {
  public popover: any = null;
  public popoverDialog: any = null;
  constructor(
    private alertCtrl: AlertController,
    private translate: TranslateService,
    private popoverController: PopoverController,
    private modalController: ModalController,
  ) { }


  public ionicAlert(
    that: any,
    title: string,
    message: string,
    okFunction: any,
    imgageName: string,
    okText?: string,
  ) {
    let ok = okText || 'common.confirm';
    return this.showalertdialog(
      that,
      title,
      message,
      okFunction,
      imgageName,
      ok,
    );
  }

  public async showalertdialog(
    that: any,
    title: string,
    message: string,
    okFunction: any,
    imgageName: string,
    okText?: string,
  ) {
    // if(this.popover != null ){
    //       return;
    // }
    this.popover = await this.popoverController.create({
      mode: 'ios',
      cssClass: 'ConfirmdialogComponent',
      component: AlertdialogComponent,
      backdropDismiss: false,
      componentProps: {
        that: that,
        title: title,
        message: message,
        okText: okText,
        okFunction: okFunction,
        imgageName: imgageName,
      },
    });

    this.popover.onWillDismiss().then(() => {
      if (this.popover != null) {
        this.popover = null;
      }
    });
    await this.popover.present();

    return this.popover;
  }

  hideAlertPopover() {
    if (this.popover != null) {
      this.popover.dismiss();
    }
  }

  async ionicConfirm(
    that: any,
    title: string,
    message: string,
    cancelFunction: any,
    okFunction: any,
    imgageName: string,
    okText?: string,
    cancelText?: string,
  ): Promise<HTMLIonPopoverElement> {
    let ok = okText || 'common.confirm';
    let cancel = cancelText || 'common.cancel';
    return await this.showConfirmdialog(
      that,
      title,
      message,
      cancelFunction,
      okFunction,
      imgageName,
      ok,
      cancel,
    );
  }

  public async showConfirmdialog(
    that: any,
    title: string,
    message: string,
    cancelFunction: any,
    okFunction: any,
    imgageName: string,
    okText?: string,
    cancelText?: string,
  ): Promise<HTMLIonPopoverElement> {
    this.popover = await this.popoverController.create({
      mode: 'ios',
      cssClass: 'ConfirmdialogComponent',
      component: ConfirmdialogComponent,
      componentProps: {
        that: that,
        title: title,
        message: message,
        okText: okText,
        cancelText: cancelText,
        okFunction: okFunction,
        cancelFunction: cancelFunction,
        imgageName: imgageName,
      },
    });

    this.popover.onWillDismiss().then(() => {
      if (this.popover != null) {
        this.popover = null;
      }
    });
    await this.popover.present();

    return this.popover;
  }


  showSelfCheckDialog(desc: string) {
    this.openAlert(desc);
  }

  openAlert(desc: string) {
    this.popoverDialog = this.ionicAlert(
      this,
      'common.timeout',
      desc,
      this.timeOutconfirm,
      'tskth.svg',
    );
  }

  timeOutconfirm(that: any) {
    that.popoverController.dismiss();
  }

  async scan(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      const modal = await this.modalController.create({
        mode: 'ios',
        component: ScanPage,
        cssClass: "transparentBody",
        animated: true,
        showBackdrop: false,
      });
      modal.onWillDismiss().then((scanText) => {
        resolve(scanText);
      }).catch(() => {
        reject("");
      });
      return await modal.present();
    });
  }
}
