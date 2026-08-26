const SUPABASE_URL = "https://VOTRE_PROJET.supabase.co";
const SUPABASE_ANON_KEY = "VOTRE_CLE_ANON_PUBLIC";
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const dashTranslations = {
  fr: { welcome: "Bonjour", btn_logout: "Déconnexion", mod_syllabus_title: "Syllabus & Cours", mod_syllabus_desc: "Consultez et téléchargez les épreuves et supports de cours.", mod_drive_title: "Mon Drive Personnel", mod_drive_desc: "Stockez vos devoirs et fichiers en toute sécurité.", mod_lmd_title: "Calculateur LMD", mod_lmd_desc: "Calculez votre moyenne et suivez vos crédits.", btn_open: "Ouvrir l'espace" },
  en: { welcome: "Hello", btn_logout: "Logout", mod_syllabus_title: "Syllabus & Courses", mod_syllabus_desc: "Access and download official course materials and past exams.", mod_drive_title: "My Personal Drive", mod_drive_desc: "Store your own assignments and files securely.", mod_lmd_title: "LMD GPA Calculator", mod_lmd_desc: "Calculate your semester GPA and validate credits.", btn_open: "Open space" },
  sw: { welcome: "Jambo", btn_logout: "Toka", mod_syllabus_title: "Masomo & Syllabus", mod_syllabus_desc: "Pata na pakua vifaa vya masomo ya darasa lako.", mod_drive_title: "Hifadhi Yangu", mod_drive_desc: "Weka kazi zako na faili zako kwa usalama.", mod_lmd_title: "Kikokotoo cha LMD", mod_lmd_desc: "Piga hesabu ya wastani wa alama zako.", btn_open: "Fungua" },
  ln: { welcome: "Mbote", btn_logout: "Bima", mod_syllabus_title: "Buku ya kelasi", mod_syllabus_desc: "Zwá mikanda mpe mateya ya kelasi na yo.", mod_drive_title: "Bisika na ngai ya kobomba", mod_drive_desc: "Bomba ba devoirs mpe dosiye na yo na kimya.", mod_lmd_title: "Mekano ya ba notes (LMD)", mod_lmd_desc: "Luka moyenne na yo mpe ba crédits ezwami.", btn_open: "Fungola" }
};

let currentUserName = "";

document.addEventListener("DOMContentLoaded", async () => {
  // Vérification de la session utilisateur
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = "index.html";
    return;
  }

  // Chargement du profil utilisateur
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*, filieres(*)')
    .eq('id', session.user.id)
    .single();

  if (error || !profile) {
    console.error("Erreur de récupération du profil:", error);
    return;
  }

  currentUserName = profile.nom_complet;
  document.getElementById("welcome-title").innerText = `Bonjour, ${profile.nom_complet} !`;

  // Appliquer la charte graphique selon la filière (L3+) ou Tronc commun (L1/L2)
  const badge = document.getElementById("filiere-badge");
  const sub = document.getElementById("user-info-sub");
  const pill = document.getElementById("status-pill");

  if (profile.niveau === 'L1' || profile.niveau === 'L2') {
    sub.innerText = `${profile.niveau} - Tronc Commun UDBL`;
    pill.innerText = "Tronc Commun (L1/L2)";
    badge.style.backgroundColor = "#3B82F6"; // Couleur neutre
  } else if (profile.filieres) {
    sub.innerText = `${profile.niveau} - ${profile.filieres.nom}`;
    pill.innerText = profile.filieres.nom;
    badge.style.backgroundColor = profile.filieres.couleur_theme || "#3B82F6";
    
    // Injecter la couleur de la filière sur la bordure de bienvenue
    document.getElementById("status-pill").style.borderColor = profile.filieres.couleur_theme;
    document.getElementById("status-pill").style.color = profile.filieres.couleur_theme;
  }
});

function changeDashLanguage(lang) {
  const dict = dashTranslations[lang] || dashTranslations.fr;
  document.getElementById("welcome-title").innerText = `${dict.welcome}, ${currentUserName} !`;
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) el.innerText = dict[key];
  });
}

function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.classList.toggle("dark");
  document.getElementById("dash-body").className = isDark 
    ? "bg-slate-900 text-slate-100 min-h-screen flex flex-col font-sans transition-colors duration-200" 
    : "bg-slate-100 text-slate-800 min-h-screen flex flex-col font-sans transition-colors duration-200";
  document.getElementById("theme-btn").innerText = isDark ? "🌙" : "☀️";
}

async function handleLogout() {
  await supabase.auth.signOut();
  window.location.href = "index.html";
}