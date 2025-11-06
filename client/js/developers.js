document.addEventListener('DOMContentLoaded', () => {
    const backBtn = document.getElementById('backBtn');
    
    backBtn.addEventListener('click', () => {
        window.location.href = '/';
    });
    
    console.log('👨‍💻 Developers page loaded');
});