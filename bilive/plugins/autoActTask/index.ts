import { Options as requestOptions } from 'request'
import Plugin, { tools } from '../../plugin'
class AutoActTask extends Plugin {
  constructor() {
    super()
  }
  public name = '自动活动任务'
  public description = '每天自动进行活动任务（不定期任务）'
  public version = '0.0.1'
  public author = 'Vector000'
  private _eventInfo!: EventInfo
  public async load({ defaultOptions, whiteList }: { defaultOptions: options, whiteList: Set<string> }) {
    // 自动签到
    defaultOptions.newUserData['doActTask'] = false
    defaultOptions.info['doActTask'] = {
      description: '自动活动任务',
      tip: '每天自动进行活动任务',
      type: 'boolean'
    }
    whiteList.add('doActTask')
    this.loaded = true
  }
  public async start({ users }: { users: Map<string, User> }) {
    await this._getEventInfo()
    this._doActTask(users)
  }
  public async loop({ cstMin, cstHour, users }: { cstMin: number, cstHour: number, users: Map<string, User> }) {
    // 每天04:30, 12:30, 20:30做任务
    if (cstMin === 30 && cstHour % 8 === 4) {
      await this._getEventInfo()
      this._doActTask(users)
    }
  }
  private _doActTask(users: Map<string, User>) {
    const eventInfo = this._eventInfo
    for (const key in eventInfo) {
      switch (key) {
        case "lpl_task":
          this._doLPLAct(users, eventInfo[key])
          break
        default: break
      }
    }
  }
  /**
   * 自动lpl类型任务任务
   *
   * @private
   * @memberof AutoActTask
   */
  private _doLPLAct(users: Map<string, User>, lplParams: lplParams[]) {
    lplParams.forEach(param => {
      const { name, endTime, game_type, room_id } = param
      if ((new Date > new Date(endTime))) return
      users.forEach(async (user) => {
        if (!user.userData['doActTask']) return
        // 用户签到
        const actLPLSgin = `${name}签到`
        const actAPI1: requestOptions = {
          method: 'POST',
          uri: `https://api.live.bilibili.com/xlive/general-interface/v1/lpl-task/MatchSign`,
          body: `room_id=${room_id}&game_type=${game_type}&csrf_token=${tools.getCookie(user.jar, 'bili_jct')}&csrf=${tools.getCookie(user.jar, 'bili_jct')}`,
          jar: user.jar,
          json: true
        }
        tools.XHR<generalCallback>(actAPI1).then(actAPI1Callback => {
          if (actAPI1Callback !== undefined && actAPI1Callback.response.statusCode === 200)
            tools.Log(user.nickname, '活动任务', actLPLSgin, '已完成')
        })
        // 用户分享
        const actLPLShare = `${name}分享`
        const actAPI2: requestOptions = {
          method: 'POST',
          uri: `https://api.live.bilibili.com/xlive/general-interface/v1/lpl-task/MatchShare`,
          body: `game_type=${game_type}&csrf_token=${tools.getCookie(user.jar, 'bili_jct')}&csrf=${tools.getCookie(user.jar, 'bili_jct')}`,
          jar: user.jar,
          json: true
        }
        tools.XHR<generalCallback>(actAPI2).then(actAPI2Callback => {
          if (actAPI2Callback !== undefined && actAPI2Callback.response.statusCode === 200) {
            tools.Log(user.nickname, '活动任务', actLPLShare, '已完成')
          }
        })
      })
    })
  }
  private async _getEventInfo() {
    const url: requestOptions = {
      method: 'GET',
      uri: `https://raw.githubusercontent.com/Vector000/bilive_client/master/EventInfo.json`,
      json: true
    }
    await tools.XHR<generalCallback>(url).then(eventInfCallback => {
      if (eventInfCallback !== undefined && eventInfCallback.response.statusCode === 200) {
        this._eventInfo = eventInfCallback.response.body
      }
    })
  }
}

interface generalCallback {
  code: number
  msg: string
  ttl: number
}

interface EventInfo {
  lpl_task: lplParams[]
}

interface lplParams {
  name: string
  room_id: string
  game_type: string
  endTime: string
}

export default new AutoActTask()
