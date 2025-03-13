document.addEventListener('DOMContentLoaded', () => {
  // 現在の日付を取得して各スピンボックスに初期値を設定
  const today = new Date();
  document.getElementById('yearSpinner').value = today.getFullYear();
  document.getElementById('monthSpinner').value = today.getMonth() + 1; // getMonth()は0～11なので+1
  document.getElementById('daySpinner').value = today.getDate();
  console.log(today);

  // 年と月が変更されたときに日付の最大値を更新する関数
  function updateDays() {
    const year = parseInt(document.getElementById('yearSpinner').value, 10);
    const month = parseInt(document.getElementById('monthSpinner').value, 10);
    
    // new Date(year, month, 0) は、指定した月の「0日目」つまりその月の最終日を返す
    const daysInMonth = new Date(year, month, 0).getDate();
    console.log(daysInMonth);
    
    const daySpinner = document.getElementById('daySpinner');
    daySpinner.max = daysInMonth;
    
    // 現在の「日」が最大値を超えている場合は、最大値に修正
    if (parseInt(daySpinner.value, 10) > daysInMonth) {
      daySpinner.value = daysInMonth;
    }
  }
  
  updateDays();
  
  // 年・月が変更されたときに updateDays() を呼び出す
  document.getElementById('yearSpinner').addEventListener('change', updateDays);
  document.getElementById('monthSpinner').addEventListener('change', updateDays);
  
  // 入力欄のいずれかが変更されたときに検索を実行
  function searchRecords() {
    // 各入力欄の値を取得
    const year = document.getElementById('yearSpinner').value;
    const month = document.getElementById('monthSpinner').value;
    const day = document.getElementById('daySpinner').value;
    const partner_name = document.getElementById('partner_search').value;
  
    // クエリパラメータを生成
    const params = new URLSearchParams({ year, month, day, partner_name });
  
    fetch('/checkDailyReport/search?' + params.toString())
      .then(response => response.json())
      .then(data => {
        const resultsDiv = document.getElementById('results');
        const totalPersonHourInput = document.getElementById('total_person_hour');
        totalPersonHourInput.textContent = data.total_person_hour;

        // テーブル形式に変換して表示
        if (data.records.length === 0) {
          resultsDiv.innerHTML = '<p>該当するレコードはありません</p>';
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
  }
  
  // 各入力欄にイベントリスナーを追加
  document.getElementById('yearSpinner').addEventListener('input', searchRecords);
  document.getElementById('monthSpinner').addEventListener('input', searchRecords);
  document.getElementById('daySpinner').addEventListener('input', searchRecords);
  document.getElementById('partner_search').addEventListener('input', searchRecords);
  
  // 今日ボタンのイベント
  document.getElementById('today-btn').addEventListener('click', () => {
    const today = new Date();
    document.getElementById('yearSpinner').value = today.getFullYear();
    document.getElementById('monthSpinner').value = today.getMonth() + 1;
    document.getElementById('daySpinner').value = today.getDate();
    updateDays();
    searchRecords();
  });

  // 月全てボタンのイベント
  document.getElementById('month-btn').addEventListener('click', () => {
    document.getElementById('daySpinner').value = "";
    searchRecords();
  })
});
