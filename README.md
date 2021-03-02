# ELECTRON-FULLTEXT-SEARCH-DEMO

electron fulltext demo by [search-index](https://github.com/fergiemcdowall/search-index), support Chinese

node 12+
## how to start

git clone 后

```
> npm install

> npm run start
```

## 结合 NIM 接入全文索引

参照 renderer.js

1. 引入并初始化，打开 search-index 数据库

```js
var nodejieba = window.require('nodejieba');
const si = require('search-index')
var SDK = require('./lib/NIM_Web_SDK_v8.3.0_test')

let searchDB

si({
  name: 'ELECTRON-FULLTEXT-SEARCH-DB',
  storeVectors: true
}).then((result) => {
  searchDB = result;
})
```

2. 定义存、取函数

```js
// 用于过滤无意义的符号
const ignoreChars = " \t\r\n~!@#$%^&*()_+-=【】、{}|;':\"，。、《》？αβγδεζηθικλμνξοπρστυφχψωΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ。，、；：？！…—·ˉ¨‘’“”々～‖∶＂＇｀｜〃〔〕〈〉《》「」『』．〖〗【】（）［］｛｝ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩⅪⅫ⒈⒉⒊⒋⒌⒍⒎⒏⒐⒑⒒⒓⒔⒕⒖⒗⒘⒙⒚⒛㈠㈡㈢㈣㈤㈥㈦㈧㈨㈩①②③④⑤⑥⑦⑧⑨⑩⑴⑵⑶⑷⑸⑹⑺⑻⑼⑽⑾⑿⒀⒁⒂⒃⒄⒅⒆⒇≈≡≠＝≤≥＜＞≮≯∷±＋－×÷／∫∮∝∞∧∨∑∏∪∩∈∵∴⊥∥∠⌒⊙≌∽√§№☆★○●◎◇◆□℃‰€■△▲※→←↑↓〓¤°＃＆＠＼︿＿￣―♂♀┌┍┎┐┑┒┓─┄┈├┝┞┟┠┡┢┣│┆┊┬┭┮┯┰┱┲┳┼┽┾┿╀╁╂╃└┕┖┗┘┙┚┛━┅┉┤┥┦┧┨┩┪┫┃┇┋┴┵┶┷┸┹┺┻╋╊╉╈╇╆╅╄";

// 增，改
async function putFts(msgs) {
  if (Object.prototype.toString.call(msgs) !== '[object Array]') {
    msgs = [msgs]
  }
  // 分词，并过滤无意义的符号
  var fts = msgs.filter(msg => msg.text && msg.idClient).map(msg => ({
    idx: nodejieba.cut(msg.text).filter(word => !ignoreChars.includes(word)),
    _id: msg.idClient
  }))
  await searchDB.PUT(fts);
  console.log('search-index save success ', fts)
}

// 查
async function queryFts(text, limit = 100) {
  var searchParams = nodejieba.cut(text).filter(word => !ignoreChars.includes(word))
  let records = await searchDB.QUERY({
    SEARCH: searchParams
  })
  let idClients = records.RESULT.map(item => item._id).slice(0, limit);
  if (!idClients) {
    console.log('查询本地消息，无匹配词')
    return;
  }
  window.nim.getLocalMsgsByIdClients({
    idClients,
    done: function (err, obj) {
      console.log('查询本地消息' + (!err ? '成功' : '失败'), err, obj);
    }
  })
}

// 删
async function deleteFts(_ids) {
  if (Object.prototype.toString.call(_ids) !== '[object Array]') {
    _ids = [_ids]
  }
  await searchDB.DELETE(_ids)
  console.log('成功删除：', _ids)
}
```

3. SDK 初始化，接收消息事件拦截

```js
window.nim = SDK.NIM.getInstance({
  debug: true,
  appKey: '******',
  account: '******',
  token: '******',

  // ...... 省略其他参数声明

  /* 消息 */
  onroamingmsgs: function(obj) {
    putFts(obj)
  },
  onofflinemsgs: function(obj) {
    putFts(obj)
  },
  onmsg: function(obj) {
    putFts(obj)
  },

  // ...... 省略其他参数声明
});
```

4. 处理调用会更改本地 msgs 的逻辑

```js
// 发送逻辑
window.nim.sendText({
  scene: 'p2p',
  to: '******',
  text: '春眠不觉晓',
  done(err, obj) {
    if (err) return
    // 发送失败的时候可能无 idClient
    if (!obj.idClient) return
    putFts(obj)
  }
})

// 直接插入本地消息
window.nim.saveMsgsToLocal({
  msgs: msgs,
  done(err, obj) {
    if (err) return
    putFts(obj)
  }
})

// 撤回消息
window.nim.deleteMsg({
  msg: {
    scene: "p2p",
    sessionId: "p2p-******",
    idClient: 'ef1a89e0aaa*******12391d7db22849'
  },
  done(err, obj) {
    if (err) return
    // 删除该 idClient 的记录
    deleteFts('ef1a89e0aaa*******12391d7db22849')
  }
})

// 本地删除消息
window.nim.deleteLocalMsg({
  msg: {
    scene: "p2p",
    sessionId: "p2p-******",
    idClient: 'ef1a89e0aaa*******12391d7db22849'
  },
  done(err, obj) {
    if (err) return
    // 删除该 idClient 的记录
    deleteFts('ef1a89e0aaa*******12391d7db22849')
  }
});
```

5. 若是希望拉取数据库存量的 msg 记录做索引，可尝试使用 getLocalMsgs 获取本地消息。

```js
window.nim.getLocalMsgs({
  // 30 天前
  start: new Date().getTime() - 1000 * 60 * 60 * 24 * 30,
  end: new Date().getTime(),
  limit: Infinity,
  done(err, obj) {
    if (err) return
    // 删除该 idClient 的记录
    putFts(obj.msgs)
  }
});
```

附 [search-index API 文档](https://github.com/fergiemcdowall/search-index) 其他常用的 api 说明

```
// 清除 search-index 中所有记录项
searchDB.FLUSH().then(console.log)

// 打印所有 searchDB 中的记录项
searchDB.ALL_DOCUMENTS().then(console.log)
```

## Question

1. 加入切换了账号登录，账号间的数据怎么做隔离

si 的 name 代表这打开哪个数据库，换个数据库名存储。

```js
const si = require('search-index')

let searchDB

si({
  name: 'ELECTRON-FULLTEXT-SEARCH-DB-WITH-YOUR-ACCOUNT',
  storeVectors: true
}).then((result) => {
  searchDB = result;
})
```
## reference resources

* [nodejieba](https://github.com/yanyiwu/nodejieba)
* [search-index](https://github.com/fergiemcdowall/search-index)
* [How to access Google Chrome's IndexedDB/LevelDB files?](https://stackoverflow.com/questions/35074659/how-to-access-google-chromes-indexeddb-leveldb-files)

