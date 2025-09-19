// app-with-cloud.js
import { supabase } from './supabase-config.js';

// ========== 你的原有900行核心算法代码 ==========
// ... (这里是你原有的所有计算逻辑和UI更新代码)
// 我们假设你有一个全局对象 `window.myApp` 或类似结构
// ========== 你的原有900行核心算法代码 ==========
document.addEventListener("DOMContentLoaded", () => {
  const ledgerBody = document.querySelector(".ledger tbody");
  const chartCanvas = document.getElementById("trendChart");

  ledgerBody.replaceChildren();
  console.log("DOMContentLoaded: 初始化清空 tbody, rows.length =", ledgerBody.rows.length);

  let winCount = 0;
  let lossCount = 0;
  let totalBetAmount = 0;
  let totalProfit = 0;
  let roundWinCount = 0;
  let roundLossCount = 0;
  let roundTotalProfit = 0;
  let cumulativeProfit = 0;
  let currentChartMode = "profit";
  let trendChart = null;
  // ✅ 修改1：roundStartIndex 必须为 1（不是2），否则会漏掉第一手
  let roundStartIndex = 1;
  let roundStartIndexForFlow = 1;

  // ✅ 新增：临时查看模式变量
  let tempViewActive = false;    // 是否处于临时查看模式
  let tempStartRow = null;       // 用户选择的起始行号（1开始）

  let maxBet = 0;
  let maxNetWin = 0;
  let minNetWin = 0;
  let maxWinStreak = 0;
  let maxLossStreak = 0;
  let currentWinStreak = 0;
  let currentLossStreak = 0;
  let maxLossCapital = 0;

  function getBetAmount() {
    const v = parseFloat(document.getElementById("input7")?.value);
    return isNaN(v) || v <= 0 ? 0 : v;
  }

  function getDirection() {
    return document.getElementById("input6")?.value.trim() || "B";
  }

  function calculateProfit(typeLabel, bet) {
    let profit;
    if (typeLabel === "WINB") profit = bet * 0.95;
    else if (typeLabel.startsWith("WIN")) profit = bet;
    else profit = -bet;
    return profit;
  }

  function updateStatsOnClick(typeLabel, bet) {
    const isWin = typeLabel.startsWith("WIN");
    console.log("updateStatsOnClick: typeLabel =", typeLabel, "bet =", bet, "isWin =", isWin);
    if (isWin) {
      winCount++;
      roundWinCount++;
      currentWinStreak++;
      currentLossStreak = 0;
      maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
    } else {
      lossCount++;
      roundLossCount++;
      currentLossStreak++;
      currentWinStreak = 0;
      maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
    }
    totalBetAmount += bet;
    maxBet = Math.max(maxBet, bet);
    const profit = calculateProfit(typeLabel, bet);
    totalProfit += profit;
    roundTotalProfit += profit;
    const currentNetWin = winCount - lossCount;
    maxNetWin = Math.max(maxNetWin, currentNetWin);
    minNetWin = Math.min(minNetWin, currentNetWin);
    const initialCapital = parseFloat(document.getElementById("input1")?.value) || 0;
    const currentFund = initialCapital + totalProfit;
    if (currentFund < initialCapital) {
      const currentLossCapital = initialCapital - currentFund;
      maxLossCapital = Math.max(maxLossCapital, currentLossCapital);
    }
    updateTrendChart(profit);
    console.log("统计更新：", { winCount, lossCount, totalProfit, roundWinCount, roundLossCount, roundTotalProfit, maxLossCapital });
  }

  function updateTrendChart(deltaProfit) {
    if (!trendChart) return;

    trendChart.rawProfits.push(deltaProfit);
    if (trendChart.rawProfits.length > 100) {
      trendChart.rawProfits.shift();
    }

    const displayData = trendChart.rawProfits;
    const dataLength = displayData.length;
    trendChart.data.labels = Array.from({ length: dataLength }, (_, i) => i + 1);
    trendChart.data.datasets[0].data = [];
    let cumulative = 0;
    trendChart.data.datasets[0].data = displayData.map(profit => {
      cumulative += profit;
      return cumulative;
    });

    trendChart.options.scales.x.min = 0;
    trendChart.options.scales.x.max = 100;

    const data = trendChart.data.datasets[0].data;
    const minData = Math.min(...data, 0);
    const maxData = Math.max(...data, 0);
    trendChart.options.scales.y.suggestedMin = minData - Math.abs(minData) * 0.1;
    trendChart.options.scales.y.suggestedMax = maxData + Math.abs(maxData) * 0.1;

    trendChart.update();
  }

  function initTrendChart() {
    if (trendChart) trendChart.destroy();
    const ctx = chartCanvas.getContext("2d");
    cumulativeProfit = 0;

    const initialData = Array(100).fill(0);
    const labels = Array.from({ length: 100 }, (_, i) => i + 1);

    trendChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [{
          label: "趋势",
          data: initialData,
          borderColor: "#f9a600ff",
          fill: false,
          tension: 0.3,
          pointRadius: 2,
          clip: 3,
          pointHoverRadius: 5,
          pointBackgroundColor: "rgba(255, 233, 217, 1)",
          pointBorderColor: "#ff3300ff",
          pointBorderWidth: 2,
          pointStyle: "circle",
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: { left: 10, right: 10 }
        },
        scales: {
          x: {
            display: true,
            ticks: { display: false },
            grid: { display: false },
            min: 0,
            max: 100
          },
          y: {
            display: false,
            position: "right",
            ticks: { display: false },
            grid: { display: true, color: "#eee" }
          },
          yLeft: {
            display: false,
            position: "left",
            ticks: { display: false },
            grid: { display: false }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: { enabled: true }
        }
      }
    });

    trendChart.rawProfits = Array(100).fill(0);
  }

function restartSystem() {
  document.querySelectorAll(".round-start-row").forEach(el => el.classList.remove("round-start-row"));

  const rows = Array.from(ledgerBody.querySelectorAll("tr"));
  const firstEmptyIndex = rows.findIndex(row => row.cells[1]?.textContent.trim() === "");
  roundStartIndex = firstEmptyIndex >= 0 ? firstEmptyIndex + 1 : rows.length + 1;

  roundWinCount = 0;
  roundLossCount = 0;
  roundTotalProfit = 0;

  calculateFlowTotal();
  updateStatsFromLedger(generateStats());

  const targetIndex = roundStartIndex - 1;
  if (targetIndex >= rows.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="text-align:right;padding-left:10px">${roundStartIndex}</td>
      <td style="text-align:right"></td>
      <td style="text-align:right"></td>
      <td style="text-align:center;font-family:monospace;font-size:12px;padding:4px">
        <span style="color: green;">0</span><span style="color: #999; padding: 0 4px;">|</span><span style="color: green;">0</span>
      </td>
      <td contenteditable="true" title="点击填写备注" style="text-align:left;padding:4px 8px;font-size:12px;color:#333;word-break:break-word;white-space:normal;"></td>
    `;
    tr.classList.add("round-start-row");
    tr.dataset.emptyRow = "true";
    tr.dataset.version = "2";
    ledgerBody.appendChild(tr);
  } else {
    rows[targetIndex].classList.add("round-start-row");
  }

  console.log("✅ 重启完成，起始行 =", roundStartIndex);
}


  function resetFlow() {
    const allRows = Array.from(ledgerBody.querySelectorAll("tr"));
    const firstEmptyIndex = allRows.findIndex(row => row.cells[1]?.textContent.trim() === "");
    roundStartIndexForFlow = firstEmptyIndex >= 0 ? firstEmptyIndex + 1 : allRows.length + 1;
    roundWinCount = 0;
    roundLossCount = 0;
    roundTotalProfit = 0;
    console.log("重置流水：流水起始行号 =", roundStartIndexForFlow);
    calculateFlowTotal();
    updateStatsFromLedger(generateStats());
  }

  function deleteData() {
    console.log("deleteData: 清理前 rows.length =", ledgerBody.rows.length);
    ledgerBody.replaceChildren();
    winCount = 0;
    lossCount = 0;
    totalBetAmount = 0;
    totalProfit = 0;
    roundWinCount = 0;
    roundLossCount = 0;
    roundTotalProfit = 0;
    maxBet = 0;
    maxNetWin = 0;
    minNetWin = 0;
    maxWinStreak = 0;
    maxLossStreak = 0;
    currentWinStreak = 0;
    currentLossStreak = 0;
    maxLossCapital = 0;
    roundStartIndex = 1;
    roundStartIndexForFlow = 1;

    const inputIds = [
      "input1", "input2", "input3", "input4", "input5", "input6", "input7", "input8",
      "stat-total-hands", "stat-win-hands", "stat-net-win", "stat-win-rate",
      "stat-total-profit", "stat-average-win", "stat-goal-complete", "stat-round-hole",
      "round-total-hands", "round-win-hands", "round-net-win", "round-win-rate",
      "round-total-profit", "round-average-win", "round-goal-complete", "round-hole",
      "sys-flow-total", "sys-current-fund", "sys-max-loss-capital", "sys-average-win",
      "sys-max-netwin", "sys-min-netwin", "sys-total-forecast", "sys-round-forecast"
    ];
    inputIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.value = "";
        console.log(`清空输入框 ${id}`);
      } else {
        console.error(`未找到输入框 ${id}`);
      }
    });

    initTrendChart();
    console.log("数据已删除，流水起始行号 =", roundStartIndexForFlow, "账本行数 =", ledgerBody.rows.length);
  }

function undoLastEntry() {
  const rows = Array.from(ledgerBody.querySelectorAll("tr"));
  if (rows.length === 0) {
    alert("账本为空，无法撤销！");
    return;
  }

  const lastRow = rows[rows.length - 1];
  const profitText = lastRow.cells[1]?.textContent.trim();
  const betText = lastRow.cells[2]?.textContent.trim();

  if (!profitText || !betText) {
    alert("无法读取最后一条记录的数据，无法撤销！");
    return;
  }

  const profit = parseFloat(profitText.replace(/^\+/, ""));
  const bet = parseFloat(betText);

  if (isNaN(profit) || isNaN(bet)) {
    alert("数据解析失败，无法撤销！");
    return;
  }

  // 判断是否会影响 roundStartIndex 或 roundStartIndexForFlow
  const currentRowCount = rows.length;
  const willAffectRound = currentRowCount < roundStartIndex;
  const willAffectFlow = currentRowCount < roundStartIndexForFlow;

  // 删除最后一行
  lastRow.remove();
  console.log("已删除最后一行账本，行号 =", currentRowCount);

  // 根据 profit 反向更新统计变量
  if (profit > 0) {
    winCount--;
    roundWinCount--;
    currentWinStreak--;
    if (currentWinStreak < 0) currentWinStreak = 0;
  } else if (profit < 0) {
    lossCount--;
    roundLossCount--;
    currentLossStreak--;
    if (currentLossStreak < 0) currentLossStreak = 0;
  }

  totalBetAmount -= bet;
  totalProfit -= profit;
  roundTotalProfit -= profit;

  // ✅ maxLossCapital 不做任何还原！
  // 💡 原因：它是“历史最大本金消耗”，属于不可逆的峰值指标
  //     即使后续盈利回升，这个值也应保留为历史最大值
  //     因此在撤销操作中，我们不还原它，保持原状
  //     它会在 generateStats() 中根据 currentFund 重新判断是否需要更新（只会变大，不会变小）

  // 更新趋势图
  if (trendChart && trendChart.rawProfits.length > 0) {
    trendChart.rawProfits.pop();
    const displayData = trendChart.rawProfits;
    let cumulative = 0;
    trendChart.data.datasets[0].data = displayData.map(p => {
      cumulative += p;
      return cumulative;
    });
    trendChart.update();
  }

  // 重新生成所有统计 → 自动处理 maxLossCapital（只增不减）
  const stats = generateStats();
  updateStatsFromLedger(stats);
  calculateFlowTotal();

  if (willAffectRound || willAffectFlow) {
    setTimeout(() => {
      alert("⚠️ 注意：当前账本行数已小于‘重启系统’或‘重置流水’设定的起始行。\n建议点击【重启系统】以重新定义统计起点。");
    }, 300);
  }

  console.log("撤销完成，已更新所有统计", {
    winCount, lossCount, totalProfit, roundWinCount, roundLossCount, roundTotalProfit,
    roundStartIndex, roundStartIndexForFlow, currentRowCount: ledgerBody.rows.length
  });
}

  function recordHistory() {
    const rows = Array.from(ledgerBody.querySelectorAll("tr"));
    const history = rows.map(row => ({
      index: row.cells[0].textContent,
      profit: row.cells[1].textContent,
      bet: row.cells[2].textContent,
      result: row.cells[3].textContent
    }));
    localStorage.setItem("ledgerHistory", JSON.stringify(history));
    console.log("recordHistory: 已保存账本到 localStorage", history);
    alert("账本已保存！");
  }

  function toggleMode() {
    const statInputs = document.querySelectorAll('[id^="stat-"]');
    const roundInputs = document.querySelectorAll('[id^="round-"]');
    const isStatVisible = statInputs[0].style.display !== "none";
    statInputs.forEach(el => (el.style.display = isStatVisible ? "none" : "block"));
    roundInputs.forEach(el => (el.style.display = isStatVisible ? "block" : "none"));
    console.log("toggleMode: 切换到", isStatVisible ? "回合统计" : "总体统计");
  }

  // ✅ 修改2：generateStats() 中的“回合统计”逻辑完全替换
  function generateStats() {
    const safe = (val, digits = 1) =>
      typeof val === "number" && !isNaN(val) ? val.toFixed(digits) : "0";

    winCount = winCount ?? 0;
    lossCount = lossCount ?? 0;
    totalProfit = totalProfit ?? 0;
    maxBet = maxBet ?? 0;
    maxNetWin = maxNetWin ?? 0;
    minNetWin = minNetWin ?? 0;
    maxWinStreak = maxWinStreak ?? 0;
    maxLossStreak = maxLossStreak ?? 0;
    maxLossCapital = maxLossCapital ?? 0;

    const totalHands = winCount + lossCount;
    const netWin = winCount - lossCount;
    const winRate = totalHands > 0 ? ((winCount / totalHands) * 100).toFixed(2) + "%" : "0%";

    let strategicAverageWin = "0";
    if (netWin > 0) {
      strategicAverageWin = safe(totalProfit / netWin);
    } else if (netWin < 0) {
      const raw = totalProfit / netWin;
      if (totalProfit < 0) {
        strategicAverageWin = `-${safe(Math.abs(raw))}`;
      } else {
        strategicAverageWin = safe(raw);
      }
    } else {
      strategicAverageWin = safe(totalProfit);
    }

    // === 核心修改：决定起始索引 ===
    const rows = Array.from(ledgerBody.querySelectorAll("tr"));
    let startIndex;

    if (tempViewActive && tempStartRow !== null && tempStartRow >= 1) {
      startIndex = tempStartRow - 1;
      console.log("📊 临时查看：从第", tempStartRow, "行开始统计");
    } else {
      startIndex = roundStartIndex - 1;
      console.log("📊 正常模式：从第", roundStartIndex, "行开始统计");
    }

    if (startIndex < 0) startIndex = 0;
    if (startIndex >= rows.length) {
      console.log("⚠️ 起始行超出范围，回合无数据");
      startIndex = rows.length;
    }

    // === 计算回合统计（基于 startIndex）===
    let roundWinCountCalc = 0;
    let roundLossCountCalc = 0;
    let roundTotalProfitCalc = 0;

    for (let i = startIndex; i < rows.length; i++) {
      const profitCell = rows[i]?.cells[1]?.textContent.trim();
      if (profitCell) {
        const profit = parseFloat(profitCell.replace(/^\+/, ""));
        if (!isNaN(profit)) {
          if (profit > 0) roundWinCountCalc++;
          else if (profit < 0) roundLossCountCalc++;
          roundTotalProfitCalc += profit;
        }
      }
    }

    const roundTotalHands = roundWinCountCalc + roundLossCountCalc;
    const roundNetWin = roundWinCountCalc - roundLossCountCalc;
    const roundWinRate = roundTotalHands > 0 ? ((roundWinCountCalc / roundTotalHands) * 100).toFixed(2) + "%" : "0%";

    let roundStrategicAverageWin = "0";
    if (roundNetWin > 0) {
      roundStrategicAverageWin = safe(roundTotalProfitCalc / roundNetWin);
    } else if (roundNetWin < 0) {
      const raw = roundTotalProfitCalc / roundNetWin;
      if (roundTotalProfitCalc < 0) {
        roundStrategicAverageWin = `-${safe(Math.abs(raw))}`;
      } else {
        roundStrategicAverageWin = safe(raw);
      }
    } else {
      roundStrategicAverageWin = safe(roundTotalProfitCalc);
    }

    // === 流水总额（基于 roundStartIndexForFlow）===
    let flowTotal = 0;
    const flowStartIndex = roundStartIndexForFlow - 1;
    if (flowStartIndex >= 0 && flowStartIndex < rows.length) {
      for (let i = flowStartIndex; i < rows.length; i++) {
        const betCell = rows[i]?.cells[2]?.textContent.trim();
        if (betCell) {
          const bet = parseFloat(betCell);
          if (!isNaN(bet)) flowTotal += bet;
        }
      }
    }

    // === 输入参数解析 ===
    const initialBetInput = parseFloat(document.getElementById("input2")?.value);
    const expectedProfitInput = parseFloat(document.getElementById("input5")?.value);
    const betUnitInput = parseFloat(document.getElementById("input4")?.value);
    const currentBet = parseFloat(document.getElementById("input7")?.value);
    const initialCapital = parseFloat(document.getElementById("input1")?.value) || 0;
    const direction = getDirection();
    const initialBet = isNaN(initialBetInput) || initialBetInput <= 0 ? 100 : initialBetInput;
    const expectedProfit = isNaN(expectedProfitInput) || expectedProfitInput < 0 ? 1 : expectedProfitInput;
    const betUnit = isNaN(betUnitInput) || betUnitInput <= 0 ? 10 : betUnitInput;
    const betPlus6Percent = currentBet > 0 ? Math.ceil((currentBet * 1.06) / betUnit) * betUnit : "0";

    const currentFund = initialCapital + totalProfit;
    if (currentFund < initialCapital) {
      const currentLossCapital = initialCapital - currentFund;
      maxLossCapital = Math.max(maxLossCapital, currentLossCapital);
    }

    // === 目标完成度（总体）===
    let goalComplete = "0";
    if (totalHands > 0) {
      if (netWin === 0) {
        goalComplete = safe(totalProfit);
      } else if (netWin > 0) {
        if (totalProfit >= 0) {
          const tolerableLoss = (totalProfit - totalHands * expectedProfit) / netWin;
          const adjustedTolerableLoss = tolerableLoss >= 0 ? Math.floor(tolerableLoss / betUnit) * betUnit : 0;
          goalComplete = `可负${adjustedTolerableLoss}×${netWin}`;
        } else {
          const shortfall = (netWin * initialBet + totalHands * expectedProfit) - totalProfit;
          goalComplete = `缺${Math.floor(shortfall)}`;
        }
      } else {
        if (totalProfit >= 0) {
          goalComplete = "须0";
        } else {
          const needToRecover = (Math.abs(netWin) * expectedProfit + Math.abs(totalProfit)) / Math.abs(netWin);
          const adjustedNeedToRecover = Math.ceil(needToRecover / betUnit) * betUnit;
          goalComplete = `须${adjustedNeedToRecover}×${Math.abs(netWin)}`;
        }
      }
    }

    // === 目标完成度（回合）===
    let roundGoalComplete = "0";
    if (roundTotalHands > 0) {
      if (roundNetWin === 0) {
        roundGoalComplete = safe(roundTotalProfitCalc);
      } else if (roundNetWin > 0) {
        if (roundTotalProfitCalc >= 0) {
          const roundTolerableLoss = (roundTotalProfitCalc - roundTotalHands * expectedProfit) / roundNetWin;
          const adjustedRoundTolerableLoss = roundTolerableLoss >= 0 ? Math.floor(roundTolerableLoss / betUnit) * betUnit : 0;
          roundGoalComplete = `可负${adjustedRoundTolerableLoss}×${roundNetWin}`;
        } else {
          const roundShortfall = (roundNetWin * initialBet + roundTotalHands * expectedProfit) - roundTotalProfitCalc;
          roundGoalComplete = `缺${Math.floor(roundShortfall)}`;
        }
      } else {
        if (roundTotalProfitCalc >= 0) {
          roundGoalComplete = "须0";
        } else {
          const roundNeedToRecover = (Math.abs(roundNetWin) * expectedProfit + Math.abs(roundTotalProfitCalc)) / Math.abs(roundNetWin);
          const adjustedRoundNeedToRecover = Math.ceil(roundNeedToRecover / betUnit) * betUnit;
          roundGoalComplete = `须${adjustedRoundNeedToRecover}×${Math.abs(roundNetWin)}`;
        }
      }
    }

    // === 码洞（总体）===
    let totalHole = 0;
    if (totalHands > 0) {
      if (netWin === 0) {
        totalHole = totalProfit - (totalHands * expectedProfit);
      } else if (netWin > 0) {
        totalHole = totalProfit - (netWin * initialBet) - ((totalHands + netWin) * expectedProfit);
      } else {
        totalHole = totalProfit + (Math.abs(netWin) * initialBet) - ((totalHands + Math.abs(netWin)) * expectedProfit);
      }
    }
    const formattedTotalHole = safe(totalHole);

    // === 码洞（回合）===
    let roundHole = 0;
    if (roundTotalHands > 0) {
      if (roundNetWin === 0) {
        roundHole = roundTotalProfitCalc - (roundTotalHands * expectedProfit);
      } else if (roundNetWin > 0) {
        roundHole = roundTotalProfitCalc - (roundNetWin * initialBet) - ((roundTotalHands + roundNetWin) * expectedProfit);
      } else {
        roundHole = roundTotalProfitCalc + (Math.abs(roundNetWin) * initialBet) - ((roundTotalHands + Math.abs(roundNetWin)) * expectedProfit);
      }
    }
    const formattedRoundHole = safe(roundHole);

    // === 预知计算 ===
    let totalForecast = "0";
    let roundForecast = "0";
    if (currentBet > 0) {
      const winProfit = direction === "P" ? totalProfit + currentBet : totalProfit + currentBet * 0.95;
      const lossProfit = totalProfit - currentBet;
      const roundWinProfit = direction === "P" ? roundTotalProfitCalc + currentBet : roundTotalProfitCalc + currentBet * 0.95;
      const roundLossProfit = roundTotalProfitCalc - currentBet;

      if (netWin > 1) {
        const winAverage = safe(winProfit / (Math.abs(netWin) + 1));
        const lossAverage = Math.abs(netWin) > 1 ? safe(lossProfit / (Math.abs(netWin) - 1)) : "0";
        totalForecast = `${winAverage}/${lossAverage}`;
      } else if (netWin < -1) {
        const winAverage = safe(winProfit / (Math.abs(netWin) - 1));
        const lossAverage = safe(lossProfit / (Math.abs(netWin) + 1));
        totalForecast = `${winAverage}/${lossAverage}`;
      } else if (netWin === 1) {
        totalForecast = "注意锁利";
      } else if (netWin === -1) {
        totalForecast = "追数不可猛";
      } else {
        totalForecast = "回合结束";
      }

      if (roundNetWin > 1) {
        const roundWinAverage = safe(roundWinProfit / (Math.abs(roundNetWin) + 1));
        const roundLossAverage = Math.abs(roundNetWin) > 1 ? safe(roundLossProfit / (Math.abs(roundNetWin) - 1)) : "0";
        roundForecast = `${roundWinAverage}/${roundLossAverage}`;
      } else if (roundNetWin < -1) {
        const roundWinAverage = safe(roundWinProfit / (Math.abs(roundNetWin) - 1));
        const roundLossAverage = safe(roundLossProfit / (Math.abs(roundNetWin) + 1));
        roundForecast = `${roundWinAverage}/${roundLossAverage}`;
      } else if (roundNetWin === 1) {
        roundForecast = "注意锁利";
      } else if (roundNetWin === -1) {
        roundForecast = "追数不可猛";
      } else {
        roundForecast = "回合结束";
      }
    }

    const overallAverageProfit = totalHands > 0 ? totalProfit / totalHands : 0;
    const formattedOverallAverageProfit = safe(overallAverageProfit);

    return {
      totalHands: totalHands > 0 ? totalHands : "0",
      winHands: winCount > 0 ? winCount : "0",
      lossHands: lossCount > 0 ? lossCount : "0",
      netWin: totalHands > 0 ? netWin : "0",
      winRate,
      totalProfit: totalProfit !== 0 ? safe(totalProfit) : "0",
      averageWin: strategicAverageWin,
      goalComplete,
      totalHole: formattedTotalHole,
      roundTotalHands: roundTotalHands > 0 ? roundTotalHands : "0",
      roundWinHands: roundWinCountCalc > 0 ? roundWinCountCalc : "0",
      roundNetWin: roundTotalHands > 0 ? roundNetWin : "0",
      roundWinRate,
      roundTotalProfit: roundTotalProfitCalc !== 0 ? safe(roundTotalProfitCalc) : "0",
      roundAverageWin: roundStrategicAverageWin,
      roundGoalComplete,
      roundHole: formattedRoundHole,
      maxBet: maxBet > 0 ? safe(maxBet) : "0",
      maxNetWin: maxNetWin !== 0 ? maxNetWin : "0",
      minNetWin: minNetWin !== 0 ? minNetWin : "0",
      maxWinStreak: maxWinStreak > 0 ? maxWinStreak : "0",
      maxLossStreak: maxLossStreak > 0 ? maxLossStreak : "0",
      maxLossCapital: maxLossCapital > 0 ? safe(maxLossCapital) : "0",
      currentFund: totalProfit !== 0 || initialCapital > 0 ? safe(currentFund) : "0",
      flowTotal: flowTotal > 0 ? safe(flowTotal) : "0",
      totalForecast,
      roundForecast,
      betPlus6Percent,
      sysAverageWin: formattedOverallAverageProfit
    };
  }
  // 更新统计区
function updateStatsFromLedger(stats) {
  const mapping = {
    totalHands:        "stat-total-hands",
    winHands:          "stat-win-hands",
    netWin:            "stat-net-win",
    winRate:           "stat-win-rate",
    totalProfit:       "stat-total-profit",
    averageWin:        "stat-average-win",
    goalComplete:      "stat-goal-complete",
    totalHole:         "stat-round-hole",
    roundTotalHands:   "round-total-hands",
    roundWinHands:     "round-win-hands",
    roundNetWin:       "round-net-win",
    roundWinRate:      "round-win-rate",
    roundTotalProfit:  "round-total-profit",
    roundAverageWin:   "round-average-win",
    roundGoalComplete: "round-goal-complete",
    roundHole:         "round-hole",
    maxBet:            "sys-max-bet",
    maxNetWin:         "sys-max-netwin",
    minNetWin:         "sys-min-netwin",
    maxWinStreak:      "sys-max-win-streak",
    maxLossCapital:    "sys-max-loss-capital",
    currentFund:       "sys-current-fund",
    flowTotal:         "sys-flow-total",
    totalForecast:     "sys-total-forecast",
    roundForecast:     "sys-round-forecast",
    betPlus6Percent:   "input8",
    sysAverageWin:     "sys-average-win"
  };

  for (const key in mapping) {
    const el = document.getElementById(mapping[key]);
    if (el) {
      const value = stats[key] ?? "0";
      el.value = value;
      console.log(`更新 ${mapping[key]} = ${value}`);
    } else {
      console.error(`未找到 DOM 元素：${mapping[key]}`);
    }
  }
  console.log("统计已更新：", stats);

  // ✅ ✅ ✅ 开始：纯视觉增强，不影响任何逻辑 ✅ ✅ ✅
  // 所有操作只改 style.color，不改数据

  const initialCapital = parseFloat(document.getElementById("input1")?.value) || 0;

  // 工具函数：设置颜色
  const setColor = (id, condition) => {
    const el = document.getElementById(id);
    if (el) el.style.color = condition ? "red" : "";
  };

  // 工具函数：安全解析数值
  const parseValue = (str) => {
    if (typeof str !== "string") str = String(str);
    const cleaned = str.replace(/[^\d.-]/g, "");
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  // 1️⃣ 胜率 ≥50% → 红色
  const overallWinRate = document.getElementById("stat-win-rate")?.value || "0%";
  const roundWinRate = document.getElementById("round-win-rate")?.value || "0%";
  const overallWinRateNum = parseFloat(overallWinRate) || 0;
  const roundWinRateNum = parseFloat(roundWinRate) || 0;

  setColor("stat-win-rate", overallWinRateNum >= 50);
  setColor("round-win-rate", roundWinRateNum >= 50);

  // 2️⃣ 以下字段 >0 → 红色
  const positiveFields = [
    "stat-net-win",
    "stat-total-profit",
    "stat-average-win",
    "stat-round-hole",
    "round-net-win",
    "round-total-profit",
    "round-average-win",
    "round-hole",
    "sys-average-win",
    "sys-current-fund"
  ];

  positiveFields.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      const value = el.value;
      const num = parseValue(value);
      setColor(id, num > 0);
    }
  });

  // 3️⃣ 当前资金 > 注入本金 → 红色
  const currentFundEl = document.getElementById("sys-current-fund");
  if (currentFundEl) {
    const currentFund = parseValue(currentFundEl.value);
    setColor("sys-current-fund", currentFund > initialCapital);
  }

  // ✅ ✅ ✅ 结束：视觉增强 ✅ ✅ ✅
}

function addLedgerRow(typeLabel, profit) {
  const bet = getBetAmount();
  const direction = getDirection();

  const left = typeLabel.startsWith("WIN") ? "1" : "0";
  const actualWinner =
    typeLabel === "WINB" || typeLabel === "LOSP" ? "B" :
    typeLabel === "WINP" || typeLabel === "LOSB" ? "P" : null;
  const right = direction === actualWinner ? "1" : "0";

  const statusHtml = `
    <span style="color: ${left === "1" ? "red" : "green"};">${left}</span>
    <span style="color: #999; padding: 0 4px;">|</span>
    <span style="color: ${right === "1" ? "red" : "green"};">${right}</span>
  `;

  // 🧠 找到系统创建的空白高亮行
  let tr = Array.from(ledgerBody.querySelectorAll("tr"))
    .find(row => row.classList.contains("round-start-row") &&
                 row.cells[1]?.textContent.trim() === "");

  let rowIndex;

  if (tr) {
    // ✅ 用空白行来填数据
    rowIndex = Number(tr.cells?.[0]?.textContent) || (ledgerBody.rows.length);
  } else {
    // 🆕 没有空行就新建一行
    rowIndex = ledgerBody.rows.length + 1;
    tr = document.createElement("tr");
    ledgerBody.appendChild(tr);
  }

  // 🌈 设置备注栏的斑马线背景色（偶数行灰，奇数行白）
  const isEvenRow = rowIndex % 2 === 0;
  const remarkBg = isEvenRow ? "#f7f7f7" : "#ffffff";

  // ✨ 填充整行内容
  tr.innerHTML = `
    <td style="text-align:right;padding-left:10px">${rowIndex}</td>
    <td style="text-align:right;color:${profit >= 0 ? "red" : "green"}">
      ${profit.toFixed(2)}
    </td>
    <td style="text-align:right">${bet.toFixed(0)}</td>
    <td style="text-align:center;font-family:monospace;font-size:12px;padding:4px">${statusHtml}</td>
    <td contenteditable="true" title="点击填写备注"
        style="background-color: ${remarkBg}; text-align:left;padding:4px 8px;font-size:12px;color:#333;word-break:break-word;white-space:normal;">
    </td>
  `;

  if (rowIndex === roundStartIndex) {
    tr.classList.add("round-start-row");
  }

  tr.scrollIntoView({ behavior: "smooth", block: "end" });
}


  function calculateFlowTotal() {
    let flowTotalBet = 0;
    const rows = Array.from(ledgerBody.querySelectorAll("tr"));
    if (rows.length === 0 || roundStartIndexForFlow > rows.length + 1) {
      const totalFlowInput = document.getElementById("sys-flow-total");
      if (totalFlowInput) totalFlowInput.value = "0";
      return 0;
    }
    for (let i = roundStartIndexForFlow - 1; i < rows.length; i++) {
      const betCell = rows[i]?.cells[2]?.textContent.trim();
      if (betCell) {
        const bet = parseFloat(betCell);
        if (!isNaN(bet)) flowTotalBet += bet;
      }
    }
    const totalFlowInput = document.getElementById("sys-flow-total");
    if (totalFlowInput) totalFlowInput.value = flowTotalBet > 0 ? flowTotalBet.toFixed(1) : "0";
    return flowTotalBet;
  }
function handleClick(typeLabel) {
  const bet = getBetAmount();
  const profit = calculateProfit(typeLabel, bet);

  updateStatsOnClick(typeLabel, bet);
  addLedgerRow(typeLabel, profit);
  updateStatsFromLedger(generateStats());
  calculateFlowTotal();
}


  function exportLedgerData() {
  const rows = Array.from(ledgerBody.querySelectorAll("tr"));
  if (rows.length === 0) {
    alert("账本为空，无法导出！");
    return;
  }

  // 构建数据数组
  const data = [];
  const headers = ["行号", "盈亏", "下注", "结果", "状态"];
  data.push(headers);

  rows.forEach(row => {
    const cells = Array.from(row.cells).map(cell => {
      // 提取文本内容，去除 HTML 标签
      const div = document.createElement("div");
      div.innerHTML = cell.innerHTML || cell.textContent;
      return div.textContent.trim().replace(/\s+/g, " ");
    });
    data.push(cells);
  });

  // 获取时间戳用于文件名
  const now = new Date();
  const timestamp = now.getFullYear() +
    (now.getMonth()+1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0') +
    "-" +
    now.getHours().toString().padStart(2, '0') +
    now.getMinutes().toString().padStart(2, '0') +
    now.getSeconds().toString().padStart(2, '0');

  // 选择格式（可扩展）
  const format = "csv"; // 默认 csv，未来可改为用户选择

  if (format === "csv") {
    exportToCSV(data, `账本记录-${timestamp}.csv`);
  } else if (format === "json") {
    exportToJSON(data, `账本记录-${timestamp}.json`);
  }
}

function exportToCSV(data, filename) {
  // 转为 CSV 字符串
  const csvContent = data.map(row => 
    row.map(cell => 
      `"${cell.replace(/"/g, '""')}"` // 处理引号
    ).join(",")
  ).join("\n");

  // 创建 Blob
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  console.log("已导出 CSV 文件：", filename);
}

function exportToJSON(data, filename) {
  const jsonContent = JSON.stringify({
    exportedAt: new Date().toISOString(),
    rowCount: data.length - 1,
    headers: data[0],
    records: data.slice(1)
  }, null, 2);

  const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  console.log("已导出 JSON 文件：", filename);
}  

// 修改 exportLedgerData 开头：
function exportLedgerData() {
  const choice = prompt(
    "选择导出格式：\n1 - CSV（推荐，可用Excel打开）\n2 - JSON（结构化数据）\n\n输入 1 或 2，直接回车默认为 CSV",
    "1"
  );

  let format = "csv";
  if (choice === "2") format = "json";
  else if (choice !== null && choice !== "" && choice !== "1") {
    alert("无效选择，使用默认格式 CSV");
  }

  // 后续同上...
} 

  // ✅ 修改3：移除 bind()，全部使用 addEventListener
  document.getElementById("winB")?.addEventListener("click", () => handleClick("WINB"));
  document.getElementById("winP")?.addEventListener("click", () => handleClick("WINP"));
  document.getElementById("losB")?.addEventListener("click", () => handleClick("LOSB"));
  document.getElementById("losP")?.addEventListener("click", () => handleClick("LOSP"));

  document.getElementById("restartSystem")?.addEventListener("click", restartSystem);
  document.getElementById("resetFlow")?.addEventListener("click", resetFlow);
  document.getElementById("randomDirection")?.addEventListener("click", () => {
    const r = Math.random() < 0.5 ? "B" : "P";
    document.getElementById("input6").value = r;
    updateStatsFromLedger(generateStats());
  });
  document.getElementById("deleteData")?.addEventListener("click", deleteData);
  document.getElementById("recordHistory")?.addEventListener("click", exportLedgerData);
  document.getElementById("toggleMode")?.addEventListener("click", toggleMode);
  document.getElementById("recordRewrite")?.addEventListener("click", undoLastEntry);

// ✅ 替换原有的 temporaryView 事件绑定
document.getElementById("temporaryView")?.addEventListener("click", () => {
  if (!tempViewActive) {
    // 进入临时查看模式
    tempViewActive = true;
    tempStartRow = null;
    console.log("🔍 已进入临时查看模式，请点击账本第1列选择起始行");

    const rows = Array.from(ledgerBody.querySelectorAll("tr"));
    rows.forEach((row, index) => {
      const cell = row.cells[0];
      if (cell) {
        cell.style.cursor = "pointer";
        cell.title = "点击设为临时查看起点";
        cell.onclick = () => {
          tempStartRow = index + 1;  // 行号从1开始
          console.log("✅ 临时查看起始行：第", tempStartRow, "行");

          // 🔍 清除之前的所有高亮
          document.querySelectorAll(".temporary-range").forEach(el => {
            el.classList.remove("temporary-range");
          });

          // 🎯 从 tempStartRow-1（索引）开始到结尾，添加高亮
          const startIndex = tempStartRow - 1;
          if (startIndex >= 0 && startIndex < rows.length) {
            for (let i = startIndex; i < rows.length; i++) {
              rows[i].classList.add("temporary-range");
            }
          }

          // 更新统计
          updateStatsFromLedger(generateStats());
        };
      }
    });

  } else {
    // 退出临时查看
    tempViewActive = false;
    tempStartRow = null;
    console.log("↩️ 退出临时查看，恢复为正常统计");

    // 🔴 清除所有高亮
    document.querySelectorAll(".temporary-range").forEach(el => {
      el.classList.remove("temporary-range");
    });

    // 移除点击事件和样式
    const rows = Array.from(ledgerBody.querySelectorAll("tr"));
    rows.forEach(row => {
      const cell = row.cells[0];
      if (cell) {
        cell.onclick = null;
        cell.style.cursor = "";
        cell.title = "";
      }
    });

    // 恢复正常统计
    updateStatsFromLedger(generateStats());
  }
});

  // 输入框事件
  const betInput = document.getElementById("input7");
  if (betInput) {
    betInput.addEventListener("click", () => { betInput.value = ""; });
    betInput.addEventListener("change", () => {
      const value = parseFloat(betInput.value);
      if (isNaN(value) || value <= 0) {
        betInput.value = "";
      } else {
        updateStatsFromLedger(generateStats());
      }
    });
  }

  const directionInput = document.getElementById("input6");
  if (directionInput) {
    directionInput.style.fontWeight = "bold";
    directionInput.addEventListener("change", () => {
      const value = directionInput.value.trim();
      if (value !== "B" && value !== "P") directionInput.value = "B";
      updateStatsFromLedger(generateStats());
    });
  }

  deleteData();
});
// script.js 文件注册
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(registration => {
        console.log('✅ Service Worker 注册成功:', registration);
      })
      .catch(error => {
        console.log('❌ Service Worker 注册失败:', error);
      });
  });
}

// 其他初始化代码...

// 👇 安装提示逻辑开始

document.addEventListener('DOMContentLoaded', () => {
  const installBtn = document.getElementById('installBtn');
  let deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.style.display = 'inline-block';
  });

  installBtn.addEventListener('click', () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('✅ 用户接受安装');
        installBtn.textContent = '✅ 已安装';
      } else {
        console.log('❌ 用户拒绝安装');
      }
      deferredPrompt = null;
    });
  });
});

// ========== 新增：授权与云端集成 ==========
class CloudManager {
    constructor() {
        this.currentUser = null;
        this.currentLicense = null;
        this.isInitialized = false;
    }

    // 初始化：检查登录状态
    async init() {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            this.currentUser = user;
            await this.loadUserLicense();
            console.log('✅ 用户已登录:', user.email);
            this.isInitialized = true;
            this.onAuthSuccess();
        } else {
            console.log('⚠️ 用户未登录');
            this.redirectToLogin();
        }
    }

    // 加载用户的许可证
    async loadUserLicense() {
        const { data, error } = await supabase
            .from('user_licenses')
            .select('*')
            .eq('user_id', this.currentUser.id)
            .order('created_at', { ascending: false })
            .limit(1);

        if (error) {
            console.error('加载许可证失败:', error);
            return;
        }

        if (data && data.length > 0) {
            this.currentLicense = data[0];
            console.log('🔑 当前许可证:', this.currentLicense.plan_type);
            
            // 如果是免费版，添加水印或功能限制
            if (this.currentLicense.plan_type === 'free') {
                this.applyFreeTierRestrictions();
            }
        }
    }

    // 应用免费版限制
    applyFreeTierRestrictions() {
        // 示例：在页面上添加水印
        const watermark = document.createElement('div');
        watermark.innerText = '免费试用版 - 升级解锁全部功能';
        watermark.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 24px;
            color: rgba(255, 0, 0, 0.5);
            pointer-events: none;
            z-index: 9999;
        `;
        document.body.appendChild(watermark);

        // 你可以在这里添加更多免费版限制，比如：
        // - 限制计算次数
        // - 禁用某些高级按钮
        // - 在保存数据时弹出升级提示
    }

    // 保存数据到云端
    async saveDataToCloud(dataToSave) {
        if (!this.currentUser) {
            alert('请先登录以保存数据！');
            return false;
        }

        const { error } = await supabase
            .from('user_data')
            .insert([
                {
                    user_id: this.currentUser.id,
                    data: dataToSave,
                    device_id: this.getDeviceId()
                }
            ]);

        if (error) {
            console.error('保存失败:', error);
            alert('数据保存失败，请检查网络');
            return false;
        }

        console.log('💾 数据已保存到云端');
        return true;
    }

    // 从云端加载数据
    async loadDataFromCloud() {
        if (!this.currentUser) {
            return null;
        }

        const { data, error } = await supabase
            .from('user_data')
            .select('data, created_at')
            .eq('user_id', this.currentUser.id)
            .order('created_at', { ascending: false })
            .limit(1); // 只加载最新的记录

        if (error) {
            console.error('加载失败:', error);
            return null;
        }

        if (data && data.length > 0) {
            console.log('📥 从云端加载了数据');
            return data[0].data;
        }

        return null;
    }

    // 获取设备ID（简单实现）
    getDeviceId() {
        let deviceId = localStorage.getItem('device_id');
        if (!deviceId) {
            deviceId = 'device-' + Math.random().toString(36).substring(2, 15);
            localStorage.setItem('device_id', deviceId);
        }
        return deviceId;
    }

    // 登录成功后的回调
    onAuthSuccess() {
        // 隐藏登录页面，显示主应用
        document.getElementById('login-container')?.style.display = 'none';
        document.getElementById('main-app')?.style.display = 'block';

        // 自动加载云端数据
        this.loadDataFromCloud().then(savedData => {
            if (savedData) {
                // 假设你有一个函数叫 `restoreAppState` 来恢复应用状态
                if (typeof window.restoreAppState === 'function') {
                    window.restoreAppState(savedData);
                } else {
                    console.log('Loaded data:', savedData);
                    // 你可以在这里直接操作你的应用状态
                }
            }
        });
    }

    // 重定向到登录页
    redirectToLogin() {
        window.location.href = 'login.html';
    }

    // 登出
    async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('登出失败:', error);
        } else {
            window.location.href = 'login.html';
        }
    }
}

// 初始化云端管理器
const cloudManager = new CloudManager();

// 在你的应用初始化时调用
async function initApp() {
    await cloudManager.init();

    // ========== 你的原有初始化代码 ==========
    // ... (这里是你原有的初始化逻辑)
    // ========== 你的原有初始化代码 ==========

    // 重写你原有的“保存”按钮点击事件，改为保存到云端
    const saveButton = document.getElementById('save-button'); // 请替换为你的实际按钮ID
    if (saveButton) {
        saveButton.addEventListener('click', async () => {
            // 假设你有一个函数 `getCurrentAppState` 来获取当前应用状态
            const currentData = typeof window.getCurrentAppState === 'function' 
                ? window.getCurrentAppState() 
                : { timestamp: new Date().toISOString(), message: '手动保存' };

            await cloudManager.saveDataToCloud(currentData);
        });
    }
}

// 启动应用
initApp();

// 将 cloudManager 挂载到全局，方便调试
window.cloudManager = cloudManager;
// v1.0.1 - 20250529 - 强制刷新 GitHub Pages 缓存