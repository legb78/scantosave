const express = require('express');
const path = require('path');
const fs = require('fs'); // Importer le module fs pour lire des fichiers

const app = express();
const PORT = 3000; // Vous pouvez changer le port si nécessaire

// Middleware pour servir des fichiers statiques (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'dashboard'))); // Assurez-vous que le chemin est correct

// Route pour lire le contenu du fichier CSV et le renvoyer en JSON
app.get('/api/achats', (req, res) => {
    const csvFilePath = path.join(__dirname, 'dashboard', 'achats_clients_10000.csv');
    
    fs.readFile(csvFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error("Erreur lors de la lecture du fichier CSV:", err);
            return res.status(500).send("Erreur lors de la lecture du fichier CSV.");
        }
        
        // Convertir le contenu CSV en JSON
        const rows = data.split('\n').map(row => row.split(','));
        const headers = rows[0];
        const jsonData = rows.slice(1).map(row => {
            return headers.reduce((acc, header, index) => {
                acc[header.trim()] = row[index] ? row[index].trim() : null; // Trim pour enlever les espaces
                return acc;
            }, {});
        });
        
        res.json(jsonData); // Renvoyer les données JSON
    });
});

// Route par défaut pour servir le fichier HTML principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard', 'index.html')); // Chemin vers votre fichier HTML
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`Serveur en cours d'exécution sur http://localhost:${PORT}`);
}); 