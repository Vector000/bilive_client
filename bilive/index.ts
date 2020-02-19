import fs from 'fs'
import util from 'util'
import tools from './lib/tools'
import User from './online'
import WebAPI from './webapi'
import Listener from './listener'
import Options from './options'
const FSreadDir = util.promisify(fs.readdir)
/**
 * 主程序
 *
 * @class BiLive
 */
class BiLive {
  constructor() {}
  // 系统消息监听
  private _Listener!: Listener
  // WS服务器
  private _WebAPI!: WebAPI
  // 全局计时器
  private _lastTime = ''
  public loop!: NodeJS.Timer
  /**
   * 插件列表
   *
   * @private
   * @type {Map<string, IPlugin>}
   * @memberof BiLive
   */
  private _pluginList: Map<string, IPlugin> = new Map()
  /**
   * 开始主程序
   *
   * @memberof BiLive
   */
  public async Start() {
    await this._loadPlugin() // 加载插件
    Options.init() // 初始化设置
    Options.on('newUser', (user: User) => { // 新用户
      this._pluginList.forEach(async plugin => { // 运行插件
        if (typeof plugin.start === 'function')
          await plugin.start({ options: Options._, users: new Map([[user.uid, user]]) }, true)
      })
    })
    for (const uid in Options._.user) {
      if (!Options._.user[uid].status) continue
      const user = new User(uid, Options._.user[uid])
      const status = await user.Start()
      if (status !== undefined) user.Stop()
    }
    this._pluginList.forEach(async plugin => { // 运行插件
      if (typeof plugin.start === 'function')
        await plugin.start({ options: Options._, users: Options.user }, false)
    })
    this.loop = setInterval(() => this._loop(), 55 * 1000)
    this._WebAPI = new WebAPI()
    this._WebAPI
      .on('utilMSG', msg => this._Interact(msg))
      .Start()
    this.Listener()
  }
  /**
   * 计时器
   *
   * @private
   * @memberof BiLive
   */
  private _loop() {
    const csttime = Date.now() + 8 * 60 * 60 * 1000
    const cst = new Date(csttime)
    const cstString = cst.toUTCString().substr(17, 5) // 'HH:mm'
    if (cstString === this._lastTime) return
    this._lastTime = cstString
    const cstHour = cst.getUTCHours()
    const cstMin = cst.getUTCMinutes()
    if (Options._.config.localListener) this._Listener.updateAreaRoom() // 更新监听房间
    if (cstMin === 0 && cstHour % 12 === 0) Options.backup() // 每天备份两次
    this._Listener.clearAllID() // 清空ID缓存
    this._pluginList.forEach(plugin => { // 插件运行
      if (typeof plugin.loop === 'function') plugin.loop({ cst, cstMin, cstHour, cstString, options: Options._, users: Options.user })
    })
  }
  /**
   * 加载插件
   *
   * @private
   * @memberof BiLive
   */
  private async _loadPlugin() {
    const pluginsPath = __dirname + '/plugins'
    const plugins = await FSreadDir(pluginsPath)
    for (const pluginName of plugins) {
      const { default: plugin }: { default: IPlugin } = await import(`${pluginsPath}/${pluginName}/index.js`)
      if (typeof plugin.load === 'function') await plugin.load({ defaultOptions: Options._, whiteList: Options.whiteList })
      if (plugin.loaded) {
        const { name, description, version, author } = plugin
        tools.Log(`已加载: ${name}, 用于: ${description}, 版本: ${version}, 作者: ${author}`)
        this._pluginList.set(pluginName, plugin)
      }
      plugin.on('msg', async (msg: pluginNotify) => await this._Notify(msg))
      plugin.on('interact', async msg => await this._WebAPI.callback(msg))
    }
  }
  /**
   * 监听
   *
   * @memberof BiLive
   */
  public Listener() {
    this._Listener = new Listener()
    this._Listener
      .on('smallTV', (raffleMessage: raffleMessage) => this._Message(raffleMessage))
      .on('raffle', (raffleMessage: raffleMessage) => this._Message(raffleMessage))
      .on('lottery', (lotteryMessage: lotteryMessage) => this._Message(lotteryMessage))
      .on('pklottery', (lotteryMessage: lotteryMessage) => this._Message(lotteryMessage))
      .on('beatStorm', (beatStormMessage: beatStormMessage) => this._Message(beatStormMessage))
      .Start()
  }
  /**
   * 监听消息
   *
   * @private
   * @param {raffleMessage | lotteryMessage | beatStormMessage} raffleMessage
   * @memberof BiLive
   */
  private async _Message(raffleMessage: raffleMessage | lotteryMessage | beatStormMessage) {
    // 运行插件
    this._pluginList.forEach(async plugin => {
      if (typeof plugin.msg === 'function')
        await plugin.msg({ message: raffleMessage, options: Options._, users: Options.user })
    })
  }
  /**
   * 插件间通讯
   *
   * @private
   * @param {pluginNotify} msg
   * @memberof BiLive
   */
  private async _Notify(msg: pluginNotify) {
    this._pluginList.forEach(async plugin => {
      if (typeof plugin.notify === 'function')
        await plugin.notify({ msg, options: Options._, users: Options.user })
    })
  }
  /**
   * 前端页面交互
   *
   * @private
   * @param {utilMSG} msg
   * @memberof BiLive
   */
  private async _Interact(msg: utilMSG) {
    const plugin = this._pluginList.get(msg.utilID)
    if (plugin !== undefined && typeof plugin.interact === 'function')
      await plugin.interact({ msg: msg, options: Options._, users: Options.user })
  }
}
export default BiLive
