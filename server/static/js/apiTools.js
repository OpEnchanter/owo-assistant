function copyApiKey() {
    navigator.clipboard.writeText(key);

    notificationPopup.style.top = "15px";
    notificationPopup.style.background = "var(--success)";
    notificationPopup.innerText = "API key copied!"

    setTimeout(() => {
        notificationPopup.style.top = "-150px";
    }, 1500);
}

const closeButton = document.getElementById("close");
const modal = document.getElementById("newApiKeyModal");
closeButton.addEventListener('click', (e) => {
    modal.style.visibility = 'hidden';
    key = '';
    apiKey.innerHTML = '';
});

let key = '';

const resetApiKeyButton = document.getElementById('resetApiKey');
const apiKey = document.getElementById('apiKey');
resetApiKeyButton.addEventListener('click', async (e) => {
    await fetch('/resetApiKey')
        .then(data => {return data.text();})
        .then(newKey => {
            apiKey.innerText = newKey;
            key = newKey;
            modal.style.visibility = 'visible';
            console.log(newKey);
        });
});