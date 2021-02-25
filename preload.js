// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.

var nodejieba = require('nodejieba');
var result = nodejieba.cut('南京市长江大桥');

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type])
  }

  var segmentView = document.getElementById('segment-result')
  segmentView.innerHTML = result;
})
