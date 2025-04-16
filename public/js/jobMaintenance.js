// DOM要素のキャッシュ
const modalHeader    = document.getElementById('modal-header');
const modalForm      = document.getElementById('modalForm');
const modalSubmitBtn = document.getElementById('submit-btn');
const jobNoInput     = document.getElementById("jobNo");
const jobNameInput   = document.getElementById("jobName");
const startDateInput = document.getElementById("startDate");
const endDateInput   = document.getElementById("endDate");
const warningMessage = document.getElementById("warningMessage");

// 更新・削除対象のID（グローバル変数）
let editId, deleteId;

// モーダルフォームを初期化する（入力フィールドをクリア）
const clearModal = () => {
  [jobNoInput, jobNameInput, startDateInput, endDateInput].forEach(input => input.value = "");
  warningMessage.textContent = "";
};

// 入力フィールドの編集状態を一括設定
const setInputsState = (isEditable) => {
  [jobNoInput, jobNameInput, startDateInput, endDateInput].forEach(input => {
    input.readOnly = !isEditable;
  });
};

// サーバーから案件データを取得し、入力フィールドに反映
const fetchJob = async (id) => {
  try {
    console.log("fetch時のjob_id:", id);
    await fetch(`/jobMaintenance/${id}`)
      .then(response => response.json())
      .then(data => {
        console.log("サーバーから取得したデータ：", data);
        jobNoInput.value   = data.job.jobno;
        jobNameInput.value = data.job.name;
        startDateInput.value = data.job.start_date;
        endDateInput.value   = data.job.end_date;
        if (data.hasChildRecord) {
          if (modalSubmitBtn.dataset.type === 'edit') {
            warningMessage.innerHTML = "(※)この案件が登録された日報が存在します<br>(※)編集を行う場合、対応する日報も編集されます";
          } else if (modalSubmitBtn.dataset.type === 'delete') {
            warningMessage.innerHTML = "(※)この案件が登録された日報が存在します<br>(※)削除を行う場合、対応する日報も削除されます";
          }
        }
      })
      .catch(error => {
        console.error('エラー発生：', error);
      })
  } catch (error) {
    console.error("データの取得に失敗しました", error);
  }
};

// モーダルの初期化と状態設定（登録・編集・削除の場合）
const selectModal = (dataType, id) => {
  // 共通処理：フォームの状態・入力内容のクリア
  clearModal();
  
  switch (dataType) {
    case 'register':
      modalHeader.textContent    = "案件登録";
      modalSubmitBtn.textContent = "登録";
      setInputsState(true);
      modalSubmitBtn.dataset.type = "register";
      break;
    case 'edit':
      modalHeader.textContent    = "案件編集";
      modalSubmitBtn.textContent = "更新";
      setInputsState(true);
      modalSubmitBtn.dataset.type = "edit";
      editId = id;
      fetchJob(id, 'edit');
      break;
    case 'delete':
      modalHeader.textContent    = "案件削除";
      modalSubmitBtn.textContent = "削除";
      setInputsState(false);
      modalSubmitBtn.dataset.type = "delete";
      deleteId = id;
      fetchJob(id, 'delete');
      break;
    default:
      modalHeader.textContent    = "####";
      modalSubmitBtn.textContent = "##";
      setInputsState(false);
      modalSubmitBtn.dataset.type = "null";
      break;
  }
};

// フォームのaction属性を更新
const updateFormAction = (actionUrl) => {
  modalForm.action = actionUrl;
};

// form validation
const validateForm = (form) => {
  if (!form.checkValidity()) {
    alert('入力エラー：全項目を入力してください');
    return false;
  }
  if (startDateInput.value && endDateInput.value) {
    console.log('日付エラーチェック');
    // Dateオブジェクトに変換して比較
    const startDate = new Date(startDateInput.value);
    const endDate = new Date(endDateInput.value);

    if (endDate < startDate) {
      alert('値エラー：終了日は開始日よりも前の日付にはできません');
      return false;
    }
  }
  console.log("エラーなし")
  return true;
}

// モーダルの「提出」ボタン押下時の処理
modalSubmitBtn.addEventListener('click', event => {
  event.preventDefault(); // デフォルトのフォーム動作を停止

  if (!validateForm(modalForm)) {
    return; // エラーがあれば以降の処理は実行せずに終了 
  }
  
  const dataType = event.target.dataset.type;
  let actionUrl = '#';
  
  switch (dataType) {
    case 'register':
      actionUrl = `/jobMaintenance/register`;
      break;
    case 'edit':
      actionUrl = `/jobMaintenance/edit/${editId}`;
      break;
    case 'delete':
      actionUrl = `/jobMaintenance/delete/${deleteId}`;
      break;
  }
  
  updateFormAction(actionUrl);
  modalForm.submit();
});

// 検索条件クリアボタンを押すと、検索窓をクリアする
document.getElementById("clear-btn").addEventListener("click", function(){
  // クエリパラメータを含まないURLへ遷移
  window.location.href = '/jobMaintenance';
});
