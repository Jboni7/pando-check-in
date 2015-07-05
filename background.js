// 一个好奇怪的问题。。
// 在windows chrome下如果manifest不设置background，browser action时鼠标指针总会转菊花，popup有明显延迟
// 如果你知道原因记得告诉我哦！

chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason == 'install') {
    var url = 'chrome-extension://' + chrome.runtime.id + '/readme.html';

    chrome.tabs.create({
      url   : url,
      active: true
    });
  }
});
