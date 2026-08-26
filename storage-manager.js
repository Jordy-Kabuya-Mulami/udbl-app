// CONFIGURATION SUPABASE
const SUPABASE_URL = "https://zxkvodughaissxbkslac.supabase.co";
const SUPABASE_ANON_KEY = "VOTRE_CLE_ANON_PUBLIC_ICI"; // ⚠️ Remplacez par votre clé anon public

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let utilisateurConnecte = null;

document.addEventListener("DOMContentLoaded", async () => {
  verifierSession();
  await chargerOptionsFilieres();
  initialiserFiltresProfil();
  chargerFichiers();
});

// 1. Vérification session locale
function verifierSession() {
  const sessionData = localStorage.getItem("udbl_user");
  if (!sessionData) {
    window.location.href = "index.html";
    return;
  }
  utilisateurConnecte = JSON.parse(sessionData);
}

// 2. Charger la liste des spécialités UDBL dans le menu déroulant
async function chargerOptionsFilieres() {
  const selectFiliere = document.getElementById("filtre-filiere");
  
  const { data: filieres, error } = await supabase
    .from("filieres")
    .select("id, nom")
    .order("nom", { ascending: true });

  if (error) {
    console.error("Erreur chargement filières :", error.message);
    return;
  }

  filieres.forEach((f) => {
    const option = document.createElement("option");
    option.value = f.id;
    option.textContent = f.nom;
    selectFiliere.appendChild(option);
  });
}

// 3. Appliquer automatiquement le profil de l'étudiant comme filtres par défaut
function initialiserFiltresProfil() {
  const selectPromo = document.getElementById("filtre-promo");
  const selectFiliere = document.getElementById("filtre-filiere");

  if (utilisateurConnecte.promotion) {
    selectPromo.value = utilisateurConnecte.promotion;
  }

  // Pour L1 et L2, pas de spécialité
  if (utilisateurConnecte.promotion === "L1" || utilisateurConnecte.promotion === "L2") {
    selectFiliere.value = "TOUTES";
  } else if (utilisateurConnecte.filiere_id) {
    selectFiliere.value = utilisateurConnecte.filiere_id;
  }

  const promoTexte = utilisateurConnecte.promotion;
  document.getElementById("label-contexte-user").innerText = `Filtre actif : ${promoTexte}`;
}

// 4. Charger et filtrer les fichiers depuis Supabase
async function chargerFichiers() {
  const container = document.getElementById("liste-fichiers");
  container.innerHTML = `<p class="text-xs text-slate-500 col-span-2">Chargement des documents en cours...</p>`;

  const promoChoisie = document.getElementById("filtre-promo").value;
  const filiereChoisie = document.getElementById("filtre-filiere").value;

  // Requête de base sur Supabase
  let query = supabase.from("ressources_cours").select("*").order("created_at", { ascending: false });

  // Application dynamique des filtres
  if (promoChoisie !== "TOUS") {
    query = query.eq("niveau", promoChoisie);
  }

  if (filiereChoisie !== "TOUTES" && promoChoisie !== "L1" && promoChoisie !== "L2") {
    query = query.eq("filiere_id", filiereChoisie);
  }

  const { data: ressources, error } = await query;

  if (error) {
    container.innerHTML = `<p class="text-xs text-rose-400 col-span-2">Erreur : ${error.message}</p>`;
    return;
  }

  if (!ressources || ressources.length === 0) {
    container.innerHTML = `
      <div class="col-span-2 bg-slate-800/40 border border-slate-800 rounded-xl p-8 text-center">
        <p class="text-slate-400 text-xs">Aucun document n'a encore été partagé pour cette sélection.</p>
      </div>`;
    return;
  }

  // Affichage des cartes de cours
  container.innerHTML = ressources.map(f => `
    <div class="bg-slate-800 border border-slate-700/80 p-4 rounded-xl flex items-center justify-between hover:border-slate-600 transition">
      <div class="flex items-center gap-3 overflow-hidden">
        <div class="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl text-lg font-bold">📄</div>
        <div class="truncate">
          <h4 class="text-xs font-bold text-white truncate">${f.titre}</h4>
          <p class="text-[10px] text-slate-400 mt-0.5">Partagé par <span class="text-slate-300 font-medium">${f.auteur_nom || 'Étudiant'}</span> • Niveau ${f.niveau}</p>
        </div>
      </div>
      <a href="${f.fichier_url}" target="_blank" download class="bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 text-xs font-medium px-3 py-1.5 rounded-lg transition shrink-0">
        Télécharger ⬇️
      </a>
    </div>
  `).join("");
}

function appliquerFiltres() {
  chargerFichiers();
}

// 5. Upload d'un fichier avec association automatique du niveau et de la filière
async function uploaderFichier(e) {
  e.preventDefault();

  const titreInput = document.getElementById("fichier-titre");
  const fileInput = document.getElementById("fichier-input");
  const btnUpload = document.getElementById("btn-upload");

  const titre = titreInput.value.trim();
  const file = fileInput.files[0];

  if (!file || !titre) return;

  btnUpload.disabled = true;
  btnUpload.innerText = "Upload en cours...";

  // Génération d'un nom de fichier unique
  const filePath = `${Date.now()}_${file.name}`;

  // 1. Upload dans le bucket Supabase Storage
  const { data: storageData, error: storageError } = await supabase.storage
    .from("syllabus-storage")
    .upload(filePath, file);

  if (storageError) {
    alert("Erreur lors de l'upload du fichier : " + storageError.message);
    btnUpload.disabled = false;
    btnUpload.innerText = "📤 Uploader le document";
    return;
  }

  // 2. Récupération de l'URL publique
  const { data: publicUrlData } = supabase.storage
    .from("syllabus-storage")
    .getPublicUrl(filePath);

  // 3. Enregistrement des métadonnées avec la promotion/filiere de l'étudiant
  const filiereFinale = (utilisateurConnecte.promotion === "L1" || utilisateurConnecte.promotion === "L2") 
    ? null 
    : utilisateurConnecte.filiere_id;

  const { error: dbError } = await supabase.from("ressources_cours").insert([
    {
      titre: titre,
      fichier_url: publicUrlData.publicUrl,
      niveau: utilisateurConnecte.promotion,
      filiere_id: filiereFinale,
      auteur_nom: utilisateurConnecte.nom
    }
  ]);

  btnUpload.disabled = false;
  btnUpload.innerText = "📤 Uploader le document";

  if (dbError) {
    alert("Erreur BDD : " + dbError.message);
  } else {
    alert("Document publié avec succès !");
    titreInput.value = "";
    fileInput.value = "";
    chargerFichiers();
  }
}