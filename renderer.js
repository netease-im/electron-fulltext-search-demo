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

function doLog(err, obj) {
  console.log('receive: ', err, obj)
}

const ignoreChars = " \t\r\n~!@#$%^&*()_+-=【】、{}|;':\"，。、《》？αβγδεζηθικλμνξοπρστυφχψωΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ。，、；：？！…—·ˉ¨‘’“”々～‖∶＂＇｀｜〃〔〕〈〉《》「」『』．〖〗【】（）［］｛｝ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩⅪⅫ⒈⒉⒊⒋⒌⒍⒎⒏⒐⒑⒒⒓⒔⒕⒖⒗⒘⒙⒚⒛㈠㈡㈢㈣㈤㈥㈦㈧㈨㈩①②③④⑤⑥⑦⑧⑨⑩⑴⑵⑶⑷⑸⑹⑺⑻⑼⑽⑾⑿⒀⒁⒂⒃⒄⒅⒆⒇≈≡≠＝≤≥＜＞≮≯∷±＋－×÷／∫∮∝∞∧∨∑∏∪∩∈∵∴⊥∥∠⌒⊙≌∽√§№☆★○●◎◇◆□℃‰€■△▲※→←↑↓〓¤°＃＆＠＼︿＿￣―♂♀┌┍┎┐┑┒┓─┄┈├┝┞┟┠┡┢┣│┆┊┬┭┮┯┰┱┲┳┼┽┾┿╀╁╂╃└┕┖┗┘┙┚┛━┅┉┤┥┦┧┨┩┪┫┃┇┋┴┵┶┷┸┹┺┻╋╊╉╈╇╆╅╄";

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

async function deleteFts(_ids) {
  if (Object.prototype.toString.call(_ids) !== '[object Array]') {
    _ids = [_ids]
  }
  await searchDB.DELETE(_ids)
  console.log('成功删除：', _ids)
}

window.nim = SDK.NIM.getInstance({
  debug: true,
  appKey: 'fe416640c8e8a72734219e1847ad2547',
  account: 'cs6',
  token: 'e10adc3949ba59abbe56e057f20f883e',
  // db: form.db,
  // syncSessionUnread: form.syncSessionUnread,
  // autoMarkRead: form.syncSessionUnread,
  reconnectionDelay: 1000, // 在第一次尝试重连之前最初等待多长时间
  reconnectionDelayMax: 60000, // 重新连接之间等待的最大时间
  reconnectionJitter: 0, // 重连等待时间振荡值

  onconnect(obj) {
    console.log('连接建立成功', obj);
    // if (loginInfo) {
      // 连接上以后更新uid
      // commit('updateUserUID', loginInfo)
    // }
  },
  onerror() {
    // alert(JSON.stringify(event))
    // debugger
    console.error('error');
    // location.href = config.loginUrl
  },
  onwillreconnect(obj) {
    console.log(obj)
  },
  ondisconnect: function onDisconnect (error) {
    let map = {
      PC: '电脑版',
      Web: '网页版',
      Android: '手机版',
      iOS: '手机版',
      WindowsPhone: '手机版'
    }
    let str = error.from
    let errorMsg = `你的帐号于${new Date()}被${(map[str] || '其他端')}踢出下线，请确定帐号信息安全!`
    switch (error.code) {
      // 账号或者密码错误, 请跳转到登录页面并提示错误
      case 302:
        console.log('帐号或密码错误');
        break
      // 被踢, 请提示错误后跳转到登录页面
      case 'kicked':
        console.log('被踢')
        break
      default:
        console.error(error);
        break
    }
  },

  /* 关系（静默，黑名单）及好友，同步及更新 */
  onfriends: doLog,
  onsyncfriendaction: doLog,
  // onmutelist: doLog,
  // onsyncmarkinmutelist: doLog,
  onblacklist: doLog,
  onsyncmarkinblacklist: doLog,

  /* 用户信息/名片，同步及更新 */
  onmyinfo: doLog,
  onupdatemyinfo: doLog,
  onusers: doLog,
  onupdateuser: doLog,

  /* 群组信息，同步及更新 */
  onteams: doLog,
  onsynccreateteam: doLog,
  onteammembers: doLog,
  onCreateTeam: doLog,
  onDismissTeam: doLog,
  onUpdateTeam: doLog,
  onAddTeamMembers: doLog,
  onRemoveTeamMembers: doLog,
  onUpdateTeamManagers: doLog,
  onupdateteammember: doLog,
  onUpdateTeamMembersMute: doLog,
  onTeamMsgReceipt: doLog,

  /* 超级群，同步及更新 */
  onSuperTeams: doLog,
  onSyncCreateSuperTeam: doLog,
  onUpdateSuperTeam: doLog,
  onUpdateSuperTeamMember: doLog,
  onAddSuperTeamMembers: doLog,
  onRemoveSuperTeamMembers: doLog,
  onDismissSuperTeam: doLog,
  // onTransferSuperTeam: doLog,
  onUpdateSuperTeamMembersMute: doLog,

  /* 会话 */
  onsessions: doLog,
  onupdatesession: doLog,

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

  /* 系统通知 */
  onsysmsg: doLog,
  onofflinesysmsgs: doLog,
  onupdatesysmsg: doLog,
  onsysmsgunread: doLog,
  onupdatesysmsgunread: doLog,
  onofflinecustomsysmsgs: doLog,
  oncustomsysmsg: doLog,

  onStickTopSessions: function(session) {
    console.log('收到置顶会话列表', session);
  },

  /* 同步完成 */
  onsyncdone: function onSyncDone () {
    // store.commit('setLoading', false)
    console.log('onsyncdone')
  }
});


// window.nim.sendText({
//   scene: 'p2p',
//   to: 'cs2',
//   text: '春眠不觉晓',
//   done(err, obj) {
//     if (err) return
//     // 发送失败的时候可能无 idClient
//     if (!obj.idClient) return
//     putFts(obj)
//   }
// })
