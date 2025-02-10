// public/swagger-custom.js

// When the URL hash changes, scroll the target element into view
window.addEventListener('hashchange', function () {
    // Remove the '#' from the hash to get the element ID
    const targetId = window.location.hash.substring(1);
    if (targetId) {
        const element = document.getElementById(targetId);
        console.log('element', element);
        if (element) {
            // Scroll the target element into view with smooth behavior
            element.scrollIntoView({ behavior: 'smooth' });
        }
    }
});
