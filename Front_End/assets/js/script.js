// --- متغیرهای سراسری ---
let network = null;
let selectedFinalStates = new Set();
let currentNFA = null;

// --- المان‌های DOM ---
const statesInput = document.getElementById("statesInput");
const btnConfirmStates = document.getElementById("btnConfirmStates");
const alphabetInput = document.getElementById("alphabetInput");
const btnConfirmAlphabet = document.getElementById("btnConfirmAlphabet");
const startStateSelect = document.getElementById("startStateSelect");
const finalStatesButtons = document.getElementById("finalStatesButtons");
const transitionsContainer = document.getElementById("transitionsContainer");
const btnAddTransition = document.getElementById("btnAddTransition");
const btnClearTransitions = document.getElementById("btnClearTransitions");
const stringInput = document.getElementById("stringInput");
const simulationResult = document.getElementById("simulationResult");
const btnCalcClosure = document.getElementById("btnLambdaClosure");
const btnSimulate = document.getElementById("btnSimulate");
const btnRemoveLambda = document.getElementById("btnRemoveLambda");
const btnExportText = document.getElementById("btnExportText");
const btnDrawNFALambda = document.getElementById("btnDrawNFALambda");
const btnDrawNFA = document.getElementById("btnDrawNFA");
const btnClearGraph = document.getElementById("btnClearGraph");
const textInputArea = document.getElementById("textInputArea");
const btnParseTextInput = document.getElementById("btnParseTextInput");
const outputText = document.getElementById("textOutput");
const graphContainer = document.getElementById("graphContainer");

// --- تب‌ها ---
document.querySelectorAll(".tab-btn").forEach((tab) => {
  tab.addEventListener("click", () => {
    document
      .querySelectorAll(".tab-btn")
      .forEach((t) => t.classList.remove("active"));
    document
      .querySelectorAll(".tab-content")
      .forEach((c) => c.classList.remove("active"));

    tab.classList.add("active");
    document.getElementById(tab.dataset.tab).classList.add("active");
  });
});

// --- تب‌های خروجی ---
document.querySelectorAll(".output-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document
      .querySelectorAll(".output-tab")
      .forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
  });
});

// --- مقداردهی اولیه ---
document.addEventListener("DOMContentLoaded", () => {
  addTransitionRow();
  updateFinalStatesButtons();
});

// --- توابع رابط کاربری ---
btnConfirmStates.addEventListener("click", () => {
  const statesStr = statesInput.value.trim();
  if (!statesStr) {
    showError("لطفا وضعیت‌ها را وارد کنید");
    return;
  }

  const states = statesStr.split(/[\s,]+/).filter((s) => s !== "");
  if (states.length === 0) {
    showError("وضعیت‌های معتبری وارد کنید");
    return;
  }

  startStateSelect.innerHTML = '<option value="">-- انتخاب کنید --</option>';
  states.forEach((state) => {
    const option = document.createElement("option");
    option.value = state;
    option.textContent = state;
    startStateSelect.appendChild(option);
  });

  updateFinalStatesButtons(states);
  showSuccess("وضعیت‌ها با موفقیت ثبت شدند");
});

btnConfirmAlphabet.addEventListener("click", () => {
  const alphabetStr = alphabetInput.value.trim();
  const alphabet = alphabetStr.split(/[\s,]+/).filter((s) => s !== "");
  if (alphabet.length > 0) {
    showSuccess("الفبا با موفقیت ثبت شد");
  }
});

function updateFinalStatesButtons(states = null) {
  if (!states) {
    states = statesInput.value
      .trim()
      .split(/[\s,]+/)
      .filter((s) => s !== "");
  }

  finalStatesButtons.innerHTML = "";
  selectedFinalStates.clear();

  states.forEach((state) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "final-state-btn";
    button.textContent = state;
    button.dataset.state = state;

    button.addEventListener("click", () => {
      button.classList.toggle("selected");
      if (button.classList.contains("selected")) {
        selectedFinalStates.add(state);
      } else {
        selectedFinalStates.delete(state);
      }
    });

    finalStatesButtons.appendChild(button);
  });
}

btnAddTransition.addEventListener("click", () => addTransitionRow());

function addTransitionRow(from = "", symbol = "", to = "") {
  const row = document.createElement("div");
  row.className = "transition-row";

  row.innerHTML = `
        <input type="text" class="trans-from" placeholder="q0" value="${from}" list="statesList">
        <input type="text" class="trans-symbol" placeholder="a یا λ" value="${symbol}">
        <input type="text" class="trans-to" placeholder="q1" value="${to}" list="statesList">
        <button type="button" class="btn-remove-transition">❌ حذف</button>
    `;

  if (!document.getElementById("statesList")) {
    const datalist = document.createElement("datalist");
    datalist.id = "statesList";
    const states = statesInput.value
      .trim()
      .split(/[\s,]+/)
      .filter((s) => s !== "");
    states.forEach((state) => {
      const option = document.createElement("option");
      option.value = state;
      datalist.appendChild(option);
    });
    document.body.appendChild(datalist);
  }

  row
    .querySelector(".btn-remove-transition")
    .addEventListener("click", function () {
      row.remove();
    });

  transitionsContainer.appendChild(row);
}

btnClearTransitions.addEventListener("click", () => {
  if (confirm("آیا از پاک کردن همه انتقال‌ها مطمئنید؟")) {
    transitionsContainer.innerHTML = "";
    addTransitionRow();
  }
});

btnParseTextInput.addEventListener("click", parseTextInput);

function parseTextInput() {
  const text = textInputArea.value.trim();
  if (!text) {
    showError("لطفا ورودی متنی را وارد کنید");
    return;
  }

  try {
    const nfaData = parseNFAText(text);
    statesInput.value = nfaData.Q.join(", ");
    alphabetInput.value = nfaData.Sigma.join(", ");

    updateStateSelectorsFromText(nfaData.Q, nfaData.q0, nfaData.F);

    transitionsContainer.innerHTML = "";
    nfaData.delta.forEach((trans) => {
      addTransitionRow(trans.from, trans.symbol, trans.to);
    });

    document.querySelector('[data-tab="input-tab"]').click();
    showSuccess("ورودی متنی با موفقیت تحلیل شد");
  } catch (error) {
    showError("خطا در تحلیل ورودی: " + error.message);
  }
}

function parseNFAText(text) {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line);
  let Q = [],
    Sigma = [],
    q0 = "",
    F = [],
    delta = [];

  lines.forEach((line) => {
    if (line.toLowerCase().startsWith("q =")) {
      Q = line
        .substring(3)
        .trim()
        .split(/[\s,]+/)
        .filter((s) => s !== "");
    } else if (
      line.toLowerCase().startsWith("σ =") ||
      line.toLowerCase().startsWith("sigma =")
    ) {
      Sigma = line
        .substring(line.indexOf("=") + 1)
        .trim()
        .split(/[\s,]+/)
        .filter((s) => s !== "");
    } else if (line.toLowerCase().startsWith("q0 =")) {
      q0 = line.substring(4).trim();
    } else if (line.toLowerCase().startsWith("f =")) {
      F = line
        .substring(3)
        .trim()
        .split(/[\s,]+/)
        .filter((s) => s !== "");
    } else if (
      line.toLowerCase().startsWith("δ(") ||
      line.toLowerCase().startsWith("d(")
    ) {
      const match = line.match(/[δd]\(([^,)]+),\s*([^)]+)\)\s*=\s*(.+)/i);
      if (match) {
        const from = match[1].trim();
        let symbol = match[2].trim();
        const to = match[3].trim();
        if (symbol.toLowerCase() === "lambda") symbol = "λ";
        delta.push({ from, symbol, to });
      }
    }
  });

  if (delta.some((t) => t.symbol === "λ") && !Sigma.includes("λ")) {
    Sigma.push("λ");
  }

  return { Q, Sigma, q0, F, delta };
}

function updateStateSelectorsFromText(states, startState, finalStates) {
  startStateSelect.innerHTML = '<option value="">-- انتخاب کنید --</option>';
  states.forEach((state) => {
    const option = document.createElement("option");
    option.value = state;
    option.textContent = state;
    if (state === startState) option.selected = true;
    startStateSelect.appendChild(option);
  });

  updateFinalStatesButtons(states);
  finalStates.forEach((state) => {
    const btn = document.querySelector(
      `.final-state-btn[data-state="${state}"]`,
    );
    if (btn) btn.click();
  });
}

function getNFADataFromForm() {
  const Q = statesInput.value
    .trim()
    .split(/[\s,]+/)
    .filter((s) => s !== "");
  const Sigma = alphabetInput.value
    .trim()
    .split(/[\s,]+/)
    .filter((s) => s !== "");
  const q0 = startStateSelect.value;
  const F = Array.from(selectedFinalStates);

  const delta = [];
  const rows = transitionsContainer.querySelectorAll(".transition-row");
  rows.forEach((row) => {
    const from = row.querySelector(".trans-from").value.trim();
    let symbol = row.querySelector(".trans-symbol").value.trim();
    const to = row.querySelector(".trans-to").value.trim();

    if (symbol === "" || symbol.toLowerCase() === "lambda") symbol = "λ";
    if (from && symbol && to) {
      delta.push({ from, symbol, to });
    }
  });

  if (delta.some((t) => t.symbol === "λ") && !Sigma.includes("λ")) {
    Sigma.push("λ");
  }

  currentNFA = { Q, Sigma, q0, F, delta };
  return currentNFA;
}

// --- الگوریتم‌های اتوماتا ---
function getLambdaClosure(state, delta) {
  const closure = new Set([state]);
  const stack = [state];

  while (stack.length > 0) {
    const current = stack.pop();
    for (const t of delta) {
      if (t.from === current && t.symbol === "λ") {
        if (!closure.has(t.to)) {
          closure.add(t.to);
          stack.push(t.to);
        }
      }
    }
  }

  return Array.from(closure).sort();
}

function computeAllLambdaClosures(Q, delta) {
  const closures = {};
  Q.forEach((q) => {
    closures[q] = getLambdaClosure(q, delta);
  });
  return closures;
}

function simulateNFALambda(nfaData, word) {
  const { Q, q0, F, delta } = nfaData;
  let currentStates = new Set(getLambdaClosure(q0, delta));
  const steps = [
    `مرحله 0: λ-closure(${q0}) = {${Array.from(currentStates).join(", ")}}`,
  ];

  for (let i = 0; i < word.length; i++) {
    const char = word[i];
    const nextStates = new Set();

    for (const state of currentStates) {
      for (const t of delta) {
        if (t.from === state && t.symbol === char) {
          const targetClosure = getLambdaClosure(t.to, delta);
          targetClosure.forEach((s) => nextStates.add(s));
        }
      }
    }

    steps.push(
      `مرحله ${i + 1}: خواندن '${char}' → {${Array.from(currentStates).join(", ")}} با '${char}' → {${Array.from(nextStates).join(", ")}}`,
    );
    currentStates = nextStates;

    if (currentStates.size === 0) {
      steps.push("⚠️ هیچ انتقالی ممکن نیست!");
      break;
    }
  }

  const finalClosure = Array.from(currentStates);
  const isAccepted = finalClosure.some((state) => F.includes(state));

  return { accepted: isAccepted, finalStates: finalClosure, steps: steps };
}

function convertToNFA(nfaData) {
  const { Q, Sigma, q0, F, delta } = nfaData;
  const closures = computeAllLambdaClosures(Q, delta);

  const newDelta = [];
  const newDeltaSet = new Set();

  Q.forEach((q) => {
    const qClosure = closures[q];
    Sigma.forEach((symbol) => {
      if (symbol === "λ") return;

      const destStates = new Set();
      qClosure.forEach((cState) => {
        delta.forEach((t) => {
          if (t.from === cState && t.symbol === symbol) {
            closures[t.to].forEach((s) => destStates.add(s));
          }
        });
      });

      destStates.forEach((dest) => {
        const transStr = `${q},${symbol},${dest}`;
        if (!newDeltaSet.has(transStr)) {
          newDeltaSet.add(transStr);
          newDelta.push({ from: q, symbol: symbol, to: dest });
        }
      });
    });
  });

  const newF = Q.filter((q) => closures[q].some((s) => F.includes(s)));

  return {
    Q: Q,
    Sigma: Sigma.filter((s) => s !== "λ"),
    q0: q0,
    F: newF,
    delta: newDelta,
  };
}

// --- توابع هندل‌کننده عملیات ---
btnCalcClosure.addEventListener("click", () => {
  const nfa = getNFADataFromForm();
  if (!validateNFAData(nfa)) return;

  const closures = computeAllLambdaClosures(nfa.Q, nfa.delta);
  let output = "🔍 λ-Closure های هر حالت:\n\n";
  Object.entries(closures).forEach(([state, closure]) => {
    output += `λ-closure(${state}) = { ${closure.join(", ")} }\n`;
  });

  displayOutput(output, "lambda-closure");
});

btnSimulate.addEventListener("click", () => {
  const nfa = getNFADataFromForm();
  const word = stringInput.value.trim();

  if (!validateNFAData(nfa)) return;

  const result = simulateNFALambda(nfa, word);

  simulationResult.textContent = result.accepted
    ? "✅ رشته پذیرفته شد"
    : "❌ رشته رد شد";
  simulationResult.className = `result-box ${result.accepted ? "accepted" : "rejected"}`;

  let output = `🎯 شبیه‌سازی رشته: "${word}"\n\n`;
  output += `حالت شروع: ${nfa.q0}\n`;
  output += `حالت‌های نهایی: {${nfa.F.join(", ")}}\n\n`;
  output += "مراحل شبیه‌سازی:\n";
  result.steps.forEach((step) => {
    output += `  ${step}\n`;
  });
  output += `\nنتیجه نهایی: ${result.accepted ? "✅ پذیرفته شده" : "❌ رد شده"}\n`;
  output += `حالت‌های پایانی: {${result.finalStates.join(", ")}}`;

  displayOutput(output, "simulation");
});

btnRemoveLambda.addEventListener("click", () => {
  const nfa = getNFADataFromForm();
  if (!validateNFAData(nfa)) return;

  const newNFA = convertToNFA(nfa);

  let output = "🔄 NFA معادل (بدون λ):\n\n";
  output += `Q = { ${newNFA.Q.join(", ")} }\n`;
  output += `Σ = { ${newNFA.Sigma.join(", ")} }\n`;
  output += `q₀ = ${newNFA.q0}\n`;
  output += `F = { ${newNFA.F.join(", ")} }\n\n`;
  output += "تابع گذار (δ):\n";

  const transitionsByState = {};
  newNFA.delta.forEach((t) => {
    if (!transitionsByState[t.from]) {
      transitionsByState[t.from] = {};
    }
    if (!transitionsByState[t.from][t.symbol]) {
      transitionsByState[t.from][t.symbol] = [];
    }
    transitionsByState[t.from][t.symbol].push(t.to);
  });

  Object.entries(transitionsByState).forEach(([state, symbols]) => {
    Object.entries(symbols).forEach(([symbol, destinations]) => {
      output += `  δ(${state}, ${symbol}) = {${destinations.join(", ")}}\n`;
    });
  });

  if (newNFA.delta.length === 0) {
    output += "  (بدون انتقال)\n";
  }

  displayOutput(output, "nfa-conversion");
});

btnExportText.addEventListener("click", () => {
  const nfa = getNFADataFromForm();
  if (!validateNFAData(nfa)) return;

  let output = "💾 اطلاعات کامل ماشین:\n\n";
  output += `Q = ${nfa.Q.join(", ")}\n`;
  output += `Σ = ${nfa.Sigma.join(", ")}\n`;
  output += `q₀ = ${nfa.q0}\n`;
  output += `F = ${nfa.F.join(", ")}\n\n`;
  output += "تابع گذار:\n";
  nfa.delta.forEach((t) => {
    output += `δ(${t.from}, ${t.symbol}) = ${t.to}\n`;
  });

  displayOutput(output, "machine-info");
});

// --- توابع گراف ---
btnDrawNFALambda.addEventListener("click", () => {
  const nfa = getNFADataFromForm();
  if (!validateNFAData(nfa)) return;

  drawAutomatonGraph(nfa, "NFA با λ");
  showSuccess("گراف NFA-λ رسم شد");
});

btnDrawNFA.addEventListener("click", () => {
  const nfa = getNFADataFromForm();
  if (!validateNFAData(nfa)) return;

  const newNFA = convertToNFA(nfa);
  drawAutomatonGraph(newNFA, "NFA بدون λ");
  showSuccess("گراف NFA معادل رسم شد");
});

btnClearGraph.addEventListener("click", clearGraph);

function drawAutomatonGraph(nfaData, title = "") {
  clearGraph();

  const { Q, q0, F, delta } = nfaData;

  const nodes = Q.map((q) => {
    const isStart = q === q0;
    const isFinal = F.includes(q);

    let color = { background: "#97C2FC", border: "#2B7CE9" };
    let label = q;

    if (isStart && isFinal) {
      color = { background: "#10B981", border: "#047857" };
      label = `▶ ${q} ◀`;
    } else if (isStart) {
      color = { background: "#FCD34D", border: "#D97706" };
      label = `▶ ${q}`;
    } else if (isFinal) {
      color.background = "#FFFFFF";
    }

    return {
      id: q,
      label: label,
      color: color,
      borderWidth: isFinal ? 3 : 2,
      shape: "circle",
      font: { size: 16, face: "Vazirmatn" },
      size: 40, // اندازه ثابت برای گره‌ها
    };
  });

  // گروه‌بندی انتقال‌ها
  const edgeMap = {};
  delta.forEach((t) => {
    const key = `${t.from}-${t.to}`;
    if (!edgeMap[key]) {
      edgeMap[key] = {
        from: t.from,
        to: t.to,
        symbols: new Set(),
        isLambda: false,
        isSelfLoop: t.from === t.to,
      };
    }
    edgeMap[key].symbols.add(t.symbol);
    if (t.symbol === "λ") {
      edgeMap[key].isLambda = true;
    }
  });


  const edges = [];
  Object.values(edgeMap).forEach((e) => {
    const label = Array.from(e.symbols).join(", ");
    
    edges.push({
      from: e.from,
      to: e.to,
      label: label,
      arrows: "to",
      font: { 
        size: 14, 
        face: "Vazirmatn", 
        align: "top",
        color: e.isLambda ? "#EF4444" : "#3B82F6"
      },
      color: e.isLambda
        ? { color: "#EF4444", highlight: "#DC2626" }
        : { color: "#3B82F6", highlight: "#1D4ED8" },
      smooth: {
        type: "dynamic" // این ویژگی هم انتقالات عادی و هم حلقه‌ها را به شکل استاندارد رسم می‌کند
      }
    });
  });


  graphContainer.innerHTML = "";

  const data = {
    nodes: new vis.DataSet(nodes),
    edges: new vis.DataSet(edges),
  };

  const options = {
    physics: {
      enabled: true,
      solver: "forceAtlas2Based",
      forceAtlas2Based: {
        gravitationalConstant: -50,
        centralGravity: 0.01,
        springLength: 100,
        springConstant: 0.08,
        damping: 0.4,
        avoidOverlap: -1,
      },
      stabilization: {
        enabled: true,
        iterations: 1000,
        updateInterval: 100,
      },
    },
    interaction: {
      dragNodes: true,
      dragView: true,
      zoomView: true,
      hover: true,
    },
    edges: {
      arrows: {
        to: {
          enabled: true,
          scaleFactor: -0.5,
        },
      },
      scaling: {
        min: 1,
        max: 5,
        label: {
          enabled: true,
          min: 8,
          max: 30,
        },
      },
    },
    layout: {
      improvedLayout: true,
      hierarchical: {
        enabled: false,
      },
    },
  };

  network = new vis.Network(graphContainer, data, options);

  // پس از رسم، موقعیت‌ها را تنظیم کنیم
  network.on("stabilizationIterationsDone", function() {
    network.setOptions({
      physics: false // غیرفعال کردن فیزیک پس از تثبیت
    });
  });

  if (title) {
    const titleEl = document.createElement("div");
    titleEl.className = "graph-title";
    titleEl.textContent = title;
    titleEl.style.cssText = `
      position: absolute;
      top: 10px;
      left: 10px;
      background: rgba(255, 255, 255, 0.9);
      padding: 5px 10px;
      border-radius: 5px;
      font-weight: bold;
      z-index: 1000;
    `;
    graphContainer.appendChild(titleEl);
  }
}


function clearGraph() {
  if (network) {
    network.destroy();
    network = null;
  }
  graphContainer.innerHTML = `
        <div class="graph-placeholder">
            <p>گراف در اینجا رسم خواهد شد</p>
            <small>برای رسم گراف یکی از دکمه‌های بالا را کلیک کنید</small>
        </div>
    `;
}

// --- توابع کمکی ---
function displayOutput(text, type = "") {
  let htmlText = text
    .replace(/λ-closure/g, "%%LAMBDACLOSURE%%")
    .replace(/λ/g, "%%LAMBDA%%")
    .replace(/δ/g, "%%DELTA%%")
    .replace(/Σ/g, "%%SIGMA%%")
    .replace(/\bQ\b/g, "%%Q%%")
    .replace(/\bF\b/g, "%%F%%");

  htmlText = htmlText
    .replace(
      /%%LAMBDACLOSURE%%/g,
      '<span style="color: #7C3AED;">λ-closure</span>',
    )
    .replace(
      /%%LAMBDA%%/g,
      '<span style="color: #EF4444; font-weight: bold;">λ</span>',
    )
    .replace(/%%DELTA%%/g, '<span style="color: #3B82F6;">δ</span>')
    .replace(/%%SIGMA%%/g, '<span style="color: #10B981;">Σ</span>')
    .replace(/%%Q%%/g, '<span style="color: #F59E0B;">Q</span>')
    .replace(/%%F%%/g, '<span style="color: #8B5CF6;">F</span>');

  outputText.innerHTML = htmlText;
  outputText.scrollTop = outputText.scrollHeight;
}

function validateNFAData(nfa) {
  if (!nfa.Q || nfa.Q.length === 0) {
    showError("لطفا وضعیت‌ها را وارد کنید");
    return false;
  }
  if (!nfa.q0) {
    showError("لطفا حالت شروع را انتخاب کنید");
    return false;
  }
  if (!nfa.Q.includes(nfa.q0)) {
    showError("حالت شروع باید جزو وضعیت‌ها باشد");
    return false;
  }
  if (nfa.F.length === 0) {
    if (!confirm("هیچ حالت نهایی انتخاب نشده. آیا ادامه می‌دهید؟")) {
      return false;
    }
  }
  return true;
}

function showError(message) {
  alert(`❌ خطا: ${message}`);
}

function showSuccess(message) {
  console.log(`✅ ${message}`);
}
