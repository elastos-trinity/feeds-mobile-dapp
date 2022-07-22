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
  private checkTokenInterval: NodeJS.Timer;
  private checkTokenNum: number = 0;

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

  async getCategoryList() {
    return await this.channelContract.methods
      .getCategoryList()
      .call()
  }

  async isValidChannelId(tokenId: string) {
    return await this.channelContract.methods
      .isValidChannelId(tokenId)
      .call()
  }

  async owner() {
    return await this.channelContract.methods
      .owner()
      .call()
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

  async mint(
    tokenId: string,
    tokenURI: string,
    channelEntry: string,
    receiptAddr: string,
    ownerAddr: string
  ): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        Logger.log(TAG, 'Mint params ', tokenId, tokenURI, channelEntry, receiptAddr, ownerAddr);
        const mintdata = this.channelContract.methods
          .mint(tokenId, tokenURI, channelEntry, receiptAddr, ownerAddr)
          .encodeABI();
        let transactionParams = await this.createTxParams(mintdata);

        Logger.log(TAG,
          'Calling smart contract through wallet connect',
          mintdata,
          transactionParams,
        );
        this.channelContract.methods
          .mint(tokenId, tokenURI, channelEntry, receiptAddr, ownerAddr)
          .send(transactionParams)
          .on('transactionHash', hash => {
            Logger.log(TAG, 'Mint process, transactionHash is', hash);
          })
          .on('receipt', receipt => {
            Logger.log(TAG, 'Mint process, receipt is', receipt);
          })
          .on('confirmation', (confirmationNumber, receipt) => {
            Logger.log(TAG,
              'Mint process, confirmation is',
              confirmationNumber,
              receipt,
            );
          })
          .on('error', (error, receipt) => {
            Logger.error(TAG, 'Mint process, error is', error, receipt);
          });

        this.checkTokenState(tokenId, info => {
          Logger.log(TAG, 'Mint success, token info is', info);
          resolve(info);
        });
      } catch (error) {
        Logger.error(TAG, 'Mint error', error);
        reject(error);
      }
    });
  }

  checkTokenState(tokenId, callback: (tokenInfo: any) => void) {
    this.checkTokenNum = 0;
    this.checkTokenInterval = setInterval(async () => {
      if (!this.checkTokenInterval) return;
      let info = await this.channelInfo(tokenId);
      if (info[0] != '0' && info[2] != '0') {
        Logger.log(TAG, 'Check token state finish', info);
        clearInterval(this.checkTokenInterval);
        callback(info);
        this.checkTokenInterval = null;
      }

      this.checkTokenNum++;
      if (this.checkTokenNum * Config.CHECK_STATUS_INTERVAL_TIME > Config.WAIT_TIME_MINT) {
        clearInterval(this.checkTokenInterval);
        this.checkTokenInterval = null;
        Logger.log(TAG, 'Exit check token state by self');
      }
    }, Config.CHECK_STATUS_INTERVAL_TIME);
  }

  async channelInfo(tokenId: string) {
    if (!this.channelContract) return [];
    return await this.channelContract.methods.channelInfo(tokenId).call();
  }

  cancelMintProcess() {
    if (!this.checkTokenInterval) return;
    clearInterval(this.checkTokenInterval);
  }

}
