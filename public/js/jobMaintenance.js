// DOM要素
const modalHeader   = document.getElementById('modal-header');
const modalSubmitBtn = document.getElementById('submit-btn');
const jobNoInput    = document.getElementById("jobNo");
const jobNameInput  = document.getElementById("jobName");
const startDateInput = document.getElementById("startDate");
const endDateInput  = document.getElementById("endDate");

// モーダルに格納するデータの取得（編集・削除の場合のみ）
async function fetchJob(id) {
  try {
    console.log("fetch時のjob_id:", id);
    const response = await fetch(`/jobMaintenance/${id}`);
    const job = await response.json();
    console.log("サーバーから取得した案件：", job);
    
    jobNoInput.value = job.jobno;
    jobNameInput.value = job.name;
    startDateInput.value = job.start_date;
    endDateInput.value = job.end_date;
  } catch (error) {
    console.error("データの取得に失敗しました", error);
  }
}

// 入力フィールドの編集可能状態を一括で切り替え
function setInputsState(isEditable) {
  jobNoInput.readOnly    = !isEditable;
  jobNameInput.readOnly  = !isEditable;
  startDateInput.readOnly = !isEditable;
  endDateInput.readOnly  = !isEditable;
}

// モーダルの初期化（フォームをクリア）
function clearModal() {
  jobNoInput.value = "";
  jobNameInput.value = "";
  startDateInput.value = "";
  endDateInput.value = "";
}

// 登録・編集・削除に応じて、モーダルの見た目と状態を切り替え
function selectModal(dataType, id) {
  switch (dataType) {
    case 'register':
      modalHeader.textContent = "案件登録";
      modalSubmitBtn.textContent = "登録";
      clearModal();
      setInputsState(true);
      break;
    case 'edit':
      modalHeader.textContent = "案件編集";
      modalSubmitBtn.textContent = "更新";
      fetchJob(id);
      setInputsState(true);
      break;
    case 'delete':
      modalHeader.textContent = "案件削除";
      modalSubmitBtn.textContent = "削除";
      fetchJob(id);
      setInputsState(false);
      break;
    default:
      modalHeader.textContent = "####";
      modalSubmitBtn.textContent = "##";
      clearModal();
      setInputsState(false);
      break;
  }
}
