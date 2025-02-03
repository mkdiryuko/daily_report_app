document.addEventListener("DOMContentLoaded", () => {
  const dropdownIcon = document.getElementById("dropdownIcon");
  const dropdownMenu = document.getElementById("dropdownMenu");
  
  // ホバー時にドロップダウンを表示する
  dropdownIcon.addEventListener("mouseenter", () => {
    dropdownMenu.style.display = "block";
  });

  // ホバーが外れた時にドロップダウンメニューを非表示
  dropdownMenu.addEventListener("mouseleave", () => {
    dropdownMenu.style.display = "none";
  });

  // メニューの上にマウスがある場合は表示を継続
  dropdownIcon.addEventListener("mouseleave", () => {
    setTimeout(() => {
      if (!dropdownMenu.matches(":hover")) {
        dropdownMenu.style.display = "none";
      }
    }, 200); 
  });
});