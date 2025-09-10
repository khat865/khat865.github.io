// Main JavaScript for Personal Website
document.addEventListener('DOMContentLoaded', function() {
    // Load HTML sections
    loadSection('header-container', 'sections/header.html');
    loadSection('hero-container', 'sections/hero.html');
    loadSection('education-container', 'sections/education.html');
    loadSection('experience-container', 'sections/experience.html');
    loadSection('projects-container', 'sections/projects.html');
    loadSection('publications-container', 'sections/publications.html');
    loadSection('skills-container', 'sections/skills.html');
    loadSection('footer-container', 'sections/footer.html');
});

// Function to load HTML sections
function loadSection(containerId, htmlFile) {
    const container = document.getElementById(containerId);
    if (container) {
        fetch(htmlFile)
            .then(response => response.text())
            .then(html => {
                container.innerHTML = html;
                // Initialize smooth scroll after all sections are loaded
                if (containerId === 'footer-container') {
                    initializeSmoothScroll();
                }
            })
            .catch(error => {
                console.warn(`Could not load ${htmlFile}:`, error);
                // Fallback content
                if (containerId === 'header-container') {
                    container.innerHTML = getHeaderFallback();
                } else if (containerId === 'hero-container') {
                    container.innerHTML = getHeroFallback();
                }
            });
    }
}

// Fallback content for critical sections
function getHeaderFallback() {
    return `
        <header class="header">
            <div class="container">
                <nav class="nav">
                    <div class="logo">Jiyao Yang</div>
                    <ul class="nav-links">
                        <li><a href="#education">Education</a></li>
                        <li><a href="#experience">Experience</a></li>
                        <li><a href="#projects">Projects</a></li>
                        <li><a href="#publications">Publications</a></li>
                        <li><a href="#skills">Skills</a></li>
                    </ul>
                </nav>
            </div>
        </header>
    `;
}

function getHeroFallback() {
    return `
        <section class="hero">
            <h1>Jiyao Yang</h1>
            <p>Computer Vision & AI Researcher</p>
        </section>
    `;
}

// Initialize smooth scroll (called after all sections load)
function initializeSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
}