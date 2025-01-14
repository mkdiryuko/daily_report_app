// URLを取得
const url = new URL(window.location.href);
const dateInput = document.getElementById('date-input');

// クエリパラメータに日付を設定
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

// 登録・編集モーダルの切替
function openModal(mode, id=null) {
  const modalHeader = document.getElementById("modal-header");
  const submitBtn = document.getElementById("submit-btn");

  // モードに応じてタイトルとボタンを配置する
  if (mode === "edit") {
    modalHeader.textContent = "工数編集";
    submitBtn.textContent = "更新";
    fetchDailyReport(id);
  } else {
    modalHeader.textContent = "工数登録";
    submitBtn.textContent = "登録";
    clearModal();
  }
}

function clearModal() {
  const jobDescDropdown = document.getElementById("job_desc_dropdown");
  const personHourDropdown = document.getElementById("person_hour_dropdown");
  document.getElementById("jobNo").value = "";
  document.getElementById("jobName").value = "";
  jobDescDropdown.options[0].style.display = 'block';
  jobDescDropdown.selectedIndex = 0;
  personHourDropdown.options[0].style.display = 'block';
  personHourDropdown.selectedIndex = 0;
  document.getElementById("note").value = "";
}

const modalForm = document.getElementById('modalForm');
const submitBtn = document.getElementById('submit-btn');

async function fetchDailyReport(id) {
  // サーバーから登録内容を取得＆モーダルに表示する
  try {
    console.log("fetch時のdaily_report_id : ", id);
    const response = await fetch(`main/${id}`);
    const data = await response.json();
    console.log("サーバーから取得した日報：", data)
    document.getElementById("jobNo").value = data.jobno;
    document.getElementById("jobName").value = data.job_name;
  
    const jobDescDropdown = document.getElementById("job_desc_dropdown");
    jobDescDropdown.options[0].style.display = 'none';
    for (let i = 1; i < jobDescDropdown.options.length; i++) {
      if (jobDescDropdown.options[i].text === data.job_desc_name) {
        jobDescDropdown.selectedIndex = i;
        break;
      }
    }

    const personHourDropdown = document.getElementById("person_hour_dropdown");
    personHourDropdown.options[0].style.display = 'none';
    for (let i = 1; i < personHourDropdown.options.length; i++) {
      if (personHourDropdown.options[i].text === data.person_hour.substr(0, 5)) {
        personHourDropdown.selectedIndex = i;
        break;
      }
    }

    document.getElementById("note").value = data.note;

    // サーバーへ編集内容を送信する
    modalForm.addEventListener('submit', async event => {
      event.preventDefault();
    
      const fd = new FormData(modalForm);
      console.log("FormDataをつくったよ!!")
      console.log(fd);
      console.log(Array.from(fd));
      const obj = Object.fromEntries(fd);
      console.log(obj);
      updateDailyReport(obj, id);
    })
  } catch (error) {
    console.error("データの取得に失敗しました", error);
  }
}

async function updateDailyReport(data, id) {
  try {
    const response = await fetch(`main/${id}`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const result = await response.json();
    console.log("レスポンス結果：", result);

    if (response.ok) {
      alert(result.message);
      location.reload();
    } else {
      alert(`エラー: ${ result.message }`);
    }
  } catch (error) {
    console.error(error);
    alert('サーバーエラー：案件の更新に失敗しました')
  }
}
