import { questions } from './questions.js';
console.log(questions[0]);

document.addEventListener("DOMContentLoaded", () => {
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

  let timeLeft = 0;
  let timerInterval;
  let currentQuestionIndex = 0;
  let score = 0;
  let selectedQuestions = [];
  let currentMode = "quiz";
  let showImmediateFeedback = true;
  let answerLog = [];

  // Lock scroll initially
  htmlElement.classList.add("scroll-locked");

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

    // Unlock scroll during quiz
    htmlElement.classList.remove("scroll-locked");
    htmlElement.classList.add("scroll-unlocked");

    if (currentMode === "exam") {
      timeLeft = 15 * 60;
      startGlobalTimer();
    }

    showQuestion();
  });

  function startGlobalTimer() {
    timerElement.classList.remove("hidden");
    updateTimerDisplay();
    timerInterval = setInterval(() => {
      timeLeft--;
      updateTimerDisplay();
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        endQuiz();
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerElement.innerText = `Time remaining: ${minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
  }

  function showQuestion() {
    resetState();
    const question = selectedQuestions[currentQuestionIndex];
    questionElement.innerText = question.question;

    if (currentMode === "quiz") {
      timeLeft = 30;
      updateTimerDisplay();
      timerElement.classList.remove("hidden");
      timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        if (timeLeft === 0) {
          clearInterval(timerInterval);
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

    question.choices.forEach(answer => {
      const button = document.createElement("button");
      button.innerText = answer;
      button.classList.add("btn");
      button.addEventListener("click", () => {
        if (currentMode === "quiz") clearInterval(timerInterval);
        selectAnswer(answer);
      });
      answerButtons.appendChild(button);
    });
  }

  function resetState() {
    clearInterval(timerInterval);
    nextButton.classList.add("hidden");
    answerButtons.innerHTML = "";
    timerElement.classList.add("hidden");
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
    clearInterval(timerInterval);
    quizContainer.classList.add("hidden");
    scoreContainer.classList.remove("hidden");

    const percent = Math.round((score / selectedQuestions.length) * 100);

    if (currentMode === "exam") {
      if (percent >= 70) {
        scoreElement.innerText = `Well done! (${percent}%)`;
      } else if (percent >= 50) {
        scoreElement.innerText = `Great try! (${percent}%)`;
      } else {
        scoreElement.innerText = `Try again. (${percent}%)`;
      }
    } else {
      scoreElement.innerText = `${score} out of ${selectedQuestions.length} (${percent}%)`;
    }

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
    scoreContainer.classList.add("hidden");
    reviewContainer.classList.add("hidden");
    document.getElementById("level-selection").classList.remove("hidden");
    startButton.classList.remove("hidden");
    difficultySelect.classList.remove("hidden");

    // Lock scroll again when back to the start screen
    htmlElement.classList.remove("scroll-unlocked");
    htmlElement.classList.add("scroll-locked");
  });

  function disableAnswers() {
    Array.from(answerButtons.children).forEach(button => {
      button.disabled = true;
      button.style.backgroundColor = "#ccc";
    });
  }
});
