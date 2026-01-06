import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/cloudflare-workers';
import { Bindings, Variables } from './types';

// Import routes
import auth from './routes/auth';
import requests from './routes/requests';
import trips from './routes/trips';
import bookings from './routes/bookings';
import payments from './routes/payments';
import reviews from './routes/reviews';
import chat from './routes/chat';

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Enable CORS for API routes
app.use('/api/*', cors());

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }));

// API Routes
app.route('/api/auth', auth);
app.route('/api/requests', requests);
app.route('/api/trips', trips);
app.route('/api/bookings', bookings);
app.route('/api/payments', payments);
app.route('/api/reviews', reviews);
app.route('/api/chat', chat);

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Main frontend route
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SafiriDocs - Document Delivery Marketplace</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            .gradient-bg {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .card-hover {
                transition: transform 0.3s ease, box-shadow 0.3s ease;
            }
            .card-hover:hover {
                transform: translateY(-5px);
                box-shadow: 0 10px 25px rgba(0,0,0,0.15);
            }
        </style>
    </head>
    <body class="bg-gray-50">
        <!-- Navigation -->
        <nav class="bg-white shadow-sm">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-16">
                    <div class="flex items-center">
                        <i class="fas fa-plane-departure text-purple-600 text-2xl mr-2"></i>
                        <span class="text-2xl font-bold text-gray-900">SafiriDocs</span>
                    </div>
                    <div class="flex items-center space-x-4">
                        <button onclick="showSection('about')" class="text-gray-700 hover:text-purple-600">About</button>
                        <button onclick="showSection('how-it-works')" class="text-gray-700 hover:text-purple-600">How It Works</button>
                        <button onclick="showSection('login')" class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">Login</button>
                        <button onclick="showSection('signup')" class="border border-purple-600 text-purple-600 px-4 py-2 rounded-lg hover:bg-purple-50">Sign Up</button>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Hero Section -->
        <section id="home" class="gradient-bg text-white py-20">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h1 class="text-5xl font-bold mb-6">Send Documents Internationally<br/>With Verified Travelers</h1>
                <p class="text-xl mb-8 text-purple-100">Save up to 80% on courier costs. Fast, trusted, peer-to-peer document delivery.</p>
                <div class="flex justify-center space-x-4">
                    <button onclick="showSection('signup')" class="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 text-lg">
                        Get Started
                    </button>
                    <button onclick="showSection('how-it-works')" class="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 text-lg">
                        Learn More
                    </button>
                </div>
                
                <!-- Stats -->
                <div class="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div class="bg-white bg-opacity-20 backdrop-blur-lg rounded-lg p-6">
                        <div class="text-4xl font-bold">60-80%</div>
                        <div class="text-purple-100">Cost Savings</div>
                    </div>
                    <div class="bg-white bg-opacity-20 backdrop-blur-lg rounded-lg p-6">
                        <div class="text-4xl font-bold">24-48hrs</div>
                        <div class="text-purple-100">Delivery Time</div>
                    </div>
                    <div class="bg-white bg-opacity-20 backdrop-blur-lg rounded-lg p-6">
                        <div class="text-4xl font-bold">100%</div>
                        <div class="text-purple-100">Verified Travelers</div>
                    </div>
                </div>
            </div>
        </section>

        <!-- How It Works -->
        <section id="how-it-works" class="py-20 hidden">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 class="text-4xl font-bold text-center mb-12">How SafiriDocs Works</h2>
                
                <div class="grid md:grid-cols-2 gap-12 mb-16">
                    <!-- For Senders -->
                    <div class="bg-white rounded-xl shadow-lg p-8 card-hover">
                        <h3 class="text-2xl font-bold mb-6 text-purple-600">
                            <i class="fas fa-paper-plane mr-2"></i>For Senders
                        </h3>
                        <div class="space-y-4">
                            <div class="flex items-start">
                                <div class="bg-purple-100 rounded-full w-8 h-8 flex items-center justify-center mr-4 flex-shrink-0">1</div>
                                <div>
                                    <p class="font-semibold">Post Your Request</p>
                                    <p class="text-gray-600 text-sm">Describe your documents and destination</p>
                                </div>
                            </div>
                            <div class="flex items-start">
                                <div class="bg-purple-100 rounded-full w-8 h-8 flex items-center justify-center mr-4 flex-shrink-0">2</div>
                                <div>
                                    <p class="font-semibold">Match With Traveler</p>
                                    <p class="text-gray-600 text-sm">Choose from verified travelers going to your destination</p>
                                </div>
                            </div>
                            <div class="flex items-start">
                                <div class="bg-purple-100 rounded-full w-8 h-8 flex items-center justify-center mr-4 flex-shrink-0">3</div>
                                <div>
                                    <p class="font-semibold">Pay Securely</p>
                                    <p class="text-gray-600 text-sm">Funds held in escrow until delivery</p>
                                </div>
                            </div>
                            <div class="flex items-start">
                                <div class="bg-purple-100 rounded-full w-8 h-8 flex items-center justify-center mr-4 flex-shrink-0">4</div>
                                <div>
                                    <p class="font-semibold">Track & Receive</p>
                                    <p class="text-gray-600 text-sm">Get updates and confirm delivery</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- For Travelers -->
                    <div class="bg-white rounded-xl shadow-lg p-8 card-hover">
                        <h3 class="text-2xl font-bold mb-6 text-green-600">
                            <i class="fas fa-suitcase-rolling mr-2"></i>For Travelers
                        </h3>
                        <div class="space-y-4">
                            <div class="flex items-start">
                                <div class="bg-green-100 rounded-full w-8 h-8 flex items-center justify-center mr-4 flex-shrink-0">1</div>
                                <div>
                                    <p class="font-semibold">Add Your Trip</p>
                                    <p class="text-gray-600 text-sm">Share your travel plans</p>
                                </div>
                            </div>
                            <div class="flex items-start">
                                <div class="bg-green-100 rounded-full w-8 h-8 flex items-center justify-center mr-4 flex-shrink-0">2</div>
                                <div>
                                    <p class="font-semibold">Browse Requests</p>
                                    <p class="text-gray-600 text-sm">Find documents to carry on your route</p>
                                </div>
                            </div>
                            <div class="flex items-start">
                                <div class="bg-green-100 rounded-full w-8 h-8 flex items-center justify-center mr-4 flex-shrink-0">3</div>
                                <div>
                                    <p class="font-semibold">Pickup & Deliver</p>
                                    <p class="text-gray-600 text-sm">Meet sender, carry documents safely</p>
                                </div>
                            </div>
                            <div class="flex items-start">
                                <div class="bg-green-100 rounded-full w-8 h-8 flex items-center justify-center mr-4 flex-shrink-0">4</div>
                                <div>
                                    <p class="font-semibold">Get Paid</p>
                                    <p class="text-gray-600 text-sm">Earn $10-50 per delivery</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- What We Accept -->
                <div class="bg-gray-100 rounded-xl p-8">
                    <h3 class="text-2xl font-bold mb-6 text-center">Documents Only - Stay Safe</h3>
                    <div class="grid md:grid-cols-2 gap-8">
                        <div>
                            <h4 class="font-bold text-green-600 mb-4"><i class="fas fa-check-circle mr-2"></i>Allowed</h4>
                            <ul class="space-y-2 text-gray-700">
                                <li>✓ Visa/Passport applications</li>
                                <li>✓ Business contracts</li>
                                <li>✓ Academic transcripts</li>
                                <li>✓ Legal documents</li>
                                <li>✓ Medical records</li>
                                <li>✓ Letters and correspondence</li>
                            </ul>
                        </div>
                        <div>
                            <h4 class="font-bold text-red-600 mb-4"><i class="fas fa-times-circle mr-2"></i>Prohibited</h4>
                            <ul class="space-y-2 text-gray-700">
                                <li>✗ Cash or checks</li>
                                <li>✗ Electronics (phones, USB, SIM cards)</li>
                                <li>✗ Medications or supplements</li>
                                <li>✗ Sealed packages</li>
                                <li>✗ Food items</li>
                                <li>✗ Anything illegal</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Login Section -->
        <section id="login" class="py-20 hidden">
            <div class="max-w-md mx-auto px-4">
                <div class="bg-white rounded-xl shadow-lg p-8">
                    <h2 class="text-3xl font-bold mb-6 text-center">Welcome Back</h2>
                    <form id="loginForm" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                            <input type="email" id="loginEmail" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
                            <input type="password" id="loginPassword" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent">
                        </div>
                        <button type="submit" class="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700">
                            Login
                        </button>
                    </form>
                    <p class="text-center mt-4 text-gray-600">
                        Don't have an account? 
                        <button onclick="showSection('signup')" class="text-purple-600 hover:underline">Sign up</button>
                    </p>
                </div>
            </div>
        </section>

        <!-- Signup Section -->
        <section id="signup" class="py-20 hidden">
            <div class="max-w-md mx-auto px-4">
                <div class="bg-white rounded-xl shadow-lg p-8">
                    <h2 class="text-3xl font-bold mb-6 text-center">Create Account</h2>
                    <form id="signupForm" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                            <input type="text" id="signupName" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                            <input type="email" id="signupEmail" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Phone (with country code)</label>
                            <input type="tel" id="signupPhone" placeholder="+254712345678" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
                            <input type="password" id="signupPassword" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">I am a...</label>
                            <select id="signupRole" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent">
                                <option value="">Select role</option>
                                <option value="sender">Sender (I need to send documents)</option>
                                <option value="traveler">Traveler (I want to earn by carrying documents)</option>
                                <option value="both">Both</option>
                            </select>
                        </div>
                        <button type="submit" class="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700">
                            Sign Up
                        </button>
                    </form>
                    <p class="text-center mt-4 text-gray-600">
                        Already have an account? 
                        <button onclick="showSection('login')" class="text-purple-600 hover:underline">Login</button>
                    </p>
                </div>
            </div>
        </section>

        <!-- Dashboard (shown after login) -->
        <section id="dashboard" class="py-20 hidden">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center mb-8">
                    <h2 class="text-3xl font-bold">Dashboard</h2>
                    <button onclick="logout()" class="text-red-600 hover:text-red-700">
                        <i class="fas fa-sign-out-alt mr-2"></i>Logout
                    </button>
                </div>
                
                <div id="dashboardContent"></div>
            </div>
        </section>

        <!-- Footer -->
        <footer class="bg-gray-900 text-white py-12">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="grid md:grid-cols-4 gap-8">
                    <div>
                        <h3 class="text-xl font-bold mb-4">SafiriDocs</h3>
                        <p class="text-gray-400">Connecting senders with verified travelers for trusted document delivery.</p>
                    </div>
                    <div>
                        <h4 class="font-bold mb-4">Product</h4>
                        <ul class="space-y-2 text-gray-400">
                            <li><a href="#" class="hover:text-white">How It Works</a></li>
                            <li><a href="#" class="hover:text-white">Pricing</a></li>
                            <li><a href="#" class="hover:text-white">Safety</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 class="font-bold mb-4">Support</h4>
                        <ul class="space-y-2 text-gray-400">
                            <li><a href="#" class="hover:text-white">Help Center</a></li>
                            <li><a href="#" class="hover:text-white">Contact Us</a></li>
                            <li><a href="#" class="hover:text-white">Terms of Service</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 class="font-bold mb-4">Routes</h4>
                        <ul class="space-y-2 text-gray-400">
                            <li>Nairobi → Dubai</li>
                            <li>Lagos → London (Coming Soon)</li>
                            <li>Accra → New York (Coming Soon)</li>
                        </ul>
                    </div>
                </div>
                <div class="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
                    <p>&copy; 2026 SafiriDocs. All rights reserved.</p>
                </div>
            </div>
        </footer>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            // Frontend JavaScript
            const API_BASE = '/api';
            let authToken = localStorage.getItem('authToken');
            let currentUser = null;

            // Show/hide sections
            function showSection(section) {
                const sections = ['home', 'about', 'how-it-works', 'login', 'signup', 'dashboard'];
                sections.forEach(s => {
                    const el = document.getElementById(s);
                    if (el) el.classList.add('hidden');
                });
                
                const target = document.getElementById(section);
                if (target) target.classList.remove('hidden');
            }

            // Login
            document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('loginEmail').value;
                const password = document.getElementById('loginPassword').value;

                try {
                    const response = await axios.post(API_BASE + '/auth/login', { email, password });
                    authToken = response.data.token;
                    currentUser = response.data.user;
                    localStorage.setItem('authToken', authToken);
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    
                    alert('Login successful!');
                    loadDashboard();
                    showSection('dashboard');
                } catch (error) {
                    alert('Login failed: ' + (error.response?.data?.error || 'Unknown error'));
                }
            });

            // Signup
            document.getElementById('signupForm')?.addEventListener('submit', async (e) => {
                e.preventDefault();
                const full_name = document.getElementById('signupName').value;
                const email = document.getElementById('signupEmail').value;
                const phone = document.getElementById('signupPhone').value;
                const password = document.getElementById('signupPassword').value;
                const role = document.getElementById('signupRole').value;

                try {
                    const response = await axios.post(API_BASE + '/auth/signup', {
                        full_name, email, phone, password, role
                    });
                    
                    alert('Account created! OTP: ' + response.data.otp + ' (Mock - auto-login)');
                    
                    // Auto-login
                    const loginResponse = await axios.post(API_BASE + '/auth/login', { email, password });
                    authToken = loginResponse.data.token;
                    currentUser = loginResponse.data.user;
                    localStorage.setItem('authToken', authToken);
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    
                    loadDashboard();
                    showSection('dashboard');
                } catch (error) {
                    alert('Signup failed: ' + (error.response?.data?.error || 'Unknown error'));
                }
            });

            // Logout
            function logout() {
                localStorage.removeItem('authToken');
                localStorage.removeItem('currentUser');
                authToken = null;
                currentUser = null;
                showSection('home');
            }

            // Load dashboard
            async function loadDashboard() {
                const user = JSON.parse(localStorage.getItem('currentUser'));
                if (!user) return;

                const content = document.getElementById('dashboardContent');
                
                content.innerHTML = \`
                    <div class="bg-white rounded-xl shadow-lg p-8 mb-6">
                        <h3 class="text-2xl font-bold mb-4">Welcome, \${user.full_name}!</h3>
                        <div class="grid md:grid-cols-4 gap-4">
                            <div class="bg-purple-100 p-4 rounded-lg">
                                <div class="text-sm text-gray-600">Trust Score</div>
                                <div class="text-2xl font-bold text-purple-600">\${user.trust_score}</div>
                            </div>
                            <div class="bg-green-100 p-4 rounded-lg">
                                <div class="text-sm text-gray-600">Rating</div>
                                <div class="text-2xl font-bold text-green-600">\${user.average_rating || 0} ⭐</div>
                            </div>
                            <div class="bg-blue-100 p-4 rounded-lg">
                                <div class="text-sm text-gray-600">Deliveries</div>
                                <div class="text-2xl font-bold text-blue-600">\${user.total_deliveries || 0}</div>
                            </div>
                            <div class="bg-yellow-100 p-4 rounded-lg">
                                <div class="text-sm text-gray-600">Status</div>
                                <div class="text-xl font-bold text-yellow-600">\${user.verification_status}</div>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white rounded-xl shadow-lg p-8">
                        <h3 class="text-xl font-bold mb-4">Quick Actions</h3>
                        <div class="space-y-4">
                            \${user.role !== 'traveler' ? '<button onclick="showCreateRequestForm()" class="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700"><i class="fas fa-plus mr-2"></i>Create Delivery Request</button>' : ''}
                            \${user.role !== 'sender' ? '<button onclick="showCreateTripForm()" class="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700"><i class="fas fa-plane mr-2"></i>Add Trip</button>' : ''}
                            <button onclick="browseMarketplace()" class="w-full border border-gray-300 py-3 rounded-lg hover:bg-gray-50"><i class="fas fa-search mr-2"></i>Browse Marketplace</button>
                        </div>
                    </div>

                    <div id="requestFormContainer"></div>
                    <div id="tripFormContainer"></div>
                    <div id="marketplaceContainer"></div>

                    <div class="mt-6 bg-blue-50 border-l-4 border-blue-400 p-4">
                        <p class="text-blue-700">
                            <i class="fas fa-info-circle mr-2"></i>
                            <strong>Tip:</strong> Try creating a delivery request or browsing the marketplace!
                        </p>
                    </div>
                \`;
            }

            // Show Create Request Form
            function showCreateRequestForm() {
                const container = document.getElementById('requestFormContainer');
                container.innerHTML = \`
                    <div class="bg-white rounded-xl shadow-lg p-8 mt-6">
                        <h3 class="text-2xl font-bold mb-6">Create Delivery Request</h3>
                        <form id="createRequestForm" class="space-y-4">
                            <div class="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium mb-2">From City</label>
                                    <select id="departureCity" required class="w-full px-4 py-2 border rounded-lg">
                                        <option value="Nairobi">Nairobi</option>
                                        <option value="Lagos">Lagos</option>
                                        <option value="Accra">Accra</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium mb-2">To City</label>
                                    <select id="destinationCity" required class="w-full px-4 py-2 border rounded-lg">
                                        <option value="Dubai">Dubai</option>
                                        <option value="London">London</option>
                                        <option value="New York">New York</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium mb-2">Pickup Address</label>
                                <input type="text" id="pickupAddress" required class="w-full px-4 py-2 border rounded-lg" placeholder="e.g., JKIA Terminal 1A">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium mb-2">Delivery Address</label>
                                <input type="text" id="deliveryAddress" required class="w-full px-4 py-2 border rounded-lg" placeholder="e.g., Dubai Marina, Address Tower">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium mb-2">Document Description</label>
                                <textarea id="documentDescription" required class="w-full px-4 py-2 border rounded-lg" rows="3" placeholder="Describe your documents (e.g., Visa application documents for UAE)"></textarea>
                            </div>
                            
                            <div class="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium mb-2">Document Type</label>
                                    <select id="documentType" class="w-full px-4 py-2 border rounded-lg">
                                        <option value="legal">Legal Documents</option>
                                        <option value="contract">Business Contract</option>
                                        <option value="transcript">Academic Transcript</option>
                                        <option value="personal">Personal Documents</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium mb-2">Offered Amount (USD)</label>
                                    <input type="number" id="offeredAmount" required min="10" max="100" class="w-full px-4 py-2 border rounded-lg" placeholder="20">
                                </div>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium mb-2">Urgency</label>
                                <select id="urgency" class="w-full px-4 py-2 border rounded-lg">
                                    <option value="within_3_days">Within 3 days</option>
                                    <option value="within_7_days">Within 7 days</option>
                                    <option value="flexible">Flexible</option>
                                </select>
                            </div>
                            
                            <div class="flex gap-4">
                                <button type="submit" class="flex-1 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700">
                                    <i class="fas fa-paper-plane mr-2"></i>Create Request
                                </button>
                                <button type="button" onclick="closeRequestForm()" class="px-6 py-3 border rounded-lg hover:bg-gray-50">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                \`;

                document.getElementById('createRequestForm').addEventListener('submit', async (e) => {
                    e.preventDefault();
                    
                    const requestData = {
                        departure_city: document.getElementById('departureCity').value,
                        destination_city: document.getElementById('destinationCity').value,
                        pickup_address: document.getElementById('pickupAddress').value,
                        delivery_address: document.getElementById('deliveryAddress').value,
                        document_description: document.getElementById('documentDescription').value,
                        document_type: document.getElementById('documentType').value,
                        offered_amount: parseFloat(document.getElementById('offeredAmount').value),
                        urgency: document.getElementById('urgency').value
                    };

                    try {
                        const response = await axios.post(API_BASE + '/requests', requestData, {
                            headers: { 'Authorization': \`Bearer \${authToken}\` }
                        });
                        
                        alert('Delivery request created successfully! Request ID: ' + response.data.id);
                        closeRequestForm();
                        loadDashboard();
                    } catch (error) {
                        alert('Failed to create request: ' + (error.response?.data?.error || 'Unknown error'));
                    }
                });
            }

            function closeRequestForm() {
                document.getElementById('requestFormContainer').innerHTML = '';
            }

            // Show Create Trip Form
            function showCreateTripForm() {
                const container = document.getElementById('tripFormContainer');
                container.innerHTML = \`
                    <div class="bg-white rounded-xl shadow-lg p-8 mt-6">
                        <h3 class="text-2xl font-bold mb-6">Add Trip</h3>
                        <form id="createTripForm" class="space-y-4">
                            <div class="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium mb-2">From City</label>
                                    <select id="tripDepartureCity" required class="w-full px-4 py-2 border rounded-lg">
                                        <option value="Nairobi">Nairobi</option>
                                        <option value="Lagos">Lagos</option>
                                        <option value="Accra">Accra</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium mb-2">To City</label>
                                    <select id="tripDestinationCity" required class="w-full px-4 py-2 border rounded-lg">
                                        <option value="Dubai">Dubai</option>
                                        <option value="London">London</option>
                                        <option value="New York">New York</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium mb-2">Departure Date</label>
                                    <input type="date" id="departureDate" required class="w-full px-4 py-2 border rounded-lg">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium mb-2">Arrival Date</label>
                                    <input type="date" id="arrivalDate" required class="w-full px-4 py-2 border rounded-lg">
                                </div>
                            </div>
                            
                            <div class="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium mb-2">Flight Number (optional)</label>
                                    <input type="text" id="flightNumber" class="w-full px-4 py-2 border rounded-lg" placeholder="e.g., KQ310">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium mb-2">Airline (optional)</label>
                                    <input type="text" id="airline" class="w-full px-4 py-2 border rounded-lg" placeholder="e.g., Kenya Airways">
                                </div>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium mb-2">Max Documents to Carry</label>
                                <select id="maxDocuments" class="w-full px-4 py-2 border rounded-lg">
                                    <option value="1">1-3 documents</option>
                                    <option value="3" selected>3-5 documents</option>
                                    <option value="5">5+ documents</option>
                                </select>
                            </div>
                            
                            <div class="flex gap-4">
                                <button type="submit" class="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700">
                                    <i class="fas fa-plane mr-2"></i>Add Trip
                                </button>
                                <button type="button" onclick="closeTripForm()" class="px-6 py-3 border rounded-lg hover:bg-gray-50">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                \`;

                // Set min date to today
                const today = new Date().toISOString().split('T')[0];
                document.getElementById('departureDate').setAttribute('min', today);
                document.getElementById('arrivalDate').setAttribute('min', today);

                document.getElementById('createTripForm').addEventListener('submit', async (e) => {
                    e.preventDefault();
                    
                    const tripData = {
                        departure_city: document.getElementById('tripDepartureCity').value,
                        destination_city: document.getElementById('tripDestinationCity').value,
                        departure_date: document.getElementById('departureDate').value,
                        arrival_date: document.getElementById('arrivalDate').value,
                        flight_number: document.getElementById('flightNumber').value,
                        airline: document.getElementById('airline').value,
                        max_documents: parseInt(document.getElementById('maxDocuments').value)
                    };

                    try {
                        const response = await axios.post(API_BASE + '/trips', tripData, {
                            headers: { 'Authorization': \`Bearer \${authToken}\` }
                        });
                        
                        alert('Trip added successfully! Trip ID: ' + response.data.id);
                        closeTripForm();
                        loadDashboard();
                    } catch (error) {
                        alert('Failed to add trip: ' + (error.response?.data?.error || 'Unknown error'));
                    }
                });
            }

            function closeTripForm() {
                document.getElementById('tripFormContainer').innerHTML = '';
            }

            // Browse Marketplace
            async function browseMarketplace() {
                const container = document.getElementById('marketplaceContainer');
                const user = JSON.parse(localStorage.getItem('currentUser'));

                try {
                    let response;
                    if (user.role === 'sender' || user.role === 'both') {
                        // Show open requests for senders
                        response = await axios.get(API_BASE + '/requests', {
                            headers: { 'Authorization': \`Bearer \${authToken}\` }
                        });
                        
                        container.innerHTML = \`
                            <div class="bg-white rounded-xl shadow-lg p-8 mt-6">
                                <h3 class="text-2xl font-bold mb-6">My Delivery Requests</h3>
                                <div class="space-y-4">
                                    \${response.data.requests.length > 0 ? response.data.requests.map(req => \`
                                        <div class="border rounded-lg p-4 hover:bg-gray-50">
                                            <div class="flex justify-between items-start">
                                                <div>
                                                    <h4 class="font-bold">\${req.departure_city} → \${req.destination_city}</h4>
                                                    <p class="text-sm text-gray-600">\${req.document_description}</p>
                                                    <p class="text-sm text-purple-600 mt-2">$\${req.offered_amount} USD</p>
                                                </div>
                                                <span class="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm">\${req.status}</span>
                                            </div>
                                        </div>
                                    \`).join('') : '<p class="text-gray-500">No requests yet. Create your first delivery request!</p>'}
                                </div>
                                <button onclick="closeMarketplace()" class="mt-6 px-6 py-2 border rounded-lg hover:bg-gray-50">Close</button>
                            </div>
                        \`;
                    } else {
                        // Show open requests for travelers
                        response = await axios.get(API_BASE + '/requests?status=open', {
                            headers: { 'Authorization': \`Bearer \${authToken}\` }
                        });
                        
                        container.innerHTML = \`
                            <div class="bg-white rounded-xl shadow-lg p-8 mt-6">
                                <h3 class="text-2xl font-bold mb-6">Available Delivery Requests</h3>
                                <div class="space-y-4">
                                    \${response.data.requests.length > 0 ? response.data.requests.map(req => \`
                                        <div class="border rounded-lg p-4 hover:bg-gray-50">
                                            <div class="flex justify-between items-start">
                                                <div>
                                                    <h4 class="font-bold">\${req.departure_city} → \${req.destination_city}</h4>
                                                    <p class="text-sm text-gray-600">\${req.document_description}</p>
                                                    <p class="text-sm mt-2">
                                                        <span class="text-purple-600 font-bold">$\${req.offered_amount} USD</span>
                                                        <span class="text-gray-500 ml-4">Trust Score: \${req.sender_trust_score || 50}</span>
                                                    </p>
                                                </div>
                                                <span class="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm">Open</span>
                                            </div>
                                        </div>
                                    \`).join('') : '<p class="text-gray-500">No open requests available yet.</p>'}
                                </div>
                                <button onclick="closeMarketplace()" class="mt-6 px-6 py-2 border rounded-lg hover:bg-gray-50">Close</button>
                            </div>
                        \`;
                    }
                } catch (error) {
                    alert('Failed to load marketplace: ' + (error.response?.data?.error || 'Unknown error'));
                }
            }

            function closeMarketplace() {
                document.getElementById('marketplaceContainer').innerHTML = '';
            }

            // Check if already logged in
            if (authToken && localStorage.getItem('currentUser')) {
                currentUser = JSON.parse(localStorage.getItem('currentUser'));
                loadDashboard();
                showSection('dashboard');
            }
        </script>
    </body>
    </html>
  `);
});

export default app;
