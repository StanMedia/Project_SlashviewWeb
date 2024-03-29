﻿$(function () {
  /* ***** 環境變數鑑別區 *****
   * 1. 利用Javascript來識別一些執行期會想要知道的參數，以利進行對應的動作
   * 2. 未必可以100%正確識別，但盡量完成就是了
   * ************************** */

  //是否為本機網站
  let bIsLocalhost = false;
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") { bIsLocalhost = true; }

  //是否為GoogleBot
  let bIsGoogleBot = false;
  if (/Googlebot/.test(window.navigator.userAgent)) { bIsGoogleBot = true; }

  //是否為內容頁面
  //利用正規表示式自網址取得日期參數
  let regDate = window.location.href.match(/(\d{4})(\d{2})(\d{2})\.html/);
  //藉由是否存在日期參數來認定是否為內容頁
  let bIsContentPage = false;
  if (regDate) { bIsContentPage = true; }
  //預先建立解構參數，讓後續的程式碼運用
  let cYear, cMonth, cDay;
  if (bIsContentPage) {
    [, cYear, cMonth, cDay] = regDate;
  }

  /* ***** 版面內容增補 *****
   * 1. 因為免費雲端主機的空間有限，因此越縮減主體靜態檔案越能爭取更大的空間容量
   * 2. 將Header、Footer這兩個標籤內容抽出改以JS插入，利用JS下載一次後就快取，每次換頁約可以省下1KB的流量
   * 3. 要注意的是若一昧追求容量的最小化，最後可能會導致網頁花太多時間在進行重新渲染，如此一來會被降低SEO排名
   * ************************ */

  //Header段落作業
  $("header").append(`
<div class="navbar navbar-dark bg-dark shadow fixed-top">
  <div class="container">
    <a href="/" class="navbar-brand d-flex align-items-center text-decoration-none fs-4">
      <i class="fa-solid fa-eye me-2"></i><strong>SlashView</strong>
    </a>
    <nav class="d-inline-flex align-items-center">
      <a class="text-white text-decoration-none me-4" href="/"><i class="fa-solid fa-bookmark text-info"></i><span class="d-none d-md-inline ms-2">articles</span></a>
      <a class="text-white text-decoration-none me-4" href="/about.html"><i class="fa-solid fa-envelope text-info"></i><span class="d-none d-md-inline ms-2">about &amp; contact</span></a>
      <a class="text-white text-decoration-none me-4" href="/privacy.html"><i class="fa-solid fa-user-shield text-info"></i><span class="d-none d-md-inline ms-2">privacy</span></a>
      <a class="text-white text-decoration-none" href="/search.html"><i class="fa-solid fa-magnifying-glass text-info"></i><span class="d-none d-md-inline ms-2">search</span></a>
    </nav>
  </div>
</div>
  `);

  //main段落作業
  $("main").addClass("container");

  //Footer段落作業
  $("footer").append(`
<div class="container pt-5 pb-4">
  <div class="row">
    <div class="col-7 col-sm-8 text-white">
      <p><strong>Copyright &copy; since 2013 by SlashView, All Rights Reserved.</strong></p>
    </div>
    <div class="col-5 col-sm-4 text-end">
      <button class="btn btn-outline-light" id="uBackToTop"><i class="fa-solid fa-angles-up me-2"></i>Back to top</button>
    </div>
  </div>
</div>
  `).addClass("container mt-2 bg-secondary rounded-top");

  //若是內容頁面就補上文章日期顯示
  if (bIsContentPage) {
    $("h1").after(`
<p class="text-end text-muted mt-2" id="uDate">
  <i class="fa-solid fa-calendar-days me-1 text-success"></i>${cYear}/${cMonth}/${cDay}
</p>
    `);
  }

  /* ***** 搜尋引擎優化 *****
   * 針對GOOGLE搜尋引擎進行網頁相關內容優化
   * ************************ */

  //插入網頁標題TITLE
  $("head").append(`<title>${$("h1").text()}</title>`);

  //添加meta標籤：典範網址
  if (bIsContentPage) {
    $("head > link:eq(0)").before(`<link rel="canonical" href="https://slashview.com/archive${cYear}/${cYear}${cMonth}${cDay}.html">`);
  } else {
    $("head > link:eq(0)").before(`<link rel="canonical" href="${window.location.href}">`);
  }

  //拿出第一個H6標籤並擷取內部字串使其成為陣列
  let oH6 = $("main > h6:last");
  let aryKeywords = oH6.length > 0 ? oH6.text().trim().split(" ") : [];
  //抽換頁尾H6內部資訊成為hashtag
  if (aryKeywords.length > 0) {
    oH6.replaceWith(function () {
      let cTemp = "";
      $.each(aryKeywords, function (i, k) {
        cTemp += `<span class="badge rounded-pill border border-success text-success opacity-75">${k}</span>`;
      });
      return `<h6>${cTemp}</h6>`;
    });
  }
  //若存在H6標籤就添加至meta標籤：網站描述
  if (aryKeywords.length > 0) {
    $("head > meta:last").after(`<meta name="description" content="${aryKeywords.join(", ")}">`);
  } 

  //添加語系標籤：繁體中文
  $("html").attr("lang", "zh-Hant");

  /* ***** 其他內容增補 *****
   * 這裡放置一些就算失去也不影響主要瀏覽功能的程式碼
   * ************************ */

  //啟動回到頁首功能
  $("#uBackToTop").on("click", function () {
    $("html").animate({
      scrollTop: 0
    }, "slow");
  });

  /* ***** 程式碼高亮度 *****
   * 渲染當前頁面的程式碼
   * ************************ */
  if (bIsContentPage) {
    HighlightCodeRender();
  }

  /* ***** 工商服務區塊（BusinessServices） *****
   * 1. 預設將插入於：
   *    A. main開始第一個P標籤之後（兩個框架）
   *    B. main結尾之上（一個框架）
   * 2. 於特定的時間後延遲載入，以利使用體驗 
   * 3. 限定內容頁面執行
   * ************************ */
  if (bIsContentPage) {
    let cBusinessServicesText = `<i class="fa-solid fa-person-praying fa-fw"></i>工商服務敬請支持`;
    let cBusinessServicesFrame = `
<div class="border border-dark border-opacity-10 rounded-3 mb-3 text-black-50" style="margin-top:2.5rem !important;">
  <div class="row m-2"">
    <div class="col-md-6 text-center m-0 p-1" id="uBSX">${cBusinessServicesText}</div>
    <div class="col-md-6 text-center m-0 p-1" id="uBSY">${cBusinessServicesText}</div>
  </div>
</div>`;
    /* 插入廣告框架 */
    $("main > p:not(#uDate):first")
      .after(cBusinessServicesFrame
        .replace("uBSX", "uBS1")
        .replace("uBSY", "uBS2")
      );
    $("main > h6:last")
      .before(cBusinessServicesFrame
        .replace("uBSX", "uBS3")
        .replace("uBSY", "uBS4")
      );

    //如果不是本機網站就插入廣告
    //if (false) {
    if (!(bIsLocalhost || bIsGoogleBot)) {
      var cAdsUrl = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4483405513208846";
      var bAdsBlocked = false;
      //動態偵測瀏覽器是否封鎖廣告
      fetch(new Request(cAdsUrl, {
          method: "HEAD"
      })).then(function (oResponse) {
        if (!oResponse.ok) {  //軟攔截
          bAdsBlocked = true;
          console.log("AdsBlocked-Soft");
        }
      }).catch(function () {  //硬攔截（AdBlock、EdgePrivacy）
        bAdsBlocked = true;
        console.log("AdsBlocked-Hard");
      }).finally(function () {
        if (bAdsBlocked) {
          //封鎖廣告：執行反制動作
          var cContent = $("main.container");
          cContent.find("p:eq(1)").nextAll().remove();
          cContent.append(`
<h2>很抱歉！您將無法繼續閱讀網站內容...</h2>
<p>因偵測到廣告屏蔽故無法顯示網站內容，本網站透過微薄的廣告營利支持有品質的內容產生，請透過下列設定，立即以<code>免費的方式</code>協助網站可永續持續營運下去。</p>
<h3>一、移除AdBlock套件</h3>
<p>瀏覽器上可能裝有AdBlock廣告封鎖套件（Plugin），請協助將<code>slashview.com</code>加入網站白名單內。</p>
<h3>二、降低瀏覽器隱私層級</h3>
<p>若您採用Microsoft Edge瀏覽器，可透過設定裡的<code>防止追蹤</code>（edge://settings/privacy），將<code>嚴格</code>調降至<code>平衡</code>即可，亦可選擇將本站加入<code>例外</code>名單。</p>
<hr class="bg-secondary mb-4">
<p>設定完成後，點選按鈕即可看見內容：<button type="button" class="btn btn-warning" onclick="location.reload()"><i class="fa-solid fa-rotate-right"></i> Reload Page</button></p>
`);
        } else {
          //未封鎖廣告：動態載入Javascript
          $.ajax({
            url: cAdsUrl,
            dataType: "script",
            crossorigin: "anonymous",
            success: function () {
              //完成JS載入，開始進行廣告
              BusinessServices("uBS1")
                .then(function () {
                  return BusinessServices("uBS2");
                })
                .then(function () {
                  return BusinessServices("uBS3");
                })
                .then(function () {
                  return BusinessServices("uBS4");
                })
            }
          });
        }
      });
    }
  }

  /* 後續要插入的程式碼 */
  //...
  //...

});

/* ***** 公用方法：Google廣告 *****
* 1. 廣告共分為天地各二，共四區塊
* 2. 引用Promise觀念，並利用jQuery Deferred包裝
* 3. 預設調用一秒後運行，並依Promise順序運行
* ********************************** */
function BusinessServices(cID) {
  //定義Google廣告參數
  let cGoogleCode = `<ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-4483405513208846" data-ad-slot="CodeSlot" data-ad-format="auto" data-full-width-responsive="true"></ins>`;
  let cGoogleSlotUpper = "9296487583";
  let cGoogleSlotLower = "9286531689";
  let cGoogleSlot;
  switch (cID) {
    case "uBS3":
    case "uBS4":
      cGoogleSlot = cGoogleSlotLower;
      break;
    default:
      cGoogleSlot = cGoogleSlotUpper;
  }
  return new Promise(function (resolve, reject) {
    setTimeout(() => {
      $(`#${cID}`).html(cGoogleCode.replace("CodeSlot", cGoogleSlot));
      (adsbygoogle = window.adsbygoogle || []).push({});
      resolve();
    }, 1000);
  });
}

/* ***** 公用方法：程式碼高亮度 *****
* 1. 將程式碼進行高亮度顯示
* 2. 除原本引用HighlightJs之外，另幫其增添複製程式碼功能按鈕
* 3. 限定內容頁面執行
* 4. 因為有其他內容頁面需要動態生成程式碼並渲染，因此將這個方法獨立至外面
* ********************************** */
function HighlightCodeRender() {
  //啟動HighlightJs功能
  hljs.highlightAll();
  //為HighlightJs添加複製程式碼按鈕
  $("pre").each(function () {
    let cCopyString = "<i class='fa-regular fa-clipboard me-1'></i>Copy";
    let cCode = $(this).find("code").text();
    $(this).find("code").prepend(`<button class='btn btn-sm btn-outline-success hljs-copy'>${cCopyString}</button>`);
    $(this).find(".hljs-copy").on("click", function () {
      let oBtn = $(this);
      window.navigator.clipboard
        .writeText(cCode)
        .then(function () {
          oBtn.html("<i class='fa-solid fa-check me-1'></i>Copied");
          setTimeout(function () {
            oBtn.fadeOut("slow", function () {
              $(this).html(cCopyString).fadeIn("slow")
            });
          }, 1000);
        })
        .catch(function () {
          prompt("Accessing clipboard failed. Please copy the text from the box below directly.", cCode);
        });
    });
  });
}