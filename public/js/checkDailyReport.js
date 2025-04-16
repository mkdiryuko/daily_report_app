/* =====================
  DOM要素のキャッシュ
===================== */
const yearInput = document.getElementById('yearInput');
const monthInput = document.getElementById('monthInput');
const dayInput = document.getElementById('dayInput');
const dateInput = document.getElementById('date-input');
const partnerSearchInput = document.getElementById('partner_search');
const prevDayBtn = document.getElementById('prev-btn');
const nextDayBtn = document.getElementById('next-btn');
const todayBtn = document.getElementById('today-btn');
const monthBtn = document.getElementById('month-btn');
const resultsDiv = document.getElementById('results');
const totalPersonHourElem = document.getElementById('total_person_hour');

document.addEventListener('DOMContentLoaded', () => {
  // Helper: DateをYYYY-MM-DD形式に変換
  const getFormattedDate = (date) => date.toISOString().split('T')[0];
  
  // 今日の日付を全ての関連入力に設定
  const setToToday = () => {
    const today = new Date();
    yearInput.value = today.getFullYear();
    monthInput.value = today.getMonth() + 1; // getMonth()は0～11なので+1
    dayInput.value = today.getDate();
    dateInput.value = getFormattedDate(today);
  };
  
  // 初期設定: 今日の日付を設定
  setToToday();
  
  // dateInputの値をもとに、年・月・日入力を更新
  const updateYMDInputs = () => {
    const dateValue = dateInput.value;
    if (!dateValue) return;
    const [year, month, day] = dateValue.split('-'); // "YYYY-MM-DD"形式
    yearInput.value = year;
    monthInput.value = month;
    dayInput.value = day;
  };

  // prev-btnまたはnext-btnを押したときに、dateInputを更新する
  const updateDateInput = (days) => {
    const currentDate = new Date(dateInput.value);
    currentDate.setDate(currentDate.getDate() + days);
    dateInput.value = currentDate.toISOString().split('T')[0];
    updateYMDInputs();
  }
  
  // 日付に変更があった場合の検索処理
  const searchRecords = () => {
    const year = yearInput.value;
    const month = monthInput.value;
    const day = dayInput.value;
    const partner_name = partnerSearchInput.value;
  
    const params = new URLSearchParams({ year, month, day, partner_name });
  
    fetch('/checkDailyReport/search?' + params.toString())
      .then(response => response.json())
      .then(data => {
        totalPersonHourElem.textContent = data.total_person_hour;
  
        if (data.records.length === 0) {
          resultsDiv.innerHTML = '<p>検索条件に合致する日報はありません</p>';
          return;
        }
  
        let table = '<table border="1">';
        table += '<thead><tr><th>パートナー</th><th>登録日</th><th>jobno</th><th>案件名</th><th>業務内容</th><th>工数</th><th>備考</th></tr></thead>';
        table += '<tbody>';
        data.records.forEach(record => {
          table += `<tr>
                      <td>${record.partner_name}</td>
                      <td>${record.job_date}</td>
                      <td>${record.jobno}</td>
                      <td>${record.job_name}</td>
                      <td>${record.job_desc_name}</td>
                      <td>${record.person_hour.slice(0, 5)}</td>
                      <td>${record.note}</td>
                    </tr>`;
        });
        table += '</tbody></table>';
        resultsDiv.innerHTML = table;
      })
      .catch(err => console.error('Fetch error:', err));
  };
  
  // dateInput変更時: 年月日を更新し検索を実行
  dateInput.addEventListener('change', () => {
    updateYMDInputs();
    searchRecords();
  });
  
  // 日付更新と検索を同時に実行
  const changeDayAndSearch = (days) => {
    updateDateInput(days);
    searchRecords();
  };

  // prev-btn, next-btn押下時に、日付更新と検索を実行
  prevDayBtn.addEventListener('click', () => changeDayAndSearch(-1));
  nextDayBtn.addEventListener('click', () => changeDayAndSearch(1));

  // パートナー名の変更時も検索を実行
  partnerSearchInput.addEventListener('input', searchRecords);
  
  // 「今日」ボタン: 今日の日付を設定して検索
  todayBtn.addEventListener('click', () => {
    setToToday();
    searchRecords();
  });
  
  // 「月全て」ボタン: 日の入力をクリアして検索
  monthBtn.addEventListener('click', () => {
    dayInput.value = "";
    searchRecords();
  });
});
