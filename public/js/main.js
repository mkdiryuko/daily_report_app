// 日付更新関数
const dateInput = document.getElementById('date-input');
const today = new Date().toISOString().split('T')[0];
dateInput.value = today; // 初期値を現在の日時にする

function updateDate(days) {
  const currentDate = new Date(dateInput.value);
  currentDate.setDate(currentDate.getDate() + days);
  dateInput.value = currentDate.toISOString().split('T')[0];
}

// ボタンのイベントリスナー
document.getElementById('prev-btn').addEventListener('click', () => {
  updateDate(-1);
})

document.getElementById('next-btn').addEventListener('click', () => {
  updateDate(1);
})