const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();

// 🔥 MIDDLEWARES
app.use(cors());
app.use(express.json()); // remplace bodyParser
app.use(express.static('public')); // ⚠️ dossier frontend

// 🔥 DATABASE
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


// 🔹 GET produit par ID
app.get('/produit/:id', (req, res) => {
    const id = req.params.id;

    db.get("SELECT * FROM produits WHERE id = ?", [id], (err, row) => {
        if (err) return res.status(500).json(err);
        res.json(row);
    });
});

//inscrip
app.post('/inscription', (req, res) => {
    const { nom, email, mot_de_passe } = req.body;
    const role = 'client'; // Sécurité : tout nouvel inscrit est un client

    db.run(
        "INSERT INTO utilisateurs (nom, email, mot_de_passe, role) VALUES (?, ?, ?, ?)",
        [nom, email, mot_de_passe, role],
        function (err) {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Cet email est déjà utilisé." });
            }
            res.json({ message: "Utilisateur créé", userId: this.lastID });
        }
    );
});


// 🔹 CONNEXION (LOGIN)
app.post('/connexion', (req, res) => {
    const { email, mot_de_passe } = req.body;

    // On cherche l'utilisateur avec l'email ET le mot de passe fournis
    const query = "SELECT id, nom, role FROM utilisateurs WHERE email = ? AND mot_de_passe = ?";
    
    db.get(query, [email, mot_de_passe], (err, user) => {
        if (err) {
            console.error("Erreur SQL lors de la connexion:", err);
            return res.status(500).json({ error: "Erreur serveur lors de la connexion" });
        }

        if (user) {
            // Si l'utilisateur est trouvé, on renvoie ses infos (sans le mot de passe pour la sécurité)
            console.log(`Connexion réussie : ${user.nom} (Rôle: ${user.role})`);
            res.json({
                userId: user.id,   //  CHANGEMENT ICI
                nom: user.nom,
                role: user.role
            });
        } else {
            // Si aucun utilisateur ne correspond
            res.status(401).json({ error: "Email ou mot de passe incorrect" });
        }
    });
});



// 🔹 VALIDER COMMANDE
app.post('/valider-commande', (req, res) => {
    console.log("REQUETE RECUE:", req.body);

    const { utilisateur_id, panier } = req.body;
    const date = new Date().toISOString();

    db.run(
        `INSERT INTO commandes (utilisateur_id, date_commande) VALUES (?, ?)`,
        [utilisateur_id, date],
        function(err) {
            if (err) return res.status(500).json({ message: "Erreur commande" });

            const commande_id = this.lastID;

            const stmt = db.prepare(`
                INSERT INTO details_commande (commande_id, produit_id, quantite)
                VALUES (?, ?, ?)
            `);

            panier.forEach(item => {
                stmt.run(commande_id, item.produit_id, item.quantite);
            });

            stmt.finalize();

            res.json({ message: "Commande validée", commande_id });
        }
    );
});

// 🔹 TEST INSERT (optionnel)
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

app.get('/admin/stats', (req, res) => {

    db.get("SELECT COUNT(*) AS usersCount FROM utilisateurs", (err1, users) => {
        if (err1) return res.status(500).json(err1);

        db.get("SELECT COUNT(*) AS ordersCount FROM commandes", (err2, orders) => {
            if (err2) return res.status(500).json(err2);

            db.all(`
                SELECT 
                    commandes.id,
                    commandes.date_commande,
                    commandes.statut,
                    utilisateurs.nom AS client_nom
                FROM commandes
                JOIN utilisateurs ON utilisateurs.id = commandes.utilisateur_id
                ORDER BY commandes.id DESC
                LIMIT 10
            `, (err3, recentOrders) => {
                if (err3) return res.status(500).json(err3);
                

                res.json({
                    usersCount: users.usersCount,
                    ordersCount: orders.ordersCount,
                    recentOrders: recentOrders
                });
            });
        });
    });
});

//route pour mettre à jour statut
app.post('/admin/update-statut', (req, res) => {
    const { commande_id, nouveau_statut } = req.body;

    console.log("REQ BODY:", req.body);

    if (!commande_id || !nouveau_statut) {
        return res.status(400).json({ message: "Données manquantes" });
    }

    db.run(
        "UPDATE commandes SET statut = ? WHERE id = ?",
        [nouveau_statut, commande_id],
        function(err) {
            if (err) {
                console.error("ERREUR SQL:", err.message);
                return res.status(500).json({ message: err.message });
            }

            console.log("Lignes modifiées:", this.changes);

            if (this.changes === 0) {
                return res.status(404).json({ message: "Commande non trouvée" });
            }

            res.json({ message: "Statut mis à jour" });
        }
    );
});



// 🔹 LANCER SERVEUR
app.listen(3000, () => {
    console.log("Serveur lancé sur http://localhost:3000");
});