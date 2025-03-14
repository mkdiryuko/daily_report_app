/* =====================
  　DOM要素のキャッシュ
   ===================== */

// モーダルフォーム関連
const modalForm = document.getElementById('modalForm');
const modalHeader = document.getElementById('modal-header');
const jobSearchBtn = document.getElementById('job-search-btn');
const jobSearchDropdownMenu = document.getElementById('job-search-dropdownMenu');
const jobNoForm = document.getElementById('jobNo');
const jobNameForm = document.getElementById('jobName');
const jobDescDropdown = document.getElementById("job_desc_dropdown");
const personHourDropdown = document.getElementById("person_hour_dropdown");
const note = document.getElementById("note");
const modalSubmitBtn = document.getElementById("submit-btn");

// 休暇申請モーダル関連
const openAbsenceModalBtn = document.getElementById("open-absence-modal-btn");
const absenceModal = document.getElementById("absence-modal");
const absenceModalHeader = document.getElementById("absence-modal-header");
const absenceModalForm = document.getElementById("absenceModalForm");
const absenceSubmitBtn = document.getElementById("absence-submit-btn");

// 日付
const dateInput = document.getElementById('date-input');

// 更新・削除対象のID（グローバル変数）
let editId, deleteId;

/* =====================
  　日付処理
   ===================== */

const url = new URL(window.location.href); // URLを取得
const date = dateInput.value;              // 現在の日付

// クエリパラメータに日付を設定
function updateDate(days) {
  const currentDate = new Date(dateInput.value);
  currentDate.setDate(currentDate.getDate() + days);
  dateInput.value = currentDate.toISOString().split('T')[0];
  url.searchParams.set('date', dateInput.value);
  window.location.href = url.toString();
}

// 前日にする
document.getElementById('prev-btn').addEventListener('click', () => {
  updateDate(-1);
})

// 翌日にする
document.getElementById('next-btn').addEventListener('click', () => {
  updateDate(1);
})

dateInput.addEventListener('change', () => {
  // クエリパラメータを更新してページをリロード
  url.searchParams.set('date', dateInput.value);
  window.location.href = url.toString();
})

/* ============================
  　案件検索（モーダルフォーム）
   ============================ */

// 案件検索ボタンを押下したら、案件ドロップダウンを表示 
jobSearchBtn.addEventListener('click', () => {
  if (jobSearchDropdownMenu.style.display === "block") {
    jobSearchDropdownMenu.style.display = "none";
  } else {
    jobSearchDropdownMenu.style.display = "block";
  }
})

// 案件検索ドロップダウンの要素を選択したら、jobNoForm, JobNameFormに格納する
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

/* =========================================
  　工数の登録・更新・削除（モーダルフォーム）
   ========================================= */

// モーダルの初期化
const clearModal = () => {
  document.getElementById("jobNo").value = "";
  document.getElementById("jobName").value = "";
  jobDescDropdown.options[0].style.display = 'block';
  jobDescDropdown.selectedIndex = 0;
  personHourDropdown.options[0].style.display = 'block';
  personHourDropdown.selectedIndex = 0;
  document.getElementById("note").value = "";
}

// 入力フィールドの編集状態を切替
const initInputsState = () => {
  jobNoForm.readOnly = true;
  jobNameForm.readOnly = true;
};

// フォームのaction属性を更新
const updateFormAction = (actionUrl, formName) => {
  formName.action = actionUrl;
}

// フォームバリデーション
const validateForm = (form) => {
  if (!form.checkValidity()) {
    alert('入力エラー：全項目を入力してください');
    return false;
  }
  console.log("エラーなし")
  return true;
}

// モーダルの初期化と状態設定（登録・編集・削除）
const selectModal = (dataType, id) => {
  // 共通処理
  clearModal();      // 入力内容のクリア
  initInputsState(); // 編集状態の初期化

  switch (dataType) {
    case 'register':
      modalHeader.textContent = "工数登録";
      modalSubmitBtn.textContent = "登録";
      modalSubmitBtn.dataset.type = "register";
      break;
    case 'edit':
      modalHeader.textContent = "工数編集";
      modalSubmitBtn.textContent = "更新";
      modalSubmitBtn.dataset.type = "edit";
      editId = id;
      fetchDailyReport(id);
      break;
    case 'delete':
      modalHeader.textContent = "工数削除";
      modalSubmitBtn.textContent = "削除";
      modalSubmitBtn.dataset.type = "delete";
      deleteId = id;
      fetchDailyReport(id);
      break;
    default:
      modalHeader.textContent    = "####";
      modalSubmitBtn.textContent = "##";
      modalSubmitBtn.dataset.type = "null";
      break;
  }
}

// action属性の変更（登録・編集・削除）
modalSubmitBtn.addEventListener('click', function(event) {
  event.preventDefault(); // デフォルトのフォーム動作を停止

  if (!validateForm(modalForm)){
    return; // エラーがあれば以降の処理は実行せずに終了
  }

  const dataType = event.target.dataset.type;

  let actionUrl = '#';

  switch( dataType ) {
    case 'register':
      actionUrl = `main/register/${date}`;
      break;
    case 'edit':
      actionUrl = `main/edit/${editId}?date=${date}`;
      break;
    case 'delete':
      actionUrl = `main/delete/${deleteId}?date=${date}`;
      break;
    default:
      actionUrl = '#';
      break;
  }
  updateFormAction(actionUrl, modalForm);
  modalForm.submit(); // フォームを送信
})

// サーバーから登録内容を取得し、モーダルに表示する
const fetchDailyReport = async (id) => {
  try {
    console.log("fetch時のdaily_report_id : ", id);
    const response = await fetch(`main/${id}`);
    const data = await response.json();
    console.log("サーバーから取得した日報：", data)
    jobNoForm.value = data.jobno;
    jobNameForm.value = data.job_name;
    
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

    note.value = data.note;

  } catch (error) {
    console.error("データの取得に失敗しました", error);
  }
}

/* ===============================
  　休暇申請の削除（モーダルフォーム）
   =============================== */
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