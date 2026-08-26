const SUPABASE_URL = "https://VOTRE_PROJET.supabase.co";
const SUPABASE_ANON_KEY = "VOTRE_CLE_ANON_PUBLIC";
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener("DOMContentLoaded", fetchFiles);

// Fonction pour déterminer l'icône selon l'extension du fichier
function getFileIcon(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  switch (ext) {
    case 'pdf': return '📄';
    case 'doc': case 'docx': return '📝';
    case 'ppt': case 'pptx': return '📊';
    case 'xls': case 'xlsx': return '📈';
    case 'zip': case 'rar': case '7z': return '📦';
    case 'png': case 'jpg': case 'jpeg': case 'webp': return '🖼️';
    case 'mp4': case 'mkv': case 'avi': return '🎥';
    case 'mp3': case 'wav': return '🎵';
    default: return '📁';
  }
}

// UPLOAD VERS SUPABASE STORAGE & ENREGISTREMENT SQL
async function handleFileUpload(e) {
  e.preventDefault();
  const title = document.getElementById("file-title").value;
  const fileInput = document.getElementById("file-input");
  const file = fileInput.files[0];
  const btn = document.getElementById("btn-upload");

  if (!file) return;

  btn.disabled = true;
  btn.innerText = "Chargement en cours...";

  // 1. Génération d'un nom de fichier unique pour éviter les conflits d'écrasement
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `syllabi/${fileName}`;

  // 2. Upload dans Supabase Storage (Accepte TOUTE extension)
  const { data: storageData, error: storageError } = await supabase.storage
    .from('syllabus-storage')
    .upload(filePath, file);

  if (storageError) {
    alert("Erreur lors de l'envoi du fichier: " + storageError.message);
    btn.disabled = false;
    btn.innerText = "📤 Publier la ressource";
    return;
  }

  // 3. Récupération de l'URL publique de téléchargement
  const { data: publicUrlData } = supabase.storage
    .from('syllabus-storage')
    .getPublicUrl(filePath);

  const filePublicUrl = publicUrlData.publicUrl;

  // 4. Récupération de l'utilisateur connecté
  const { data: { session } } = await supabase.auth.getSession();
  
  // 5. Enregistrement dans la table SQL ressources_cours
  const { error: dbError } = await supabase
    .from('ressources_cours')
    .insert([
      {
        titre: title,
        fichier_url: filePublicUrl,
        niveau: 'L1', // À lier dynamiquement avec le profil de l'utilisateur
        auteur_id: session ? session.user.id : null
      }
    ]);

  btn.disabled = false;
  btn.innerText = "📤 Publier la ressource";

  if (dbError) {
    alert("Erreur BDD: " + dbError.message);
  } else {
    alert("Fichier téléversé avec succès !");
    document.getElementById("upload-form").reset();
    fetchFiles();
  }
}

// RÉCUPÉRATION ET AFFICHAGE DES FICHIERS
async function fetchFiles() {
  const container = document.getElementById("files-list");
  container.innerHTML = "<p class='text-xs text-slate-400'>Chargement des ressources...</p>";

  const { data: files, error } = await supabase
    .from('ressources_cours')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    container.innerHTML = "<p class='text-xs text-red-400'>Erreur de chargement des ressources.</p>";
    return;
  }

  if (files.length === 0) {
    container.innerHTML = "<p class='text-xs text-slate-500'>Aucun document n'a encore été publié.</p>";
    return;
  }

  container.innerHTML = "";
  files.forEach(f => {
    const icon = getFileIcon(f.fichier_url);
    
    const card = document.createElement("div");
    card.className = "bg-slate-900 border border-slate-700/80 p-4 rounded-xl flex justify-between items-center hover:border-slate-600 transition";
    
    card.innerHTML = `
      <div class="flex items-center space-x-3 overflow-hidden">
        <div class="text-2xl">${icon}</div>
        <div class="truncate">
          <h4 class="font-semibold text-sm text-white truncate">${f.titre}</h4>
          <p class="text-[10px] text-slate-400">${new Date(f.created_at).toLocaleDateString()}</p>
        </div>
      </div>
      <a href="${f.fichier_url}" target="_blank" download class="bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 text-xs px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1 font-medium transition shrink-0">
        ⬇️ Télécharger
      </a>
    `;

    container.appendChild(card);
  });
}