// onClicked action gives us the tab without any permissions needed.
chrome.browserAction.onClicked.addListener(copyTabLinkToClipboard);

chrome.commands.onCommand.addListener(function(command) {
  getActiveTab(copyTabLinkToClipboard);
});

function getActiveTab(callback) {
  requestPermissions('tabs', function() {
    chrome.tabs.query({
        lastFocusedWindow: true,
        active: true
      }, function(tab) {
        if (tab && tab.length > 0) {
          callback(tab[0]);
        } else {
          showNotification('Error', 'Unable to get link: No active tab.');
        }
      });
  });
}

function requestPermissions(permission, callback) {
  chrome.permissions.request({
    permissions: [permission]
  }, function(granted) {
    if (granted) {
      callback();
    } else {
      if (permission != "notifications") {
        showNotification('Error', 'Unable to get link: User rejected tabs permissions request.');
      } else {
        console.log('Unable to show the message: Notifications permissions rejected.');
      }
    }
  });
}

function showNotification(title, text) {
  requestPermissions('notifications', function() {
    var opt = {
      type: 'basic',
      title: title,
      message: text,
      iconUrl: 'icon.png'
    };
    chrome.notifications.create("", opt, function() {});
  });
}

function copyTabLinkToClipboard(tab) {
  var url = tab.url;
  var title = tab.title;
  console.log('Copying to clipboard', url, title);
  copyLinkToClipboard(url, title);
}

function copyLinkToClipboard(url, title) {
  var link = document.createElement('a');
  link.innerText = title;
  link.setAttribute('href', url);
  document.body.appendChild(link);
  try {
    link.focus();
    document.execCommand('SelectAll');
    document.execCommand("Copy", false, null);
    showNotification('Link is ready to be pasted', '"' + title + '" was copied to clipboard');
  } finally {
    link.remove();
  }
}