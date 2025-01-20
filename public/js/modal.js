$(document).ready(function() {
  
  // モーダルを開く
  $(".openModal").on("click", function() {
    $("#modal").addClass("show");
  });

  //モーダルを閉じる
  $(".close").on("click", function() {
    $("#modal").removeClass("show");
  });

  $(".cancel-btn").on("click", function() {
    $("#modal").removeClass("show");
  })

  // モーダル外側のクリックで閉じる
  $(window).on("click", function(event) {
    if ($(event.target).is("#modal")) {
      $("#modal").removeClass("show");
    }
  });

  // 休暇申請モーダルを開く
  $(".openHolidayModal").on("click", function() {
    $("#holiday-modal").addClass("show");
  });

  //モーダルを閉じる
  $(".close").on("click", function() {
    $("#holiday-modal").removeClass("show");
  });

  $(".cancel-btn").on("click", function() {
    $("#holiday-modal").removeClass("show");
  })

  // モーダル外側のクリックで閉じる
  $(window).on("click", function(event) {
    if ($(event.target).is("#holiday-modal")) {
      $("#holiday-modal").removeClass("show");
    }
  });
})