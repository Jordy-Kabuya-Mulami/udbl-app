// Barème standard LMD : CC (40%) + Examen (60%)
const WEIGHT_CC = 0.4;
const WEIGHT_EXAM = 0.6;

document.addEventListener("DOMContentLoaded", () => {
  // Ajouter 3 lignes par défaut au chargement
  addSubjectRow("Algorithmique & Programmation", 6);
  addSubjectRow("Mathématiques Discrètes", 4);
  addSubjectRow("Architecture des Ordinateurs", 5);
});

function addSubjectRow(name = "", credits = 3) {
  const container = document.getElementById("subjects-container");
  const rowId = 'row-' + Date.now() + Math.random().toString(36).substr(2, 4);

  const tr = document.createElement("tr");
  tr.id = rowId;
  tr.className = "hover:bg-slate-700/30 transition";

  tr.innerHTML = `
    <td class="p-3">
      <input type="text" value="${name}" placeholder="Ex: Droit Civil" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none">
    </td>
    <td class="p-3">
      <input type="number" min="1" max="15" value="${credits}" onchange="calculateLMD()" class="w-20 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-center focus:ring-2 focus:ring-blue-500 outline-none subject-credits">
    </td>
    <td class="p-3">
      <input type="number" min="0" max="20" placeholder="CC" oninput="calculateLMD()" class="w-24 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-center focus:ring-2 focus:ring-blue-500 outline-none subject-cc">
    </td>
    <td class="p-3">
      <input type="number" min="0" max="20" placeholder="Exam" oninput="calculateLMD()" class="w-24 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-center focus:ring-2 focus:ring-blue-500 outline-none subject-exam">
    </td>
    <td class="p-3 font-bold text-sm subject-average">
      -- / 20
    </td>
    <td class="p-3 text-center">
      <button onclick="removeSubjectRow('${rowId}')" class="text-red-400 hover:text-red-300 text-xs font-semibold px-2 py-1 bg-red-500/10 rounded-lg border border-red-500/20">Supprimer</button>
    </td>
  `;

  container.appendChild(tr);
  calculateLMD();
}

function removeSubjectRow(rowId) {
  const row = document.getElementById(rowId);
  if (row) {
    row.remove();
    calculateLMD();
  }
}

function calculateLMD() {
  const rows = document.querySelectorAll("#subjects-container tr");
  let totalPoints = 0;
  let totalCredits = 0;
  let validatedCredits = 0;

  rows.forEach(row => {
    const credits = parseFloat(row.querySelector(".subject-credits").value) || 0;
    const cc = parseFloat(row.querySelector(".subject-cc").value);
    const exam = parseFloat(row.querySelector(".subject-exam").value);
    const avgCell = row.querySelector(".subject-average");

    if (!isNaN(cc) || !isNaN(exam)) {
      // Calcul pondéré si une des deux notes est saisie
      const noteCC = isNaN(cc) ? exam : cc;
      const noteExam = isNaN(exam) ? cc : exam;
      
      const moyenneUE = (noteCC * WEIGHT_CC) + (noteExam * WEIGHT_EXAM);
      avgCell.innerText = `${moyenneUE.toFixed(2)} / 20`;

      if (moyenneUE >= 10) {
        avgCell.className = "p-3 font-bold text-sm text-emerald-400 subject-average";
        validatedCredits += credits;
      } else {
        avgCell.className = "p-3 font-bold text-sm text-red-400 subject-average";
      }

      totalPoints += moyenneUE * credits;
      totalCredits += credits;
    } else {
      avgCell.innerText = "-- / 20";
      avgCell.className = "p-3 font-bold text-sm text-slate-500 subject-average";
    }
  });

  // Mise à jour de la carte de résumé
  const globalAvg = totalCredits > 0 ? (totalPoints / totalCredits) : 0;
  document.getElementById("res-moyenne").innerText = `${globalAvg.toFixed(2)} / 20`;
  document.getElementById("res-credits").innerText = `${validatedCredits} / ${totalCredits}`;

  // Gestion des mentions LMD
  const mentionEl = document.getElementById("res-mention");
  if (totalCredits === 0) {
    mentionEl.innerText = "En attente";
    mentionEl.className = "text-xl font-bold text-amber-400 mt-2";
  } else if (globalAvg >= 16) {
    mentionEl.innerText = "Très Bien 🌟";
    mentionEl.className = "text-xl font-bold text-emerald-400 mt-2";
  } else if (globalAvg >= 14) {
    mentionEl.innerText = "Bien 🎖️";
    mentionEl.className = "text-xl font-bold text-blue-400 mt-2";
  } else if (globalAvg >= 12) {
    mentionEl.innerText = "Assez Bien 👍";
    mentionEl.className = "text-xl font-bold text-sky-400 mt-2";
  } else if (globalAvg >= 10) {
    mentionEl.innerText = "Passable ✔️";
    mentionEl.className = "text-xl font-bold text-slate-300 mt-2";
  } else {
    mentionEl.innerText = "Ajourné / Rattrapage ⚠️";
    mentionEl.className = "text-xl font-bold text-red-400 mt-2";
  }
}