import { Options as requestOptions } from 'request'
import Plugin, { tools, AppClient } from '../../plugin'
import Options from '../../options'

class GetStatus extends Plugin {
  constructor() {
    super()
  }
  public name = '运行统计'
  public description = '定时log并推送运行统计数据'
  public version = '0.0.8'
  public author = 'Vector000'
  // 监听状态
  private listenStatus: any = {
    startTime: 0,
    raffle: 0,
    lottery: 0,
    beatStorm: 0
  }
  // 监听状态(Daily, 只统计当天0点开始的监听量)
  private todayListenStatus: any = {
    raffle: 0,
    lottery: 0,
    beatStorm: 0
  }
  // 封禁列表
  private _raffleBanList: Map<string, boolean> = new Map()
  private _stormBanList: Map<string, boolean> = new Map()
  // 抽奖统计
  private _raffleStatus: any = {}
  // 抽奖统计(Daily, 只统计当前0点开始的获奖量)
  private _todayRaffleStatus: any = {}
  public async load({ defaultOptions, whiteList }: { defaultOptions: options, whiteList: Set<string> }) {
    defaultOptions.config['getStatus'] = 6
    defaultOptions.info['getStatus'] = {
      description: '查看挂机状态',
      tip: '定时log并推送运行状态数据。输入一整数，表示每隔N小时推送一次，若为0，则表示不推送',
      type: 'number'
    }
    whiteList.add('getStatus')
    defaultOptions.newUserData['raffleBan'] = false
    defaultOptions.newUserData['beatStormBan'] = false
    whiteList.add('raffleBan')
    whiteList.add('beatStormBan')
    this.loaded = true
  }
  public async start({ users }: { users: Map<string, User> }) {
    this._loadBanStatus(users)
    this._clearStatus(this._raffleStatus, users)
    this._clearStatus(this._todayRaffleStatus, users)
    this.listenStatus.startTime = Date.now()
    this._getStatus(users, false)
  }
  public async loop({ cstMin, cstHour, cstString, options, users }: { cstMin: number, cstHour: number, cstString: string, options: options, users: Map<string, User> }) {
    if (cstString === '00:00') {
      this._clearStatus(this._todayRaffleStatus, users)
      for (let key in this.todayListenStatus) {
        this.todayListenStatus[key] = 0
      }
    }
    let time = <number>options.config.getStatus
    if (cstMin === 59) this._getStatus(users, false)
    if (time > 0 && cstMin === 59 && (cstHour + 1) % time === 0) this._getStatus(users, true)
  }
  public async msg({ message }: { message: raffleMessage | lotteryMessage | beatStormMessage }) {
    this.listenStatus[message.cmd]++
    this.todayListenStatus[message.cmd]++
  }
  public async notify({ msg, users }: { msg: pluginNotify, users: Map<string, User> }) {
    let data = msg.data
    let user = <User>users.get(msg.data.uid)
    if (msg.cmd === 'ban') {
      this._banMSGHandler(data, user)
    }
    if (msg.cmd === 'earn') {
      this._addEarnStatus(this._raffleStatus, data.uid, msg.data)
      this._addEarnStatus(this._todayRaffleStatus, data.uid, msg.data)
      this._unBanMSGHandler(msg.data, user)
    }
    if (msg.cmd === 'unban') this._unBanMSGHandler(msg.data, user)
  }
  /**
   * 加载封禁状态到内存
   *  
   * @param {Map<string, User>}
   * @private
   * @memberof GetStatus
   */
  private async _loadBanStatus(users: Map<string, User>) {
    users.forEach(async (user, uid) => {
      this._raffleBanList.set(uid, <boolean>user.userData['raffleBan'])
      this._stormBanList.set(uid, <boolean>user.userData['beatStormBan'])
    })
  }
  /**
   * 清除/分配状态缓存
   *
   * @param {any, Map<string, User>}
   * @private
   * @memberof GetStatus
   */
  private async _clearStatus(status: any, users: Map<string, User>) {
    users.forEach(user => { status[user.uid] = { earned: [] } })
  }
  /**
   * 处理ban msg
   * 
   * @param {any, User}
   * @private
   * @memberof GetStatus
   */
  private async _banMSGHandler(data: any, user: User) {
    if (data.type === 'raffle') {
      if (!this._raffleBanList.get(data.uid)) {
        this._raffleBanList.set(data.uid, true)
        user.userData['raffleBan'] = true
        await tools.Sleep(Math.random() * 5 * 1000)
        tools.emit('systemMSG', <systemMSG>{
          message: `${data.nickname}已封禁`,
          options: Options._
        })
      }
    }
    else {
      if (!this._stormBanList.get(data.uid)) {
        this._stormBanList.set(data.uid, true)
        user.userData['beatStormBan'] = true
        await tools.Sleep(Math.random() * 5 * 1000)
        tools.emit('systemMSG', <systemMSG>{
          message: `${data.nickname}风暴已封禁`,
          options: Options._
        })
      }
    }
    Options.save()
  }
  /**
   * 处理unban(earn) msg
   * 
   * @param {any, User}
   * @private
   * @memberof GetStatus
   */
  private async _unBanMSGHandler(data: any, user: User) {
    if (data.type !== 'beatStorm') {
      if (this._raffleBanList.get(data.uid)) {
        this._raffleBanList.set(data.uid, false)
        user.userData['raffleBan'] = false
        await tools.Sleep(Math.random() * 5 * 1000)
        tools.emit('systemMSG', <systemMSG>{
          message: `${data.nickname}已解除封禁`,
          options: Options._
        })
      }
    }
    else {
      if (this._stormBanList.get(data.uid)) {
        this._stormBanList.set(data.uid, false)
        user.userData['beatStormBan'] = false
        await tools.Sleep(Math.random() * 5 * 1000)
        tools.emit('systemMSG', <systemMSG>{
          message: `${data.nickname}已解除风暴封禁`,
          options: Options._
        })
      }
    }
    Options.save()
  }
  /**
   * 获取礼物数量+1
   *
   * @private
   * @memberof GetStatus
   */
  private _addEarnStatus(status: any, uid: string, data: any) {
    let len = status[uid].earned.length
    for (let i = 0; i <= len; i++) {
      if (i === len) { // 完成遍历，未发现同名item，作为全新item插入数组
        status[uid].earned.push({ name: data.name, num: data.num })
        break
      }
      if (data.name === status[uid].earned[i].name) { // 发现同名item，追加item数量
        status[uid].earned[i].num += data.num
        break
      }
    }
  }
  /**
   * 用户信息
   *
   * @private
   * @memberof GetStatus
   */
  private async _getStatus(users: Map<string, User>, push: boolean) {
    let rawMsg: any = {} // 原始消息数据
    for (const [uid, user] of users) {
      if (!user.userData.status) continue
      let tmp: any = {
        userData: user.userData,
        raffleBan: this._raffleBanList.get(user.uid),
        stormBan: this._stormBanList.get(user.uid)
      }
      tmp['liveData'] = await this._getLiveInfo(user)
      tmp['medalData'] = await this._getMedalInfo(user)
      tmp['bagData'] = await this._getBagInfo(user)
      tmp['earnData'] = await this._getEarnInfo(user)
      rawMsg[uid] = tmp
    }
    this._logMSGHandler(rawMsg)
    if (push) this._pushMSGHandler(rawMsg)
  }
  /**
   * 获取liveInfo
   *
   * @memberof GetStatus
   */
  private async _getLiveInfo(user: User) {
    const userInfo: requestOptions = {
      uri: `https://api.live.bilibili.com/User/getUserInfo?ts=${AppClient.TS}`,
      json: true,
      jar: user.jar,
      headers: user.headers
    }
    const getUserInfo = await tools.XHR<userInfo>(userInfo)
    if (getUserInfo === undefined || getUserInfo.response.statusCode !== 200) return false
    if (getUserInfo.body.code === 'REPONSE_OK') return getUserInfo.body.data
    else return false
  }
  /**
   * 获取medalInfo
   *
   * @memberof GetStatus
   */
  private async _getMedalInfo(user: User) {
    const medalInfo: requestOptions = {
      uri: `https://api.live.bilibili.com/i/api/medal?page=1&pageSize=25`,
      json: true,
      jar: user.jar,
      headers: user.headers
    }
    const getMedalInfo = await tools.XHR<medalInfo>(medalInfo)
    if (getMedalInfo === undefined) return false
    else {
      if (getMedalInfo.body.code === 0) {
        const medalData = getMedalInfo.body.data
        if (medalData.count === 0) return 0 // 无勋章
        else {
          let medal: any
          for (let i = 0; i <= medalData.fansMedalList.length; i++) {
            if (i === medalData.fansMedalList.length) {
              medal = -1 // 完成遍历，未发现有佩戴勋章
              break
            }
            if (medalData.fansMedalList[i].status === 1) {
              medal = medalData.fansMedalList[i] // 佩戴了勋章
              break
            }
          }
          return medal
        }
      }
      else return false // 获取勋章信息失败
    }
  }
  /**
   * 获取bagInfo
   *
   * @memberof GetStatus
   */
  private async _getBagInfo(user: User) {
    const bag: requestOptions = {
      uri: `https://api.live.bilibili.com/gift/v2/gift/m_bag_list?${AppClient.signQueryBase(user.tokenQuery)}`,
      json: true,
      headers: user.headers
    }
    const bagInfo = await tools.XHR<bagInfo>(bag, 'Android')
    if (bagInfo === undefined || bagInfo.response.statusCode !== 200 || bagInfo.body.code !== 0) return false
    else return bagInfo.body.data
  }
  /**
   * 已获取奖励
   *
   * @memberof GetStatus
   */
  private async _getEarnInfo(user: User) {
    return {
      total: this._raffleStatus[user.uid].earned,
      today: this._todayRaffleStatus[user.uid].earned
    }
  }
  /**
   * 处理logMSG
   *
   * @memberof GetStatus
   */
  private _logMSGHandler(rawMsg: any) {
    let logMsg: string = '\n'
    let headLine: string = `/********************************* bilive_client 运行信息 *********************************/`
    let timeLine: string = `本次挂机开始于 ${new Date(this.listenStatus.startTime).toString()}`
    let raffleLine: string = `共监听到活动抽奖数：${this.listenStatus.raffle}(${this.todayListenStatus.raffle})`
    let lotteryLine: string = `共监听到大航海抽奖数：${this.listenStatus.lottery}(${this.todayListenStatus.lottery})`
    let beatStormLine: string = `共监听到节奏风暴抽奖数：${this.listenStatus.beatStorm}(${this.todayListenStatus.beatStorm})`
    logMsg += headLine + '\n' + timeLine + '\n'
      + raffleLine + '\n' + lotteryLine + '\n' + beatStormLine + '\n'
    for (const uid in rawMsg) {
      let line, live, medal, bag, raffle: string = ''
      let user = rawMsg[uid]
      let ban: string = function(r: boolean, s: boolean) {
        if (r === true) return '已封禁'
        else if (r === false && s === true) return '风暴黑屋'
        else return '未封禁'
      }(user.raffleBan, user.stormBan)
      line = `\n/************************************ 用户 ${user.userData.nickname} 信息 ************************************/\n`
      live = function() {
        if (!user.liveData || user.liveData === undefined) return (`用户信息获取失败`)
        else {
          let vip: string = '普通用户'
          if (user.liveData.vip === 1 && user.liveData.svip === 0) vip = '月费老爷'
          else if (user.liveData.svip === 1) vip = '年费老爷'
          return (`ID：${user.liveData.uname}  ${vip}  \
LV${user.liveData.user_level} (${user.liveData.user_intimacy}/${user.liveData.user_next_intimacy})\
[${Math.floor(user.liveData.user_intimacy / user.liveData.user_next_intimacy * 100)}%]  \
排名：${user.liveData.user_level_rank}\n金瓜子：${user.liveData.gold}  \
银瓜子：${user.liveData.silver}  硬币：${user.liveData.billCoin}  当前状态：${ban}`)
        }
      }()
      let medalDiv: string = '\n\n-------------------------- 佩戴勋章信息 --------------------------\n'
      medal = function() {
        if (user.medalData === false || user.medalData === undefined) return (`勋章信息获取失败`)
        else if (user.medalData === -1) return (`未佩戴勋章`)
        else if (user.medalData === 0) return (`无勋章`)
        else {
          return (`[${user.medalData.medal_name}]${user.medalData.level}   \
EXP：${user.medalData.intimacy}/${user.medalData.next_intimacy} \
(${Math.floor(user.medalData.intimacy / user.medalData.next_intimacy * 100)}%)   \
排名：${user.medalData.rank}`)
        }
      }()
      let bagDiv: string = '\n\n---------------------------- 包裹信息 ----------------------------\n'
      bag = function() {
        if (!user.bagData || user.bagData === undefined) return (`包裹信息获取失败`)
        else if (user.bagData.length === 0) return (`包裹空空的`)
        else {
          let tmp: string = ''
          for (let i = 0; i < user.bagData.length; i++) {
            let giftItem = user.bagData[i]
            let expireStr: string = ''
            let expire = user.bagData[i].expireat
            if (expire === 0) expireStr = `永久`
            else if (expire / 3600 < 1) expireStr = `${(expire / 60).toFixed(1)}分钟`
            else if (expire / (24 * 3600) < 1) expireStr = `${(expire / 3600).toFixed(1)}小时`
            else expireStr = `${(expire / 24 / 3600).toFixed(1)}天`
            tmp += `${giftItem.gift_name} x${giftItem.gift_num} (有效期${expireStr})    `
            if ((i + 1) % 3 === 0) tmp += '\n'
          }
          return tmp
        }
      }()
      raffle = function() {
        let tmp: string = '\n本次挂机，此账号共获得奖励：\n'
        if (user.earnData.total.length > 0) user.earnData.total.forEach((earn: any) => tmp += `  ${earn.name} x${earn.num}\n`)
        else tmp += '  无\n'
        tmp += '今日收益：\n'
        if (user.earnData.today.length > 0) user.earnData.today.forEach((earn: any) => tmp += `  ${earn.name} x${earn.num}\n`)
        else tmp += '  无\n'
        return tmp
      }()
      logMsg += line + live + medalDiv + medal + bagDiv + bag + '\n' + raffle + '\n'
    }
    tools.Log(logMsg)
  }
  /**
   * 处理pushMSG
   *
   * @memberof GetStatus
   */
  private _pushMSGHandler(rawMsg: any) {
    let pushMsg: string = ''
    pushMsg += `# bilive_client 挂机情况报告\n`
    pushMsg += `- 本次挂机开始于 ${new Date(this.listenStatus.startTime).toString()}\n`
    pushMsg += `- 共监听到活动抽奖数：${this.listenStatus.raffle}(${this.todayListenStatus.raffle})\n`
    pushMsg += `- 共监听到大航海抽奖数：${this.listenStatus.lottery}(${this.todayListenStatus.lottery})\n`
    pushMsg += `- 共监听到节奏风暴抽奖数：${this.listenStatus.beatStorm}(${this.todayListenStatus.beatStorm})\n`
    for (const uid in rawMsg) {
      let line, live, medal, bag, raffle: string = ''
      let user = rawMsg[uid]
      let ban: string = function(r: boolean, s: boolean) {
        if (r === true) return '已封禁'
        else if (r === false && s === true) return '风暴黑屋'
        else return '未封禁'
      }(user.raffleBan, user.stormBan)
      line = `# 用户 *****${user.userData.nickname}***** 信息\n`
      live = function() {
        if (!user.liveData || user.liveData === undefined) return (`## 用户信息获取失败\n`)
        else {
          let vip: string = '普通用户'
          if (user.liveData.vip === 1 && user.liveData.svip === 0) vip = '月费老爷'
          else if (user.liveData.svip === 1) vip = '年费老爷'
          return (`## 用户信息\n- ID：${user.liveData.uname} ${vip} 当前状态：${ban}\n
- LV${user.liveData.user_level} (${user.liveData.user_intimacy}/${user.liveData.user_next_intimacy}) \
[${Math.floor(user.liveData.user_intimacy / user.liveData.user_next_intimacy * 100)}%]\
排名：${user.liveData.user_level_rank}\n\
- 金瓜子：${user.liveData.gold} 银瓜子：${user.liveData.silver} 硬币：${user.liveData.billCoin}\n`)
        }
      }()
      medal = function() {
        if (user.medalData === false || user.medalData === undefined) return (`## 勋章信息获取失败\n`)
        else if (user.medalData === -1) return (`## 未佩戴勋章\n`)
        else if (user.medalData === 0) return (`## 无勋章\n`)
        else {
          return (`## 佩戴勋章信息\n- [${user.medalData.medal_name}]${user.medalData.level}\n\
- 获取时间：${user.medalData.receive_time}\n\
- EXP：${user.medalData.intimacy}/${user.medalData.next_intimacy} (${Math.floor(user.medalData.intimacy / user.medalData.next_intimacy * 100)}%) \
排名：${user.medalData.rank}\n`)
        }
      }()
      bag = function() {
        if (!user.bagData || user.bagData === undefined) return (`## 包裹信息获取失败\n`)
        else if (user.bagData.length === 0) return (`## 包裹空空的\n`)
        else {
          let tmp: string = '## 包裹信息\n名称|数量|有效期|名称|数量|有效期|名称|数量|有效期\n'
          tmp += ':-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:\n'
          for (let i = 0; i < user.bagData.length; i++) {
            let giftItem = user.bagData[i]
            let expireStr: string = ''
            let expire = user.bagData[i].expireat
            if (expire === 0) expireStr = `永久`
            else if (expire / 3600 < 1) expireStr = `${(expire / 60).toFixed(1)}分钟`
            else if (expire / (24 * 3600) < 1) expireStr = `${(expire / 3600).toFixed(1)}小时`
            else expireStr = `${(expire / 24 / 3600).toFixed(1)}天`
            if ((i + 1) % 3 === 1) tmp += `${giftItem.gift_name}|${giftItem.gift_num}|${expireStr}`
            else if ((i + 1) % 3 === 2) tmp += `|${giftItem.gift_name}|${giftItem.gift_num}|${expireStr}`
            else tmp += `|${giftItem.gift_name}|${giftItem.gift_num}|${expireStr}\n`
          }
          return (tmp)
        }
      }()
      raffle = function() {
        let tmp: string = '## 抽奖情况\n'
        tmp += `### 共获得奖励：\n`
        if (user.earnData.total.length) user.earnData.total.forEach((earn: any) => tmp += `- ${earn.name} x${earn.num}\n`)
        else tmp += '- 无\n'
        tmp += `### 今日收益：\n`
        if (user.earnData.today.length) user.earnData.today.forEach((earn: any) => tmp += `- ${earn.name} x${earn.num}\n`)
        else tmp += '- 无\n'
        return tmp
      }()
      pushMsg += '\n---\n' + line + '\n---\n' + live + '\n---\n' + medal + '\n---\n' + bag + '\n---\n' + raffle + '\n---\n'
      if (<string>user.userData['serverChan'] !== '') {
        if (<string>Options._.config['adminServerChan'] !== <string>user.userData['serverChan']) {
          tools.emit('SCMSG', <systemMSG>{
            message: '\n---\n' + live + '\n---\n' + medal + '\n---\n' + bag + '\n---\n' + raffle + '\n---\n',
            options: Options._,
            serverChan:<string>user.userData['serverChan']
          })
        }
      }
    }
    tools.emit('SCMSG', <systemMSG>{
      message: pushMsg,
      options: Options._
    })
  }
}

/**
 * 个人信息
 *
 * @interface userInfo
 */
interface userInfo {
  code: string
  msg: string
  data: userInfoData
}
interface userInfoData {
  uname: string
  silver: number
  gold: number
  user_level: number
  user_intimacy: number
  user_next_intimacy: number
  user_level_rank: number
  billCoin: number
  vip: number
  svip: number
}

/**
 * 勋章信息
 *
 * @interface medalInfo
 */
interface medalInfo {
  code: number
  msg: string
  data: medalInfoData
}
interface medalInfoData {
  medalCount: number
  count: number
  fansMedalList: medalInfoDataInfo[]
}
interface medalInfoDataInfo {
  status: number
  level: number
  intimacy: number
  next_intimacy: number
  medal_name: string
  rank: number
  target_id: number
  uid: number
}
/**
 * 包裹信息
 *
 * @interface bagInfo
 */
interface bagInfo {
  code: number
  msg: string
  message: string
  data: bagInfoData[]
}
interface bagInfoData {
  id: number
  uid: number
  gift_id: number
  gift_num: number
  expireat: number
  gift_type: number
  gift_name: string
  gift_price: string
  img: string
  count_set: string
  combo_num: number
  super_num: number
}

export default new GetStatus()
