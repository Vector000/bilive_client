import { EventEmitter } from 'events'
import fs from 'fs'
import util from 'util'
import tools from './lib/tools'
const FSwriteFile = util.promisify(fs.writeFile)
/**
* 统一设置
*
* @class Options
* @extends {EventEmitter}
*/
class Options extends EventEmitter {
  constructor() {
    super()
    this._dirname = __dirname + '/../'
    // 检查是否有options目录
    const hasDir = fs.existsSync(this._dirname + 'options/')
    if (!hasDir) fs.mkdirSync(this._dirname + 'options/')
    // 读取默认设置文件
    const defaultOptionBuffer = fs.readFileSync(this._dirname + 'build/options.default.json')
    this._ = <options>JSON.parse(defaultOptionBuffer.toString())
    this._.util = {}
    // 复制默认设置文件到用户设置文件
    const hasFile = fs.existsSync(this._dirname + 'options/options.json')
    if (!hasFile) fs.copyFileSync(this._dirname + 'build/options.default.json', this._dirname + 'options/options.json')
    // 读取用户设置文件
    const userOptionBuffer = fs.readFileSync(this._dirname + 'options/options.json')
    this._userOption = this._
    if (this.isValidJSON(userOptionBuffer.toString())) {
      this._userOption = <options>JSON.parse(userOptionBuffer.toString())
    }
    else this.restore()
    if (this._ === undefined || this._userOption === undefined) throw new TypeError('文件格式化失败')
    this.backup()
  }
  /**
   * 用户设置
   *
   * @private
   * @type {options}
   * @memberof Options
   */
  private _userOption: options
  /**
   * 原始数据
   *
   * @type {options}
   * @memberof Options
   */
  public _: options
  /**
   * 有效用户列表
   *
   * @type {Map<string, User>}
   * @memberof Options
   */
  public user: Map<string, User> = new Map()
  /**
   * 设置白名单
   *
   * @type {Set<string>}
   * @memberof Options
   */
  public whiteList: Set<string> = new Set([
    'server',
    'path',
    'hostname',
    'port',
    'protocol',
    'netkey',
    'config',
    'advConfig',
    'localListener',
    'defaultUserID',
    'serverURL',
    'bakServerURL',
    'eventRooms',
    'user',
    'nickname',
    'userName',
    'passWord',
    'biliUID',
    'accessToken',
    'refreshToken',
    'cookie',
    'status'
  ])
  /**
   *文件真实路径
   *
   * @private
   * @type {string}
   * @memberof Options
   */
  private _dirname: string
  public shortRoomID = new Map<number, number>()
  public longRoomID = new Map<number, number>()
  /**
   * 合并设置
   *
   * @memberof Options
   */
  public init() {
    this._.server = Object.assign({}, this._.server, this._userOption.server)
    this._.config = Object.assign({}, this._.config, this._userOption.config)
    this._.advConfig = Object.assign({}, this._.advConfig, this._userOption.advConfig)
    for (const uid in this._userOption.user) {
      this.whiteList.add(uid)
      this._.user[uid] = Object.assign({}, this._.newUserData, this._userOption.user[uid])
    }
    this._.roomList.forEach(([long, short]) => {
      this.shortRoomID.set(long, short)
      this.longRoomID.set(short, long)
    })
  }
  /**
   * 获取短id
   *
   * @param {number} roomID
   * @returns {number}
   * @memberof Options
   */
  public getShortRoomID(roomID: number): number {
    return this.shortRoomID.get(roomID) || roomID
  }
  /**
   * 获取长id
   *
   * @param {number} roomID
   * @returns {number}
   * @memberof Options
   */
  public getLongRoomID(roomID: number): number {
    return this.longRoomID.get(roomID) || roomID
  }
  /**
   * 验证JSON可读性
   * 
   * @returns
   * @memberof Options
   */
  private isValidJSON(string: string) {
    try {
      <options>JSON.parse(string)
      return true
    } catch (error) {
      console.log(error)
      return false
    }
  }
  /**
   * 保存设置
   *
   * @returns
   * @memberof Options
   */
  public async save() {
    // const blacklist = ['newUserData', 'info', 'roomList']
    const error = await FSwriteFile(this._dirname + '/options/options.json'
      , JSON.stringify(this._, (key, value) => (key.match(/^\d*$/) !== null || this.whiteList.has(key)) ? value : undefined, 2))
    if (error !== undefined) console.error(`${new Date().toString().slice(4, 24)} :`, error)
    return this._
  }
  /**
   * 备份设置文件
   * 
   * @memberof Options
   */
  public async backup() {
    fs.copyFileSync(this._dirname + 'options/options.json', this._dirname + 'options/options.bak')
    tools.Log('成功备份options.json')
  }
  /**
   * 还原设置文件
   * 
   * @memberof Options
   */
  public async restore() {
    tools.Log('options.json似乎已损坏，将尝试进行还原...')
    if (fs.existsSync(this._dirname + 'options/options.bak')) {
      const backupString = fs.readFileSync(this._dirname + 'options/options.bak').toString()
      fs.copyFileSync(this._dirname + 'options/options.bak', this._dirname + 'options/options.json')
      this._userOption = <options>JSON.parse(backupString)
      this.init()
      tools.Log('已成功恢复options.json')
    }
    else return tools.ErrorLog('未找到备份文件，请重新进行设置!')
  }
}
// 自定义一些常量
const liveOrigin = 'https://live.bilibili.com'
const apiOrigin = 'https://api.bilibili.com'
const apiVCOrigin = 'https://api.vc.bilibili.com'
const apiLiveOrigin = 'https://api.live.bilibili.com'
const beatStormPathname = '/lottery/v1/Storm'
export default new Options()
export { Options as __Options, liveOrigin, apiOrigin, apiVCOrigin, apiLiveOrigin, beatStormPathname }
