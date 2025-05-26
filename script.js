import { questions } from './questions.js';

document.addEventListener("DOMContentLoaded", () => {
  // Quiz Elements
  const startButton = document.getElementById("start-btn");
  const difficultySelect = document.getElementById("difficulty");
  const quizContainer = document.getElementById("quiz");
  const questionElement = document.getElementById("question");
  const answerButtons = document.getElementById("answer-buttons");
  const nextButton = document.getElementById("next-btn");
  const scoreContainer = document.getElementById("score-container");
  const scoreElement = document.getElementById("score");
  const restartButton = document.getElementById("restart-btn");
  const timerElement = document.getElementById("timer");
  const feedback = document.getElementById("feedback");
  const reviewContainer = document.getElementById("review-container");
  const reviewList = document.getElementById("review-list");
  const htmlElement = document.documentElement;

  // Flashcard Elements
  const flashcardLaunch = document.getElementById("flashcard-launch");
  const flashcardSection = document.getElementById("flashcard-section");
  const flashcardLevelSelect = document.getElementById("flashcard-level-select");
  const flashcardStart = document.getElementById("flashcard-start");
  const flashcardContainer = document.getElementById("flashcard-container");
  const flashcardFront = document.getElementById("flashcard-front");
  const flashcardBack = document.getElementById("flashcard-back");
  const prevFlashcard = document.getElementById("prev-flashcard");
  const nextFlashcard = document.getElementById("next-flashcard");
  const flipFlashcard = document.getElementById("flip-flashcard");
  const exitFlashcards = document.getElementById("exit-flashcards");
  const flashcardDifficulty = document.getElementById("flashcard-difficulty");

  // Quiz State
  let timeLeft = 0;
  let globalTimerInterval = null;
  let quizTimerInterval = null;
  let currentQuestionIndex = 0;
  let score = 0;
  let selectedQuestions = [];
  let currentMode = "quiz";
  let showImmediateFeedback = true;
  let answerLog = [];

  // Flashcard State
  let flashcardDeck = [];
  let currentCardIndex = 0;
  let showingBack = false;

  // Initial state lock scroll
  htmlElement.classList.add("scroll-locked");

  // === QUIZ LOGIC ===
  startButton.addEventListener("click", () => {
    const level = difficultySelect.value;
    const selectedRadio = document.querySelector('input[name="mode"]:checked');
    currentMode = selectedRadio ? selectedRadio.value : "quiz";
    showImmediateFeedback = currentMode === "quiz";

    selectedQuestions = questions
      .filter(q => q.level === level)
      .sort(() => Math.random() - 0.5)
      .slice(0, currentMode === "quiz" ? 10 : 20);

    currentQuestionIndex = 0;
    score = 0;
    answerLog = [];

    document.getElementById("level-selection").classList.add("hidden");
    quizContainer.classList.remove("hidden");
    reviewContainer.classList.add("hidden");

    htmlElement.classList.remove("scroll-locked");
    htmlElement.classList.add("scroll-unlocked");

    if (currentMode === "exam") {
      timeLeft = 12 * 60;
      startGlobalTimer();
    }

    showQuestion();
  });

  function startGlobalTimer() {
    timerElement.classList.remove("hidden");
    updateTimerDisplay(timeLeft);
    globalTimerInterval = setInterval(() => {
      timeLeft--;
      updateTimerDisplay(timeLeft);
      if (timeLeft <= 0) {
        clearInterval(globalTimerInterval);
        endQuiz();
      }
    }, 1000);
  }

  function startQuizTimer() {
    timeLeft = 30;
    updateTimerDisplay(timeLeft);
    timerElement.classList.remove("hidden");
    quizTimerInterval = setInterval(() => {
      timeLeft--;
      updateTimerDisplay(timeLeft);
      if (timeLeft === 0) {
        clearInterval(quizTimerInterval);
        if (showImmediateFeedback) {
          feedback.innerText = "Time's up!";
          feedback.classList.remove("hidden");
          feedback.style.color = "orange";
        }
        disableAnswers();
        nextButton.classList.remove("hidden");
      }
    }, 1000);
  }

  function updateTimerDisplay(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const formatted = `${minutes}:${secs < 10 ? "0" + secs : secs}`;
    timerElement.innerText = `Time remaining: ${formatted}`;
  }

  function showQuestion() {
    resetState();
    const question = selectedQuestions[currentQuestionIndex];
    questionElement.innerText = question.question;

    if (currentMode === "quiz") {
      startQuizTimer();
    } else {
      timerElement.classList.remove("hidden");
      updateTimerDisplay(timeLeft);
    }

    question.choices.forEach(answer => {
      const button = document.createElement("button");
      button.innerText = answer;
      button.classList.add("btn");
      button.addEventListener("click", () => {
        if (currentMode === "quiz") clearInterval(quizTimerInterval);
        selectAnswer(answer);
      });
      answerButtons.appendChild(button);
    });
  }

  function resetState() {
    if (currentMode === "quiz") {
      clearInterval(quizTimerInterval);
    }
    nextButton.classList.add("hidden");
    answerButtons.innerHTML = "";
    feedback.classList.add("hidden");
    feedback.innerText = "";
  }

  function selectAnswer(selected) {
    const question = selectedQuestions[currentQuestionIndex];
    const isCorrect = selected === question.answer;
    if (isCorrect) score++;

    answerLog.push({
      question: question.question,
      selected: selected,
      correct: question.answer,
      isCorrect: isCorrect
    });

    if (showImmediateFeedback) {
      feedback.classList.remove("hidden");
      feedback.innerText = isCorrect ? "Correct!" : `Wrong! Correct: ${question.answer}`;
      feedback.style.color = isCorrect ? "green" : "red";
    }

    Array.from(answerButtons.children).forEach(button => {
      if (button.innerText === question.answer) {
        button.style.backgroundColor = "lightgreen";
      } else {
        button.style.backgroundColor = "lightcoral";
      }
      button.disabled = true;
    });

    nextButton.classList.remove("hidden");
  }

  nextButton.addEventListener("click", () => {
    currentQuestionIndex++;
    if (currentQuestionIndex < selectedQuestions.length) {
      showQuestion();
    } else {
      endQuiz();
    }
  });

  function endQuiz() {
    clearInterval(quizTimerInterval);
    clearInterval(globalTimerInterval);
    quizContainer.classList.add("hidden");
    scoreContainer.classList.remove("hidden");

    const percent = Math.round((score / selectedQuestions.length) * 100);

    scoreElement.innerText =
      currentMode === "exam"
        ? percent >= 70
          ? `Well done! (${percent}%)`
          : percent >= 50
          ? `Great try! (${percent}%)`
          : `Try again. (${percent}%)`
        : `${score} out of ${selectedQuestions.length} (${percent}%)`;

    generateReview();
  }

  function generateReview() {
    reviewList.innerHTML = "";
    const wrongAnswers = answerLog.filter(entry => !entry.isCorrect);
    if (wrongAnswers.length === 0) {
      reviewList.innerHTML = "<p>✅ You got everything correct!</p>";
    } else {
      wrongAnswers.forEach(entry => {
        const div = document.createElement("div");
        div.classList.add("review-item");
        div.innerHTML = `
          <p><strong>Q:</strong> ${entry.question}</p>
          <p><strong>Your Answer:</strong> <span style="color: red;">${entry.selected}</span></p>
          <p><strong>Correct Answer:</strong> <span style="color: green;">${entry.correct}</span></p>
          <hr />
        `;
        reviewList.appendChild(div);
      });
    }
    reviewContainer.classList.remove("hidden");
  }

  restartButton.addEventListener("click", () => {
    clearInterval(quizTimerInterval);
    clearInterval(globalTimerInterval);
    scoreContainer.classList.add("hidden");
    reviewContainer.classList.add("hidden");
    document.getElementById("level-selection").classList.remove("hidden");
    startButton.classList.remove("hidden");
    difficultySelect.classList.remove("hidden");
    htmlElement.classList.remove("scroll-unlocked");
    htmlElement.classList.add("scroll-locked");
  });

  function disableAnswers() {
    Array.from(answerButtons.children).forEach(button => {
      button.disabled = true;
      button.style.backgroundColor = "#ccc";
    });
  }

  // === FLASHCARD LOGIC ===
  document.getElementById("enter-flashcards").addEventListener("click", () => {
    flashcardSection.classList.remove("hidden");
    flashcardLaunch.classList.add("hidden");
  });

  flashcardStart.addEventListener("click", () => {
    const selectedLevel = flashcardDifficulty.value;
    const allFiltered = questions.filter(q => q.level === selectedLevel);
    flashcardDeck = allFiltered.sort(() => Math.random() - 0.5).slice(0, 15);
    currentCardIndex = 0;
    showingBack = false;
    flashcardLevelSelect.classList.add("hidden");
    flashcardContainer.classList.remove("hidden");
    renderFlashcard();
  });

  function renderFlashcard() {
    const card = flashcardDeck[currentCardIndex];
    flashcardFront.innerText = card.question;
    flashcardBack.innerText = card.answer;
    flashcardBack.classList.add("hidden");
    flashcardFront.classList.remove("hidden");
    showingBack = false;
  }

  flipFlashcard.addEventListener("click", () => {
    showingBack = !showingBack;
    flashcardBack.classList.toggle("hidden", !showingBack);
    flashcardFront.classList.toggle("hidden", showingBack);
  });

  nextFlashcard.addEventListener("click", () => {
    if (currentCardIndex < flashcardDeck.length - 1) {
      currentCardIndex++;
      renderFlashcard();
    }
  });

  prevFlashcard.addEventListener("click", () => {
    if (currentCardIndex > 0) {
      currentCardIndex--;
      renderFlashcard();
    }
  });

  exitFlashcards.addEventListener("click", () => {
    flashcardContainer.classList.add("hidden");
    flashcardLevelSelect.classList.remove("hidden");
    flashcardSection.classList.add("hidden");
    flashcardLaunch.classList.remove("hidden");
  });
});
