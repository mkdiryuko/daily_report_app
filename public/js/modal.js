$(document).ready(function() {
  function initModal(modalSelector, openTriggerSelector) {
    // モーダルを開く
    $(openTriggerSelector).on("click", function() {
      $(modalSelector).addClass("show");
    });

    // モーダルを閉じる（閉じるボタンとキャンセルボタン）
    $(modalSelector).find(".close, .cancel-btn").on("click", function() {
      $(modalSelector).removeClass("show");
    });

    // モーダル外側のクリックで閉じる
    $(window).on("click", function(event) {
      if ($(event.target).is(modalSelector)) {
        $(modalSelector).removeClass("show");
      }
    });
  }

  // 通常のモーダルの初期化
  initModal("#modal", ".openModal");
  
  // 休暇申請モーダルの初期化
  initModal("#absence-modal", ".openAbsenceModal");

});
