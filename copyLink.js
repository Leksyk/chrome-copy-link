// onClicked action gives us the tab without any permissions needed.
chrome.browserAction.onClicked.addListener(function(tab) {
  emitCopyEvent('html-copy-link', 'icon');
  copyTabLinkToClipboard(tab, true);
});

chrome.commands.onCommand.addListener(function(command) {
  switch (command) {
    case 'copy-link':
      emitCopyEvent('html-copy-link', 'shortcut');
      getActiveTab(function(tab) {
        return copyTabLinkToClipboard(tab, true);
      });
      break;

    case 'copy-as-plain':
      emitCopyEvent('copy-plain-text', 'shortcut');
      getActiveTab(function(tab) {
        return copyTabLinkToClipboard(tab, False);
      })

    default:
      throw new Error('Unknown command: ' + command);
  }
});

function setupGoogleAnalytics() {
  if (!window.ga) {
    (function(){
      window.ga = function() {
        (window.ga.q = window.ga.q || []).push(arguments);
      }, window.ga.l = 1 * new Date();
      var tag = 'script';
      var a = document.createElement(tag);
      var m = document.getElementsByTagName(tag)[0];
      a.async = 1;
      a.src = 'https://www.google-analytics.com/analytics.js';
      m.parentNode.insertBefore(a, m);
    })();
    ga('create', 'UA-61069739-1', 'auto');
    ga('set', 'checkProtocolTask', null);
  }
}

function analyticsEvent(category, action, opt_label, opt_value) {
  console.log('ga', arguments);
  setupGoogleAnalytics();
  ga('send', {
      'hitType': 'event',
      'eventCategory': category,
      'eventAction': action,
      'eventLabel': opt_label,
      'eventValue': opt_value
  });
}

// Number of copy actions made so far within this session.
var numCopyActions = 0;

function emitCopyEvent(method, source) {
  numCopyActions += 1;
  analyticsEvent('copy', method, source, numCopyActions);
}

function emitPermissionsEvent(permissions, granted) {
  category = granted ? 'permissions-granted' : 'permissions-rejected';
  analyticsEvent(category, permissions, permissions);
}

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
      emitPermissionsEvent(permission, true);
      callback();
    } else {
      emitPermissionsEvent(permission, false);
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

function copyTabLinkToClipboard(tab, as_html) {
  var url = tab.url;
  var title = tab.title;
  console.log('Copying to clipboard', url, title);
  if (as_html) {
    copyLinkToClipboard(url, title);
  } else {
    copyLinkAsPlainTextToClipboard(url, title);
  }
}

function copyLinkAsPlainTextToClipboard(url, title) {
  var span = document.createElement('span');
  span.innerText = title + ' ' + url;
  document.body.appendChild(span);
  try {
    span.focus();
    document.execCommand('SelectAll');
    document.execCommand("Copy", false, null);
    showNotification('Link is ready to be pasted', '"' + title + '" was copied to clipboard');
  } finally {
    span.remove();
  }
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

function copyAsPlainText(tab) {
  emitCopyEvent('copy-plain-text', 'menu');
  copyTabLinkToClipboard(tab, false);
}

COPY_AS_PLAIN_MENU_ITEM_ID = 'CopyAsPlainText';

chrome.contextMenus.removeAll();
chrome.contextMenus.create({
  id: COPY_AS_PLAIN_MENU_ITEM_ID,
  title: "Copy Link and Title as Plain Text",
  contexts: ["browser_action"],
});

chrome.contextMenus.onClicked.addListener(function(info, tab) {
  switch (info.menuItemId) {
    case COPY_AS_PLAIN_MENU_ITEM_ID:
      copyAsPlainText(tab);
      break;

    default:
      throw Error('Unknown menu item' + info.menuItemId);
  }
});