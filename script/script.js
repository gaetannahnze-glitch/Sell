// --- script.js (Version Nettoyée) ---

// 1. ACHAT IMMÉDIAT (Depuis une page produit)
function validerCommande(bouton) {
    const section = bouton.closest('.product-detail-container');
    const produit = {
        id: parseInt(section.dataset.id),
        nom: section.querySelector('h1').innerText,
        prix: parseInt(section.querySelector('.price').innerText.replace(/[^0-9]/g, '')),
        image: section.querySelector('img').src,
        qte: parseInt(section.querySelector('input[type="number"]').value)
    };
    localStorage.setItem('commande_finale', JSON.stringify([produit]));
    window.location.href = "validerc.html";
}

// 2. AJOUT AU PANIER
function ajouterAuPanier(bouton) {
    const section = bouton.closest('.product-detail-container');
    const produit = {
        id: parseInt(section.dataset.id),
        nom: section.querySelector('h1').innerText,
        prix: parseInt(section.querySelector('.price').innerText.replace(/[^0-9]/g, '')),
        image: section.querySelector('img').src,
        qte: parseInt(section.querySelector('input[type="number"]').value)
    };
    let panier = JSON.parse(localStorage.getItem('panier_storage')) || [];
    panier.push(produit);
    localStorage.setItem('panier_storage', JSON.stringify(panier));
    alert("Produit ajouté au panier !");
    window.location.href = "panier.html";
}

// 3. PASSER AU PAIEMENT (Depuis le panier)
function passerAuPaiement() {
    const panier = JSON.parse(localStorage.getItem('panier_storage')) || [];
    if (panier.length > 0) {
        localStorage.setItem('commande_finale', JSON.stringify(panier));
        window.location.href = "validerc.html";
    } else {
        alert("Votre panier est vide !");
    }
}

// 4. GESTION DE LA NAVIGATION (Connexion / Déconnexion)
document.addEventListener("DOMContentLoaded", function() {
    const authLinkContainer = document.getElementById('auth-link');
    const userNom = localStorage.getItem('user_nom');
    const userRole = localStorage.getItem('user_role');

    if (userNom && authLinkContainer) {
        authLinkContainer.innerHTML = `
            <div style="display: flex; align-items: center; gap: 15px;">
                <span style="font-size: 0.9rem;">Bonjour, <strong>${userNom}</strong></span>
                <a href="#" onclick="deconnexion()" style="color: #e63946;">Déconnexion</a>
            </div>
        `;
        if (userRole === 'admin') {
            authLinkContainer.insertAdjacentHTML('beforebegin', `<li><a href="admin.html" style="color: #d4af37;">Dashboard</a></li>`);
        }
    }
});

function deconnexion() {
    if (confirm("Se déconnecter ?")) {
        localStorage.clear();
        window.location.href = "index.html";
    }
}
