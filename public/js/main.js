// URLを取得
const url = new URL(window.location.href);
const dateInput = document.getElementById('date-input');

function updateDate(days) {
  const currentDate = new Date(dateInput.value);
  currentDate.setDate(currentDate.getDate() + days);
  dateInput.value = currentDate.toISOString().split('T')[0];
  url.searchParams.set('date', dateInput.value);
  window.location.href = url.toString();
}

// 日付前後ボタンのイベントリスナー
document.getElementById('prev-btn').addEventListener('click', () => {
  updateDate(-1);
})

document.getElementById('next-btn').addEventListener('click', () => {
  updateDate(1);
})

dateInput.addEventListener('change', () => {
  const selectedDate = dateInput.value;
  // クエリパラメータを更新してページをリロード
  url.searchParams.set('date', dateInput.value);
  window.location.href = url.toString();
})

// 案件検索ボタンのイベントリスナー
const jobSearchBtn = document.getElementById('job-search-btn');
const jobSearchDropdownMenu = document.getElementById('job-search-dropdownMenu');
jobSearchBtn.addEventListener('click', () => {
  if (jobSearchDropdownMenu.style.display === "block") {
    jobSearchDropdownMenu.style.display = "none";
  } else {
    jobSearchDropdownMenu.style.display = "block";
  }
})

jobSearchDropdownMenu.addEventListener('click', function(event) {
  const jobNoForm = document.getElementById('jobNo');
  const jobNameForm = document.getElementById('jobName');

  const clickedItem = event.target;

  if (clickedItem.tagName === 'LI') {
    jobNoForm.value = clickedItem.getAttribute('data-jobno');
    jobNameForm.value = clickedItem.getAttribute('data-jobname');
    jobSearchDropdownMenu.style.display = "none";
  } else {
    jobSearchDropdownMenu.style.display = "block";
  }
})

// 案件検索ボタンまたはドロップダウン以外をクリックした場合に、ドロップダウンを閉じる
document.addEventListener('click', function(event) {
  if (!jobSearchBtn.contains(event.target) && !jobSearchDropdownMenu.contains(event.target)) {
    jobSearchDropdownMenu.style.display = "none";
  }
})
