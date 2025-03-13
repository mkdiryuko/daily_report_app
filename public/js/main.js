// URLを取得
const url = new URL(window.location.href);
const dateInput = document.getElementById('date-input');
const date = dateInput.value; // 現在の日付

// クエリパラメータに日付を設定
function updateDate(days) {
  const currentDate = new Date(dateInput.value);
  currentDate.setDate(currentDate.getDate() + days);
  dateInput.value = currentDate.toISOString().split('T')[0];
  url.searchParams.set('date', dateInput.value);
  window.location.href = url.toString();
}

// --- 日付選択 -------------
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
// -------------------------

// --- 案件検索ボタン -----------------------
const jobSearchBtn = document.getElementById('job-search-btn');
const jobSearchDropdownMenu = document.getElementById('job-search-dropdownMenu');
const jobNoForm = document.getElementById('jobNo');
const jobNameForm = document.getElementById('jobName');

// 案件検索ボタンを押下したら、案件ドロップダウンを表示 
jobSearchBtn.addEventListener('click', () => {
  if (jobSearchDropdownMenu.style.display === "block") {
    jobSearchDropdownMenu.style.display = "none";
  } else {
    jobSearchDropdownMenu.style.display = "block";
  }
})

// 案件ドロップダウンの要素を選択したら、formに格納する
jobSearchDropdownMenu.addEventListener('click', function(event) {
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
// --------------------------------------------

// ---モーダルフォームを用いた工数の登録・更新・削除--------------------------
// DOM要素
const modalForm = document.getElementById('modalForm');
const submitBtn = document.getElementById("submit-btn");
const jobDescDropdown = document.getElementById("job_desc_dropdown");
const personHourDropdown = document.getElementById("person_hour_dropdown");
const openRegModalBtn = document.getElementById('open-reg-modal-btn');
const modalHeader = document.getElementById('modal-header');

// daily_report DBのidをグローバル変数として定義
let daily_report_id;

// 登録ボタンが押されたら、モーダルのヘッダーとボタンの名前を変更
openRegModalBtn.addEventListener('click', () => {
  modalHeader.textContent = "工数登録";
  submitBtn.textContent = "登録";
})

// 編集、削除ボタンクリック時にモーダルヘッダーとモーダルボタンを対応する名称に変更する
document.addEventListener('click', function(event) {
  const clickedElement = event.target;

  if (clickedElement.id.includes("open-edit-modal-btn")) {
    modalHeader.textContent = "工数編集";
    submitBtn.textContent = "更新";
  } else if (clickedElement.id.includes("open-del-modal-btn")) {
    modalHeader.textContent = "工数削除";
    submitBtn.textContent = "削除";
  } else {
    return;
  }
})

// ボタンがクリックされたときにフォームのactionを変更する関数
function updateFormAction(actionUrl, formName) {
  formName.action = actionUrl;
}

// form validation
const validateForm = (form) => {
  if (!form.checkValidity()) {
    alert('入力エラー：全項目を入力してください');
    return false;
  }
  console.log("エラーなし")
  return true;
}

// 登録、編集、削除の3パターンでaction(バックのルート)を変更する
submitBtn.addEventListener('click', function(event) {
  event.preventDefault(); // デフォルトのフォーム動作を停止

  if (!validateForm(modalForm)){
    return; // エラーがあれば以降の処理は実行せずに終了
  }

  let actionUrl;

  // 登録、編集、削除の3パターンでactionを変更する
  const mode = submitBtn.innerText;
  console.log("モーダルフォームの提出ボタンの名前：", mode);
  switch( mode ) {
    case '登録':
      actionUrl = `main/register/${date}`;
      break;
    case '更新':
      actionUrl = `main/edit/${daily_report_id}?date=${date}`;
      break;
    case '削除':
      actionUrl = `main/delete/${daily_report_id}?date=${date}`;
      break;
    default:
      actionUrl = '#';
      break;
  }
  updateFormAction(actionUrl, modalForm);

  modalForm.submit(); // フォームを送信
})

// モーダルの初期化(工数登録ボタン押下時)
function clearModal() {
  document.getElementById("jobNo").value = "";
  document.getElementById("jobName").value = "";
  jobDescDropdown.options[0].style.display = 'block';
  jobDescDropdown.selectedIndex = 0;
  personHourDropdown.options[0].style.display = 'block';
  personHourDropdown.selectedIndex = 0;
  document.getElementById("note").value = "";
}

// サーバーから登録内容を取得＆モーダルに表示する(編集、削除ボタン押下時に実行)
async function fetchDailyReport(id) {
  try {
    daily_report_id = id;
    console.log("fetch時のdaily_report_id : ", id);
    const response = await fetch(`main/${id}`);
    const data = await response.json();
    console.log("サーバーから取得した日報：", data)
    document.getElementById("jobNo").value = data.jobno;
    document.getElementById("jobName").value = data.job_name;
    
    jobDescDropdown.options[0].style.display = 'none';
    for (let i = 1; i < jobDescDropdown.options.length; i++) {
      if (jobDescDropdown.options[i].text === data.job_desc_name) {
        jobDescDropdown.selectedIndex = i;
        break;
      }
    }

    personHourDropdown.options[0].style.display = 'none';
    for (let i = 1; i < personHourDropdown.options.length; i++) {
      if (personHourDropdown.options[i].text === data.person_hour.substr(0, 5)) {
        personHourDropdown.selectedIndex = i;
        break;
      }
    }

    document.getElementById("note").value = data.note;

  } catch (error) {
    console.error("データの取得に失敗しました", error);
  }
}
// ---------------------------------------------------------------------

// ---休暇申請モーダル--------------------
const openAbsenceModalBtn = document.getElementById("open-absence-modal-btn");
const absenceModal = document.getElementById("absence-modal");
const absenceModalHeader = document.getElementById("absence-modal-header");
const absenceModalForm = document.getElementById("absenceModalForm");
const absenceSubmitBtn = document.getElementById("absence-submit-btn");

console.log(absenceModal.dataset.absence);
if (JSON.parse(absenceModal.dataset.absence)) {
  openAbsenceModalBtn.innerText = "休暇取消";
  openAbsenceModalBtn.style.backgroundColor = "red";
  absenceModalHeader.textContent = "休暇申請取消";
  absenceSubmitBtn.innerText = "取消";
  absenceSubmitBtn.style.backgroundColor = "red";

  absenceSubmitBtn.addEventListener('click', function(event) {
    event.preventDefault();
    updateFormAction(`main/absence/delete?date=${date}`, absenceModalForm)
    absenceModalForm.submit();
  })
}