import { Injectable } from '@angular/core';
import { WalletConnectControllerService } from 'src/app/services/walletconnect_controller.service';
import Web3 from 'web3';
import { Config } from './config';
import { Logger } from './logger';

const TAG: string = "ChannelService";
const EstimateGasError = 'EstimateGasError';
type TXData = {
  from: string;
  gasPrice: string;
  gas: number;
  value: any;
}
@Injectable()
export class ChannelContractService {
  private channelAddress: string = Config.CHANNEL_ADDRESS;
  private channelAbi = require('../../assets/contracts/channelRegistryABI.json');
  private web3: Web3;
  private channelContract: any;
  private checkRegisterterval: NodeJS.Timer;
  private checkChannelInterval: NodeJS.Timer;
  private checkRemoveCategoryInterval: NodeJS.Timer;
  private checkTransferOwnershipInterval: NodeJS.Timer;
  private checkUnregisterInterval: NodeJS.Timer;
  private checkUpdateChannelInterval: NodeJS.Timer;

  private checkRegisterNum: number = 0;
  private checkAddCategoryNum: number = 0;
  private checkRemoveCategoryNum: number = 0;
  private checkTransferOwnershipNum: number = 0;
  private checkUnregisterNum: number = 0;
  private checkUpdateChannelNum: number = 0;

  constructor(
    private walletConnectControllerService: WalletConnectControllerService,
  ) {
    this.init();
  }

  init() {
    this.web3 = this.walletConnectControllerService.getWeb3();
    if (!this.web3) return;
    this.channelContract = new this.web3.eth.Contract(
      this.channelAbi,
      this.channelAddress,
    );
  }

  setTestMode(testMode: boolean) {
    if (testMode) {
      this.channelAddress = Config.CHANNEL_TEST_ADDRESS;
      return;
    }
    this.channelAddress = Config.CHANNEL_ADDRESS;
  }

  getChannel() {
    return this;
  }

  getChannelAddress() {
    return this.channelAddress;
  }

  addCategory(category: string): Promise<any> {
    return new Promise(async (resolve, reject) => {

      const data = this.channelContract.methods.addCategory(category).encodeABI()
      let transactionParams = await this.createTxParams(data);
      Logger.log(TAG,
        'Calling addCategory smart contract through wallet connect',
        data,
        transactionParams,
      );

      this.channelContract.methods.addCategory(category)
        .send(transactionParams)
        .on('transactionHash', hash => {
          Logger.log(TAG, 'transactionHash', hash);
          resolve(hash);
        })
        .on('receipt', receipt => {
          Logger.log(TAG, 'receipt', receipt);
          resolve(receipt);
        })
        .on('confirmation', (confirmationNumber, receipt) => {
          Logger.log(TAG, 'confirmation', confirmationNumber, receipt);
          resolve(receipt);
        })
        .on('error', (error, receipt) => {
          Logger.error(TAG, 'addCategory error,', error, receipt);
          reject(receipt);
        });

      this.checkAddCategory(category, isCategory => {
        Logger.log(TAG, 'Add category success', isCategory);
        resolve(isCategory)
      });
    })
  }

  checkAddCategory(category: string, callback: (isCategory: any) => void) {
    this.checkAddCategoryNum = 0;
    this.checkChannelInterval = setInterval(async () => {
      if (!this.checkChannelInterval) return;
      let isCategory = await this.isAddCategory(category)
      if (isCategory) {
        Logger.log(TAG, 'Check Approved finish', isCategory);
        clearInterval(this.checkChannelInterval);
        callback(isCategory);
        this.checkChannelInterval = null;
      }

      this.checkAddCategoryNum++;
      if (this.checkAddCategoryNum * Config.CHECK_STATUS_INTERVAL_TIME > Config.WAIT_TIME_MINT) {
        clearInterval(this.checkChannelInterval);
        this.checkChannelInterval = null;
        Logger.log(TAG, 'Exit check AddCategory state by self');
      }
    }, Config.CHECK_STATUS_INTERVAL_TIME);
  }

  async isAddCategory(category) {
    if (!this.channelContract) return [];
    return await this.channelContract.methods.addCategory(category).call();
  }

  async getCategory(index: string) {
    return await this.channelContract.methods
      .getCategory(index)
      .call()
  }

  async getCategoryCount() {
    return await this.channelContract.methods
      .getCategoryCount()
      .call()
  }

  async getCategoryList() {
    return await this.channelContract.methods
      .getCategoryList()
      .call()
  }

  async getChannelByCategory(category: string) {
    return await this.channelContract.methods
      .getChannelByCategory(category)
      .call()
  }

  async getChannelById(channelId: string) {
    return await this.channelContract.methods
      .getChannelById(channelId)
      .call()
  }

  async getChannels() {
    return await this.channelContract.methods
      .getChannels()
      .call()
  }

  async getPlatformFee() {
    return await this.channelContract.methods
      .getPlatformFee()
      .call()
  }

  async isValidCategory(category: string) {
    return await this.channelContract.methods
      .isValidCategory(category)
      .call()
  }

  async isValidCategoryIndex(index: string) {
    return await this.channelContract.methods
      .isValidCategoryIndex(index)
      .call()
  }

  async isValidChannelId(channelId: string) {
    return await this.channelContract.methods
      .isValidChannelId(channelId)
      .call()
  }

  async owner() {
    return await this.channelContract.methods
      .owner()
      .call()
  }

  register(channelUri: string, tippingAddr: string, category: string, quoteToken: string, value: string): Promise<any> {
    return new Promise(async (resolve, reject) => {

      const data = this.channelContract.methods.register(channelUri, tippingAddr, category, quoteToken, value).encodeABI()
      let transactionParams = await this.createTxParams(data);
      Logger.log(TAG,
        'Calling register smart contract through wallet connect',
        data,
        transactionParams,
      );

      this.channelContract.methods.register(channelUri, tippingAddr, category, quoteToken, value)
        .send(transactionParams)
        .on('transactionHash', hash => {
          Logger.log(TAG, 'transactionHash', hash);
          resolve(hash);
        })
        .on('receipt', receipt => {
          Logger.log(TAG, 'receipt', receipt);
          resolve(receipt);
        })
        .on('confirmation', (confirmationNumber, receipt) => {
          Logger.log(TAG, 'confirmation', confirmationNumber, receipt);
          resolve(receipt);
        })
        .on('error', (error, receipt) => {
          Logger.error(TAG, 'register error,', error, receipt);
          reject(receipt);
        });

      this.checkRegister(channelUri, tippingAddr, category, quoteToken, value, isRegister => {
        Logger.log(TAG, 'register success', isRegister);
        resolve(isRegister)
      });
    })
  }

  checkRegister(channelUri: string, tippingAddr: string, category: string, quoteToken: string, value: string, callback: (isRegister: any) => void) {
    this.checkRegisterNum = 0;
    this.checkRegisterterval = setInterval(async () => {
      if (!this.checkRegisterterval) return;
      let isRegister = await this.isRegister(channelUri, tippingAddr, category, quoteToken, value)
      if (isRegister) {
        Logger.log(TAG, 'Check Register finish', isRegister);
        clearInterval(this.checkRegisterterval);
        callback(isRegister);
        this.checkRegisterterval = null;
      }

      this.checkRegisterNum++;
      if (this.checkRegisterNum * Config.CHECK_STATUS_INTERVAL_TIME > Config.WAIT_TIME_MINT) {
        clearInterval(this.checkRegisterterval);
        this.checkRegisterterval = null;
        Logger.log(TAG, 'Exit check Register state by self');
      }
    }, Config.CHECK_STATUS_INTERVAL_TIME);
  }

  async isRegister(channelUri: string, tippingAddr: string, category: string, quoteToken: string, value: string) {
    if (!this.channelContract) return [];
    return await this.channelContract.methods.register(channelUri, tippingAddr, category, quoteToken, value).call();
  }

  removeCategory(category: string): Promise<any> {
    return new Promise(async (resolve, reject) => {

      const data = this.channelContract.methods.removeCategory(category).encodeABI()
      let transactionParams = await this.createTxParams(data);
      Logger.log(TAG,
        'Calling register smart contract through wallet connect',
        data,
        transactionParams,
      );

      this.channelContract.methods.removeCategory(category)
        .send(transactionParams)
        .on('transactionHash', hash => {
          Logger.log(TAG, 'transactionHash', hash);
          resolve(hash);
        })
        .on('receipt', receipt => {
          Logger.log(TAG, 'receipt', receipt);
          resolve(receipt);
        })
        .on('confirmation', (confirmationNumber, receipt) => {
          Logger.log(TAG, 'confirmation', confirmationNumber, receipt);
          resolve(receipt);
        })
        .on('error', (error, receipt) => {
          Logger.error(TAG, 'Remove category error,', error, receipt);
          reject(receipt);
        });

      this.checkRemoveCategory(category, isRemoveCategory => {
        Logger.log(TAG, 'Remove category success', isRemoveCategory);
        resolve(isRemoveCategory)
      });
    })
  }

  checkRemoveCategory(category: string, callback: (isRemoveCategory: any) => void) {
    this.checkRemoveCategoryNum = 0;
    this.checkRemoveCategoryInterval = setInterval(async () => {
      if (!this.checkRemoveCategoryInterval) return;
      let isRemoveCategory = await this.isRemoveCategory(category)
      if (isRemoveCategory) {
        Logger.log(TAG, 'Check RemoveCategory finish', isRemoveCategory);
        clearInterval(this.checkRemoveCategoryInterval);
        callback(isRemoveCategory);
        this.checkRemoveCategoryInterval = null;
      }

      this.checkRemoveCategoryNum++;
      if (this.checkRemoveCategoryNum * Config.CHECK_STATUS_INTERVAL_TIME > Config.WAIT_TIME_MINT) {
        clearInterval(this.checkRemoveCategoryInterval);
        this.checkRemoveCategoryInterval = null;
        Logger.log(TAG, 'Exit check RemoveCategory state by self');
      }
    }, Config.CHECK_STATUS_INTERVAL_TIME);
  }

  async isRemoveCategory(category: string) {
    if (!this.channelContract) return [];
    return await this.channelContract.methods.removeCategory(category).call();
  }

  transferOwnership(newOwner: string): Promise<any> {
    return new Promise(async (resolve, reject) => {

      const data = this.channelContract.methods.transferOwnership(newOwner).encodeABI()
      let transactionParams = await this.createTxParams(data);
      Logger.log(TAG,
        'Calling transferOwnership smart contract through wallet connect',
        data,
        transactionParams,
      );

      this.channelContract.methods.transferOwnership(newOwner)
        .send(transactionParams)
        .on('transactionHash', hash => {
          Logger.log(TAG, 'transactionHash', hash);
          resolve(hash);
        })
        .on('receipt', receipt => {
          Logger.log(TAG, 'receipt', receipt);
          resolve(receipt);
        })
        .on('confirmation', (confirmationNumber, receipt) => {
          Logger.log(TAG, 'confirmation', confirmationNumber, receipt);
          resolve(receipt);
        })
        .on('error', (error, receipt) => {
          Logger.error(TAG, 'transferOwnership error,', error, receipt);
          reject(receipt);
        });

      this.checkTransferOwnership(newOwner, isNewOwner => {
        Logger.log(TAG, 'transferOwnership success', isNewOwner);
        resolve(isNewOwner)
      });
    })
  }

  checkTransferOwnership(newOwner: string, callback: (isTransferOwnership: any) => void) {
    this.checkTransferOwnershipNum = 0;
    this.checkTransferOwnershipInterval = setInterval(async () => {
      if (!this.checkTransferOwnershipInterval) return;
      let isTransferOwnership = await this.isTransferOwnership(newOwner)
      if (isTransferOwnership) {
        Logger.log(TAG, 'Check checkTransferOwnership finish', isTransferOwnership);
        clearInterval(this.checkTransferOwnershipInterval);
        callback(isTransferOwnership);
        this.checkTransferOwnershipInterval = null;
      }

      this.checkTransferOwnershipNum++;
      if (this.checkTransferOwnershipNum * Config.CHECK_STATUS_INTERVAL_TIME > Config.WAIT_TIME_MINT) {
        clearInterval(this.checkTransferOwnershipInterval);
        this.checkTransferOwnershipInterval = null;
        Logger.log(TAG, 'Exit check TransferOwnership state by self');
      }
    }, Config.CHECK_STATUS_INTERVAL_TIME);
  }

  async isTransferOwnership(newOwner: string) {
    if (!this.channelContract) return [];
    return await this.channelContract.methods.transferOwnership(newOwner).call();
  }

  unregister(channelId: string): Promise<any> {
    return new Promise(async (resolve, reject) => {

      const data = this.channelContract.methods.unregister(channelId).encodeABI()
      let transactionParams = await this.createTxParams(data);
      Logger.log(TAG,
        'Calling unregister smart contract through wallet connect',
        data,
        transactionParams,
      );

      this.channelContract.methods.unregister(channelId)
        .send(transactionParams)
        .on('transactionHash', hash => {
          Logger.log(TAG, 'transactionHash', hash);
          resolve(hash);
        })
        .on('receipt', receipt => {
          Logger.log(TAG, 'receipt', receipt);
          resolve(receipt);
        })
        .on('confirmation', (confirmationNumber, receipt) => {
          Logger.log(TAG, 'confirmation', confirmationNumber, receipt);
          resolve(receipt);
        })
        .on('error', (error, receipt) => {
          Logger.error(TAG, 'unregister error,', error, receipt);
          reject(receipt);
        });

      this.checkUnregister(channelId, isUnregister => {
        Logger.log(TAG, 'unregister success', isUnregister);
        resolve(isUnregister)
      });
    })
  }

  checkUnregister(channelId: string, callback: (isUnregister: any) => void) {
    this.checkUnregisterNum = 0;
    this.checkUnregisterInterval = setInterval(async () => {
      if (!this.checkUnregisterInterval) return;
      let isUnregister = await this.isUnregister(channelId)
      if (isUnregister) {
        Logger.log(TAG, 'Check Unregister finish', isUnregister);
        clearInterval(this.checkUnregisterInterval);
        callback(isUnregister);
        this.checkUnregisterInterval = null;
      }

      this.checkUnregisterNum++;
      if (this.checkUnregisterNum * Config.CHECK_STATUS_INTERVAL_TIME > Config.WAIT_TIME_MINT) {
        clearInterval(this.checkUnregisterInterval);
        this.checkUnregisterInterval = null;
        Logger.log(TAG, 'Exit check Unregister state by self');
      }
    }, Config.CHECK_STATUS_INTERVAL_TIME);
  }

  async isUnregister(channelId: string) {
    if (!this.channelContract) return [];
    return await this.channelContract.methods.unregister(channelId).call();
  }

  updateChannel(channelId: string, channelUri: string, tippingAddr: string, category: string): Promise<any> {
    return new Promise(async (resolve, reject) => {

      const data = this.channelContract.methods.updateChannel(channelId, channelUri, tippingAddr, category).encodeABI()
      let transactionParams = await this.createTxParams(data);
      Logger.log(TAG,
        'Calling updateChannel smart contract through wallet connect',
        data,
        transactionParams,
      );

      this.channelContract.methods.updateChannel(channelId)
        .send(transactionParams)
        .on('transactionHash', hash => {
          Logger.log(TAG, 'transactionHash', hash);
          resolve(hash);
        })
        .on('receipt', receipt => {
          Logger.log(TAG, 'receipt', receipt);
          resolve(receipt);
        })
        .on('confirmation', (confirmationNumber, receipt) => {
          Logger.log(TAG, 'confirmation', confirmationNumber, receipt);
          resolve(receipt);
        })
        .on('error', (error, receipt) => {
          Logger.error(TAG, 'UpdateChannel error,', error, receipt);
          reject(receipt);
        });

      this.checkUpdateChannel(channelId, channelUri, tippingAddr, category, isUpdateChannel => {
        Logger.log(TAG, 'UpdateChannel success', isUpdateChannel);
        resolve(isUpdateChannel)
      });
    })
  }

  checkUpdateChannel(channelId: string, channelUri: string, tippingAddr: string, category: string, callback: (isUpdateChannel: any) => void) {
    this.checkUpdateChannelNum = 0;
    this.checkUpdateChannelInterval = setInterval(async () => {
      if (!this.checkUpdateChannelInterval) return;
      let isUpdateChannel = await this.isUpdateChannel(channelId, channelUri, tippingAddr, category)
      if (isUpdateChannel) {
        Logger.log(TAG, 'Check UpdateChannel finish', isUpdateChannel);
        clearInterval(this.checkUpdateChannelInterval);
        callback(isUpdateChannel);
        this.checkUpdateChannelInterval = null;
      }

      this.checkUpdateChannelNum++;
      if (this.checkUpdateChannelNum * Config.CHECK_STATUS_INTERVAL_TIME > Config.WAIT_TIME_MINT) {
        clearInterval(this.checkUpdateChannelInterval);
        this.checkUpdateChannelInterval = null;
        Logger.log(TAG, 'Exit check UpdateChannel state by self');
      }
    }, Config.CHECK_STATUS_INTERVAL_TIME);
  }

  async isUpdateChannel(channelId: string, channelUri: string, tippingAddr: string, category: string) {
    if (!this.channelContract) return [];
    return await this.channelContract.methods.updateChannel(channelId, channelUri, tippingAddr, category).call();
  }









  async createTxParams(data) {
    return new Promise(async (resolve, reject) => {
      try {
        let accountAddress = this.walletConnectControllerService.getAccountAddress();
        let txGas = 0;

        const txData = {
          from: this.walletConnectControllerService.getAccountAddress(),
          to: this.channelAddress,
          value: 0,
          data: data,
        };
        Logger.log(TAG, 'Create Tx Params is', txData);

        await this.web3.eth.estimateGas(txData, (error, gasResult) => {
          txGas = gasResult;
          Logger.log(TAG, 'EstimateGas finish ,gas is', txGas, ', error is', error);

        });
        if (!txGas || txGas == 0) {
          Logger.error(TAG, EstimateGasError);
          reject(EstimateGasError);
          return;
        }
        Logger.log(TAG, 'Finnal gas is', txGas);

        let gasPrice = await this.web3.eth.getGasPrice();
        let txResult: TXData = {
          from: accountAddress,
          // to: chanelAddr,
          gasPrice: gasPrice,
          gas: Math.round(txGas * 3),
          value: 0,
        };
        resolve(txResult);
      } catch (error) {
        Logger.log(TAG, 'error', error);
        reject(EstimateGasError);
      }
    });
  }
}
