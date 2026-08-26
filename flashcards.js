let generatedCards = [];
let currentIndex = 0;
let isFlipped = false;

// ALGORITHME DE GENERATION HEURISTIQUE / IA CLIENT-SIDE
// (Remplaçable par un appel API OpenAI/Gemini/DeepSeek si souhaité)
function generateFlashcards() {
  const text = document.getElementById("source-text").value.trim();
  const count = parseInt(document.getElementById("card-count").value);
  const btn = document.getElementById("btn-generate");

  if (!text || text.length < 30) {
    alert("Veuillez coller un texte plus complet (au moins 30 caractères) pour générer des flashcards.");
    return;
  }

  btn.disabled = true;
  btn.innerText = "Traitement IA en cours...";

  setTimeout(() => {
    // Découpage en phrases
    const sentences = text.split(/(?<=[.?!])\s+/).filter(s => s.length > 20);
    generatedCards = [];

    // Extraction automatique sous forme de Q/R
    for (let i = 0; i < Math.min(count, sentences.length); i++) {
      const sentence = sentences[i];
      const words = sentence.split(" ");
      
      if (words.length > 5) {
        // Sélectionne un mot clé ou concept pour la question
        const hiddenIndex = Math.floor(words.length / 2);
        const keyword = words[hiddenIndex];
        
        const questionPrompt = sentence.replace(keyword, " [ ... ] ");
        
        generatedCards.push({
          question: `Quel est le terme manquant ? \n"${questionPrompt}"`,
          answer: `Le terme exact est : "${keyword}".\n\nPhrase complète : ${sentence}`
        });
      } else {
        generatedCards.push({
          question: `Quel est l'élément clé de cette affirmation ?`,
          answer: sentence
        });
      }
    }

    // Si le texte est court, combler par un mode d'analyse synthétique
    if (generatedCards.length === 0) {
      generatedCards.push({
        question: "Exposez le principe central de l'extrait saisi :",
        answer: text
      });
    }

    btn.disabled = false;
    btn.innerText = "✨ Générer les cartes";

    // Affichage de l'interface
    currentIndex = 0;
    document.getElementById("revision-area").classList.remove("hidden");
    displayCard(currentIndex);
  }, 800);
}

function displayCard(index) {
  if (generatedCards.length === 0) return;

  // Réinitialiser le flip
  isFlipped = false;
  document.getElementById("flashcard-inner").classList.remove("rotate-y-180");

  const card = generatedCards[index];
  document.getElementById("question-text").innerText = card.question;
  document.getElementById("answer-text").innerText = card.answer;
  document.getElementById("card-counter").innerText = `Carte ${index + 1} / ${generatedCards.length}`;
}

function flipCard() {
  const inner = document.getElementById("flashcard-inner");
  isFlipped = !isFlipped;
  if (isFlipped) {
    inner.classList.add("rotate-y-180");
  } else {
    inner.classList.remove("rotate-y-180");
  }
}

function nextCard() {
  if (currentIndex < generatedCards.length - 1) {
    currentIndex++;
    displayCard(currentIndex);
  }
}

function prevCard() {
  if (currentIndex > 0) {
    currentIndex--;
    displayCard(currentIndex);
  }
}