chrome.browserAction.onClicked.addListener(function(tab) {
  var url = tab.url;
  var title = tab.title;
  copyLinkToClipboard(url, title);
});

function copyLinkToClipboard(url, title) {
  var link = document.createElement('a');
  link.innerText = title;
  link.setAttribute('href', url);
  document.body.appendChild(link);
  try {
    link.focus();
    document.execCommand('SelectAll');
    document.execCommand("Copy", false, null);
  } finally {
    link.remove();
  }
}