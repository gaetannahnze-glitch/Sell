const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
app.use(express.static('sell'));


app.use(cors());
app.use(bodyParser.json());

const db = new sqlite3.Database('ecommerce.db');

// 🔹 TEST
app.get('/', (req, res) => {
    res.send('Serveur ecommerce actif');
});

// 🔹 GET produits par catégorie
app.get('/produits/:categorie_id', (req, res) => {
    const id = req.params.categorie_id;

    db.all("SELECT * FROM produits WHERE categorie_id = ?", [id], (err, rows) => {
        if (err) return res.status(500).json(err);
        res.json(rows);
    });
});

app.get('/test-insert', (req, res) => {
    db.run(
        `INSERT INTO commandes (utilisateur_id, date_commande) VALUES (?, ?)`,
        [1, new Date().toISOString()],
        function(err) {
            if (err) return res.send(err);
            res.send("Commande test insérée ID: " + this.lastID);
        }
    );
});





// 🔹 GET produit par ID
app.get('/produit/:id', (req, res) => {
    const id = req.params.id;

    db.get("SELECT * FROM produits WHERE id = ?", [id], (err, row) => {
        if (err) return res.status(500).json(err);
        res.json(row);
    });
});

// 🔹 INSCRIPTION
app.post('/inscription', (req, res) => {
    const { nom, email, mot_de_passe } = req.body;

    db.run(
        "INSERT INTO utilisateurs (nom, email, mot_de_passe) VALUES (?, ?, ?)",
        [nom, email, mot_de_passe],
        function (err) {
            if (err) return res.status(500).json(err);
            res.json({ message: "Utilisateur créé", userId: this.lastID });
        }
    );
});
//valider commande
app.post('/valider-commande', (req, res) => {
    console.log("REQUETE RECUE:", req.body);
    const { utilisateur_id, panier } = req.body;
    const date = new Date().toISOString();

    db.run(
        `INSERT INTO commandes (utilisateur_id, date_commande) VALUES (?, ?)`,
        [utilisateur_id, date],
        function(err) {
            if (err) return res.status(500).send(err);

            const commande_id = this.lastID;

            const stmt = db.prepare(`
                INSERT INTO details_commande (commande_id, produit_id, quantite)
                VALUES (?, ?, ?)
            `);

            panier.forEach(item => {
                stmt.run(commande_id, item.produit_id, item.quantite);
            });

            stmt.finalize();

            res.send({ message: "Commande validée", commande_id });
        }
    );
});

function choisirProduit(nomImage, nomProduit) {
    // On enregistre les infos dans la mémoire du navigateur
    localStorage.setItem('imageSelectionnee', nomImage);
    localStorage.setItem('nomDuProduit', nomProduit);
    // On dirige vers la page de validation
    window.location.href = "validerc.html";
}

// 🔹 LANCER SERVEUR
app.listen(3000, () => {
    console.log("Serveur lancé sur http://localhost:3000");
});