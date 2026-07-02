"use strict";

// ============================================================
// IMPORTS
// ============================================================
const { Telegraf, session } = require("telegraf");
const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const { CookieJar } = require("tough-cookie");
const { wrapper } = require("axios-cookiejar-support");
const { parsePhoneNumber } = require("libphonenumber-js");
const countryEmoji = require("country-emoji");
const WebSocket = require("ws");
const tunnel = require("tunnel");

// ============================================================
// EMOJI PREMIUM ID - LENGKAP
// ============================================================
const EMOJI = {
    FLAG_INDONESIA: '<tg-emoji emoji-id="5221937224068640464">🇮🇩</tg-emoji>',
    FLAG_SENEGAL: '<tg-emoji emoji-id="5224358988623130949">🇸🇳</tg-emoji>',
    FLAG_MOZAMBIQUE: '<tg-emoji emoji-id="5222470388423864826">🇲🇿</tg-emoji>',
    FLAG_TOGO: '<tg-emoji emoji-id="5222408051268532030">🇹🇬</tg-emoji>',
    FLAG_CAMEROON: '<tg-emoji emoji-id="5222270788408717651">🇨🇲</tg-emoji>',
    FLAG_BENIN: '<tg-emoji emoji-id="5222024115552009151">🇧🇯</tg-emoji>',
    FLAG_ECUADOR: '<tg-emoji emoji-id="5224191188545840926">🇪🇨</tg-emoji>',
    FLAG_TIMOR: '<tg-emoji emoji-id="5224515905253291409">🇹🇱</tg-emoji>',
    FLAG_MADAGASCAR: '<tg-emoji emoji-id="5222042605386217334">🇲🇬</tg-emoji>',
    FLAG_GABON: '<tg-emoji emoji-id="5224669733801963467">🇬🇦</tg-emoji>',
    FLAG_UNKNOWN: '<tg-emoji emoji-id="6037630738545774536">🌐</tg-emoji>',
    
    WS: '<tg-emoji emoji-id="5334998226636390258">💬</tg-emoji>',
    GET_NUMBER: '<tg-emoji emoji-id="6206375377925839184">📱</tg-emoji>',
    CENSOR_NUMBER: '<tg-emoji emoji-id="5465465194056525619">🔒</tg-emoji>',
    SERVICE: '<tg-emoji emoji-id="5334998226636390258">🛠️</tg-emoji>',
    OTP: '<tg-emoji emoji-id="5415655814079723871">🔑</tg-emoji>',
    HAPUS: '<tg-emoji emoji-id="5213358684024877471">❌</tg-emoji>',
    LOADING: '<tg-emoji emoji-id="5350427505805238170">⏳</tg-emoji>',
    REFRESH: '<tg-emoji emoji-id="5433878454078556670">🔄</tg-emoji>',
    FILE: '<tg-emoji emoji-id="5433653135799228968">📄</tg-emoji>',
    MESSAGE: '<tg-emoji emoji-id="5253742260054409879">📨</tg-emoji>',
    CHECK: '<tg-emoji emoji-id="6255591515544882364">✅</tg-emoji>',
    WARNING: '<tg-emoji emoji-id="5440660757194744323">⚠️</tg-emoji>',
    BOLT: '<tg-emoji emoji-id="5456140674028019486">⚡</tg-emoji>',
    ALERT: '<tg-emoji emoji-id="5395695537687123235">🚨</tg-emoji>',
    GRUP_OTP: '<tg-emoji emoji-id="5330237710655306682">👥</tg-emoji>',
    SENSOR: '<tg-emoji emoji-id="5465465194056525619">🔒</tg-emoji>',
};

const EMOJI_BTN = {
    FLAG_INDONESIA: "5221937224068640464",
    FLAG_SENEGAL: "5224358988623130949",
    FLAG_MOZAMBIQUE: "5222470388423864826",
    FLAG_TOGO: "5222408051268532030",
    FLAG_CAMEROON: "5222270788408717651",
    FLAG_BENIN: "5222024115552009151",
    FLAG_ECUADOR: "5224191188545840926",
    FLAG_TIMOR: "5224515905253291409",
    FLAG_MADAGASCAR: "5222042605386217334",
    FLAG_GABON: "5224669733801963467",
    FLAG_UNKNOWN: "6037630738545774536",
    
    WS: "5334998226636390258",
    GET_NUMBER: "6206375377925839184",
    CENSOR_NUMBER: "5465465194056525619",
    SERVICE: "5334998226636390258",
    OTP: "5415655814079723871",
    HAPUS: "5213358684024877471",
    LOADING: "5350427505805238170",
    REFRESH: "5433878454078556670",
    FILE: "5433653135799228968",
    MESSAGE: "5253742260054409879",
    CHECK: "6255591515544882364",
    WARNING: "5440660757194744323",
    BOLT: "5456140674028019486",
    ALERT: "5395695537687123235",
    GRUP_OTP: "5330237710655306682",
};

const FLAG_EMOJI_MAP = {
    'ID': EMOJI_BTN.FLAG_INDONESIA,
    'SN': EMOJI_BTN.FLAG_SENEGAL,
    'MZ': EMOJI_BTN.FLAG_MOZAMBIQUE,
    'TG': EMOJI_BTN.FLAG_TOGO,
    'CM': EMOJI_BTN.FLAG_CAMEROON,
    'BJ': EMOJI_BTN.FLAG_BENIN,
    'EC': EMOJI_BTN.FLAG_ECUADOR,
    'TL': EMOJI_BTN.FLAG_TIMOR,
    'MG': EMOJI_BTN.FLAG_MADAGASCAR,
    'GA': EMOJI_BTN.FLAG_GABON,
};

const FLAG_HTML_MAP = {
    'ID': EMOJI.FLAG_INDONESIA,
    'SN': EMOJI.FLAG_SENEGAL,
    'MZ': EMOJI.FLAG_MOZAMBIQUE,
    'TG': EMOJI.FLAG_TOGO,
    'CM': EMOJI.FLAG_CAMEROON,
    'BJ': EMOJI.FLAG_BENIN,
    'EC': EMOJI.FLAG_ECUADOR,
    'TL': EMOJI.FLAG_TIMOR,
    'MG': EMOJI.FLAG_MADAGASCAR,
    'GA': EMOJI.FLAG_GABON,
};

let customFlagMap = {};

function getFlagEmojiId(isoCode) {
    if (!isoCode) return EMOJI_BTN.FLAG_UNKNOWN;
    const upper = isoCode.toUpperCase();
    if (customFlagMap[upper]) return customFlagMap[upper];
    return FLAG_EMOJI_MAP[upper] || EMOJI_BTN.FLAG_UNKNOWN;
}

function getFlagEmojiHtml(isoCode) {
    if (!isoCode) return EMOJI.FLAG_UNKNOWN;
    const upper = isoCode.toUpperCase();
    const emojiId = customFlagMap[upper] || FLAG_EMOJI_MAP[upper];
    if (emojiId && emojiId !== EMOJI_BTN.FLAG_UNKNOWN) {
        return `<tg-emoji emoji-id="${emojiId}">${countryEmoji.flag(isoCode) || '🌐'}</tg-emoji>`;
    }
    return FLAG_HTML_MAP[upper] || EMOJI.FLAG_UNKNOWN;
}

function loadCustomFlags() {
    try {
        const file = path.join(DB_DIR, "custom_flags.json");
        if (fs.existsSync(file)) {
            const data = fs.readFileSync(file, "utf8");
            customFlagMap = JSON.parse(data);
            console.log(chalk.gray(`   Custom flags loaded: ${Object.keys(customFlagMap).length}`));
        } else {
            customFlagMap = {};
        }
    } catch (e) {
        customFlagMap = {};
    }
}

function saveCustomFlags() {
    try {
        const file = path.join(DB_DIR, "custom_flags.json");
        fs.writeFileSync(file, JSON.stringify(customFlagMap, null, 2));
    } catch (e) {}
}

// ============================================================
// CONFIG
// ============================================================
const BOT_TOKEN = "8718500610:AAFEBiLDfu7tIWy1b2pcuhxQCLmOfpQwf1k";
const OWNER_IDS = ["6828924584"];

// IVAS SMS Config - FULL
const IVAS_CONFIG = {
    name: "IVAS SMS",
    displayName: "i4",
    enabled: true,
    
    // Credentials
    email: "wokir84175@matkind.com",
    password: "Anggazyy112",
    
    // URLs
    baseUrl: "https://www.ivasms.com",
    loginUrl: "https://www.ivasms.com/login",
    wsUrl: "wss://ivasms.com:2087/livesms",
    
    // Auth tokens (dynamic, will be updated)
    chatToken: null,
    userToken: null,
    csrfToken: null,
    sessionCookie: null,
    xsrfCookie: null,
    
    // WebSocket query
    wsQuery: {
        token: null,
        user: null
    },
    
    // Cookies
    cookies: [],
    
    // Status
    authenticated: false,
    wsConnected: false,
    ws: null,
};

// ============================================================
// FILE-BASED DATABASE
// ============================================================
const DB_DIR = "./db";
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR);

const FILES = {
    services: path.join(DB_DIR, "services.json"),
    countries: path.join(DB_DIR, "countries.json"),
    numbers: path.join(DB_DIR, "numbers.json"),
    assigned: path.join(DB_DIR, "assigned.json"),
    users: path.join(DB_DIR, "users.json"),
    otpSeen: path.join(DB_DIR, "otp_seen.json"),
    otpLogs: path.join(DB_DIR, "otp_logs.json"),
    processedKeys: path.join(DB_DIR, "processed_keys.json"),
    processedOtp: path.join(DB_DIR, "processed_otp.json"),
    ivasSession: path.join(DB_DIR, "ivas_session.json"),
};

function readDb(file, fallback) {
    try {
        if (!fs.existsSync(file)) {
            fs.writeFileSync(file, JSON.stringify(fallback, null, 2));
            return fallback;
        }
        const data = fs.readFileSync(file, "utf8");
        return JSON.parse(data);
    } catch (e) {
        return fallback;
    }
}

function writeDb(file, data) {
    try {
        fs.writeFileSync(file, JSON.stringify(data, null, 2));
    } catch (e) {}
}

function getServices() { return readDb(FILES.services, []); }
function getCountries() { return readDb(FILES.countries, []); }
function getNumbers() { return readDb(FILES.numbers, []); }
function getAssigned() { return readDb(FILES.assigned, []); }
function getUsers() { return readDb(FILES.users, []); }
function getSeenOtp() { return new Set(readDb(FILES.otpSeen, [])); }
function getOtpLogs() { return readDb(FILES.otpLogs, []); }
function getProcessedKeys() { return new Set(readDb(FILES.processedKeys, [])); }
function getProcessedOtp() { return readDb(FILES.processedOtp, {}); }
function getIvasSession() { return readDb(FILES.ivasSession, {}); }

function saveServices(d) { writeDb(FILES.services, d); }
function saveCountries(d) { writeDb(FILES.countries, d); }
function saveNumbers(d) { writeDb(FILES.numbers, d); }
function saveAssigned(d) { writeDb(FILES.assigned, d); }
function saveUsers(d) { writeDb(FILES.users, d); }
function saveSeenOtp(set) { writeDb(FILES.otpSeen, Array.from(set).slice(-10000)); }
function saveOtpLogs(d) { writeDb(FILES.otpLogs, d.slice(-2000)); }
function saveProcessedKeys(set) { writeDb(FILES.processedKeys, Array.from(set).slice(-10000)); }
function saveProcessedOtp(data) { writeDb(FILES.processedOtp, data); }
function saveIvasSession(data) { writeDb(FILES.ivasSession, data); }

// ============================================================
// IVAS SMS AUTH - BYPASS CLOUDFLARE
// ============================================================
let ivasSession = null;
let ivasAxios = null;
let wsConnection = null;
let isWsConnected = false;
let ivasDataHandler = null;

// Create axios instance with cookie jar for IVAS
function createIvasAxios() {
    const jar = new CookieJar();
    const axiosInstance = wrapper(axios.create({
        jar: jar,
        withCredentials: true,
        timeout: 30000,
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-User": "?1",
            "Cache-Control": "max-age=0",
        },
        httpsAgent: new (require('https').Agent)({
            rejectUnauthorized: false
        })
    }));
    return axiosInstance;
}

// Get CSRF token from login page
async function getCsrfToken(axiosInstance) {
    try {
        const response = await axiosInstance.get(IVAS_CONFIG.loginUrl);
        const html = response.data;
        
        // Extract CSRF token
        const tokenMatch = html.match(/name="_token"\s+value="([^"]+)"/);
        if (tokenMatch) {
            return tokenMatch[1];
        }
        
        // Alternative pattern
        const tokenMatch2 = html.match(/<input[^>]*name="_token"[^>]*value="([^"]+)"/);
        if (tokenMatch2) {
            return tokenMatch2[1];
        }
        
        return null;
    } catch (error) {
        console.log(chalk.red(`❌ Failed to get CSRF token: ${error.message}`));
        return null;
    }
}

// Login to IVAS
async function loginIvas() {
    try {
        console.log(chalk.cyan(`🔐 Logging in to IVAS SMS...`));
        
        const axiosInstance = createIvasAxios();
        
        // Step 1: Get CSRF token
        const csrfToken = await getCsrfToken(axiosInstance);
        if (!csrfToken) {
            console.log(chalk.red(`❌ Failed to get CSRF token`));
            return false;
        }
        
        console.log(chalk.gray(`   CSRF Token: ${csrfToken.substring(0, 20)}...`));
        
        // Step 2: Login
        const loginData = new URLSearchParams();
        loginData.append('_token', csrfToken);
        loginData.append('email', IVAS_CONFIG.email);
        loginData.append('password', IVAS_CONFIG.password);
        loginData.append('submit', 'register');
        loginData.append('remember', '1');
        
        const loginResponse = await axiosInstance.post(IVAS_CONFIG.loginUrl, loginData.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Referer': IVAS_CONFIG.loginUrl,
                'Origin': IVAS_CONFIG.baseUrl,
            },
            maxRedirects: 5,
            validateStatus: (status) => status < 400
        });
        
        // Check if login successful
        const responseData = typeof loginResponse.data === 'string' ? loginResponse.data : JSON.stringify(loginResponse.data);
        
        if (responseData.includes('dashboard') || 
            responseData.includes('portal') || 
            responseData.includes('logout') ||
            responseData.includes('Client System') ||
            responseData.includes('Live SMS')) {
            
            // Get cookies from jar
            const cookies = await axiosInstance.jar.getCookies(IVAS_CONFIG.baseUrl);
            const cookieMap = {};
            for (const cookie of cookies) {
                cookieMap[cookie.key] = cookie.value;
            }
            
            // Extract session cookies
            const xsrfToken = cookieMap['XSRF-TOKEN'] || null;
            const sessionCookie = cookieMap['ivas_sms_session'] || null;
            
            // Get chat token from response or from API
            let chatToken = null;
            let userToken = null;
            
            // Try to get chat token from API
            try {
                const chatResponse = await axiosInstance.get('https://hub.orangecarrier.com/api/auth', {
                    params: {
                        token: 'eyJpdiI6IjUwUGpBeTlZYUJ4a3h5bFBKblR1K2c9PSIsInZhbHVlIjoiU2htV0FwQWphZmtXWHQzWHNhK3BSNER4eWY0K3NiQTNTZGVxWjNVdzlwcnNpUStnWVdXSVIrRDg2NlRSQWVoVEpVRGI0WlBGUElBVExsUzNWOEZ4VWphRTY2elY3azIraDZNN1c5aU5Qb25zVHhrZTU5N1IzeTN3aTY3VWFSVXpEVmVMNjhra3NVNE1MaTNPZzM5SGplU0prZXNlR0NnWm1sVHY5NnVwUnhUdU5BK1ZrRFpxeUNQYXZ3WUVhZFRHZ05VbjMyVUIrL1BseXVOaHR3WXdEUlF4SERqd3JEWlhLNUtjcDNGc0NpdVpmTXpzQXl0MmdtYVd6eFRBSnY0K3RyMG5kT3ZPNVhQWHkzZXcrei95QUlDcEVLZ2drY3NMM2lVS3didDJqeHM9IiwibWFjIjoiZGVjMzBjMzA1YmZmNTZjYzJjN2Q3ZDQ0NzE0MWMzZGViYzgzNDU3ZDMxZGQzMTlkNzJjYjNkMGIzMWYwMjQyMCIsInRhZyI6IiJ9',
                        system: 'ivas'
                    },
                    headers: {
                        'Referer': IVAS_CONFIG.baseUrl,
                        'Origin': IVAS_CONFIG.baseUrl,
                    }
                });
                
                if (chatResponse.data && chatResponse.data.chatToken) {
                    chatToken = chatResponse.data.chatToken;
                }
                
                // Get user token from response
                if (chatResponse.data && chatResponse.data.userToken) {
                    userToken = chatResponse.data.userToken;
                }
            } catch (e) {
                console.log(chalk.yellow(`⚠️ Could not get chat token: ${e.message}`));
            }
            
            // Save session
            ivasSession = {
                csrfToken: csrfToken,
                xsrfToken: xsrfToken,
                sessionCookie: sessionCookie,
                chatToken: chatToken || IVAS_CONFIG.chatToken,
                userToken: userToken || IVAS_CONFIG.userToken,
                cookies: cookieMap,
                authenticated: true,
                loginTime: Date.now()
            };
            
            ivasAxios = axiosInstance;
            
            saveIvasSession(ivasSession);
            
            console.log(chalk.green(`✅ IVAS SMS login successful`));
            console.log(chalk.gray(`   Session: ${sessionCookie ? sessionCookie.substring(0, 30) + '...' : 'N/A'}`));
            
            return true;
            
        } else {
            console.log(chalk.red(`❌ IVAS SMS login failed`));
            console.log(chalk.gray(`   Response preview: ${responseData.substring(0, 200)}`));
            return false;
        }
        
    } catch (error) {
        console.log(chalk.red(`❌ IVAS SMS login error: ${error.message}`));
        return false;
    }
}

// Refresh session if needed
async function refreshIvasSession() {
    if (!ivasSession || !ivasSession.authenticated) {
        return await loginIvas();
    }
    
    // Check if session expired (older than 1 hour)
    if (Date.now() - ivasSession.loginTime > 3600000) {
        console.log(chalk.yellow(`⏰ Session expired, refreshing...`));
        return await loginIvas();
    }
    
    // Check if session is still valid by making a test request
    try {
        const response = await ivasAxios.get('https://www.ivasms.com/portal', {
            headers: {
                'Referer': IVAS_CONFIG.baseUrl,
            },
            timeout: 10000
        });
        
        const html = response.data;
        if (html.includes('logout') || html.includes('dashboard') || html.includes('portal')) {
            return true;
        } else {
            console.log(chalk.yellow(`⚠️ Session invalid, re-login...`));
            return await loginIvas();
        }
    } catch (error) {
        console.log(chalk.yellow(`⚠️ Session check failed: ${error.message}`));
        return await loginIvas();
    }
}

// ============================================================
// IVAS WEBSOCKET - REAL-TIME SMS
// ============================================================
function connectIvasWebSocket() {
    if (!ivasSession || !ivasSession.authenticated) {
        console.log(chalk.yellow(`⚠️ Cannot connect WebSocket: not authenticated`));
        return;
    }
    
    if (isWsConnected) {
        console.log(chalk.gray(`   WebSocket already connected`));
        return;
    }
    
    // Close existing connection
    if (wsConnection) {
        try { wsConnection.close(); } catch (e) {}
        wsConnection = null;
    }
    
    const wsUrl = IVAS_CONFIG.wsUrl;
    const token = ivasSession.userToken || IVAS_CONFIG.userToken;
    const userHash = "905ad14078a606819e64d66245e66e39"; // Fixed user hash from page
    
    const fullUrl = `${wsUrl}?token=${encodeURIComponent(token)}&user=${userHash}`;
    
    console.log(chalk.cyan(`🔌 Connecting to IVAS WebSocket...`));
    
    try {
        wsConnection = new WebSocket(fullUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Origin': 'https://www.ivasms.com',
                'Referer': 'https://www.ivasms.com/portal/live/my_sms',
            },
            perMessageDeflate: false,
        });
        
        wsConnection.on('open', function() {
            isWsConnected = true;
            console.log(chalk.green(`✅ IVAS WebSocket connected`));
        });
        
        wsConnection.on('message', function(data) {
            try {
                const message = data.toString();
                // Parse the message - it's a JSON string
                let parsed;
                try {
                    parsed = JSON.parse(message);
                } catch (e) {
                    // Try to extract from socket.io format
                    if (message.startsWith('42')) {
                        const content = message.substring(2);
                        const parsedContent = JSON.parse(content);
                        if (Array.isArray(parsedContent) && parsedContent.length === 2) {
                            const eventName = parsedContent[0];
                            const eventData = parsedContent[1];
                            if (eventName && eventData) {
                                handleIvasSmsEvent(eventName, eventData);
                            }
                        }
                    }
                    return;
                }
                
                // Handle different message types
                if (parsed.event) {
                    handleIvasSmsEvent(parsed.event, parsed.data);
                } else if (parsed.data && parsed.data.event) {
                    handleIvasSmsEvent(parsed.data.event, parsed.data.data);
                }
                
            } catch (error) {
                console.log(chalk.yellow(`⚠️ WebSocket message parse error: ${error.message}`));
            }
        });
        
        wsConnection.on('error', function(error) {
            console.log(chalk.red(`❌ WebSocket error: ${error.message}`));
            isWsConnected = false;
        });
        
        wsConnection.on('close', function() {
            console.log(chalk.yellow(`⚠️ WebSocket disconnected`));
            isWsConnected = false;
            wsConnection = null;
            
            // Try to reconnect after 5 seconds
            setTimeout(() => {
                if (!isWsConnected) {
                    console.log(chalk.gray(`🔄 Reconnecting WebSocket...`));
                    refreshIvasSession().then(() => {
                        connectIvasWebSocket();
                    });
                }
            }, 5000);
        });
        
    } catch (error) {
        console.log(chalk.red(`❌ WebSocket connection error: ${error.message}`));
        isWsConnected = false;
        wsConnection = null;
    }
}

// Handle IVAS SMS events
function handleIvasSmsEvent(eventName, eventData) {
    try {
        // Check if this is a live SMS event
        if (eventName && eventName.includes('eyJpdiI6Inhic0p6ZzAzcklyY1pwYWU0REZvTlE9PSIsInZhbHVlIjoiMk1TaGhjb0NhbW1KVGM5VUJqYU5ONmlqMGN1SEtPYzRzOTRIY0xDMmkydz0iLCJtYWMiOiI3M2E1MjgxYzNhNWMxZjE0OTBkZmMwNTc2M2VjNDE0ZjZkODAzMWY2MjY2ZGE0OThmZDQ3M2E4YjU1YTk1MDU1IiwidGFnIjoiIn0=')) {
            // This is the live SMS event
            processIvasSmsData(eventData);
        }
    } catch (error) {
        console.log(chalk.red(`❌ Handle SMS event error: ${error.message}`));
    }
}

// Process SMS data from IVAS
function processIvasSmsData(data) {
    try {
        // Data structure from IVAS WebSocket
        // {
        //   recipient: "24160148007",
        //   range: "Gabon",
        //   country_iso: "GA",
        //   originator: "WhatsApp",
        //   message: "Your WhatsApp code 186-187",
        //   client_revenue: 0.003,
        //   limit: 1,
        //   termination_id: 12345
        // }
        
        if (!data) return;
        
        const number = data.recipient || data.num || '';
        const message = data.message || data.messagedata || '';
        const cli = data.originator || data.cli || 'Unknown';
        const range = data.range || '';
        const countryIso = data.country_iso || '';
        const date = data.senttime || data.dt || new Date().toISOString().replace('T', ' ').slice(0, 19);
        const panel = 'i4';
        
        if (!number || !message) return;
        
        const formattedNumber = formatInternationalNumber(number);
        const otpCode = extractOTP(message);
        const language = detectLanguage(message);
        const uniqueKey = `ivas-${number}-${date}-${message.substring(0, 30)}`;
        
        // Check if already processed
        if (processedKeys.has(uniqueKey)) return;
        if (processedOtp[uniqueKey]) return;
        
        const smsData = {
            panel: panel,
            date: date,
            range: range,
            number: formattedNumber,
            cli: cli,
            client: '',
            sms: message,
            otp: otpCode,
            language: language,
            uniqueKey: uniqueKey,
            countryIso: countryIso,
            rawData: data
        };
        
        // Process the SMS
        processedKeys.add(uniqueKey);
        seenOtpKeys.add(uniqueKey);
        processedOtp[uniqueKey] = {
            timestamp: Date.now(),
            number: formattedNumber,
            panel: panel,
            otp: otpCode
        };
        
        // Process OTP
        processOtpSms(smsData);
        
        console.log(chalk.green(`📨 IVAS SMS: ${formattedNumber} | ${otpCode || 'no OTP'}`));
        
    } catch (error) {
        console.log(chalk.red(`❌ Process IVAS SMS error: ${error.message}`));
    }
}

// ============================================================
// FETCH SMS FROM IVAS - REST API FALLBACK
// ============================================================
async function fetchIvasSmsRest() {
    try {
        const sessionValid = await refreshIvasSession();
        if (!sessionValid) {
            console.log(chalk.red(`❌ IVAS session invalid`));
            return [];
        }
        
        // Get SMS history from API
        const response = await ivasAxios.get('https://www.ivasms.com/portal/live/my_sms', {
            headers: {
                'Referer': 'https://www.ivasms.com/portal',
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json',
            },
            timeout: 15000
        });
        
        const html = response.data;
        
        // Extract SMS data from HTML
        const results = [];
        
        // Parse the table data from the page
        const $ = cheerio.load(html);
        $('.table-dashboard tbody tr').each(function() {
            const row = $(this);
            const cells = row.find('td');
            
            if (cells.length >= 5) {
                const rangeText = cells.eq(0).find('h6 a').text().trim() || cells.eq(0).text().trim();
                const numberText = cells.eq(0).find('.CopyText').text().trim() || cells.eq(1).text().trim();
                const sidText = cells.eq(1).find('.fw-semi-bold').text().trim() || cells.eq(1).text().trim();
                const messageText = cells.eq(4).text().trim();
                const paidText = cells.eq(2).text().trim();
                const limitText = cells.eq(3).text().trim();
                
                if (numberText && messageText) {
                    const formattedNumber = formatInternationalNumber(numberText);
                    const otpCode = extractOTP(messageText);
                    const language = detectLanguage(messageText);
                    const uniqueKey = `ivas-rest-${numberText}-${Date.now()}-${messageText.substring(0, 20)}`;
                    
                    results.push({
                        panel: 'i4',
                        date: new Date().toISOString().replace('T', ' ').slice(0, 19),
                        range: rangeText || 'Unknown',
                        number: formattedNumber,
                        cli: sidText || 'Unknown',
                        client: '',
                        sms: messageText,
                        otp: otpCode,
                        language: language,
                        uniqueKey: uniqueKey
                    });
                }
            }
        });
        
        return results;
        
    } catch (error) {
        console.log(chalk.red(`❌ IVAS REST fetch error: ${error.message}`));
        return [];
    }
}

// ============================================================
// LANGUAGE DETECTION - SMART MULTI-LAYER
// ============================================================
const UNICODE_SCRIPTS = [
    { regex: /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/, code: 'AR', name: 'Arabic', flag: '🇸🇦' },
    { regex: /[\u0400-\u04FF]/, code: 'RU', name: 'Russian', flag: '🇷🇺' },
    { regex: /[\u4E00-\u9FFF\u3400-\u4DBF]/, code: 'ZH', name: 'Chinese', flag: '🇨🇳' },
    { regex: /[\u3040-\u309F\u30A0-\u30FF]/, code: 'JA', name: 'Japanese', flag: '🇯🇵' },
    { regex: /[\uAC00-\uD7AF\u1100-\u11FF]/, code: 'KO', name: 'Korean', flag: '🇰🇷' },
    { regex: /[\u0E00-\u0E7F]/, code: 'TH', name: 'Thai', flag: '🇹🇭' },
    { regex: /[\u0900-\u097F]/, code: 'HI', name: 'Hindi', flag: '🇮🇳' },
    { regex: /[\u0980-\u09FF]/, code: 'BN', name: 'Bengali', flag: '🇧🇩' },
    { regex: /[\u0A80-\u0AFF]/, code: 'GU', name: 'Gujarati', flag: '🇮🇳' },
    { regex: /[\u0B00-\u0B7F]/, code: 'OR', name: 'Odia', flag: '🇮🇳' },
    { regex: /[\u0B80-\u0BFF]/, code: 'TA', name: 'Tamil', flag: '🇮🇳' },
    { regex: /[\u0C00-\u0C7F]/, code: 'TE', name: 'Telugu', flag: '🇮🇳' },
    { regex: /[\u0C80-\u0CFF]/, code: 'KN', name: 'Kannada', flag: '🇮🇳' },
    { regex: /[\u0D00-\u0D7F]/, code: 'ML', name: 'Malayalam', flag: '🇮🇳' },
    { regex: /[\u0E80-\u0EFF]/, code: 'LO', name: 'Lao', flag: '🇱🇦' },
    { regex: /[\u1000-\u109F]/, code: 'MY', name: 'Burmese', flag: '🇲🇲' },
    { regex: /[\u1780-\u17FF]/, code: 'KM', name: 'Khmer', flag: '🇰🇭' },
];

const WA_OTP_PHRASES = [
    {
        code: 'ID', name: 'Indonesia', flag: '🇮🇩', weight: 100,
        phrases: [
            'kode whatsapp', 'jangan bagikan kode ini', 'kode anda', 'bisnis whatsapp',
            'perangkat baru', 'jangan berikan', 'akun whatsapp', 'verifikasi whatsapp',
            'kode otp', 'masukkan kode', 'nomor telepon', 'bagikan kode',
            'whatsapp bisnis', 'akan terdaftar', 'orang lain'
        ]
    },
    {
        code: 'EN', name: 'English', flag: '🇬🇧', weight: 90,
        phrases: [
            'your whatsapp code', 'do not share this code', "don't share", 'whatsapp business',
            'new device', 'verification code', 'your code', 'whatsapp account',
            'being registered', 'share this code', 'anyone'
        ]
    },
    {
        code: 'FR', name: 'French', flag: '🇫🇷', weight: 90,
        phrases: [
            'votre code whatsapp', 'ne donnez pas ce code', 'ne partagez pas',
            'nouvel appareil', 'whatsapp business', 'sera enregistré',
            'code de vérification', 'votre compte', 'ne le partagez'
        ]
    },
    {
        code: 'ES', name: 'Spanish', flag: '🇪🇸', weight: 90,
        phrases: [
            'tu código de whatsapp', 'no compartas', 'nuevo dispositivo',
            'whatsapp business', 'será registrado', 'código de verificación',
            'comparte este código', 'nadie'
        ]
    },
    {
        code: 'PT', name: 'Portuguese', flag: '🇵🇹', weight: 90,
        phrases: [
            'seu código do whatsapp', 'não compartilhe', 'novo dispositivo',
            'whatsapp business', 'será registrado', 'código de verificação',
            'compartilhe este código', 'ninguém', 'código whatsapp'
        ]
    },
    {
        code: 'MS', name: 'Malay', flag: '🇲🇾', weight: 90,
        phrases: [
            'kod whatsapp anda', 'jangan kongsikan', 'peranti baharu',
            'whatsapp business', 'akan didaftarkan', 'kod pengesahan',
            'jangan berkongsi', 'sesiapa pun', 'kod'
        ]
    },
    {
        code: 'TL', name: 'Tagalog', flag: '🇵🇭', weight: 90,
        phrases: [
            'iyong whatsapp code', 'huwag ibahagi', 'bagong device',
            'whatsapp business', 'irerehistro', 'verification code',
            'ibahagi ang code', 'sinuman'
        ]
    },
    {
        code: 'VI', name: 'Vietnamese', flag: '🇻🇳', weight: 90,
        phrases: [
            'mã whatsapp của bạn', 'đừng chia sẻ', 'thiết bị mới',
            'whatsapp business', 'sẽ được đăng ký', 'mã xác minh',
            'chia sẻ mã này', 'bất kỳ ai'
        ]
    },
    {
        code: 'TR', name: 'Turkish', flag: '🇹🇷', weight: 90,
        phrases: [
            'whatsapp kodunuz', 'paylaşmayın', 'yeni cihaz',
            'whatsapp business', 'kaydedilecek', 'doğrulama kodu',
            'bu kodu kimseyle'
        ]
    },
];

const LANG_WEIGHTED_KEYWORDS = {
    'id': {
        code: 'ID', name: 'Indonesia', flag: '🇮🇩',
        keywords: [
            { w: 15, k: 'verifikasi' }, { w: 15, k: 'bagikan' }, { w: 15, k: 'perangkat' },
            { w: 15, k: 'whatsapp bisnis' }, { w: 15, k: 'terdaftar' }, { w: 12, k: 'jangan' },
            { w: 12, k: 'akun' }, { w: 12, k: 'bisnis' }, { w: 10, k: 'kode' },
            { w: 10, k: 'nomor' }, { w: 10, k: 'telepon' }, { w: 8, k: 'tidak' },
            { w: 8, k: 'untuk' }, { w: 8, k: 'dengan' }, { w: 8, k: 'sudah' },
            { w: 7, k: 'yang' }, { w: 7, k: 'akan' }, { w: 7, k: 'dari' },
            { w: 7, k: 'anda' }, { w: 7, k: 'orang' }, { w: 7, k: 'baru' },
        ]
    },
    'en': {
        code: 'EN', name: 'English', flag: '🇬🇧',
        keywords: [
            { w: 15, k: 'verification' }, { w: 15, k: 'registered' }, { w: 15, k: 'device' },
            { w: 12, k: 'share' }, { w: 12, k: 'account' }, { w: 12, k: 'business' },
            { w: 12, k: 'anyone' }, { w: 10, k: 'your' }, { w: 10, k: 'code' },
            { w: 10, k: 'this' }, { w: 8, k: 'with' }, { w: 8, k: 'from' },
            { w: 8, k: 'that' }, { w: 7, k: 'have' }, { w: 7, k: 'will' },
            { w: 7, k: 'been' },
        ]
    },
    'fr': {
        code: 'FR', name: 'French', flag: '🇫🇷',
        keywords: [
            { w: 15, k: 'vérification' }, { w: 15, k: 'appareil' }, { w: 15, k: 'enregistré' },
            { w: 15, k: 'partagez' }, { w: 12, k: 'votre' }, { w: 12, k: 'compte' },
            { w: 12, k: 'personne' }, { w: 12, k: 'donnez' }, { w: 10, k: 'nouveau' },
            { w: 10, k: 'sera' }, { w: 8, k: 'pour' }, { w: 8, k: 'avec' },
            { w: 8, k: 'vous' }, { w: 8, k: 'code' },
        ]
    },
    'es': {
        code: 'ES', name: 'Spanish', flag: '🇪🇸',
        keywords: [
            { w: 15, k: 'verificación' }, { w: 15, k: 'dispositivo' }, { w: 15, k: 'registrado' },
            { w: 15, k: 'compartir' }, { w: 12, k: 'nadie' }, { w: 12, k: 'cuenta' },
            { w: 12, k: 'código' }, { w: 10, k: 'nuevo' }, { w: 10, k: 'será' },
            { w: 8, k: 'usted' }, { w: 8, k: 'negocio' }, { w: 8, k: 'comparte' },
        ]
    },
    'pt': {
        code: 'PT', name: 'Portuguese', flag: '🇵🇹',
        keywords: [
            { w: 15, k: 'verificação' }, { w: 15, k: 'dispositivo' }, { w: 15, k: 'registrado' },
            { w: 15, k: 'compartilhe' }, { w: 15, k: 'ninguém' }, { w: 15, k: 'você' },
            { w: 15, k: 'código' }, { w: 12, k: 'conta' }, { w: 12, k: 'compartilhar' },
            { w: 10, k: 'novo' }, { w: 10, k: 'será' }, { w: 10, k: 'negócio' },
        ]
    },
    'ms': {
        code: 'MS', name: 'Malay', flag: '🇲🇾',
        keywords: [
            { w: 15, k: 'pengesahan' }, { w: 15, k: 'peranti' }, { w: 15, k: 'didaftarkan' },
            { w: 15, k: 'kongsikan' }, { w: 15, k: 'sesiapa' }, { w: 12, k: 'akaun' },
            { w: 12, k: 'baharu' }, { w: 12, k: 'perniagaan' }, { w: 12, k: 'nombor' },
            { w: 10, k: 'telefon' }, { w: 10, k: 'kerana' }, { w: 10, k: 'boleh' },
            { w: 10, k: 'kongsi' }, { w: 8, k: 'anda' },
        ]
    },
};

const COUNTRY_LANG_FALLBACK = {
    'indonesia': { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
    'senegal': { code: 'FR', name: 'French', flag: '🇫🇷' },
    'cameroon': { code: 'FR', name: 'French', flag: '🇫🇷' },
    'mozambique': { code: 'PT', name: 'Portuguese', flag: '🇵🇹' },
    'togo': { code: 'FR', name: 'French', flag: '🇫🇷' },
    'benin': { code: 'FR', name: 'French', flag: '🇫🇷' },
    'ecuador': { code: 'ES', name: 'Spanish', flag: '🇪🇸' },
    'timor': { code: 'PT', name: 'Portuguese', flag: '🇵🇹' },
    'madagascar': { code: 'FR', name: 'French', flag: '🇫🇷' },
    'gabon': { code: 'FR', name: 'French', flag: '🇫🇷' },
    'malaysia': { code: 'MS', name: 'Malay', flag: '🇲🇾' },
    'singapore': { code: 'EN', name: 'English', flag: '🇬🇧' },
    'philippines': { code: 'TL', name: 'Tagalog', flag: '🇵🇭' },
    'brazil': { code: 'PT', name: 'Portuguese', flag: '🇵🇹' },
    'france': { code: 'FR', name: 'French', flag: '🇫🇷' },
    'spain': { code: 'ES', name: 'Spanish', flag: '🇪🇸' },
    'usa': { code: 'EN', name: 'English', flag: '🇬🇧' },
    'uk': { code: 'EN', name: 'English', flag: '🇬🇧' },
};

function detectLanguage(text) {
    const defaultResult = { code: 'UN', name: 'Unknown', flag: '🌐' };
    if (!text || typeof text !== 'string' || text.length < 3) return defaultResult;

    try {
        const textLower = text.toLowerCase();

        for (const script of UNICODE_SCRIPTS) {
            if (script.regex.test(text)) {
                return { code: script.code, name: script.name, flag: script.flag };
            }
        }

        let phraseScores = {};
        for (const lang of WA_OTP_PHRASES) {
            let score = 0;
            for (const phrase of lang.phrases) {
                if (textLower.includes(phrase.toLowerCase())) {
                    score += lang.weight;
                }
            }
            if (score > 0) {
                phraseScores[lang.code] = { score, name: lang.name, flag: lang.flag };
            }
        }

        if (Object.keys(phraseScores).length > 0) {
            const sorted = Object.entries(phraseScores).sort((a, b) => b[1].score - a[1].score);
            const [topCode, topData] = sorted[0];
            if (sorted.length === 1 || topData.score >= sorted[1][1].score * 1.5) {
                return { code: topCode, name: topData.name, flag: topData.flag };
            }
        }

        let kwScores = {};
        for (const [langKey, langData] of Object.entries(LANG_WEIGHTED_KEYWORDS)) {
            let score = 0;
            for (const { w, k } of langData.keywords) {
                let found = false;
                if (k.length <= 5) {
                    found = new RegExp('\\b' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i').test(textLower);
                } else {
                    found = textLower.includes(k.toLowerCase());
                }
                if (found) score += w;
            }
            if (score > 0) {
                kwScores[langKey] = { score, code: langData.code, name: langData.name, flag: langData.flag };
            }
        }

        if (Object.keys(kwScores).length > 0) {
            const sorted = Object.entries(kwScores).sort((a, b) => b[1].score - a[1].score);
            const [topKey, topData] = sorted[0];
            if (topData.score >= 10) {
                return { code: topData.code, name: topData.name, flag: topData.flag };
            }
        }

        return defaultResult;

    } catch (error) {
        return defaultResult;
    }
}

function detectLangObjFromCountry(countryName) {
    if (!countryName) return null;
    try {
        const lower = countryName.toLowerCase().trim();
        for (const [key, langData] of Object.entries(COUNTRY_LANG_FALLBACK)) {
            if (lower.includes(key)) return langData;
        }
        return null;
    } catch (e) {
        return null;
    }
}

// ============================================================
// COUNTRY / FLAG HELPERS
// ============================================================
function getCountryIso(countryName) {
    if (!countryName) return null;
    try {
        const iso = countryEmoji.code(countryName);
        if (iso) return iso.toUpperCase();
    } catch (e) {}

    const nameMap = {
        "indonesia":"ID","senegal":"SN","mozambique":"MZ","togo":"TG",
        "cameroon":"CM","benin":"BJ","ecuador":"EC","timor-leste":"TL",
        "madagascar":"MG","gabon":"GA","malaysia":"MY","singapore":"SG",
        "philippines":"PH","thailand":"TH","vietnam":"VN","india":"IN",
        "nigeria":"NG","ghana":"GH","kenya":"KE","brazil":"BR","russia":"RU",
        "china":"CN","japan":"JP","south korea":"KR","france":"FR",
        "spain":"ES","germany":"DE","italy":"IT","turkey":"TR","egypt":"EG",
        "saudi arabia":"SA","uae":"AE","south africa":"ZA","australia":"AU",
        "uk":"GB","usa":"US","canada":"CA"
    };
    return nameMap[countryName.toLowerCase().trim()] || null;
}

function getShortCountryName(isoCode) {
    if (!isoCode) return "Unknown";
    try { return countryEmoji.name(isoCode) || isoCode; } catch (e) { return isoCode; }
}

function getFlagForCountryId(countryId) {
    const c = getCountries().find(c => c.id === countryId);
    if (!c) return EMOJI.FLAG_UNKNOWN;
    const iso = c.isoCode || getCountryIso(c.name);
    return getFlagEmojiHtml(iso);
}

function getCountryIsoById(countryId) {
    const c = getCountries().find(c => c.id === countryId);
    if (!c) return null;
    return c.isoCode || getCountryIso(c.name);
}

function getServiceName(serviceId) {
    const s = getServices().find(s => s.id === serviceId);
    return s ? s.name : "Unknown";
}

function getCountryName(countryId) {
    const c = getCountries().find(c => c.id === countryId);
    return c ? c.name : "Unknown";
}

function getCountryIsoByNumber(phoneNumber) {
    try {
        const parsed = parsePhoneNumber("+" + String(phoneNumber).replace(/[^0-9]/g, ""));
        if (parsed && parsed.country) return parsed.country;
    } catch (e) {}
    return null;
}

// ============================================================
// EXTRACT OTP
// ============================================================
function extractOTP(message) {
    if (!message) return null;

    let cleanMsg = message.replace(/\n/g, ' ').replace(/\s+/g, ' ');
    cleanMsg = cleanMsg.replace(/^#\s*/, '');
    cleanMsg = cleanMsg.replace(/\s+[a-zA-Z0-9]{6,}$/, '');
    cleanMsg = cleanMsg.replace(/(\d)n(\d)/g, '$1$2');
    cleanMsg = cleanMsg.replace(/(\d)\s*n\s*(\d)/g, '$1$2');

    const patterns = [
        /\b(\d{3}-\d{3})(?![a-zA-Z0-9])/,
        /\b(\d{3}-\d{3})\s*[a-zA-Z]?\b/,
        /\b(\d{6})(?![a-zA-Z0-9])/,
        /\b(\d{3}\s\d{3})\b/,
        /Kode WhatsApp[:\s]+(\d{3}-\d{3})/i,
        /WhatsApp.*?(\d{3}-\d{3})/i,
        /OTP[:\s]+(\d{3}-\d{3})/i,
        /KODE[:\s]+(\d{3}-\d{3})/i,
        /CODE[:\s]+(\d{3}-\d{3})/i,
        /PIN[:\s]+(\d{3}-\d{3})/i,
        /verifikasi[:\s]+(\d{4,8})/i,
        /verification[:\s]+(\d{4,8})/i,
        /code\s+(\d{3}-\d{3})/i,
        /WhatsApp.*code\s+(\d{3}-\d{3})/i,
        /\b(\d{4,8})\b/,
    ];

    for (const pattern of patterns) {
        const match = cleanMsg.match(pattern);
        if (match) {
            let result = match[1];
            result = result.replace(/[^0-9-]/g, '');
            if (result.includes('-')) {
                const parts = result.split('-');
                if (parts.length === 2 && parts[0].length === 3 && parts[1].length === 3) {
                    return result;
                }
                result = result.replace(/-/g, '');
            }
            if (/^\d{4,8}$/.test(result) || /^\d{6}$/.test(result)) {
                return result;
            }
        }
    }
    return null;
}

// ============================================================
// FORMAT NUMBER INTERNASIONAL
// ============================================================
function formatInternationalNumber(number) {
    const clean = String(number).replace(/[^0-9]/g, '');
    if (!clean) return number;
    
    if (!String(number).startsWith('+')) {
        return `+${clean}`;
    }
    return String(number);
}

// ============================================================
// SENSOR NUMBER - SENSOR DI TENGAH
// ============================================================
function sensorNumber(number) {
    const clean = String(number).replace(/[^0-9+]/g, '');
    const hasPlus = clean.startsWith('+');
    const digits = hasPlus ? clean.slice(1) : clean;
    
    if (digits.length < 7) return clean;
    
    const head = digits.slice(0, 4);
    const tail = digits.slice(-4);
    const masked = `${head}XXXX${tail}`;
    
    return hasPlus ? `+${masked}` : masked;
}

// ============================================================
// DB HELPERS
// ============================================================
function pick3Numbers(serviceId, countryId) {
    const allNumbers = getNumbers().filter(n => n.serviceId === serviceId && n.countryId === countryId);
    const assigned = getAssigned();
    const usedIds = new Set(assigned.flatMap(a => a.numbers.map(n => n.numberId)));
    const available = allNumbers.filter(n => !usedIds.has(n.id));
    if (available.length === 0) return null;
    for (let i = available.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [available[i], available[j]] = [available[j], available[i]];
    }
    return available.slice(0, Math.min(3, available.length));
}

function getAssignmentByUserId(userId) {
    return getAssigned().find(a => a.userId === userId) || null;
}

function removeAssignment(userId) {
    saveAssigned(getAssigned().filter(a => a.userId !== userId));
}

function createAssignment(userId, numbers, serviceId, countryId) {
    let assigned = getAssigned().filter(a => a.userId !== userId);
    assigned.push({
        userId,
        numbers: numbers.map(n => ({ numberId: n.id, number: n.number })),
        serviceId,
        countryId,
        assignedAt: Date.now(),
        lastChanged: 0,
        msgId: null,
    });
    saveAssigned(assigned);
}

function updateAssignmentMsgId(userId, msgId) {
    const assigned = getAssigned();
    const rec = assigned.find(a => a.userId === userId);
    if (rec) { rec.msgId = msgId; saveAssigned(assigned); }
}

function updateAssignmentNumbers(userId, numbers) {
    const assigned = getAssigned();
    const rec = assigned.find(a => a.userId === userId);
    if (rec) {
        rec.numbers = numbers.map(n => ({ numberId: n.id, number: n.number }));
        rec.lastChanged = Date.now();
        saveAssigned(assigned);
    }
}

function updateAssignmentCountry(userId, countryId) {
    const assigned = getAssigned();
    const rec = assigned.find(a => a.userId === userId);
    if (rec) { rec.countryId = countryId; saveAssigned(assigned); }
}

function deleteNumberFromDb(numberId) {
    saveNumbers(getNumbers().filter(n => n.id !== numberId));
}

function addUserToList(userId, username, firstName) {
    const users = getUsers();
    const existing = users.find(u => u.id === userId);
    if (!existing) {
        users.push({ id: userId, username: username || "Unknown", firstName: firstName || "Unknown", joinedAt: Date.now() });
    } else {
        existing.username = username || existing.username;
        existing.firstName = firstName || existing.firstName;
    }
    saveUsers(users);
}

function getUsernameById(userId) {
    const u = getUsers().find(u => u.id === userId);
    return u ? (u.username || u.firstName || String(userId)) : String(userId);
}

// ============================================================
// BOT SETUP
// ============================================================
const bot = new Telegraf(BOT_TOKEN);
bot.use(session());
bot.use((ctx, next) => { if (!ctx.session) ctx.session = {}; return next(); });

const isOwner = (id) => {
    const userId = Number(id);
    return OWNER_IDS.some(ownerId => Number(ownerId) === userId);
};

function esc(str = "") {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const delay = (ms) => new Promise(r => setTimeout(r, ms));

let activeTimeouts = new Set();
function addTimeout(cb, ms) {
    const id = setTimeout(() => { activeTimeouts.delete(id); cb(); }, ms);
    activeTimeouts.add(id);
    return id;
}

async function deleteMessage(chatId, messageId, delayMs = 0) {
    if (delayMs > 0) {
        addTimeout(async () => {
            try { if (messageId) await bot.telegram.deleteMessage(chatId, messageId); } catch (e) {}
        }, delayMs);
    } else {
        try { if (messageId) await bot.telegram.deleteMessage(chatId, messageId); } catch (e) {}
    }
}

// ============================================================
// KEYBOARD BUILDERS
// ============================================================
function rawKeyboard(rows) { return { reply_markup: { inline_keyboard: rows } }; }

function cbBtnWithIcon(text, data, emojiId, style = null) {
    const btn = { text, callback_data: data };
    if (emojiId) btn.icon_custom_emoji_id = emojiId;
    if (style) btn.style = style;
    return btn;
}

function urlBtnWithIcon(text, url, emojiId, style = null) {
    const btn = { text, url };
    if (emojiId) btn.icon_custom_emoji_id = emojiId;
    if (style) btn.style = style;
    return btn;
}

function copyBtnWithIcon(text, copyText, emojiId, style = null) {
    const btn = { text, copy_text: { text: String(copyText) } };
    if (emojiId) btn.icon_custom_emoji_id = emojiId;
    if (style) btn.style = style;
    return btn;
}

// ============================================================
// KEYBOARDS
// ============================================================
function customMainKeyboard() {
    return {
        reply_markup: {
            keyboard: [
                [
                    { 
                        text: "Get Number Now", 
                        style: "primary",
                        icon_custom_emoji_id: EMOJI_BTN.GET_NUMBER
                    },
                    { 
                        text: "Check OTP", 
                        style: "success",
                        icon_custom_emoji_id: EMOJI_BTN.OTP
                    }
                ],
                [
                    { 
                        text: "Cek Traffic", 
                        style: "primary",
                        icon_custom_emoji_id: EMOJI_BTN.BOLT
                    },
                    { 
                        text: "Get File", 
                        style: "primary",
                        icon_custom_emoji_id: EMOJI_BTN.FILE
                    }
                ],
                [
                    { 
                        text: "Panel Status", 
                        style: "primary",
                        icon_custom_emoji_id: EMOJI_BTN.REFRESH
                    }
                ]
            ],
            resize_keyboard: true,
            one_time_keyboard: false,
            persistent: true,
        },
    };
}

function countryListKeyboard(countries) {
    const rows = countries.map(c => {
        const iso = c.isoCode || getCountryIso(c.name);
        const flagId = getFlagEmojiId(iso);
        return [{ 
            text: c.name, 
            style: "primary",
            icon_custom_emoji_id: flagId
        }];
    });
    rows.push([{ 
        text: "Menu Utama", 
        style: "danger",
        icon_custom_emoji_id: EMOJI_BTN.HAPUS
    }]);
    return {
        reply_markup: {
            keyboard: rows,
            resize_keyboard: true,
            one_time_keyboard: false,
            persistent: true,
        }
    };
}

function joinKeyboard() {
    const config = require("./config.json");
    return rawKeyboard([
        [urlBtnWithIcon("Channel Official", config.REQUIRED_CHANNEL_LINK, EMOJI_BTN.ALERT, "primary")],
        [urlBtnWithIcon("Group Official 1", config.REQUIRED_GROUP1_LINK, EMOJI_BTN.WS, "primary")],
        [urlBtnWithIcon("Group Official 2", config.REQUIRED_GROUP2_LINK, EMOJI_BTN.WS, "primary")],
        [urlBtnWithIcon("Number Channel", config.REQUIRED_NUMBER_CHANNEL_LINK, EMOJI_BTN.GET_NUMBER, "primary")],
        [urlBtnWithIcon("Group OTP", config.REQUIRED_OTP_GROUP_LINK, EMOJI_BTN.GRUP_OTP, "primary")],
        [cbBtnWithIcon("Validasi Akses", "validate_join", EMOJI_BTN.CHECK, "success")],
    ]);
}

function serviceKeyboard() {
    const services = getServices();
    if (services.length === 0) {
        return rawKeyboard([[cbBtnWithIcon("Belum ada service tersedia", "noop", EMOJI_BTN.WARNING, "danger")]]);
    }
    const rows = services.map(s => [cbBtnWithIcon(s.name, `sel_service_${s.id}`, EMOJI_BTN.SERVICE, "primary")]);
    rows.push([cbBtnWithIcon("Back", "back_main", EMOJI_BTN.HAPUS, "danger")]);
    return rawKeyboard(rows);
}

function countryKeyboard(serviceId) {
    const countries = getCountries();
    if (countries.length === 0) {
        return rawKeyboard([[cbBtnWithIcon("Belum ada negara tersedia", "noop", EMOJI_BTN.WARNING, "danger")]]);
    }
    const rows = countries.map(c => {
        const iso = c.isoCode || getCountryIso(c.name);
        const flagId = getFlagEmojiId(iso);
        return [cbBtnWithIcon(c.name, `sel_country_${serviceId}_${c.id}`, flagId, "primary")];
    });
    rows.push([cbBtnWithIcon("⬅️ Back", "sel_service_back", EMOJI_BTN.HAPUS, "danger")]);
    return rawKeyboard(rows);
}

function assignedKeyboard(userId, numbers) {
    const rows = numbers.map(n => [copyBtnWithIcon(n.number, n.number, EMOJI_BTN.GET_NUMBER, "primary")]);
    const allNums = numbers.map(n => n.number).join("\n");
    rows.push([
        copyBtnWithIcon("Copy All Number", allNums, EMOJI_BTN.FILE, "success"),
        cbBtnWithIcon("Ganti Nomor", `change_num_${userId}`, EMOJI_BTN.REFRESH, "danger"),
    ]);
    rows.push([cbBtnWithIcon("Change Country", `change_country_${userId}`, EMOJI_BTN.FLAG_UNKNOWN, "primary")]);
    rows.push([urlBtnWithIcon("View OTP Group", config.REQUIRED_OTP_GROUP_LINK, EMOJI_BTN.GRUP_OTP, "success")]);
    rows.push([cbBtnWithIcon("Menu Utama", "back_main", EMOJI_BTN.HAPUS, "danger")]);
    return rawKeyboard(rows);
}

function otpReceivedKeyboard(otpCode) {
    const rows = [];
    if (otpCode) rows.push([copyBtnWithIcon(`${otpCode}`, otpCode, EMOJI_BTN.OTP, "success")]);
    rows.push([urlBtnWithIcon("Get Number", config.GET_NUMBER_LINK, EMOJI_BTN.GET_NUMBER, "success")]);
    rows.push([urlBtnWithIcon("View OTP Group", config.REQUIRED_OTP_GROUP_LINK, EMOJI_BTN.GRUP_OTP, "primary")]);
    return rawKeyboard(rows);
}

function otpGroupKeyboardFull(otpCode) {
    const rows = [];
    const row1 = [];
    if (otpCode) {
        row1.push(copyBtnWithIcon(`OTP: ${otpCode}`, otpCode, EMOJI_BTN.OTP, "success"));
    }
    row1.push(urlBtnWithIcon("Channel", config.REQUIRED_CHANNEL_LINK, EMOJI_BTN.ALERT, "primary"));
    rows.push(row1);
    rows.push([urlBtnWithIcon("Get Number", config.GET_NUMBER_LINK, EMOJI_BTN.GET_NUMBER, "danger")]);
    return rawKeyboard(rows);
}

// ============================================================
// CONFIG
// ============================================================
const config = {
    BOT_TOKEN: BOT_TOKEN,
    OWNER_IDS: OWNER_IDS,
    BANNER_IMAGE: "https://qu.ax/dpAY1",
    BOT_USERNAME: "apocalypseotpbot",
    
    REQUIRED_CHANNEL_ID: "-1002754399777",
    REQUIRED_CHANNEL_LINK: "https://t.me/anggazyy66x",
    REQUIRED_GROUP1_ID: "-1003953572287",
    REQUIRED_GROUP1_LINK: "https://t.me/checkbiobotwa",
    REQUIRED_GROUP2_ID: "-1003727603800",
    REQUIRED_GROUP2_LINK: "https://t.me/allmonitoringbotfixmerah",
    REQUIRED_NUMBER_CHANNEL_ID: "-1004432986475",
    REQUIRED_NUMBER_CHANNEL_LINK: "https://t.me/+Tyn_CVfACnxmODY1",
    REQUIRED_OTP_GROUP_ID: "-1003839202661",
    REQUIRED_OTP_GROUP_LINK: "https://t.me/apocalypseotp",
    OTP_FORWARD_GROUP: "-1003839202661",
    GET_NUMBER_LINK: "https://t.me/+Tyn_CVfACnxmODY1",
    OTP_POLL_INTERVAL_MS: 5000,
    CHANGE_COOLDOWN_MS: 10000,
    OTP_DELETE_TIMER_MS: 3600000,
    OTP_GROUP_DELETE_MS: 300000,
};

// ============================================================
// CAPTIONS
// ============================================================
function captionAccessDenied() {
    return `<b>AKSES DITOLAK</b>\n\nKamu harus bergabung ke semua channel & group resmi terlebih dahulu:\n\n✅ Channel Official\n✅ Group Official 1\n✅ Group Official 2\n✅ Number Channel\n✅ Group OTP\n\n👇 Klik tombol di bawah untuk bergabung:`;
}

function captionGroupNotAllowed() {
    return `<b>PERINGATAN</b>\n\nBot tidak bisa digunakan di GROUP!\nGunakan di <b>PRIVATE CHAT</b>.`;
}

function captionWelcome(username, userId) {
    return `<b>SELAMAT DATANG</b>\n\n<b>👤 Welcome</b> : @${esc(username)}\n<b>🆔 User ID</b>  : <code>${userId}</code>\n<b>✅ Status</b>  : Member Terverifikasi\n\n<b>📌 INFO:</b>\n─▢ Klik <b>Get Number Now</b> di bawah untuk mulai.\n─▢ Nomor aktif hingga OTP diterima.\n─▢ Kode OTP akan otomatis dikirim saat masuk.`;
}

function captionSelectService() {
    return `<b>PILIH SERVICE</b>\n\nPilih layanan yang ingin kamu gunakan:`;
}

function captionSelectCountry(serviceName) {
    return `<b>PILIH NEGARA</b>\n\nService : <b>${esc(serviceName)}</b>\n\nPilih negara asal nomor yang ingin digunakan:`;
}

function captionAssigned(assignment) {
    const flag = getFlagForCountryId(assignment.countryId);
    const isoCode = getCountryIsoById(assignment.countryId) || "??";
    const serviceName = getServiceName(assignment.serviceId);

    let numbersDisplay = "";
    for (const n of assignment.numbers) numbersDisplay += `\n<code>${n.number}</code>`;

    return `${flag} <b>${isoCode} | ${esc(serviceName)}</b>\n\n<b>Nomor Aktif:</b>${numbersDisplay}\n\n<b>Waiting for Code...</b>`;
}

function captionOtpForUser(number, otpCode, flag, countryName, serviceName, panelName, language) {
    const masked = sensorNumber(number);
    const langDisplay = language && language.code !== 'UN' ? `${language.flag} ${language.name}` : '';
    return `${flag} <b>${esc(countryName)}</b> | <b>${esc(serviceName)}</b>\n<b>Panel</b> : ${esc(panelName)}\n<b>Nomor</b> : <code>${masked}</code>\n${langDisplay ? `<b>Language</b> : ${langDisplay}\n` : ''}<b>OTP</b> : <code>${otpCode || "—"}</code>\n\n<i>Nomor akan otomatis dihapus dalam 60 menit.</i>`;
}

function captionOtpForGroupMatched(userId, username, number, otpCode, flag, isoCode, countryName, serviceName, syncedAt, panelName, language, smsContent) {
    const flagHtml = flag || EMOJI.FLAG_UNKNOWN;
    const countryTag = `#${(isoCode || countryName.toUpperCase().substring(0, 2))}`;
    const platform = serviceName.toLowerCase().includes("whatsapp") ? EMOJI.WS : EMOJI.MESSAGE;
    
    let languageName = 'Unknown';
    if (language && language.code !== 'UN' && language.name) {
        languageName = language.name;
    } else if (countryName && countryName !== 'Unknown') {
        const langFromCountry = detectLangObjFromCountry(countryName);
        languageName = langFromCountry ? langFromCountry.name : 'Unknown';
    }
    const languageTag = `#${languageName}`;
    
    const maskedNumber = sensorNumber(number);
    
    const header = `${flagHtml} ${countryTag} | ${platform} ${maskedNumber} | ${languageTag}`;
    
    let cleanContent = smsContent || '';
    if (otpCode && cleanContent) {
        cleanContent = cleanContent.replace(otpCode, '••••••');
        cleanContent = cleanContent.replace(otpCode.replace('-', ''), '••••••');
    }
    const blockquote = cleanContent ? `\n\n<blockquote>${esc(cleanContent)}</blockquote>` : '';
    
    return `${header}${blockquote}`;
}

function captionOtpForGroupUnmatched(number, otpCode, flag, isoCode, countryName, serviceName, syncedAt, panelName, language, smsContent) {
    const flagHtml = flag || EMOJI.FLAG_UNKNOWN;
    const countryTag = `#${(isoCode || countryName.toUpperCase().substring(0, 2))}`;
    const platform = serviceName.toLowerCase().includes("whatsapp") ? EMOJI.WS : EMOJI.MESSAGE;
    
    let languageName = 'Unknown';
    if (language && language.code !== 'UN' && language.name) {
        languageName = language.name;
    } else if (countryName && countryName !== 'Unknown') {
        const langFromCountry = detectLangObjFromCountry(countryName);
        languageName = langFromCountry ? langFromCountry.name : 'Unknown';
    }
    const languageTag = `#${languageName}`;
    
    const maskedNumber = sensorNumber(number);
    
    const header = `${flagHtml} ${countryTag} | ${platform} ${maskedNumber} | ${languageTag}`;
    
    let cleanContent = smsContent || '';
    if (otpCode && cleanContent) {
        cleanContent = cleanContent.replace(otpCode, '••••••');
        cleanContent = cleanContent.replace(otpCode.replace('-', ''), '••••••');
    }
    const blockquote = cleanContent ? `\n\n<blockquote>${esc(cleanContent)}</blockquote>` : '';
    
    return `${header}${blockquote}`;
}

// ============================================================
// MEMBERSHIP CHECK
// ============================================================
async function checkFullMembership(telegram, userId) {
    if (isOwner(userId)) return true;

    try {
        const checks = await Promise.all([
            telegram.getChatMember(config.REQUIRED_CHANNEL_ID, userId).catch(() => null),
            telegram.getChatMember(config.REQUIRED_GROUP1_ID, userId).catch(() => null),
            telegram.getChatMember(config.REQUIRED_GROUP2_ID, userId).catch(() => null),
            telegram.getChatMember(config.REQUIRED_NUMBER_CHANNEL_ID, userId).catch(() => null),
            telegram.getChatMember(config.REQUIRED_OTP_GROUP_ID, userId).catch(() => null),
        ]);

        const ok = m => m && ["member", "administrator", "creator"].includes(m.status);
        return ok(checks[0]) && ok(checks[1]) && ok(checks[2]) && ok(checks[3]) && ok(checks[4]);
    } catch (e) {
        return false;
    }
}

// ============================================================
// ANTI-FLOOD
// ============================================================
const floodMap = new Map();
const FLOOD_INTERVAL = 2000;

function checkFlood(userId) {
    const now = Date.now();
    const last = floodMap.get(userId) || 0;
    if (now - last < FLOOD_INTERVAL) return true;
    floodMap.set(userId, now);
    return false;
}

// ============================================================
// PROCESS OTP SMS
// ============================================================
async function processOtpSms(sms) {
    try {
        const incomingNumber = String(sms.number || "").replace(/\s/g, "");
        if (!incomingNumber) return;

        const assigned = getAssigned();
        let targetAssignment = null;
        let targetNumRecord = null;

        for (const a of assigned) {
            for (const n of a.numbers) {
                const normDb = n.number.replace(/[^0-9]/g, "");
                const normIncoming = incomingNumber.replace(/[^0-9]/g, "");
                if (normDb === normIncoming || normDb.endsWith(normIncoming) || normIncoming.endsWith(normDb)) {
                    targetAssignment = a;
                    targetNumRecord = n;
                    break;
                }
            }
            if (targetAssignment) break;
        }

        const otpCode = sms.otp;
        const rawNumber = targetNumRecord ? targetNumRecord.number : incomingNumber;
        const panelName = sms.panel || "IVAS";
        const smsContent = sms.sms || '';

        let flag = EMOJI.FLAG_UNKNOWN;
        let isoCode = null;
        let countryName = "Unknown";
        let serviceName = sms.cli || "Unknown";

        if (targetAssignment) {
            flag = getFlagForCountryId(targetAssignment.countryId);
            isoCode = getCountryIsoById(targetAssignment.countryId);
            countryName = getCountryName(targetAssignment.countryId);
            serviceName = getServiceName(targetAssignment.serviceId);
        } else {
            isoCode = getCountryIsoByNumber(incomingNumber) || sms.countryIso || null;
            flag = getFlagEmojiHtml(isoCode);
            if (isoCode) countryName = getShortCountryName(isoCode) || countryName;
            if (sms.range && sms.range.includes(' ')) {
                const parts = sms.range.split(' ');
                if (parts.length > 0) countryName = parts[0];
            }
        }

        let language = { code: 'UN', name: 'Unknown', flag: '🌐' };
        try {
            if (sms.sms && sms.sms.length > 3) {
                const detected = detectLanguage(sms.sms);
                if (detected && detected.code !== 'UN') {
                    language = detected;
                }
            }
            
            if (language.code === 'UN' && countryName && countryName !== 'Unknown') {
                const langFromCountry = detectLangObjFromCountry(countryName);
                if (langFromCountry) {
                    language = langFromCountry;
                }
            }
        } catch (e) {
            language = { code: 'UN', name: 'Unknown', flag: '🌐' };
        }

        const displayNumber = formatInternationalNumber(rawNumber);

        // Save logs
        const otpLogs = getOtpLogs();
        otpLogs.push({
            date: sms.date || new Date().toISOString().replace('T', ' ').slice(0, 19),
            number: displayNumber,
            panel: panelName,
            countryName: countryName,
            isoCode: isoCode || "??",
            flag: flag,
            service: serviceName,
            otp: otpCode || "—",
            language: language.code || 'UN',
            assigned: !!targetAssignment,
            userId: targetAssignment ? targetAssignment.userId : null,
            uniqueKey: sms.uniqueKey
        });
        saveOtpLogs(otpLogs);

        // SEND TO GROUP
        let groupMsg;
        if (targetAssignment) {
            const username = getUsernameById(targetAssignment.userId);
            groupMsg = captionOtpForGroupMatched(
                targetAssignment.userId, username, displayNumber, otpCode,
                flag, isoCode, countryName, serviceName, sms.date, panelName, language, smsContent
            );
        } else {
            groupMsg = captionOtpForGroupUnmatched(
                displayNumber, otpCode, flag, isoCode, countryName, serviceName, sms.date, panelName, language, smsContent
            );
        }

        const groupKb = otpGroupKeyboardFull(otpCode);

        try {
            const sentMsg = await bot.telegram.sendMessage(config.OTP_FORWARD_GROUP, groupMsg, {
                parse_mode: "HTML",
                disable_web_page_preview: true,
                ...groupKb,
            });
            console.log(chalk.green(`✅ OTP terkirim ke group: ${otpCode || 'no code'}`));
            
            if (sentMsg && sentMsg.message_id) {
                setTimeout(async () => {
                    try {
                        await bot.telegram.deleteMessage(config.OTP_FORWARD_GROUP, sentMsg.message_id);
                        console.log(chalk.gray(`🗑️ Deleted OTP message from group after 3 minutes`));
                    } catch (e) {}
                }, config.OTP_GROUP_DELETE_MS);
            }
        } catch (e) {
            console.log(chalk.red(`❌ Gagal kirim ke group: ${e.message}`));
        }

        // SEND TO USER
        if (targetAssignment && targetNumRecord) {
            const userMsg = captionOtpForUser(displayNumber, otpCode, flag, countryName, serviceName, panelName, language);
            const userKb = otpReceivedKeyboard(otpCode);
            try {
                await bot.telegram.sendMessage(
                    targetAssignment.userId,
                    userMsg,
                    { parse_mode: "HTML", disable_web_page_preview: true, ...userKb }
                );
                console.log(chalk.green(`✅ OTP terkirim ke user ${targetAssignment.userId}`));
            } catch (e) {
                console.log(chalk.red(`❌ Gagal kirim ke user: ${e.message}`));
            }

            const capturedNumRecord = targetNumRecord;
            const capturedUserId = targetAssignment.userId;

            setTimeout(async () => {
                if (capturedNumRecord) {
                    deleteNumberFromDb(capturedNumRecord.numberId);
                }
                removeAssignment(capturedUserId);
                console.log(chalk.gray(`🗑️ Deleted number after 1 hour`));
            }, config.OTP_DELETE_TIMER_MS);
        }

    } catch (error) {
        console.log(chalk.red(`❌ Process OTP error: ${error.message}`));
    }
}

// ============================================================
// BOT COMMANDS
// ============================================================
bot.start(async (ctx) => {
    const userId = ctx.from.id;
    const username = ctx.from.username || ctx.from.first_name || "Unknown";
    const chatType = ctx.chat.type;
    const firstName = ctx.from.first_name || "";

    addUserToList(userId, username, firstName);

    if (chatType !== "private") {
        const msg = await ctx.reply(captionGroupNotAllowed(), { parse_mode: "HTML" });
        deleteMessage(ctx.chat.id, msg.message_id, 30000);
        return;
    }

    const isMember = await checkFullMembership(ctx.telegram, userId);
    if (!isMember) {
        return ctx.replyWithPhoto(config.BANNER_IMAGE, {
            caption: captionAccessDenied(),
            parse_mode: "HTML",
            ...joinKeyboard(),
        });
    }

    return ctx.replyWithPhoto(config.BANNER_IMAGE, {
        caption: captionWelcome(username, userId),
        parse_mode: "HTML",
        ...customMainKeyboard(),
    });
});

bot.command("adds", async (ctx) => {
    const userId = ctx.from.id;
    if (!isOwner(userId)) return ctx.reply("❌ Command ini hanya untuk owner.");

    const args = ctx.message.text.split(" ").slice(1).join(" ").trim();
    if (!args) return ctx.reply("❌ Format: /adds <nama service>\n\nContoh: /adds WhatsApp");

    const services = getServices();
    if (services.some(s => s.name.toLowerCase() === args.toLowerCase())) {
        return ctx.reply(`❌ Service "${args}" sudah ada.`);
    }

    const newId = services.length > 0 ? Math.max(...services.map(s => s.id)) + 1 : 1;
    services.push({ id: newId, name: args });
    saveServices(services);

    await ctx.reply(`✅ Service <b>${esc(args)}</b> berhasil ditambahkan!\n\n📋 ID: <code>${newId}</code>`, { parse_mode: "HTML" });
    console.log(chalk.green(`[ADMIN] /adds: ${args} (ID: ${newId}) by ${userId}`));
});

bot.command("createc", async (ctx) => {
    const userId = ctx.from.id;
    if (!isOwner(userId)) return ctx.reply("❌ Command ini hanya untuk owner.");

    const args = ctx.message.text.split(" ").slice(1).join(" ").trim();
    if (!args) return ctx.reply("❌ Format: /createc <nama negara>\n\nContoh: /createc Indonesia");

    const countries = getCountries();
    if (countries.some(c => c.name.toLowerCase() === args.toLowerCase())) {
        return ctx.reply(`❌ Negara "${args}" sudah ada.`);
    }

    const isoCode = getCountryIso(args);
    const flag = getFlagEmojiHtml(isoCode);
    const newId = countries.length > 0 ? Math.max(...countries.map(c => c.id)) + 1 : 1;
    countries.push({ id: newId, name: args, flag: flag, isoCode: isoCode || null });
    saveCountries(countries);

    await ctx.reply(`✅ ${flag} <b>${esc(args)}</b> berhasil ditambahkan!\n\n📋 ID: <code>${newId}</code>`, { parse_mode: "HTML" });
    console.log(chalk.green(`[ADMIN] /createc: ${args} (ID: ${newId}, ISO: ${isoCode}) by ${userId}`));
});

bot.command("delc", async (ctx) => {
    const userId = ctx.from.id;
    if (!isOwner(userId)) return ctx.reply("❌ Command ini hanya untuk owner.");

    const args = ctx.message.text.split(" ").slice(1).join("").trim();
    if (!args) {
        return ctx.reply('❌ <b>Format:</b> /delc <idCountry>\n\n📝 <b>Contoh:</b> /delc 1\n\n💡 Gunakan /listall untuk melihat ID country', { parse_mode: "HTML" });
    }

    const countryId = parseInt(args);
    if (isNaN(countryId)) return ctx.reply("❌ ID Country harus berupa angka.\n\nContoh: /delc 1", { parse_mode: "HTML" });

    const countries = getCountries();
    const countryIndex = countries.findIndex(c => c.id === countryId);
    if (countryIndex === -1) return ctx.reply(`❌ Country dengan ID <code>${countryId}</code> tidak ditemukan.`, { parse_mode: "HTML" });

    const country = countries[countryIndex];
    const flag = country.flag || getFlagEmojiHtml(country.isoCode || getCountryIso(country.name));
    const countryName = country.name;

    const numbers = getNumbers();
    const numbersToDelete = numbers.filter(n => n.countryId === countryId);
    const countNumbers = numbersToDelete.length;

    const assigned = getAssigned();
    const affectedAssignments = assigned.filter(a =>
        a.numbers.some(n => numbersToDelete.some(num => num.id === n.numberId))
    );

    let confirmMsg = `⚠️ <b>KONFIRMASI HAPUS COUNTRY</b>\n\n`;
    confirmMsg += `${flag} <b>${esc(countryName)}</b> (ID: <code>${countryId}</code>)\n\n`;
    confirmMsg += `📊 <b>Data yang akan dihapus:</b>\n`;
    confirmMsg += `• Nomor: <b>${countNumbers}</b> nomor\n`;
    confirmMsg += `• Assignment aktif: <b>${affectedAssignments.length}</b> user\n\n`;
    confirmMsg += `❓ Yakin ingin menghapus country ini dan semua nomornya?`;

    const confirmKb = rawKeyboard([
        [cbBtnWithIcon(`✅ YA, HAPUS ${flag} ${esc(countryName)}`, `confirm_delc_${countryId}`, EMOJI_BTN.WARNING, "danger"), 
         cbBtnWithIcon("❌ BATAL", "cancel_delc", EMOJI_BTN.HAPUS, "primary")]
    ]);

    await ctx.reply(confirmMsg, { parse_mode: "HTML", ...confirmKb });
});

bot.command("insertdb", async (ctx) => {
    const userId = ctx.from.id;
    if (!isOwner(userId)) return ctx.reply("❌ Command ini hanya untuk owner.");

    const parts = ctx.message.text.split(" ").slice(1);
    if (parts.length < 2) return ctx.reply("❌ Format: /insertdb <serviceId> <countryId>\n(reply ke file .txt)\n\nContoh: /insertdb 1 1");

    const serviceId = parseInt(parts[0]);
    const countryId = parseInt(parts[1]);
    if (isNaN(serviceId) || isNaN(countryId)) return ctx.reply("❌ serviceId dan countryId harus angka.");

    const reply = ctx.message.reply_to_message;
    if (!reply || !reply.document) return ctx.reply("❌ Reply ke file .txt yang berisi nomor telepon.");

    const fileId = reply.document.file_id;
    const fileInfo = await ctx.telegram.getFile(fileId);
    const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileInfo.file_path}`;

    let fileContent;
    try {
        const res = await fetch(fileUrl);
        fileContent = await res.text();
    } catch (e) {
        return ctx.reply("❌ Gagal download file.");
    }

    const lines = fileContent.split("\n").map(l => l.trim()).filter(l => l.length > 0);
    const numbers = getNumbers();
    let nextId = numbers.length > 0 ? Math.max(...numbers.map(n => n.id)) + 1 : 1;
    let count = 0;

    for (const line of lines) {
        if (!/^[+\d]/.test(line)) continue;
        const clean = line.replace(/\s/g, "");
        if (clean.replace(/[^0-9]/g, '').length < 4) continue;
        const formatted = formatInternationalNumber(clean);
        if (numbers.some(n => n.number === formatted)) continue;
        numbers.push({ id: nextId++, number: formatted, serviceId, countryId });
        count++;
    }

    saveNumbers(numbers);

    const country = getCountries().find(c => c.id === countryId);
    const iso = country ? country.isoCode || getCountryIso(country.name) : null;
    const flag = getFlagEmojiHtml(iso);
    const countryName = country ? country.name : 'Unknown';

    const users = getUsers();
    const broadcastMsg = `${flag} <b>Stock Added!</b>\n\n${flag} ${esc(countryName)}\n📁 <b>Total Insert :</b> ${count}`;
    const broadcastKb = {
        reply_markup: {
            inline_keyboard: [
                [urlBtnWithIcon("Get Number", config.GET_NUMBER_LINK, EMOJI_BTN.GET_NUMBER, "success")]
            ]
        }
    };

    let sent = 0, failed = 0;
    for (const u of users) {
        try {
            await bot.telegram.sendMessage(u.id, broadcastMsg, {
                parse_mode: "HTML",
                ...broadcastKb
            });
            sent++;
            await delay(50);
        } catch (e) { failed++; }
    }

    await ctx.reply(`✅ Berhasil memasukkan <b>${count}</b> nomor!\n\n📢 Broadcast ke ${sent} user (${failed} gagal)`, { parse_mode: "HTML" });
    console.log(chalk.green(`[ADMIN] /insertdb: ${count} numbers to service ${serviceId}, country ${countryId} by ${userId}`));
});

bot.command("listall", async (ctx) => {
    const userId = ctx.from.id;
    if (!isOwner(userId)) return ctx.reply("❌ Command ini hanya untuk owner.");

    const services = getServices();
    const countries = getCountries();
    const numbers = getNumbers();
    const assigned = getAssigned();
    const users = getUsers();

    let msg = "<b>📋 LIST ALL DATA</b>\n\n";
    msg += "<b>🔷 SERVICES:</b>\n";
    if (services.length === 0) msg += "  <i>Belum ada service.</i>\n";
    for (const s of services) {
        const count = numbers.filter(n => n.serviceId === s.id).length;
        msg += `  ID <code>${s.id}</code> → <b>${esc(s.name)}</b> (${count} nomor)\n`;
    }

    msg += "\n<b>🌐 COUNTRIES:</b>\n";
    if (countries.length === 0) msg += "  <i>Belum ada negara.</i>\n";
    for (const c of countries) {
        const iso = c.isoCode || getCountryIso(c.name);
        const flag = getFlagEmojiHtml(iso);
        const count = numbers.filter(n => n.countryId === c.id).length;
        msg += `  ID <code>${c.id}</code> → ${flag} <b>${esc(c.name)}</b> (${count} nomor)\n`;
    }

    msg += `\n📊 TOTAL NOMOR: <code>${numbers.length}</code>`;
    msg += `\n👤 ASSIGNED AKTIF: <code>${assigned.length}</code>`;
    msg += `\n📱 TOTAL USER: <code>${users.length}</code>`;

    await ctx.reply(msg, { parse_mode: "HTML" });
    console.log(chalk.green(`[ADMIN] /listall by ${userId}`));
});

bot.command("panelstatus", async (ctx) => {
    const userId = ctx.from.id;
    if (!isOwner(userId)) return ctx.reply("❌ Command ini hanya untuk owner.");

    const status = ivasSession && ivasSession.authenticated ? "✅ ONLINE" : "❌ OFFLINE";
    const wsStatus = isWsConnected ? "✅ Connected" : "❌ Disconnected";

    let msg = `<b>📋 STATUS PANEL</b>\n\n`;
    msg += `<b>IVAS SMS (i4)</b>\n`;
    msg += `   Status: ${status}\n`;
    msg += `   WebSocket: ${wsStatus}\n`;
    msg += `   URL: https://www.ivasms.com\n\n`;
    msg += `📊 Total Panel: <b>1</b>`;

    await ctx.reply(msg, { parse_mode: "HTML" });
});

bot.command("reloadpanel", async (ctx) => {
    const userId = ctx.from.id;
    if (!isOwner(userId)) return ctx.reply("❌ Command ini hanya untuk owner.");

    const loading = await ctx.reply("⏳ Reload IVAS panel...");

    // Close WebSocket
    if (wsConnection) {
        try { wsConnection.close(); } catch (e) {}
        wsConnection = null;
        isWsConnected = false;
    }

    // Re-login
    const success = await loginIvas();
    if (success) {
        connectIvasWebSocket();
        await ctx.reply("✅ IVAS panel berhasil direload!", { parse_mode: "HTML" });
    } else {
        await ctx.reply("❌ Gagal reload IVAS panel!", { parse_mode: "HTML" });
    }

    await deleteMessage(ctx.chat.id, loading.message_id, 500);
});

bot.command("bc", async (ctx) => {
    const userId = ctx.from.id;
    if (!isOwner(userId)) return ctx.reply("❌ Command ini hanya untuk owner.");

    const text = ctx.message.text.split(" ").slice(1).join(" ").trim();
    if (!text) return ctx.reply("❌ Format: /bc <pesan>\n\nContoh: /bc Selamat pagi semua!");

    const users = getUsers();
    if (users.length === 0) return ctx.reply("❌ Belum ada user terdaftar.");

    const bcText = `<b>Broadcast</b>\n\n${esc(text)}`;
    let sent = 0, failed = 0;

    await ctx.reply(`⏳ Mengirim broadcast ke ${users.length} user...`);

    for (const u of users) {
        try {
            await bot.telegram.sendMessage(u.id, bcText, { parse_mode: "HTML" });
            sent++;
            await delay(50);
        } catch (e) { failed++; }
    }

    await ctx.reply(`✅ <b>Broadcast selesai</b>\n\n📤 Terkirim: <b>${sent}</b> user\n❌ Gagal: <b>${failed}</b> user`, { parse_mode: "HTML" });
    console.log(chalk.green(`[ADMIN] /bc: "${text}" to ${sent} users by ${userId}`));
});

bot.command("cekotp", async (ctx) => {
    const userId = ctx.from.id;

    if (!isOwner(userId)) {
        const isMember = await checkFullMembership(ctx.telegram, userId);
        if (!isMember) {
            return ctx.reply("❌ Akses ditolak! Kamu harus join semua channel & group resmi.\n\nGunakan /start untuk melihat link join.", { parse_mode: "HTML" });
        }
    }

    const args = ctx.message.text.split(" ").slice(1).join("").trim();
    if (!args) {
        return ctx.reply('📌 <b>Cara penggunaan:</b>\n\n<code>/cekotp +62xxxxxxxx</code>\n\n📝 <b>Contoh:</b>\n<code>/cekotp +6281234567890</code>\n\n📌 Mengecek dari panel IVAS', { parse_mode: "HTML" });
    }

    const loading = await ctx.reply("⏳ Sedang mengecek OTP dari IVAS...");

    try {
        const cleanNum = args.replace(/[^0-9]/g, '');
        const results = await fetchIvasSmsRest();
        
        const filtered = results.filter(s => {
            const cleanDest = s.number.replace(/[^0-9]/g, '');
            return cleanDest === cleanNum;
        });

        await deleteMessage(ctx.chat.id, loading.message_id, 500);

        if (filtered.length === 0) {
            return ctx.reply(`❌ <b>Tidak ada SMS ditemukan</b>\n\n📞 Nomor: <code>${formatInternationalNumber(cleanNum)}</code>\n\n💡 Dicek dari panel IVAS`, { parse_mode: "HTML" });
        }

        let result = `<b>HASIL CEK OTP</b>\n`;
        result += `━━━━━━━━━━━━━━━━━━━\n`;
        result += `📞 Nomor: <code>${formatInternationalNumber(cleanNum)}</code>\n`;
        result += `📊 Total SMS: <b>${filtered.length}</b>\n\n`;

        const display = filtered.slice(0, 5);
        for (let i = 0; i < display.length; i++) {
            const sms = display[i];
            const iso = getCountryIsoByNumber(sms.number);
            const flag = getFlagEmojiHtml(iso);
            const langDisplay = sms.language && sms.language.code !== 'UN' ? `${sms.language.flag} ${sms.language.name}` : '🌐 Unknown';
            result += `${i + 1}. ${flag} 🕐 ${sms.date || '-'}\n`;
            result += `   📦 Panel: ${esc(sms.panel)}\n`;
            if (sms.cli) result += `   📤 From: ${sms.cli}\n`;
            result += `   🌐 Language: ${langDisplay}\n`;
            result += `   📨 ${sms.sms.substring(0, 100)}${sms.sms.length > 100 ? '...' : ''}\n`;
            if (sms.otp) result += `   🔑 <b>OTP: <code>${sms.otp}</code></b>\n`;
            result += `   ───\n`;
        }

        if (filtered.length > 5) result += `\n... dan ${filtered.length - 5} SMS lainnya`;

        const latestOtp = filtered[0].otp || null;
        const kb = latestOtp ?
            rawKeyboard([
                [copyBtnWithIcon(`${latestOtp}`, latestOtp, EMOJI_BTN.OTP, "success")],
                [urlBtnWithIcon("View OTP Group", config.REQUIRED_OTP_GROUP_LINK, EMOJI_BTN.GRUP_OTP, "primary")]
            ]) :
            {};

        await ctx.reply(result, { parse_mode: "HTML", ...kb });

    } catch (error) {
        await deleteMessage(ctx.chat.id, loading.message_id, 500);
        await ctx.reply(`❌ Error: ${error.message}`);
    }
});

// ============================================================
// TEXT HANDLERS
// ============================================================
bot.hears("Get Number Now", async (ctx) => {
    const userId = ctx.from.id;
    if (ctx.chat.type !== "private") return;
    if (checkFlood(userId)) return;

    const isMember = await checkFullMembership(ctx.telegram, userId);
    if (!isMember) {
        return ctx.reply(captionAccessDenied(), { parse_mode: "HTML", ...joinKeyboard() });
    }

    const existing = getAssignmentByUserId(userId);
    if (existing) {
        return ctx.reply(captionAssigned(existing), {
            parse_mode: "HTML",
            ...assignedKeyboard(userId, existing.numbers),
        });
    }

    await ctx.reply(captionSelectService(), { parse_mode: "HTML", ...serviceKeyboard() });
});

bot.hears("Check OTP", async (ctx) => {
    const userId = ctx.from.id;
    if (ctx.chat.type !== "private") return;
    if (checkFlood(userId)) return;

    const isMember = await checkFullMembership(ctx.telegram, userId);
    if (!isMember) {
        return ctx.reply(captionAccessDenied(), { parse_mode: "HTML", ...joinKeyboard() });
    }

    ctx.session.awaitingOtpCheck = true;
    await ctx.reply(
        `<b>CEK OTP</b>\n\nMohon masukan nomor yang ingin di cek:\n\n<i>Contoh: +229 68 52 63 83 atau +22968526383</i>\n\n📌 Bot akan mengecek dari panel IVAS`,
        { parse_mode: "HTML", reply_markup: { remove_keyboard: true } }
    );
});

bot.hears("Cek Traffic", async (ctx) => {
    const userId = ctx.from.id;
    if (ctx.chat.type !== "private") return;
    if (checkFlood(userId)) return;

    const isMember = await checkFullMembership(ctx.telegram, userId);
    if (!isMember) {
        return ctx.reply(captionAccessDenied(), { parse_mode: "HTML", ...joinKeyboard() });
    }

    const loading = await ctx.reply("⏳ Menganalisis traffic dari IVAS...");

    try {
        const allSMS = await fetchIvasSmsRest();

        if (allSMS.length === 0) {
            await deleteMessage(ctx.chat.id, loading.message_id, 500);
            return ctx.reply("📭 Belum ada data SMS yang tercatat.", { parse_mode: "HTML", ...customMainKeyboard() });
        }

        const countryCount = {};
        for (const sms of allSMS) {
            let isoCode = getCountryIsoByNumber(sms.number) || sms.countryIso || null;
            let label = isoCode ? (getShortCountryName(isoCode) || isoCode) : "Unknown";
            countryCount[label] = (countryCount[label] || 0) + 1;
        }

        const sorted = Object.entries(countryCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        let msg = `<b>CEK TRAFFIC TOP 10 NEGARA</b>\n`;
        msg += `<i>Berdasarkan ${allSMS.length} SMS dari IVAS</i>\n\n`;

        sorted.forEach(([country, count], i) => {
            const iso = getCountryIso(country);
            const flag = getFlagEmojiHtml(iso);
            const bar = "█".repeat(Math.min(10, Math.round((count / sorted[0][1]) * 10)));
            msg += `${i + 1}. ${flag} <b>${esc(country)}</b>\n`;
            msg += `   ${bar} <code>${count}</code> SMS\n\n`;
        });

        await deleteMessage(ctx.chat.id, loading.message_id, 500);
        await ctx.reply(msg, { parse_mode: "HTML", ...customMainKeyboard() });

    } catch (error) {
        await deleteMessage(ctx.chat.id, loading.message_id, 500);
        await ctx.reply(`❌ Error: ${error.message}`, { parse_mode: "HTML", ...customMainKeyboard() });
    }
});

bot.hears("Get File", async (ctx) => {
    const userId = ctx.from.id;
    if (ctx.chat.type !== "private") return;
    if (checkFlood(userId)) return;

    const isMember = await checkFullMembership(ctx.telegram, userId);
    if (!isMember) {
        return ctx.reply(captionAccessDenied(), { parse_mode: "HTML", ...joinKeyboard() });
    }

    const countries = getCountries();
    const numbers = getNumbers();
    const countriesWithNumbers = countries.filter(c => numbers.some(n => n.countryId === c.id));

    if (countriesWithNumbers.length === 0) {
        return ctx.reply("❌ Tidak ada file nomor tersedia saat ini.", { parse_mode: "HTML", ...customMainKeyboard() });
    }

    ctx.session.awaitingFileCountry = true;

    await ctx.reply(
        `<b>GET FILE</b>\n\nMohon pilih file yang ingin kamu ambil:\n\n<i>Pilih negara dari keyboard di bawah</i>`,
        { parse_mode: "HTML", ...countryListKeyboard(countriesWithNumbers) }
    );
});

bot.hears("Panel Status", async (ctx) => {
    const userId = ctx.from.id;
    if (ctx.chat.type !== "private") return;
    if (checkFlood(userId)) return;
    if (!isOwner(userId)) return ctx.reply("❌ Command ini hanya untuk owner.");

    const isMember = await checkFullMembership(ctx.telegram, userId);
    if (!isMember) {
        return ctx.reply(captionAccessDenied(), { parse_mode: "HTML", ...joinKeyboard() });
    }

    const status = ivasSession && ivasSession.authenticated ? "✅ ONLINE" : "❌ OFFLINE";
    const wsStatus = isWsConnected ? "✅ Connected" : "❌ Disconnected";

    let msg = `<b>📋 STATUS PANEL</b>\n\n`;
    msg += `<b>IVAS SMS (i4)</b>\n`;
    msg += `   Status: ${status}\n`;
    msg += `   WebSocket: ${wsStatus}\n`;
    msg += `   URL: https://www.ivasms.com\n\n`;
    msg += `📊 Total Panel: <b>1</b>`;

    await ctx.reply(msg, { parse_mode: "HTML", ...customMainKeyboard() });
});

// ============================================================
// TEXT HANDLER
// ============================================================
bot.on("text", async (ctx) => {
    const userId = ctx.from.id;
    const text = ctx.message.text;
    if (ctx.chat.type !== "private") return;

    if (text.startsWith("/")) return;
    if (text.startsWith("Get") || text.startsWith("Check") ||
        text.startsWith("Cek") || text.startsWith("Panel")) return;
    if (text === "Menu Utama") return;

    if (ctx.session && ctx.session.awaitingOtpCheck) {
        ctx.session.awaitingOtpCheck = false;

        const cleanNum = text.replace(/[^0-9]/g, "");
        if (!cleanNum || cleanNum.length < 4) {
            return ctx.reply("❌ Format nomor tidak valid. Coba lagi.", { parse_mode: "HTML", ...customMainKeyboard() });
        }

        const loading = await ctx.reply("⏳ Sedang mengecek OTP dari IVAS...");

        try {
            const results = await fetchIvasSmsRest();
            const filtered = results.filter(s => {
                const cleanDest = s.number.replace(/[^0-9]/g, "");
                return cleanDest === cleanNum || cleanDest.endsWith(cleanNum) || cleanNum.endsWith(cleanDest);
            });

            await deleteMessage(ctx.chat.id, loading.message_id, 500);

            if (filtered.length === 0) {
                return ctx.reply(
                    `❌ <b>Tidak ada SMS ditemukan</b>\n\n📞 Nomor: <code>${formatInternationalNumber(cleanNum)}</code>\n\n💡 Dicek dari panel IVAS`,
                    { parse_mode: "HTML", ...customMainKeyboard() }
                );
            }

            let result = `<b>HASIL CEK OTP</b>\n`;
            result += `━━━━━━━━━━━━━━━━━━━\n`;
            result += `📞 Nomor: <code>${formatInternationalNumber(cleanNum)}</code>\n`;
            result += `📊 Total SMS: <b>${filtered.length}</b>\n\n`;

            const display = filtered.slice(0, 5);
            for (let i = 0; i < display.length; i++) {
                const sms = display[i];
                const iso = getCountryIsoByNumber(sms.number);
                const flag = getFlagEmojiHtml(iso);
                const langDisplay = sms.language && sms.language.code !== 'UN' ? `${sms.language.flag} ${sms.language.name}` : '🌐 Unknown';
                result += `${i + 1}. ${flag} 🕐 ${sms.date || "-"}\n`;
                result += `   📦 Panel: ${esc(sms.panel)}\n`;
                if (sms.cli) result += `   📤 From: ${sms.cli}\n`;
                result += `   🌐 Language: ${langDisplay}\n`;
                result += `   📨 ${sms.sms.substring(0, 100)}${sms.sms.length > 100 ? "..." : ""}\n`;
                if (sms.otp) result += `   🔑 <b>OTP: <code>${sms.otp}</code></b>\n`;
                result += `   ───\n`;
            }
            if (filtered.length > 5) result += `\n... dan ${filtered.length - 5} SMS lainnya`;

            const latestOtp = filtered[0].otp || null;
            const kb = latestOtp ?
                rawKeyboard([
                    [copyBtnWithIcon(`${latestOtp}`, latestOtp, EMOJI_BTN.OTP, "success")],
                    [urlBtnWithIcon("View OTP Group", config.REQUIRED_OTP_GROUP_LINK, EMOJI_BTN.GRUP_OTP, "primary")]
                ]) :
                {};

            return ctx.reply(result, { parse_mode: "HTML", ...kb, ...customMainKeyboard() });

        } catch (error) {
            await deleteMessage(ctx.chat.id, loading.message_id, 500);
            return ctx.reply(`❌ Error: ${error.message}`, { parse_mode: "HTML", ...customMainKeyboard() });
        }
    }

    if (ctx.session && ctx.session.awaitingFileCountry) {
        if (text === "Menu Utama") {
            ctx.session.awaitingFileCountry = false;
            return ctx.reply("🏠 Kembali ke menu utama.", { parse_mode: "HTML", ...customMainKeyboard() });
        }

        const countries = getCountries();
        const numbers = getNumbers();
        const countriesWithNumbers = countries.filter(c => numbers.some(n => n.countryId === c.id));

        const selected = countriesWithNumbers.find(c => {
            return text === c.name || text.includes(c.name);
        });

        if (!selected) {
            return ctx.reply("❌ Negara tidak ditemukan. Pilih dari keyboard.", { parse_mode: "HTML", ...countryListKeyboard(countriesWithNumbers) });
        }

        ctx.session.awaitingFileCountry = false;

        const countryNumbers = numbers.filter(n => n.countryId === selected.id);
        if (countryNumbers.length === 0) {
            return ctx.reply("❌ Tidak ada nomor untuk negara ini.", { parse_mode: "HTML", ...customMainKeyboard() });
        }

        const loading = await ctx.reply("⏳ Menyiapkan file...", { reply_markup: { remove_keyboard: true } });

        const iso = selected.isoCode || getCountryIso(selected.name);
        const flag = getFlagEmojiHtml(iso);
        const fileContent = countryNumbers.map(n => n.number).join("\n");
        const fileName = `numbers_${selected.name.replace(/\s+/g, "_").toLowerCase()}.txt`;
        const fileBuf = Buffer.from(fileContent, "utf8");

        try {
            await bot.telegram.sendDocument(
                ctx.chat.id,
                { source: fileBuf, filename: fileName },
                {
                    caption: `${flag} <b>${esc(selected.name)}</b>\n📊 Total: <b>${countryNumbers.length}</b> nomor`,
                    parse_mode: "HTML",
                    ...customMainKeyboard()
                }
            );
            await deleteMessage(ctx.chat.id, loading.message_id, 500);
        } catch (e) {
            await deleteMessage(ctx.chat.id, loading.message_id, 500);
            await ctx.reply(`❌ Gagal mengirim file: ${e.message}`, { parse_mode: "HTML", ...customMainKeyboard() });
        }
        return;
    }
});

// ============================================================
// CALLBACKS
// ============================================================
bot.action("validate_join", async (ctx) => {
    const userId = ctx.from.id;
    const isMember = await checkFullMembership(ctx.telegram, userId);
    if (!isMember) {
        return ctx.answerCbQuery("❌ Kamu belum bergabung! Join semua channel & group dulu ya.", { show_alert: true });
    }

    await ctx.answerCbQuery("✅ Akses terverifikasi!");
    const username = ctx.from.username || ctx.from.first_name || "Unknown";
    try {
        await ctx.editMessageCaption(captionWelcome(username, userId), {
            parse_mode: "HTML",
            reply_markup: { inline_keyboard: [] },
        });
    } catch (e) {}
    await delay(1500);
    await ctx.replyWithPhoto(config.BANNER_IMAGE, {
        caption: captionWelcome(username, userId),
        parse_mode: "HTML",
        ...customMainKeyboard(),
    });
});

bot.action("back_main", async (ctx) => {
    await ctx.answerCbQuery();
    const userId = ctx.from.id;
    const username = ctx.from.username || ctx.from.first_name || "Unknown";
    const caption = captionWelcome(username, userId);

    try {
        await ctx.editMessageCaption(caption, {
            parse_mode: "HTML",
            reply_markup: { inline_keyboard: [] },
        });
        return;
    } catch (e) {}
    try {
        await ctx.editMessageText(caption, {
            parse_mode: "HTML",
            reply_markup: { inline_keyboard: [] },
        });
        return;
    } catch (e) {}
    try {
        await ctx.replyWithPhoto(config.BANNER_IMAGE, {
            caption: caption,
            parse_mode: "HTML",
            ...customMainKeyboard(),
        });
    } catch (e) {}
});

bot.action("get_number", async (ctx) => {
    await ctx.answerCbQuery();
    const userId = ctx.from.id;
    if (checkFlood(userId)) return ctx.answerCbQuery("⚠️ Terlalu cepat!", { show_alert: true });

    const existing = getAssignmentByUserId(userId);
    if (existing) {
        try {
            return await ctx.editMessageText(captionAssigned(existing), {
                parse_mode: "HTML",
                ...assignedKeyboard(userId, existing.numbers),
            });
        } catch (e) {
            return ctx.reply(captionAssigned(existing), {
                parse_mode: "HTML",
                ...assignedKeyboard(userId, existing.numbers),
            });
        }
    }
    try {
        await ctx.editMessageText(captionSelectService(), { parse_mode: "HTML", ...serviceKeyboard() });
    } catch (e) {
        await ctx.reply(captionSelectService(), { parse_mode: "HTML", ...serviceKeyboard() });
    }
});

bot.action("sel_service_back", async (ctx) => {
    await ctx.answerCbQuery();
    try {
        await ctx.editMessageText(captionSelectService(), { parse_mode: "HTML", ...serviceKeyboard() });
    } catch (e) {
        await ctx.reply(captionSelectService(), { parse_mode: "HTML", ...serviceKeyboard() });
    }
});

bot.action(/^sel_service_(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const serviceId = parseInt(ctx.match[1]);
    const service = getServices().find(s => s.id === serviceId);
    if (!service) return ctx.answerCbQuery("❌ Service tidak ditemukan.", { show_alert: true });

    try {
        await ctx.editMessageText(captionSelectCountry(service.name), {
            parse_mode: "HTML",
            ...countryKeyboard(serviceId),
        });
    } catch (e) {
        await ctx.reply(captionSelectCountry(service.name), {
            parse_mode: "HTML",
            ...countryKeyboard(serviceId),
        });
    }
});

bot.action(/^sel_country_(\d+)_(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const serviceId = parseInt(ctx.match[1]);
    const countryId = parseInt(ctx.match[2]);
    const userId = ctx.from.id;

    if (checkFlood(userId)) return ctx.answerCbQuery("⚠️ Terlalu cepat!", { show_alert: true });

    const existing = getAssignmentByUserId(userId);
    if (existing) {
        const newNumbers = pick3Numbers(serviceId, countryId);
        if (!newNumbers || newNumbers.length === 0) {
            return ctx.answerCbQuery("❌ Stok nomor habis untuk negara ini.", { show_alert: true });
        }
        updateAssignmentCountry(userId, countryId);
        updateAssignmentNumbers(userId, newNumbers);
        const updated = getAssignmentByUserId(userId);
        await ctx.answerCbQuery("✅ Country berhasil diganti!");
        const caption = captionAssigned(updated);
        try {
            await ctx.editMessageText(caption, { parse_mode: "HTML", ...assignedKeyboard(userId, updated.numbers) });
        } catch (e) {
            await ctx.reply(caption, { parse_mode: "HTML", ...assignedKeyboard(userId, updated.numbers) });
        }
        return;
    }

    const picked = pick3Numbers(serviceId, countryId);
    if (!picked || picked.length === 0) {
        return ctx.answerCbQuery("❌ Stok nomor habis untuk pilihan ini. Coba service/negara lain.", { show_alert: true });
    }

    createAssignment(userId, picked, serviceId, countryId);
    const assignment = getAssignmentByUserId(userId);
    const caption = captionAssigned(assignment);
    let msg;
    try {
        msg = await ctx.editMessageText(caption, { parse_mode: "HTML", ...assignedKeyboard(userId, assignment.numbers) });
    } catch (e) {
        msg = await ctx.reply(caption, { parse_mode: "HTML", ...assignedKeyboard(userId, assignment.numbers) });
    }
    if (msg && msg.message_id) updateAssignmentMsgId(userId, msg.message_id);
});

bot.action(/^change_country_(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const targetUserId = parseInt(ctx.match[1]);
    const userId = ctx.from.id;
    if (userId !== targetUserId) return ctx.answerCbQuery("❌ Bukan assignment kamu.", { show_alert: true });

    const assignment = getAssignmentByUserId(userId);
    if (!assignment) return ctx.answerCbQuery("❌ Tidak ada nomor aktif.", { show_alert: true });

    const serviceName = getServiceName(assignment.serviceId);
    try {
        await ctx.editMessageText(captionSelectCountry(serviceName), {
            parse_mode: "HTML",
            ...countryKeyboard(assignment.serviceId),
        });
    } catch (e) {
        await ctx.reply(captionSelectCountry(serviceName), {
            parse_mode: "HTML",
            ...countryKeyboard(assignment.serviceId),
        });
    }
});

bot.action(/^change_num_(\d+)$/, async (ctx) => {
    const targetUserId = parseInt(ctx.match[1]);
    const userId = ctx.from.id;
    if (userId !== targetUserId) return ctx.answerCbQuery("❌ Bukan assignment kamu.", { show_alert: true });

    const assignment = getAssignmentByUserId(userId);
    if (!assignment) return ctx.answerCbQuery("❌ Tidak ada nomor aktif.", { show_alert: true });

    const sinceLastChange = Date.now() - (assignment.lastChanged || 0);
    if (sinceLastChange < config.CHANGE_COOLDOWN_MS) {
        const waitSec = Math.ceil((config.CHANGE_COOLDOWN_MS - sinceLastChange) / 1000);
        return ctx.answerCbQuery(`⏳ Tunggu ${waitSec} detik lagi sebelum ganti nomor.`, { show_alert: true });
    }

    const newNumbers = pick3Numbers(assignment.serviceId, assignment.countryId);
    if (!newNumbers || newNumbers.length === 0) return ctx.answerCbQuery("❌ Stok nomor habis!", { show_alert: true });

    updateAssignmentNumbers(userId, newNumbers);
    const updated = getAssignmentByUserId(userId);

    await ctx.answerCbQuery("✅ Nomor berhasil diganti!");
    const caption = captionAssigned(updated);
    try {
        await ctx.editMessageText(caption, { parse_mode: "HTML", ...assignedKeyboard(userId, updated.numbers) });
    } catch (e) {
        await ctx.reply(caption, { parse_mode: "HTML", ...assignedKeyboard(userId, updated.numbers) });
    }
});

bot.action(/^confirm_delc_(\d+)$/, async (ctx) => {
    if (!isOwner(ctx.from.id)) {
        return ctx.answerCbQuery("❌ Command ini hanya untuk owner.", { show_alert: true });
    }

    const countryId = parseInt(ctx.match[1]);
    const countries = getCountries();
    const countryIndex = countries.findIndex(c => c.id === countryId);

    if (countryIndex === -1) {
        await ctx.answerCbQuery("❌ Country sudah tidak ada.", { show_alert: true });
        await ctx.editMessageText("❌ Country sudah tidak ada.", { parse_mode: "HTML" });
        return;
    }

    const country = countries[countryIndex];
    const iso = country.isoCode || getCountryIso(country.name);
    const flag = getFlagEmojiHtml(iso);
    const countryName = country.name;

    const numbers = getNumbers();
    const numbersToDelete = numbers.filter(n => n.countryId === countryId);
    const countNumbers = numbersToDelete.length;

    saveNumbers(numbers.filter(n => n.countryId !== countryId));
    countries.splice(countryIndex, 1);
    saveCountries(countries);

    const assigned = getAssigned();
    let removedAssignments = 0;
    for (const a of assigned) {
        const hasNumberInCountry = a.numbers.some(n => numbersToDelete.some(num => num.id === n.numberId));
        if (hasNumberInCountry) {
            removeAssignment(a.userId);
            removedAssignments++;
        }
    }

    const successMsg = `✅ <b>Country Berhasil Dihapus!</b>\n\n${flag} <b>${esc(countryName)}</b>\n\n📊 <b>Data yang dihapus:</b>\n• Nomor: <b>${countNumbers}</b>\n• Assignment: <b>${removedAssignments}</b> user`;

    await ctx.answerCbQuery(`✅ ${flag} ${countryName} berhasil dihapus!`);
    await ctx.editMessageText(successMsg, { parse_mode: "HTML" });
});

bot.action("cancel_delc", async (ctx) => {
    await ctx.answerCbQuery("❌ Penghapusan dibatalkan!");
    await ctx.editMessageText("✅ Penghapusan country dibatalkan.", { parse_mode: "HTML" });
});

bot.action("noop", async (ctx) => ctx.answerCbQuery());

// ============================================================
// ERROR HANDLER
// ============================================================
bot.catch((err, ctx) => {
    console.error(chalk.red("[BOT ERROR]"), err.message);
});

// ============================================================
// STARTUP
// ============================================================
async function main() {
    console.log(chalk.cyan("╔═══════════════════════════════════════════╗"));
    console.log(chalk.cyan("║   OTP Bot - IVAS SMS v2                   ║"));
    console.log(chalk.cyan("║   WebSocket Real-time + Bypass CF        ║"));
    console.log(chalk.cyan("╚═══════════════════════════════════════════╝"));

    console.log(chalk.gray("📂 Checking database..."));
    console.log(chalk.gray(`   Services: ${getServices().length}, Countries: ${getCountries().length}`));
    console.log(chalk.gray(`   Numbers: ${getNumbers().length}, Assigned: ${getAssigned().length}`));
    console.log(chalk.gray(`   Users: ${getUsers().length}`));

    loadCustomFlags();
    console.log(chalk.gray(`   Custom flags: ${Object.keys(customFlagMap).length}`));

    // Load saved session
    const savedSession = getIvasSession();
    if (savedSession && savedSession.authenticated) {
        ivasSession = savedSession;
        console.log(chalk.gray(`   Loaded saved session`));
    }

    seenOtpKeys = getSeenOtp();
    processedKeys = getProcessedKeys();
    processedOtp = getProcessedOtp();
    console.log(chalk.gray(`   Seen OTP: ${seenOtpKeys.size}, Processed Keys: ${processedKeys.size}`));

    const now = Date.now();
    let cleaned = 0;
    for (const [key, data] of Object.entries(processedOtp)) {
        if (now - data.timestamp > config.OTP_DELETE_TIMER_MS) {
            delete processedOtp[key];
            cleaned++;
        }
    }
    if (cleaned > 0) {
        saveProcessedOtp(processedOtp);
        console.log(chalk.gray(`🧹 Cleaned ${cleaned} expired OTP entries`));
    }

    console.log(chalk.cyan("\n🔌 Initializing IVAS SMS..."));
    
    // Login to IVAS
    const loginSuccess = await loginIvas();
    if (loginSuccess) {
        console.log(chalk.green(`✅ IVAS SMS authenticated`));
        
        // Connect WebSocket
        connectIvasWebSocket();
        console.log(chalk.green(`✅ WebSocket connection initiated`));
    } else {
        console.log(chalk.red(`❌ Failed to authenticate IVAS SMS`));
    }

    // Periodic session refresh
    setInterval(async () => {
        await refreshIvasSession();
        if (!isWsConnected) {
            connectIvasWebSocket();
        }
    }, 300000); // Every 5 minutes

    console.log(chalk.cyan(`⏱️ Polling setiap ${config.OTP_POLL_INTERVAL_MS/1000} detik`));
    console.log(chalk.cyan(`⏱️ OTP dihapus setelah ${config.OTP_DELETE_TIMER_MS/60000} menit`));
    console.log(chalk.cyan(`⏱️ Pesan OTP di group auto delete 3 menit`));
    console.log(chalk.cyan(`🎨 Premium Emoji ID untuk semua button & flag`));
    console.log(chalk.cyan(`🔒 Sensor di tengah nomor: +62XXXX1234`));
    console.log(chalk.cyan(`📝 Blockquote untuk isi pesan`));
    console.log(chalk.cyan(`🌐 Deteksi bahasa akurat untuk 15+ bahasa`));
    console.log(chalk.cyan(`📡 IVAS WebSocket: ${isWsConnected ? '✅ Connected' : '❌ Disconnected'}`));

    // Periodic REST fetch as fallback
    setInterval(async () => {
        try {
            const results = await fetchIvasSmsRest();
            for (const sms of results) {
                const uniqueKey = sms.uniqueKey;
                if (processedKeys.has(uniqueKey)) continue;
                if (processedOtp[uniqueKey]) continue;
                
                processedKeys.add(uniqueKey);
                seenOtpKeys.add(uniqueKey);
                processedOtp[uniqueKey] = {
                    timestamp: Date.now(),
                    number: sms.number,
                    panel: sms.panel,
                    otp: sms.otp
                };
                
                await processOtpSms(sms);
            }
            if (results.length > 0) {
                saveProcessedKeys(processedKeys);
                saveSeenOtp(seenOtpKeys);
                saveProcessedOtp(processedOtp);
            }
        } catch (error) {
            // Silent
        }
    }, config.OTP_POLL_INTERVAL_MS);

    await bot.launch();
    console.log(chalk.green("\n[TELEGRAM] Bot aktif ✓"));
    console.log(chalk.green(`[PANELS] IVAS SMS aktif ✓`));

    process.once("SIGINT", () => {
        console.log(chalk.yellow("\n⏹️ Shutting down..."));
        if (wsConnection) {
            try { wsConnection.close(); } catch (e) {}
        }
        saveProcessedKeys(processedKeys);
        saveSeenOtp(seenOtpKeys);
        saveProcessedOtp(processedOtp);
        saveIvasSession(ivasSession);
        bot.stop("SIGINT");
        process.exit(0);
    });
    process.once("SIGTERM", () => {
        console.log(chalk.yellow("\n⏹️ Shutting down..."));
        if (wsConnection) {
            try { wsConnection.close(); } catch (e) {}
        }
        saveProcessedKeys(processedKeys);
        saveSeenOtp(seenOtpKeys);
        saveProcessedOtp(processedOtp);
        saveIvasSession(ivasSession);
        bot.stop("SIGTERM");
        process.exit(0);
    });
}

main().catch(e => {
    console.error(chalk.red("[FATAL]"), e);
    process.exit(1);
});
