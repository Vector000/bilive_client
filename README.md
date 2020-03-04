# bilive_client

[![Node.js](https://img.shields.io/badge/Node.js-v10.0%2B-green.svg)](https://nodejs.org)
[![Commitizen friendly](https://img.shields.io/badge/Commitizen-Friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
![GitHub repo size](https://img.shields.io/github/repo-size/Vector000/bilive_client.svg)
[![MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/Vector000/bilive_client/blob/2.1.0-beta/LICENSE)

* 这是一个次分支，感谢所有对[主分支](https://github.com/lzghzr/bilive_client)做出贡献的人及其他同类开源软件的开发者
* 有兴趣支持原作者的，请朝这里打钱=>[给lzghzr打钱](https://github.com/lzghzr/bilive_client/wiki)
* 有兴趣向我投喂的，请朝这里打钱=>[请给我钱](https://github.com/Vector000/Something_Serious/blob/master/pics/mm_reward_qrcode.png)
* 感谢大佬的推荐！趴 _(:3」∠)_

## 使用方法

1. 安装[Node.js](https://nodejs.org/)，建议使用LTS版本
2. 安装[Git](https://git-scm.com/downloads)
3. 在命令行中定位到想要安装的目录
4. `git clone https://github.com/Vector000/bilive_client.git`
5. `cd bilive_client` 进入程序主目录
6. `npm i` 或 `npm install` 安装依赖包
7. `npm i -g pm2`(自动更新所需，可忽略)
8. `npm run build` 第一次启动需进行手动编译
9. `npm start`(直接启动) 或 `pm2 start`(通过PM2后台启动)

## 手动更新(从旧版本更新)

1. 定位到`bilive_client`目录下
2. `git pull` 拉取更新
3. `npm i` 或 `npm install` 检查更新依赖包
4. `npm run build` 手动进行编译
5. `npm start` 或 `pm2 start`

更新之后可能会出现不兼容的情况(或者bug)，可删去`options/options.json`后重新进行账号设置

可使用网页设置：[点此进行设置](http://vector000.coding.me/bilive_setting/)(因为GitHub Page强行开启HTTPS，故使用tx的服务)\
推荐使用`docs/index.html`进行本地设置

## PM2

可使用PM2在后台启动挂机进程，无需终端常驻，并可通过`pm2 restart bilive_client`来进行重启
之所以用PM2做更新，是觉得PM2比较好用，而且重启方便，还能导出日志
后面可能会引入一个类似于子进程触发更新的机制，顺便看看做release的话有没有什么好的更新方法

## 设置相关

~~服务器挂机用户可通过防火墙设置来开启远程设置，但由此产生的信息泄露及其他风险请自行承担~~

* 现在提供了远程连接数据加密的功能，默认关闭（无密钥）
* 需要打开的用户可以在设置页面中设置密钥（建议最好是直接修改json）

## HttpApi 相关
请求地址 => http(s)://ip:你设置的端口(options.server.port)/api

请求方式 => POST

请求参数 => Header 包含 authorization 值为 options.server.protocol

具体接口和参数与 ws 操作一致，返回内容一致，具体传入和传出参数请参照 [webapi.ts](./blob/master/bilive/webapi.ts)


目前有
```json
{
    "getLog": "获取日志",
    "getConfig": "获取配置",
    "setConfig": "设置配置",
    "getAdvConfig": "获取高级设置",
    "setAdvConfig": "设置高级设置",
    "setNewNetkey": "修改密钥",
    "getInfo": "获取参数描述",
    "getAllUID": "获取uid",
    "getUserData": "获取用户配置",
    "setUserData": "设置用户配置",
    "delUserData": "删除用户",
    "newUserData": "新增用户",
    "getAllUtilID": "获取util ID",
    "getUtilData": "获取utilData",
    "utilMSG": "接收util数据，触发对应util"
}
```

## 服务端相关

* [原作者](https://github.com/lzghzr/)大佬的服务器11月到期，现提供一个备用服务端`ws://47.101.153.223:20080/#ff5f0db2548baecbcd21c7a50ece57a3`，目前续费到12月，后续应该也会继续续上(无限+1s)，欢迎各种花式投喂

## 使用releases

~~不存在的，不存在的，永远也不会发release的~~
最近有个想法，可能会做release

## Features

* 定时查询挂机信息，支持微信推送
* 自动送礼V2，自动升勋章
* 本地多分区监听(无ws服务端时可用，只支持广播类抽奖)
* 用户被封禁后停抽并通知(每两小时检测)
* 主站任务(登录/观看/投币)，支持指定投币对象
* 云监听服务器，大幅降低漏抽
* 多次参与节奏风暴
* 参与大乱斗抽奖功能
* 自动更新
* 购买主播勋章功能
* 查询全站用户信息功能
* PM2 Support

## TO-DO

* 优化更新逻辑
* 做release
* 想做点交互，但是不知道能设计什么功能，可能搞个弹幕姬
