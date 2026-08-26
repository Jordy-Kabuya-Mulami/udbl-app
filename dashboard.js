// CONFIGURATION SUPABASE
const SUPABASE_URL = "https://zxkvodughaissxbkslac.supabase.co";
const SUPABASE_ANON_KEY = "VOTRE_CLE_ANON_PUBLIC_ICI"; // ⚠️ Remplacez par votre clé anon

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener("DOMContentLoaded", () => {
  chargerProfilEtudiant();
});

async function chargerProfilEtudiant() {
  const sessionData = localStorage.getItem("udbl_user");

  // 1. Redirection si l'utilisateur n'est pas connecté
  if (!sessionData) {
    window.location.href = "index.html";
    return;
  }

  const user = JSON.parse(sessionData);

  // 2. Afficher le nom et la promotion
  document.getElementById("user-name").innerText = user.nom || "Étudiant UDBL";
  
  const libellesPromo = {
    L1: "Licence 1 (L1)",
    L2: "Licence 2 (L2)",
    L3: "Licence 3 (L3)",
    L4: "Licence 4 (L4)"
  };
  document.getElementById("user-promo").innerText = libellesPromo[user.promotion] || user.promotion;

  // 3. Gestion de l'affichage de la Spécialité / Filière
  const elementFiliere = document.getElementById("user-filiere");

  if (user.promotion === "L1" || user.promotion === "L2" || !user.filiere_id) {
    elementFiliere.innerText = "Tronc Commun (Sciences Info)";
  } else {
    // Si c'est L3/L4, récupérer le nom exact de la filière depuis Supabase
    elementFiliere.innerText = "Chargement...";

    const { data: filiere, error } = await supabase
      .from("filieres")
      .select("nom")
      .eq("id", user.filiere_id)
      .single();

    if (error || !filiere) {
      elementFiliere.innerText = "Spécialité sélectionnée";
    } else {
      elementFiliere.innerText = filiere.nom;
    }
  }
}

// Déconnexion de l'étudiant
function deconnecterEtudiant() {
  localStorage.removeItem("udbl_user");
  window.location.href = "index.html";
}