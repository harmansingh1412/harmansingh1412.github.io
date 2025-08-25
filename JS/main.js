// Harman Singh Academic Website - Main JavaScript

// IP Tracking functionality
class VisitorTracker {
    constructor() {
        this.trackVisit();
        this.setupNavigation();
    }

    async trackVisit() {
        try {
            // Get visitor's IP address
            const ipResponse = await fetch('https://api.ipify.org?format=json');
            const ipData = await ipResponse.json();
            
            // Get additional visitor info
            const geoResponse = await fetch(`https://ipapi.co/${ipData.ip}/json/`);
            const geoData = await geoResponse.json();
            
            const visitData = {
                ip: ipData.ip,
                timestamp: new Date().toISOString(),
                page: window.location.pathname,
                userAgent: navigator.userAgent,
                referrer: document.referrer,
                location: {
                    city: geoData.city,
                    region: geoData.region,
                    country: geoData.country_name,
                    org: geoData.org
                }
            };

            // Store locally (you can replace this with server endpoint)
            this.logVisit(visitData);
            
            // Optional: Send to server endpoint
            // await this.sendToServer(visitData);
            
        } catch (error) {
            console.log('Visitor tracking failed:', error);
        }
    }

    logVisit(data) {
        // Store in localStorage for now (replace with server logging)
        const visits = JSON.parse(localStorage.getItem('harman_site_visits') || '[]');
        visits.push(data);
        
        // Keep only last 100 visits to prevent storage overflow
        if (visits.length > 100) {
            visits.splice(0, visits.length - 100);
        }
        
        localStorage.setItem('harman_site_visits', JSON.stringify(visits));
        
        // Log to console for development
        console.log('Visit tracked:', data);
    }

    async sendToServer(data) {
        // Replace with your actual server endpoint
        try {
            await fetch('/api/track-visit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
        } catch (error) {
            console.log('Server logging failed:', error);
        }
    }

    // Method to retrieve visit data (for admin use)
    getVisitData() {
        return JSON.parse(localStorage.getItem('harman_site_visits') || '[]');
    }

    // Method to export visit data
    exportVisitData() {
        const data = this.getVisitData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'harman_site_visits.json';
        a.click();
        URL.revokeObjectURL(url);
    }
}

// Navigation functionality
class Navigation {
    constructor() {
        this.setupActiveNavigation();
        this.setupMobileMenu();
    }

    setupActiveNavigation() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const navLinks = document.querySelectorAll('.nav a');
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPage || (currentPage === 'index.html' && href === 'index.html')) {
                link.classList.add('active');
            }
        });
    }

    setupMobileMenu() {
        // Add mobile menu functionality if needed
        const nav = document.querySelector('.nav');
        if (window.innerWidth <= 768) {
            // Mobile menu logic here
        }
    }
}

// Smooth scrolling for anchor links
function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Loading animations
function setupLoadingAnimations() {
    const cards = document.querySelectorAll('.card');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
}

// Search functionality for publications and presentations
class SearchFilter {
    constructor() {
        this.setupSearch();
    }

    setupSearch() {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterContent(e.target.value.toLowerCase());
            });
        }
    }

    filterContent(searchTerm) {
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
            const text = card.textContent.toLowerCase();
            if (text.includes(searchTerm)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize visitor tracking
    const tracker = new VisitorTracker();
    
    // Initialize navigation
    const navigation = new Navigation();
    
    // Setup smooth scrolling
    setupSmoothScrolling();
    
    // Setup loading animations
    setupLoadingAnimations();
    
    // Initialize search if on publications/presentations page
    const searchFilter = new SearchFilter();
    
    // Make tracker available globally for admin access
    window.visitorTracker = tracker;
    
    console.log('Harman Singh Academic Website initialized');
    console.log('To view visit data, use: window.visitorTracker.getVisitData()');
    console.log('To export visit data, use: window.visitorTracker.exportVisitData()');
});

// Utility functions
const utils = {
    // Format date for display
    formatDate: (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    },
    
    // Copy text to clipboard
    copyToClipboard: (text) => {
        navigator.clipboard.writeText(text).then(() => {
            console.log('Copied to clipboard:', text);
        });
    },
    
    // Show notification
    showNotification: (message, type = 'info') => {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 2rem;
            background: var(--primary-blue);
            color: white;
            border-radius: 8px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
};

// Export for use in other scripts
window.HarmanSiteUtils = utils;
