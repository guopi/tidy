# tidyjs
    tidy typescript framework web framework for node

## 项目理念

1. 专为 typescript 设计，充分的type safe保障
2. Function 方式的 api 实现
    传统 framework，将每一个 api 是看成 Procedure，比如
    function api1(){
        resp.send(JSON.stringify({a:1,b:2}))
    }
    而 tidyjs，将每一个 api 看成一个 Function，比如
    function api1(){
        return {a:1,b:2}
    }
3. 对业务代码尽量少的侵入
4. 前端尽量能够共享代码（比如接口数据验证）

## 概念

ServerApp
api
    interface
    schema (类型，数据校验，等)
api 实现抽象为
    request => response
    
