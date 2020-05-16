---
title: wechatforhash-加密货币矿业微信助手
[![Powered by Wechaty](https://img.shields.io/badge/Powered%20By-Wechaty-green.svg)](https://github.com/chatie/wechaty)
[![Wechaty开源激励计划](https://img.shields.io/badge/Wechaty-开源激励计划-green.svg)](https://github.com/juzibot/Welcome/wiki/Everything-about-Wechaty)
date: 2020-05-15 18:00 +0800
author: Kelly Cheng
---
> Author: [@hkenter](https://github.com/hkenter) 加密货币矿工
<!--more-->
## 背景
加密货币微信机器人在业界有过实现，大多基于币种行情，鲜有针对矿业矿工群体做消息响应的案例，
该机器人重点针对矿工群体进行矿机、算力、难度、币价等信息进行实现。

## wechatforhash希望解决的问题
- 针对矿机的各项指标信息响应（算力、功耗等）（已实现）
- 针对币价的实时价格查询（已实现）
- 矿机价格响应，或与矿业销售合作（计划实现）
- 算力、难度分析预测(计划实现)
- 矿池信息响应（计划实现）

## 业务分析与技术实现（基于已实现部分）
代码参见：[GitHub](https://github.com/hkenter/wechatforhash)
基于 [wechaty](https://github.com/hkenter/wechatforhash)
### 碎片化数据被动查询 ###
矿工在采购、置换矿机、计算与预测成本的过程中，需要频繁参阅币价、各项矿机参数、矿池数据、算力、难度等信息，
微信形式的碎片化响应，是一个比较合理的解决实现方式。

> 比如：
~通过查阅币价、功耗比、难度进行静态回本周期的计算
~通过询价获取矿机市场行情

实现方案：构建此类场景的查询关键词规则，入参查询并回复

### 定时任务做主动推送 ###
暂未具体规划
 
### 开发与生产环境 ###
生产环境基于centos 7.5，数据库mysql8.0.x。

> Tips：centos7.5安装wechaty需进行gcc相关组件的手动升级，比较繁琐，可自行百度。

 
## 结尾
wechatforhash 依然是一个正在开发中的项目, 欢迎留言交流你对它的看法
