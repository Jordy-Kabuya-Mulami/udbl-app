const SUPABASE_URL = "https://VOTRE_PROJET.supabase.co";
const SUPABASE_ANON_KEY = "VOTRE_CLE_ANON_PUBLIC";
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;
let currentProfile = null;

document.addEventListener("DOMContentLoaded", async () => {
  // 1. Récupération de l'utilisateur
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = "index.html";
    return;
  }
  currentUser = session.user;

  // 2. Chargement du profil
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', currentUser.id)
    .single();

  currentProfile = profile;

  // Mettre à jour le titre du salon
  const title = profile.niveau === 'L1' || profile.niveau === 'L2'
    ? `Salon d'Entraide (${profile.niveau} - Tronc Commun)`
    : `Salon d'Entraide (${profile.niveau})`;
  document.getElementById("channel-title").innerText = title;

  // 3. Charger l'historique des 50 derniers messages
  await fetchMessages();

  // 4. ACTIVER LA SOUSCRIPTION SUPABASE REALTIME
  supabase
    .channel('public:forum_messages')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'forum_messages' }, payload => {
      // Vérifier si le message concerne la même promo / filière
      if (payload.new.niveau === currentProfile.niveau) {
        renderMessage(payload.new);
        scrollToBottom();
      }
    })
    .subscribe();
});

// RÉCUPÉRATION DE L'HISTORIQUE
async function fetchMessages() {
  const container = document.getElementById("chat-messages");

  let query = supabase
    .from('forum_messages')
    .select('*')
    .eq('niveau', currentProfile.niveau)
    .order('created_at', { ascending: true })
    .limit(50);

  const { data: messages, error } = await query;

  document.getElementById("loading-txt")?.remove();
  container.innerHTML = "";

  if (error) {
    container.innerHTML = "<p class='text-xs text-red-400 text-center'>Erreur de chargement du chat.</p>";
    return;
  }

  messages.forEach(msg => renderMessage(msg));
  scrollToBottom();
}

// AFFICHAGE D'UN MESSAGE
function renderMessage(msg) {
  const container = document.getElementById("chat-messages");
  const isMe = msg.etudiant_id === currentUser.id;

  const msgDiv = document.createElement("div");
  msgDiv.className = `flex flex-col ${isMe ? 'items-end' : 'items-start'}`;

  const timeStr = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  msgDiv.innerHTML = `
    <div class="flex items-center gap-2 mb-1">
      <span class="text-[11px] font-semibold ${isMe ? 'text-blue-400' : 'text-slate-300'}">${msg.nom_auteur}</span>
      <span class="text-[9px] text-slate-500">${timeStr}</span>
    </div>
    <div class="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
      isMe 
        ? 'bg-blue-600 text-white rounded-br-none' 
        : 'bg-slate-700 text-slate-200 rounded-bl-none'
    }">
      ${escapeHtml(msg.contenu)}
    </div>
  `;

  container.appendChild(msgDiv);
}

// ENVOI D'UN NOUVEAU MESSAGE
async function sendMessage(e) {
  e.preventDefault();
  const input = document.getElementById("message-input");
  const text = input.value.trim();

  if (!text) return;

  input.value = "";

  const { error } = await supabase
    .from('forum_messages')
    .insert([
      {
        etudiant_id: currentUser.id,
        nom_auteur: currentProfile.nom_complet,
        contenu: text,
        niveau: currentProfile.niveau,
        filiere_id: currentProfile.filiere_id
      }
    ]);

  if (error) {
    alert("Erreur lors de l'envoi : " + error.message);
  }
}

function scrollToBottom() {
  const container = document.getElementById("chat-messages");
  container.scrollTop = container.scrollHeight;
}

function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}