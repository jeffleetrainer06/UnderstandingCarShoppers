// Calculate quiz result locally
async function calculateQuizResult(data) {
  const { answers } = data;
  
  // Count answer types
  const typeCounts = {};
  answers.forEach((type) => {
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });
  
  // Find the dominant type
  const dominantType = Object.entries(typeCounts)
    .sort(([, a], [, b]) => b - a)[0][0];
  
  const result = customerTypes.find(t => t.id === dominantType);
  
  return {
    data: {
      primaryType: result,
      scores: typeCounts
    }
  };
}

// Global state
let currentQuestionIndex = 0;
let quizAnswers = [];
let quizQuestions = [];
let customerTypes = [];
let visitedSections = new Set(['home']);

// Initialize the app
document.addEventListener('DOMContentLoaded', async () => {
    // Load initial data
    await loadCustomerTypes();
    await loadQuizQuestions();
    
    // Show home section by default
    showSection('home');
    
    // Initialize strategy content
    showStrategyTab('communication');
    
    // Track progress
    updateProgress();
});

// Navigation functions
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.add('hidden');
    });
    
    // Show selected section
    const section = document.getElementById(`${sectionName}-section`);
    if (section) {
        section.classList.remove('hidden');
        section.classList.add('fade-in');
    }
    
    // Update navigation active state
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('text-blue-600', 'font-bold');
        btn.classList.add('text-gray-600');
    });
    
    // Track visited sections
    visitedSections.add(sectionName);
    updateProgress();
    
    // Special handling for different sections
    if (sectionName === 'quiz') {
        startQuiz();
    } else if (sectionName === 'types') {
        displayCustomerTypes();
    }
}

// Load customer types from API
async function loadCustomerTypes() {
    try {
        const response = await fetch('static/customer-types.json').then(r => r.json());
        customerTypes = response;
    } catch (error) {
        console.error('Error loading customer types:', error);
    }
}

// Load quiz questions from API
async function loadQuizQuestions() {
    try {
        const response = await fetch('static/quiz-questions.json').then(r => r.json());
        quizQuestions = response;
    } catch (error) {
        console.error('Error loading quiz questions:', error);
    }
}

// Quiz functions
function startQuiz() {
    currentQuestionIndex = 0;
    quizAnswers = [];
    displayQuizQuestion();
}

function displayQuizQuestion() {
    const container = document.getElementById('quiz-container');
    
    if (currentQuestionIndex < quizQuestions.length) {
        const question = quizQuestions[currentQuestionIndex];
        const progress = ((currentQuestionIndex + 1) / quizQuestions.length) * 100;
        
        container.innerHTML = `
            <div class="mb-6">
                <div class="flex justify-between items-center mb-2">
                    <span class="text-sm text-gray-600">Question ${currentQuestionIndex + 1} of ${quizQuestions.length}</span>
                    <span class="text-sm text-gray-600">${Math.round(progress)}% Complete</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="bg-blue-600 h-2 rounded-full progress-bar" style="width: ${progress}%"></div>
                </div>
            </div>
            
            <h3 class="text-xl font-bold mb-6">${question.question}</h3>
            
            <div class="space-y-3">
                ${question.answers.map((answer, index) => `
                    <button onclick="selectAnswer('${answer.type}')" 
                            class="quiz-option w-full text-left p-4 bg-gray-50 hover:bg-blue-50 rounded-lg border-2 border-transparent hover:border-blue-300 transition">
                        <span class="font-medium">${String.fromCharCode(65 + index)}.</span> ${answer.text}
                    </button>
                `).join('')}
            </div>
            
            ${currentQuestionIndex > 0 ? `
                <button onclick="previousQuestion()" class="mt-6 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition">
                    <i class="fas fa-arrow-left mr-2"></i>Previous
                </button>
            ` : ''}
        `;
    }
}

function selectAnswer(type) {
    quizAnswers.push(type);
    currentQuestionIndex++;
    
    if (currentQuestionIndex < quizQuestions.length) {
        displayQuizQuestion();
    } else {
        showQuizResult();
    }
}

function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        quizAnswers.pop();
        displayQuizQuestion();
    }
}

async function showQuizResult() {
    try {
        const response = await calculateQuizResult({
            answers: quizAnswers
        });
        
        const { primaryType, scores } = response.data;
        
        const container = document.getElementById('quiz-container');
        container.innerHTML = `
            <div class="text-center">
                <div class="text-6xl mb-4">${primaryType.icon}</div>
                <h3 class="text-2xl font-bold mb-4">Your Result: ${primaryType.name}</h3>
                
                <div class="bg-${primaryType.color}-50 rounded-lg p-6 mb-6 text-left">
                    <h4 class="font-bold mb-3">Key Characteristics:</h4>
                    <ul class="space-y-2">
                        ${primaryType.characteristics.map(char => `
                            <li class="flex items-center">
                                <i class="fas fa-check-circle text-${primaryType.color}-600 mr-2"></i>
                                ${char}
                            </li>
                        `).join('')}
                    </ul>
                </div>
                
                <div class="bg-gray-50 rounded-lg p-6 mb-6 text-left">
                    <h4 class="font-bold mb-3">Communication Style:</h4>
                    <p class="text-gray-700">${primaryType.communicationStyle}</p>
                    
                    <h4 class="font-bold mt-4 mb-3">Decision Timeline:</h4>
                    <p class="text-gray-700">${primaryType.decisionTime}</p>
                </div>
                
                <div class="bg-green-50 rounded-lg p-6 mb-6 text-left">
                    <h4 class="font-bold mb-3">Best Engagement Tips:</h4>
                    <ul class="space-y-2">
                        ${primaryType.engagementTips.map(tip => `
                            <li class="flex items-start">
                                <i class="fas fa-lightbulb text-green-600 mr-2 mt-1"></i>
                                <span>${tip}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
                
                <div class="flex gap-4 justify-center">
                    <button onclick="startQuiz()" class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                        <i class="fas fa-redo mr-2"></i>Retake Quiz
                    </button>
                    <button onclick="showSection('types')" class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                        View All Types <i class="fas fa-arrow-right ml-2"></i>
                    </button>
                </div>
            </div>
        `;
        
        // Mark quiz as completed
        document.getElementById('quiz-progress').classList.remove('bg-gray-300');
        document.getElementById('quiz-progress').classList.add('bg-green-500');
    } catch (error) {
        console.error('Error getting quiz result:', error);
    }
}

// Display customer types
function displayCustomerTypes() {
    const grid = document.getElementById('customer-types-grid');
    
    grid.innerHTML = customerTypes.map(type => `
        <div class="bg-white rounded-xl shadow-lg p-6 card-hover cursor-pointer" onclick="showTypeDetail('${type.id}')">
            <div class="text-5xl mb-4 text-center">${type.icon}</div>
            <h3 class="text-xl font-bold mb-3 text-center">${type.name}</h3>
            
            <div class="space-y-3">
                <div>
                    <span class="text-sm font-semibold text-gray-600">Key Traits:</span>
                    <div class="flex flex-wrap gap-1 mt-1">
                        ${type.traits.slice(0, 3).map(trait => `
                            <span class="text-xs bg-${type.color}-100 text-${type.color}-800 px-2 py-1 rounded">
                                ${trait}
                            </span>
                        `).join('')}
                    </div>
                </div>
                
                <div>
                    <span class="text-sm font-semibold text-gray-600">Decision Style:</span>
                    <p class="text-sm text-gray-700 mt-1">${type.decisionTime}</p>
                </div>
                
                <div>
                    <span class="text-sm font-semibold text-gray-600">Primary Motivations:</span>
                    <div class="flex flex-wrap gap-1 mt-1">
                        ${type.primaryMotivations.map(motivation => `
                            <span class="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                ${motivation}
                            </span>
                        `).join('')}
                    </div>
                </div>
            </div>
            
            <button class="mt-4 w-full bg-${type.color}-600 text-white px-4 py-2 rounded hover:bg-${type.color}-700 transition">
                Learn More <i class="fas fa-arrow-right ml-2"></i>
            </button>
        </div>
    `).join('');
    
    // Mark types as visited
    document.getElementById('types-progress').classList.remove('bg-gray-300');
    document.getElementById('types-progress').classList.add('bg-green-500');
}

// Show detailed view of a customer type
function showTypeDetail(typeId) {
    const type = customerTypes.find(t => t.id === typeId);
    if (!type) return;
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8">
            <div class="flex justify-between items-start mb-6">
                <div class="flex items-center">
                    <span class="text-5xl mr-4">${type.icon}</span>
                    <h2 class="text-2xl font-bold">${type.name}</h2>
                </div>
                <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times text-2xl"></i>
                </button>
            </div>
            
            <div class="grid md:grid-cols-2 gap-6">
                <div>
                    <h3 class="font-bold text-lg mb-3">Characteristics</h3>
                    <ul class="space-y-2">
                        ${type.characteristics.map(char => `
                            <li class="flex items-center">
                                <i class="fas fa-check-circle text-${type.color}-600 mr-2"></i>
                                ${char}
                            </li>
                        `).join('')}
                    </ul>
                </div>
                
                <div>
                    <h3 class="font-bold text-lg mb-3">Personality Traits</h3>
                    <ul class="space-y-2">
                        ${type.traits.map(trait => `
                            <li class="flex items-center">
                                <i class="fas fa-user-circle text-${type.color}-600 mr-2"></i>
                                ${trait}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>
            
            <div class="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 class="font-bold mb-2">Communication Style</h3>
                <p class="text-gray-700">${type.communicationStyle}</p>
            </div>
            
            <div class="mt-4 p-4 bg-blue-50 rounded-lg">
                <h3 class="font-bold mb-2">Decision Timeline</h3>
                <p class="text-gray-700">${type.decisionTime}</p>
            </div>
            
            <div class="mt-4 p-4 bg-green-50 rounded-lg">
                <h3 class="font-bold mb-3">Engagement Best Practices</h3>
                <ul class="space-y-2">
                    ${type.engagementTips.map(tip => `
                        <li class="flex items-start">
                            <i class="fas fa-star text-green-600 mr-2 mt-1"></i>
                            <span>${tip}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
            
            <div class="mt-6 flex gap-4">
                <button onclick="this.closest('.fixed').remove()" class="px-6 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition">
                    Close
                </button>
                <button onclick="showSection('strategies'); this.closest('.fixed').remove()" class="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
                    View Strategies <i class="fas fa-arrow-right ml-2"></i>
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Strategy tab functions
function showStrategyTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.strategy-tab').forEach(tab => {
        tab.classList.remove('bg-blue-600', 'text-white');
        tab.classList.add('bg-gray-200', 'text-gray-700');
    });
    
    event.target.classList.remove('bg-gray-200', 'text-gray-700');
    event.target.classList.add('bg-blue-600', 'text-white');
    
    // Update content
    const content = document.getElementById('strategy-content');
    
    const strategies = {
        communication: {
            title: 'Communication Techniques',
            content: `
                <div class="space-y-6">
                    <div class="bg-blue-50 p-6 rounded-lg">
                        <h4 class="font-bold mb-3"><i class="fas fa-comments mr-2"></i>Active Listening</h4>
                        <p class="text-gray-700 mb-3">The foundation of effective sales communication is active listening. Pay attention to verbal and non-verbal cues.</p>
                        <ul class="space-y-2">
                            <li><i class="fas fa-check text-blue-600 mr-2"></i>Maintain eye contact and open body language</li>
                            <li><i class="fas fa-check text-blue-600 mr-2"></i>Ask clarifying questions to understand needs</li>
                            <li><i class="fas fa-check text-blue-600 mr-2"></i>Summarize and confirm understanding</li>
                            <li><i class="fas fa-check text-blue-600 mr-2"></i>Avoid interrupting the customer</li>
                        </ul>
                    </div>
                    
                    <div class="bg-green-50 p-6 rounded-lg">
                        <h4 class="font-bold mb-3"><i class="fas fa-user-friends mr-2"></i>Matching Communication Styles</h4>
                        <p class="text-gray-700 mb-3">Adapt your communication style to match the customer's personality type for better rapport.</p>
                        <ul class="space-y-2">
                            <li><i class="fas fa-arrow-right text-green-600 mr-2"></i><strong>Analytical:</strong> Use data, facts, and detailed explanations</li>
                            <li><i class="fas fa-arrow-right text-green-600 mr-2"></i><strong>Driver:</strong> Be direct, concise, and results-focused</li>
                            <li><i class="fas fa-arrow-right text-green-600 mr-2"></i><strong>Amiable:</strong> Build personal connection, be patient</li>
                            <li><i class="fas fa-arrow-right text-green-600 mr-2"></i><strong>Expressive:</strong> Show enthusiasm, use stories</li>
                        </ul>
                    </div>
                </div>
            `
        },
        trust: {
            title: 'Building Trust',
            content: `
                <div class="space-y-6">
                    <div class="bg-purple-50 p-6 rounded-lg">
                        <h4 class="font-bold mb-3"><i class="fas fa-handshake mr-2"></i>Transparency & Honesty</h4>
                        <p class="text-gray-700 mb-3">Trust is built on a foundation of transparency. Be upfront about pricing, features, and any limitations.</p>
                        <ul class="space-y-2">
                            <li><i class="fas fa-check text-purple-600 mr-2"></i>Provide clear, upfront pricing information</li>
                            <li><i class="fas fa-check text-purple-600 mr-2"></i>Acknowledge product limitations honestly</li>
                            <li><i class="fas fa-check text-purple-600 mr-2"></i>Share real customer testimonials</li>
                            <li><i class="fas fa-check text-purple-600 mr-2"></i>Follow through on all promises</li>
                        </ul>
                    </div>
                    
                    <div class="bg-indigo-50 p-6 rounded-lg">
                        <h4 class="font-bold mb-3"><i class="fas fa-shield-alt mr-2"></i>Creating Safety & Comfort</h4>
                        <p class="text-gray-700 mb-3">Make customers feel safe and comfortable throughout the buying process.</p>
                        <ul class="space-y-2">
                            <li><i class="fas fa-arrow-right text-indigo-600 mr-2"></i>Respect personal space and boundaries</li>
                            <li><i class="fas fa-arrow-right text-indigo-600 mr-2"></i>Offer guarantees and warranties</li>
                            <li><i class="fas fa-arrow-right text-indigo-600 mr-2"></i>Provide time to think without pressure</li>
                            <li><i class="fas fa-arrow-right text-indigo-600 mr-2"></i>Share your expertise without condescension</li>
                        </ul>
                    </div>
                </div>
            `
        },
        objections: {
            title: 'Handling Objections',
            content: `
                <div class="space-y-6">
                    <div class="bg-red-50 p-6 rounded-lg">
                        <h4 class="font-bold mb-3"><i class="fas fa-exclamation-triangle mr-2"></i>Common Objections & Responses</h4>
                        <div class="space-y-4">
                            <div>
                                <p class="font-semibold text-red-700">"It's too expensive"</p>
                                <p class="text-gray-700 mt-1">Focus on value and ROI. Break down the cost over time and highlight long-term savings.</p>
                            </div>
                            <div>
                                <p class="font-semibold text-red-700">"I need to think about it"</p>
                                <p class="text-gray-700 mt-1">Respect their process. Offer to address specific concerns and schedule a follow-up.</p>
                            </div>
                            <div>
                                <p class="font-semibold text-red-700">"I'm just looking"</p>
                                <p class="text-gray-700 mt-1">Engage without pressure. Offer helpful information and make yourself available for questions.</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-yellow-50 p-6 rounded-lg">
                        <h4 class="font-bold mb-3"><i class="fas fa-lightbulb mr-2"></i>The LAER Method</h4>
                        <ul class="space-y-3">
                            <li><i class="fas fa-ear text-yellow-600 mr-2"></i><strong>Listen:</strong> Let them fully express their concern</li>
                            <li><i class="fas fa-check-circle text-yellow-600 mr-2"></i><strong>Acknowledge:</strong> Show you understand their perspective</li>
                            <li><i class="fas fa-search text-yellow-600 mr-2"></i><strong>Explore:</strong> Ask questions to understand the root cause</li>
                            <li><i class="fas fa-reply text-yellow-600 mr-2"></i><strong>Respond:</strong> Address the specific concern with relevant information</li>
                        </ul>
                    </div>
                </div>
            `
        },
        closing: {
            title: 'Closing Techniques',
            content: `
                <div class="space-y-6">
                    <div class="bg-green-50 p-6 rounded-lg">
                        <h4 class="font-bold mb-3"><i class="fas fa-flag-checkered mr-2"></i>Closing Strategies by Type</h4>
                        <div class="space-y-3">
                            <div class="p-3 bg-white rounded">
                                <p class="font-semibold">📊 Analytical Buyers</p>
                                <p class="text-sm text-gray-700">Use the summary close: Review all data points and ask for confirmation</p>
                            </div>
                            <div class="p-3 bg-white rounded">
                                <p class="font-semibold">🎯 Driver Buyers</p>
                                <p class="text-sm text-gray-700">Use the direct close: "Are you ready to move forward today?"</p>
                            </div>
                            <div class="p-3 bg-white rounded">
                                <p class="font-semibold">🤝 Amiable Buyers</p>
                                <p class="text-sm text-gray-700">Use the comfort close: Reassure and ask how they feel about proceeding</p>
                            </div>
                            <div class="p-3 bg-white rounded">
                                <p class="font-semibold">🌟 Expressive Buyers</p>
                                <p class="text-sm text-gray-700">Use the enthusiasm close: Match their excitement and ask for commitment</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-blue-50 p-6 rounded-lg">
                        <h4 class="font-bold mb-3"><i class="fas fa-clock mr-2"></i>Timing the Close</h4>
                        <p class="text-gray-700 mb-3">Recognize buying signals and time your close appropriately:</p>
                        <ul class="space-y-2">
                            <li><i class="fas fa-check text-blue-600 mr-2"></i>Customer asks about delivery or availability</li>
                            <li><i class="fas fa-check text-blue-600 mr-2"></i>Discussion shifts to payment options</li>
                            <li><i class="fas fa-check text-blue-600 mr-2"></i>Customer uses ownership language ("my car")</li>
                            <li><i class="fas fa-check text-blue-600 mr-2"></i>Body language becomes more relaxed and open</li>
                        </ul>
                    </div>
                </div>
            `
        }
    };
    
    if (strategies[tabName]) {
        content.innerHTML = `
            <h3 class="text-xl font-bold mb-4">${strategies[tabName].title}</h3>
            ${strategies[tabName].content}
        `;
    }
    
    // Mark strategies as visited
    document.getElementById('strategies-progress').classList.remove('bg-gray-300');
    document.getElementById('strategies-progress').classList.add('bg-green-500');
}

// Progress tracking
function updateProgress() {
    const tracker = document.getElementById('progress-tracker');
    if (visitedSections.size > 1) {
        tracker.classList.remove('hidden');
    }
    
    // Save progress to localStorage
    localStorage.setItem('automotiveTool_progress', JSON.stringify(Array.from(visitedSections)));
}

// Load saved progress
window.addEventListener('load', () => {
    const savedProgress = localStorage.getItem('automotiveTool_progress');
    if (savedProgress) {
        const sections = JSON.parse(savedProgress);
        sections.forEach(section => visitedSections.add(section));
        
        // Update progress indicators
        if (visitedSections.has('quiz')) {
            document.getElementById('quiz-progress').classList.remove('bg-gray-300');
            document.getElementById('quiz-progress').classList.add('bg-green-500');
        }
        if (visitedSections.has('types')) {
            document.getElementById('types-progress').classList.remove('bg-gray-300');
            document.getElementById('types-progress').classList.add('bg-green-500');
        }
        if (visitedSections.has('strategies')) {
            document.getElementById('strategies-progress').classList.remove('bg-gray-300');
            document.getElementById('strategies-progress').classList.add('bg-green-500');
        }
    }
});
