// CONFIGURATION SUPABASE
const SUPABASE_URL = "https://zxkvodughaissxbkslac.supabase.co";
const SUPABASE_ANON_KEY = "VOTRE_CLE_ANON_PUBLIC_ICI"; // ⚠️ Remplacez par votre clé anon public

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener("DOMContentLoaded", () => {
  chargerFilieresUDBL();
  gererLogiquePromotion();
  verifierSessionExistante();
});

// 1. Charger les filières L3/L4 depuis Supabase
async function chargerFilieresUDBL() {
  const selectFiliere = document.getElementById("filiere");
  if (!selectFiliere) return;

  const { data: filieres, error } = await supabase
    .from("filieres")
    .select("id, nom")
    .order("nom", { ascending: true });

  if (error) {
    console.error("Erreur de chargement des filières :", error.message);
    return;
  }

  selectFiliere.innerHTML = '<option value="">-- Choisissez votre spécialité --</option>';
  filieres.forEach((f) => {
    const option = document.createElement("option");
    option.value = f.id;
    option.textContent = f.nom;
    selectFiliere.appendChild(option);
  });
}

// 2. Masquer ou afficher le champ filière selon la promotion
function gererLogiquePromotion() {
  const selectPromo = document.getElementById("promotion");
  const containerFiliere = document.getElementById("filiere-container");

  if (!selectPromo || !containerFiliere) return;

  selectPromo.addEventListener("change", (e) => {
    const val = e.target.value;
    // Si L1 ou L2 -> Tronc commun (Pas de filière)
    if (val === "L1" || val === "L2") {
      containerFiliere.style.display = "none";
      document.getElementById("filiere").value = "";
    } else {
      containerFiliere.style.display = "block";
    }
  });
}

// 3. Soumission et accès immédiat
async function rejoindreApplication(e) {
  e.preventDefault();

  const nom = document.getElementById("nom").value.trim();
  const promotion = document.getElementById("promotion").value;
  const filiereId = document.getElementById("filiere").value;

  if (!nom || !promotion) {
    alert("Veuillez renseigner votre nom et votre niveau.");
    return;
  }

  if ((promotion === "L3" || promotion === "L4") && !filiereId) {
    alert("Veuillez sélectionner votre spécialité pour la " + promotion);
    return;
  }

  // Stockage local de la session étudiant
  const etudiantSession = {
    nom: nom,
    promotion: promotion,
    filiere_id: (promotion === "L1" || promotion === "L2") ? null : filiereId,
    connecte: true
  };

  localStorage.setItem("udbl_user", JSON.stringify(etudiantSession));

  // Insertion optionnelle dans Supabase
  await supabase.from("profiles").insert([
    {
      nom_complet: nom,
      niveau: promotion,
      filiere_id: etudiantSession.filiere_id
    }
  ]);

  // Redirection vers le tableau de bord
  window.location.href = "dashboard.html";
}

// 4. Auto-redirection si l'étudiant s'est déjà identifié
function verifierSessionExistante() {
  const user = localStorage.getItem("udbl_user");
  if (user && window.location.pathname.endsWith("index.html")) {
    window.location.href = "dashboard.html";
  }
}

// 5. Déconnexion globale
function deconnecterEtudiant() {
  localStorage.removeItem("udbl_user");
  window.location.href = "index.html";
}