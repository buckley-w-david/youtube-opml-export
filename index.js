// ==UserScript==
// @name         Export YouTube Subscriptions to RSS OPML
// @namespace    https://github.com/buckley-w-david/youtube-opml-export/
// @version      1.6
// @description  Adds the option to export subscriptions from YouTube as an OPML file of RSS feeds.
// @author       Gavin Borg & David Buckley
// @match        https://www.youtube.com/feed/channels
// @grant        GM_registerMenuCommand
// @grant        GM.registerMenuCommand
// ==/UserScript==

async function exportSubscriptions() {
  var promises = []

  document.querySelectorAll("ytd-channel-renderer a#main-link.channel-link").forEach((channel) => {
    promises.push(new Promise(function (resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({
            "title": channel.querySelector("ytd-channel-name").innerText,
            "url": xhr.responseXML.querySelector('body > link[title = "RSS"]').href
          })
        } else {
          reject({
            status: xhr.status,
            statusText: xhr.statusText
          })
        }
      }
      xhr.open("GET", channel.href);
      xhr.responseType = "document";
      xhr.send();
    }))
  })
    
  Promise.all(promises).then(channels => {
    // Build download link and click it
    var xml = buildXML(channels);
    var fileType = "text/plain";
    var blob = new Blob([xml], {type: fileType});
    var blobURL = window.URL.createObjectURL(blob);
    var filename = "youtubeSubscriptions.opml";
    var downloadLink = document.createElement("a");
    downloadLink.setAttribute("href", blobURL);
    downloadLink.setAttribute("download", filename);
    downloadLink.dataset.downloadurl = fileType + ":" + filename + ":" + blobURL;
    downloadLink.click();
  })
}


function buildXML(channels) {
   // Goal structure:
   //  <opml version="1.0">
   //   <head>
   //   <title>YouTube Subscriptions as RSS</title>
   //   </head>
   //   <body>
   //   <outline text="YouTube Subscriptions" title="YouTube Subscriptions">
   //    <outline type="rss" text="" title="" xmlURL="" />
   //    ...
   //   </outline>
   //   </body>
   //  </opml>

   var xmlDoc = document.implementation.createDocument("", "", null);
   var opml = xmlDoc.createElement("opml");
   opml.setAttribute("version", "1.0");

   var head = xmlDoc.createElement("head");
   var title = xmlDoc.createElement("title");
   title.innerHTML = "YouTube Subscriptions as RSS";
   head.appendChild(title);
   opml.appendChild(head);

   var body = xmlDoc.createElement("body");
   var parentOutline = xmlDoc.createElement("outline");
   parentOutline.setAttribute("text", "YouTube Subscriptions")
   parentOutline.setAttribute("title", "YouTube Subscriptions")

   for(var j = 0; j < channels.length; j++) {
      var outline = xmlDoc.createElement("outline");
      outline.setAttribute("type", "rss");
      outline.setAttribute("text", channels[j].title);
      outline.setAttribute("title", channels[j].title);
      outline.setAttribute("xmlUrl", channels[j].url);
      parentOutline.appendChild(outline);
   }

   body.appendChild(parentOutline);

   opml.appendChild(body);
   xmlDoc.appendChild(opml);

   var s = new XMLSerializer();
   return s.serializeToString(xmlDoc);
}

// Support both Greasemonkey and others (Greasemonkey check must come first because it can't handle checking if GM_registerMenuCommand exists without crashing)
if(GM.registerMenuCommand) {
    GM.registerMenuCommand("Export YouTube Subscriptions to OPML", exportSubscriptions, "x");
}
else {
    GM_registerMenuCommand("Export YouTube Subscriptions to OPML", exportSubscriptions, "x");
}
