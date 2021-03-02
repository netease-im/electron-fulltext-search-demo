// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.

var Mock = window.require('mockjs');
var nodejieba = window.require('nodejieba');
var result = nodejieba.cut('一个南京市长江大桥');
console.log('~~~~~~~', result);

const si = require('search-index')

let searchDB

si({
  name: 'ELECTRON-FULLTEXT-SEARCH-DB'
}).then((result) => {
  searchDB = result;
})

// 大约是 1369.73 MB

const ignoreChars = " \t\r\n~!@#$%^&*()_+-=【】、{}|;':\"，。、《》？αβγδεζηθικλμνξοπρστυφχψωΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ。，、；：？！…—·ˉ¨‘’“”々～‖∶＂＇｀｜〃〔〕〈〉《》「」『』．〖〗【】（）［］｛｝ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩⅪⅫ⒈⒉⒊⒋⒌⒍⒎⒏⒐⒑⒒⒓⒔⒕⒖⒗⒘⒙⒚⒛㈠㈡㈢㈣㈤㈥㈦㈧㈨㈩①②③④⑤⑥⑦⑧⑨⑩⑴⑵⑶⑷⑸⑹⑺⑻⑼⑽⑾⑿⒀⒁⒂⒃⒄⒅⒆⒇≈≡≠＝≤≥＜＞≮≯∷±＋－×÷／∫∮∝∞∧∨∑∏∪∩∈∵∴⊥∥∠⌒⊙≌∽√§№☆★○●◎◇◆□℃‰€■△▲※→←↑↓〓¤°＃＆＠＼︿＿￣―♂♀┌┍┎┐┑┒┓─┄┈├┝┞┟┠┡┢┣│┆┊┬┭┮┯┰┱┲┳┼┽┾┿╀╁╂╃└┕┖┗┘┙┚┛━┅┉┤┥┦┧┨┩┪┫┃┇┋┴┵┶┷┸┹┺┻╋╊╉╈╇╆╅╄";

// 这样一条 msg，大概是 2.11857421875 kb，那么 200mb 的 db 乐观估计是十万条。
var obj = {
  cc: true,
  "flow|1": [
    "out",
    "in",
  ],
  "from|1": [
    "cjhz1",
    "wangsitu1",
    "cs1",
    "cs2",
    "cs3",
    "cs4"
  ],
  "fromClientType|1": [
    "Web",
    "Android",
    "IOS"
  ],
  "fromDeviceId|1": [
    "2fb0d8c26d874a4790a92719a186bea0",
    "3ab0ddc2rtjk4a4790a92719o98jbAa1",
    "4ab0ddc2rtjk4a4790a92719o98jbAa1",
  ],
  "fromNick|1": [
    "cjhz1",
    "wangsitu1",
    "cs1",
    "cs2",
    "cs3",
    "cs4"
  ],
  "idClient": /\w{32}/,
  "idServer": /\d{12}/,
  isHistoryable: true,
  isLocal: false,
  isOfflinable: true,
  isPushable: true,
  isReplyMsg: true,
  isRoamingable: true,
  isSyncable: true,
  isUnreadable: true,
  needMsgReceipt: false,
  needPushNick: true,
  resend: false,
  scene: "p2p",
  "sessionId": /p2p-cs\d{3}/,
  status: "success",
  "target|1": [
    "cjhz1",
    "wangsitu1",
    "cs1",
    "cs2",
    "cs3",
    "cs4"
  ],
  text: Mock.Random.cparagraph(2, 10),
  "time|1600000000000-1700000000000": 1,
  "to|1": [
    "cjhz1",
    "wangsitu1",
    "cs1",
    "cs2",
    "cs3",
    "cs4"
  ],
  type: "text",
  "userUpdateTime|1600000000000-1700000000000": 1
}

var request = window.indexedDB.open('nim-cjhz2');
var db;

request.onerror = function (event) {
  console.log('数据库打开报错', event);
};

request.onsuccess = function (event) {
  db = request.result;
  console.log('数据库打开成功，拥有三个方法：writeData、readByKeyword、readByPrimary、printUseSize');
};

request.onupgradeneeded = function (event) {
  db = event.target.result;
  var objectStore;
  console.log('onupgradeneeded：', db.objectStoreNames);
  if (!db.objectStoreNames.contains('msg1')) {
    var objectStore = db.createObjectStore(
      'msg1',
      // { keyPath: 'id', autoIncrement: true }
      { keyPath: 'idClient' }
    );
    objectStore.createIndex('idx_idClient', 'idClient', { unique: true });
    // objectStore.createIndex('idx_fulltext', 'terms', { multiEntry: true });
  }
}

function readByPrimary(id) {
  var transaction = db.transaction(['msg1']);
  var objectStore = transaction.objectStore('msg1');
  var request = objectStore.get(id);

  console.time('readByPrimary last')
  request.onerror = function(event) {
    console.log('事务失败');
  };

  request.onsuccess = function(event) {
    console.timeEnd('readByPrimary last')
    if (request.result) {
      console.log('GET: ', request.result);
    } else {
      console.log('未获得数据记录');
    }
  };
}

async function readByKeyword(text, limit) {
  // var transaction = db.transaction(['msg1']);
  // var objectStore = transaction.objectStore('msg1');
  // var index = objectStore.index('idx_fulltext');

  console.time('readByKeyword last')
  // FullText.search(index, text, 'ch', ids => {
  //   console.log('query:', text, 'results:', ids);
  //   console.timeEnd('readByKeyword last')
  // }, limit)

  // searchDB.INDEX.STORE.clear()  清除所有
  var searchParams = nodejieba.cut(text).filter(word => !ignoreChars.includes(word))
  await searchDB.QUERY({
    SEARCH: searchParams
  }).then(console.log)
  console.timeEnd('readByKeyword last')
}

function writeData(num = 100) {
  var transaction = db.transaction(['msg1'], 'readwrite');
  var objectStore = transaction.objectStore('msg1');

  console.log('写事务开始：');

  let tempTime = new Date().getTime()

  let fts = []

  for (let i = 0; i < num; i++) {
    let temp = Mock.mock(obj)
    let text = Mock.Random.cparagraph(2, 10);
    fts.push({
      _id: temp.idClient,
      idx: nodejieba.cut(text).filter(word => !ignoreChars.includes(word))
    })
    objectStore.add({
      ...temp,
      text: text
      // terms: FullText.tokenize(temp.text, 'ch').filter(word => !ignoreChars.includes(word))
      // terms: nodejieba.cut(temp.text).filter(word => !ignoreChars.includes(word))
    });
  }

  searchDB.PUT(fts).then(() => {
    console.log('search-index save success, last: ', new Date().getTime() - tempTime)
  });

  // do add 100 times
  transaction.oncomplete = function (event) {
    console.log('transaction success, writeData last: ', new Date().getTime() - tempTime);
  };

  transaction.onerror = function (event) {
    console.log('transaction error: ' + transaction.error);
  };

}

async function printUseSize() {
  var obj = await navigator.storage.estimate();
  var size = (obj.usageDetails.indexedDB / 1024 / 1024).toFixed(2);
  console.log(`${size} MB`)
}
