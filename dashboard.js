// Variables globales
let allData = [];
let filteredData = [];
let uniqueProducts = new Set();
let uniqueStores = new Set();
let uniqueCustomers = new Set();
let uniqueTickets = new Set();
let currentFilters = {
    period: 'all',
    store: 'all',
    product: 'all',
    gender: 'all',
    age: 'all'
};

// Charts
let salesChart;
let productsChart;
let customersChart;

// Préchargeur
window.addEventListener('load', () => {
    setTimeout(() => {
        document.querySelector('.preloader').style.opacity = '0';
        document.querySelector('.preloader').style.visibility = 'hidden';
    }, 1500);
});

// Initialisation du menu mobile pour la sidebar
document.addEventListener('DOMContentLoaded', function() {
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'sidebar-toggle';
    toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
    document.querySelector('.dashboard-header').prepend(toggleBtn);
    
    toggleBtn.addEventListener('click', () => {
        document.querySelector('.sidebar').classList.toggle('active');
    });
    
    // Ajouter événements aux éléments DOM si présents
    setupEventListeners();
    
    // Charger automatiquement le fichier CSV
    loadLocalCsvFile();
});

// Configuration des écouteurs d'événements
function setupEventListeners() {
    const csvFileInput = document.getElementById('csvFile');
    const applyFiltersBtn = document.getElementById('applyFilters');
    const productChartTypeSelect = document.getElementById('productChartType');
    const customerChartTypeSelect = document.getElementById('customerChartType');
    const topProductsMetricSelect = document.getElementById('topProductsMetric');
    const storePerformanceMetricSelect = document.getElementById('storePerformanceMetric');
    
    if (csvFileInput) csvFileInput.addEventListener('change', handleFileUpload);
    if (applyFiltersBtn) applyFiltersBtn.addEventListener('click', applyFilters);
    if (productChartTypeSelect) productChartTypeSelect.addEventListener('change', updateProductsChart);
    if (customerChartTypeSelect) customerChartTypeSelect.addEventListener('change', updateCustomersChart);
    if (topProductsMetricSelect) topProductsMetricSelect.addEventListener('change', updateTopProducts);
    if (storePerformanceMetricSelect) storePerformanceMetricSelect.addEventListener('change', updateStorePerformance);
    
    // Écouteurs pour les boutons de période du graphique des ventes
    document.querySelectorAll('.chart-actions button').forEach(button => {
        button.addEventListener('click', (e) => {
            document.querySelectorAll('.chart-actions button').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            updateSalesChart(e.target.dataset.period);
        });
    });
}

// Fonction pour gérer l'import du fichier CSV
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const fileNameDisplay = document.getElementById('fileName');
        if (fileNameDisplay) fileNameDisplay.textContent = file.name;
        
        // Utilisation de Papa Parse pour lire le CSV
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                processData(results.data);
            },
            error: function(error) {
                console.error("Erreur lors de l'analyse du fichier CSV:", error);
                alert("Une erreur s'est produite lors de l'analyse du fichier CSV.");
            }
        });
    }
}

// Fonction pour traiter les données
function processData(data) {
    // Nettoyage et conversion des données
    allData = data.map(row => {
        return {
            ...row,
            'Âge': parseInt(row['Âge'] || 0),
            'Nombre_Produits': parseInt(row['Nombre_Produits'] || 0),
            'Total_Achat (€)': parseFloat(row['Total_Achat (€)'] || 0),
            'Quantité': parseInt(row['Quantité'] || 0),
            'Total_Coût_Produit (€)': parseFloat(row['Total_Coût_Produit (€)'] || 0)
        };
    });
    
    // Extraire les valeurs uniques pour les filtres
    uniqueProducts = new Set();
    uniqueStores = new Set();
    uniqueCustomers = new Set();
    uniqueTickets = new Set();
    
    allData.forEach(row => {
        if (row['Nom_Produit']) uniqueProducts.add(row['Nom_Produit']);
        if (row['Magasin']) uniqueStores.add(row['Magasin']);
        if (row['Client_ID']) uniqueCustomers.add(row['Client_ID']);
        if (row['Ticket_ID']) uniqueTickets.add(row['Ticket_ID']);
    });
    
    // Populer les filtres
    populateFilters();
    
    // Initialiser les données filtrées
    filteredData = [...allData];
    
    // Mettre à jour l'interface
    updateDashboard();
}

// Fonction pour peupler les filtres
function populateFilters() {
    const storeFilter = document.getElementById('storeFilter');
    const productFilter = document.getElementById('productFilter');
    
    if (!storeFilter || !productFilter) return;
    
    // Vider les options existantes
    storeFilter.innerHTML = '<option value="all">Tous</option>';
    productFilter.innerHTML = '<option value="all">Tous</option>';
    
    // Ajouter les options pour les magasins
    Array.from(uniqueStores).sort().forEach(store => {
        const option = document.createElement('option');
        option.value = store;
        option.textContent = store;
        storeFilter.appendChild(option);
    });
    
    // Ajouter les options pour les produits
    Array.from(uniqueProducts).sort().forEach(product => {
        const option = document.createElement('option');
        option.value = product;
        option.textContent = product;
        productFilter.appendChild(option);
    });
}

// Fonction pour appliquer les filtres
function applyFilters() {
    // Récupérer les valeurs des filtres
    const periodFilter = document.getElementById('periodFilter');
    const storeFilter = document.getElementById('storeFilter');
    const productFilter = document.getElementById('productFilter');
    const genderFilter = document.getElementById('genderFilter');
    const ageFilter = document.getElementById('ageFilter');
    
    if (!periodFilter || !storeFilter || !productFilter || !genderFilter || !ageFilter) return;
    
    currentFilters = {
        period: periodFilter.value,
        store: storeFilter.value,
        product: productFilter.value,
        gender: genderFilter.value,
        age: ageFilter.value
    };
    
    // Appliquer les filtres
    filteredData = allData.filter(row => {
        // Filtre de magasin
        if (currentFilters.store !== 'all' && row['Magasin'] !== currentFilters.store) {
            return false;
        }
        
        // Filtre de produit
        if (currentFilters.product !== 'all' && row['Nom_Produit'] !== currentFilters.product) {
            return false;
        }
        
        // Filtre de sexe
        if (currentFilters.gender !== 'all' && row['Sexe'] !== currentFilters.gender) {
            return false;
        }
        
        // Filtre d'âge
        if (currentFilters.age !== 'all') {
            const age = parseInt(row['Âge']);
            if (currentFilters.age === '18-25' && (age < 18 || age > 25)) return false;
            if (currentFilters.age === '26-35' && (age < 26 || age > 35)) return false;
            if (currentFilters.age === '36-45' && (age < 36 || age > 45)) return false;
            if (currentFilters.age === '46+' && age < 46) return false;
        }
        
        // Filtre de période
        if (currentFilters.period !== 'all') {
            const date = new Date(row['Jour_Achat']);
            const today = new Date();
            
            if (currentFilters.period === 'day' && !isSameDay(date, today)) return false;
            if (currentFilters.period === 'week' && !isInLastWeek(date, today)) return false;
            if (currentFilters.period === 'month' && !isInLastMonth(date, today)) return false;
        }
        
        return true;
    });
    
    // Mettre à jour l'interface
    updateDashboard();
}

// Fonctions utilitaires pour les dates
function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
}

function isInLastWeek(date, today) {
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(today.getDate() - 7);
    return date >= oneWeekAgo && date <= today;
}

function isInLastMonth(date, today) {
    const oneMonthAgo = new Date(today);
    oneMonthAgo.setMonth(today.getMonth() - 1);
    return date >= oneMonthAgo && date <= today;
}

// Fonction pour mettre à jour le dashboard
function updateDashboard() {
    updateStats();
    updateSalesChart();
    updateProductsChart();
    updateCustomersChart();
    updateTransactionsTable();
    updateTopProducts();
    updateStorePerformance();
}

// Fonction pour mettre à jour les statistiques
function updateStats() {
    const uniqueFilteredCustomers = new Set();
    const uniqueFilteredTickets = new Set();
    let totalSales = 0;
    
    filteredData.forEach(row => {
        uniqueFilteredCustomers.add(row['Client_ID']);
        uniqueFilteredTickets.add(row['Ticket_ID']);
        totalSales += parseFloat(row['Total_Coût_Produit (€)'] || 0);
    });
    
    const totalCustomers = uniqueFilteredCustomers.size;
    const totalTransactions = uniqueFilteredTickets.size;
    const averageBasket = totalTransactions > 0 ? (totalSales / totalTransactions) : 0;
    
    // Mettre à jour les affichages si les éléments existent
    const totalSalesElement = document.getElementById('totalSales');
    const totalCustomersElement = document.getElementById('totalCustomers');
    const totalTransactionsElement = document.getElementById('totalTransactions');
    const averageBasketElement = document.getElementById('averageBasket');
    
    if (totalSalesElement) totalSalesElement.textContent = totalSales.toFixed(2) + ' €';
    if (totalCustomersElement) totalCustomersElement.textContent = totalCustomers;
    if (totalTransactionsElement) totalTransactionsElement.textContent = totalTransactions;
    if (averageBasketElement) averageBasketElement.textContent = averageBasket.toFixed(2) + ' €';
    
    // Simuler des changements (dans une vraie application, on comparerait avec une période précédente)
    const salesChangeElement = document.getElementById('salesChange');
    const customersChangeElement = document.getElementById('customersChange');
    const transactionsChangeElement = document.getElementById('transactionsChange');
    const basketChangeElement = document.getElementById('basketChange');
    
    if (salesChangeElement) salesChangeElement.textContent = '12.5%';
    if (customersChangeElement) customersChangeElement.textContent = '8.3%';
    if (transactionsChangeElement) transactionsChangeElement.textContent = '15.2%';
    if (basketChangeElement) basketChangeElement.textContent = '5.7%';
}

// Fonction pour mettre à jour le graphique des ventes
function updateSalesChart(period = 'day') {
    const chartCanvas = document.getElementById('salesChart');
    if (!chartCanvas) return;
    
    const ctx = chartCanvas.getContext('2d');
    
    // Organiser les données par date
    const salesByDate = {};
    filteredData.forEach(row => {
        const date = row['Jour_Achat'];
        if (!date) return;
        
        if (!salesByDate[date]) {
            salesByDate[date] = 0;
        }
        salesByDate[date] += parseFloat(row['Total_Coût_Produit (€)'] || 0);
    });
    
    // Convertir en format pour Chart.js
    const labels = Object.keys(salesByDate).sort();
    const data = labels.map(date => salesByDate[date]);
    
    // Détruire le graphique existant s'il existe
    if (salesChart) {
        salesChart.destroy();
    }
    
    // Créer le nouveau graphique
    salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Ventes (€)',
                data: data,
                borderColor: '#75BC8D',
                backgroundColor: 'rgba(117, 188, 141, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.parsed.y.toFixed(2) + ' €';
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        borderDash: [5, 5]
                    },
                    ticks: {
                        callback: function(value) {
                            return value + ' €';
                        }
                    }
                }
            }
        }
    });
}

// Fonction pour mettre à jour le graphique des produits
function updateProductsChart() {
    const chartCanvas = document.getElementById('productsChart');
    const chartTypeSelect = document.getElementById('productChartType');
    if (!chartCanvas || !chartTypeSelect) return;
    
    const ctx = chartCanvas.getContext('2d');
    const chartType = chartTypeSelect.value;
    
    // Organiser les données par produit
    const productData = {};
    filteredData.forEach(row => {
        const product = row['Nom_Produit'];
        if (!product) return;
        
        if (!productData[product]) {
            productData[product] = {
                revenue: 0,
                quantity: 0
            };
        }
        productData[product].revenue += parseFloat(row['Total_Coût_Produit (€)'] || 0);
        productData[product].quantity += parseInt(row['Quantité'] || 0);
    });
    
    // Trier et prendre les 5 premiers
    const sortedProducts = Object.entries(productData)
        .sort((a, b) => b[1][chartType] - a[1][chartType])
        .slice(0, 5);
    
    const labels = sortedProducts.map(item => item[0]);
    const data = sortedProducts.map(item => item[1][chartType]);
    
    // Couleurs
    const backgroundColors = [
        'rgba(117, 188, 141, 0.7)',
        'rgba(75, 182, 201, 0.7)',
        'rgba(131, 118, 178, 0.7)',
        'rgba(255, 162, 107, 0.7)',
        'rgba(255, 107, 107, 0.7)'
    ];
    
    // Détruire le graphique existant s'il existe
    if (productsChart) {
        productsChart.destroy();
    }
    
    // Créer le nouveau graphique
    productsChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderColor: '#FFFFFF',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        boxWidth: 12,
                        padding: 15
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed;
                            if (chartType === 'revenue') {
                                return context.label + ': ' + value.toFixed(2) + ' €';
                            } else {
                                return context.label + ': ' + value + ' unités';
                            }
                        }
                    }
                }
            },
            cutout: '60%'
        }
    });
}

// Fonction pour mettre à jour le graphique des clients
function updateCustomersChart() {
    const chartCanvas = document.getElementById('customersChart');
    const chartTypeSelect = document.getElementById('customerChartType');
    if (!chartCanvas || !chartTypeSelect) return;
    
    const ctx = chartCanvas.getContext('2d');
    const chartType = chartTypeSelect.value;
    
    let labels, data, backgroundColors;
    
    if (chartType === 'gender') {
        // Données par sexe
        const genderData = {
            'Homme': 0,
            'Femme': 0
        };
        
        // Utiliser uniqueTickets pour éviter les doublons
        const processedTickets = new Set();
        
        filteredData.forEach(row => {
            // Ne compter chaque client qu'une fois par ticket
            const ticketClientKey = row['Ticket_ID'] + row['Client_ID'];
            if (!processedTickets.has(ticketClientKey) && row['Sexe']) {
                processedTickets.add(ticketClientKey);
                genderData[row['Sexe']] = (genderData[row['Sexe']] || 0) + 1;
            }
        });
        
        labels = Object.keys(genderData);
        data = Object.values(genderData);
        backgroundColors = ['#4BB6C9', '#FF6B6B'];
    } else {
        // Données par âge
        const ageGroups = {
            '18-25': 0,
            '26-35': 0,
            '36-45': 0,
            '46+': 0
        };
        
        // Utiliser uniqueTickets pour éviter les doublons
        const processedClients = new Set();
        
        filteredData.forEach(row => {
            // Ne compter chaque client qu'une fois
            if (!processedClients.has(row['Client_ID']) && row['Client_ID']) {
                processedClients.add(row['Client_ID']);
                
                const age = parseInt(row['Âge'] || 0);
                if (age >= 18 && age <= 25) ageGroups['18-25'] += 1;
                else if (age >= 26 && age <= 35) ageGroups['26-35'] += 1;
                else if (age >= 36 && age <= 45) ageGroups['36-45'] += 1;
                else if (age >= 46) ageGroups['46+'] += 1;
            }
        });
        
        labels = Object.keys(ageGroups);
        data = Object.values(ageGroups);
        backgroundColors = ['#75BC8D', '#4BB6C9', '#8376B2', '#FFA26B'];
    }
    
    // Détruire le graphique existant s'il existe
    if (customersChart) {
        customersChart.destroy();
    }
    
    // Créer le nouveau graphique
    customersChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderColor: '#FFFFFF',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        boxWidth: 12,
                        padding: 15
                    }
                }
            }
        }
    });
}

// Fonction pour mettre à jour le tableau des transactions
function updateTransactionsTable() {
    const tableBody = document.getElementById('transactionsTable');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    // Obtenir les tickets uniques
    const uniqueTicketsData = {};
    filteredData.forEach(row => {
        const ticketId = row['Ticket_ID'];
        if (!ticketId) return;
        
        if (!uniqueTicketsData[ticketId]) {
            uniqueTicketsData[ticketId] = {
                clientId: row['Client_ID'],
                age: row['Âge'],
                gender: row['Sexe'],
                store: row['Magasin'],
                date: row['Jour_Achat'],
                time: row['Heure_Achat'],
                totalAmount: 0,
                products: 0
            };
        }
        
        uniqueTicketsData[ticketId].totalAmount += parseFloat(row['Total_Coût_Produit (€)'] || 0);
        uniqueTicketsData[ticketId].products += parseInt(row['Quantité'] || 0);
    });
    
    // Convertir et trier par date, heure (les plus récents d'abord)
    const sortedTickets = Object.entries(uniqueTicketsData)
        .sort((a, b) => {
            const dateA = new Date((a[1].date || '') + ' ' + (a[1].time || ''));
            const dateB = new Date((b[1].date || '') + ' ' + (b[1].time || ''));
            return dateB - dateA;
        })
        .slice(0, 10); // Seulement les 10 plus récentes
    
    // Générer les lignes du tableau
    sortedTickets.forEach(([ticketId, data]) => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>
                <div class="table-user">
                    <img src="https://i.pravatar.cc/300?u=${data.clientId}" alt="User">
                    <div>
                        <p>${data.clientId}</p>
                        <span>${data.age} ans, ${data.gender}</span>
                    </div>
                </div>
            </td>
            <td>${ticketId}</td>
            <td>${data.date || 'N/A'} <br> <span class="text-light">${data.time || 'N/A'}</span></td>
            <td>${data.store || 'N/A'}</td>
            <td>${data.products} produits</td>
            <td><strong>${data.totalAmount.toFixed(2)} €</strong></td>
            <td>
                <button class="btn-icon">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Fonction pour mettre à jour les produits les plus vendus
function updateTopProducts() {
    const container = document.getElementById('topProducts');
    const metricSelect = document.getElementById('topProductsMetric');
    if (!container || !metricSelect) return;
    
    container.innerHTML = '';
    
    const metric = metricSelect.value;
    
    // Organiser les données par produit
    const productData = {};
    filteredData.forEach(row => {
        const product = row['Nom_Produit'];
        if (!product) return;
        
        if (!productData[product]) {
            productData[product] = {
                revenue: 0,
                quantity: 0
            };
        }
        productData[product].revenue += parseFloat(row['Total_Coût_Produit (€)'] || 0);
        productData[product].quantity += parseInt(row['Quantité'] || 0);
    });
    
    // Trier et prendre les 5 premiers
    const sortedProducts = Object.entries(productData)
        .sort((a, b) => b[1][metric] - a[1][metric])
        .slice(0, 5);
    
    // Générer les éléments HTML
    sortedProducts.forEach(([product, data]) => {
        const productItem = document.createElement('div');
        productItem.className = 'product-item';
        
        // Format de l'affichage selon la métrique
        const valueDisplay = metric === 'revenue' 
            ? data.revenue.toFixed(2) + ' €' 
            : data.quantity + ' unités';
        
        productItem.innerHTML = `
            <strong>${product}</strong>
            <span>${valueDisplay}</span>
        `;
        
        container.appendChild(productItem);
    });
}

// Fonction pour mettre à jour la performance des magasins
function updateStorePerformance() {
    const container = document.getElementById('storePerformance');
    const metricSelect = document.getElementById('storePerformanceMetric');
    if (!container || !metricSelect) return;
    
    container.innerHTML = '';
    
    const metric = metricSelect.value;
    
    // Organiser les données par magasin
    const storeData = {};
    
    // Pour les transactions, compter chaque ticket une seule fois
    const ticketsByStore = {};
    
    filteredData.forEach(row => {
        const store = row['Magasin'];
        if (!store) return;
        
        if (!storeData[store]) {
            storeData[store] = {
                revenue: 0,
                transactions: 0
            };
            ticketsByStore[store] = new Set();
        }
        
        storeData[store].revenue += parseFloat(row['Total_Coût_Produit (€)'] || 0);
        
        // Compter les transactions (tickets uniques)
        const ticketId = row['Ticket_ID'];
        if (ticketId && !ticketsByStore[store].has(ticketId)) {
            ticketsByStore[store].add(ticketId);
            storeData[store].transactions++;
        }
    });
    
    // Trier et prendre les 5 premiers
    const sortedStores = Object.entries(storeData)
        .sort((a, b) => b[1][metric] - a[1][metric])
        .slice(0, 5);
    
    // Générer les éléments HTML
    sortedStores.forEach(([store, data]) => {
        const storeItem = document.createElement('div');
        storeItem.className = 'store-item';
        
        // Format de l'affichage selon la métrique
        const valueDisplay = metric === 'revenue' 
            ? data.revenue.toFixed(2) + ' €' 
            : data.transactions + ' transactions';
        
        storeItem.innerHTML = `
            <strong>${store}</strong>
            <span>${valueDisplay}</span>
        `;
        
        container.appendChild(storeItem);
    });
}

// Fonction pour charger les données du fichier CSV
function loadLocalCsvFile() {
    const csvFilePath = path.join(__dirname, 'dashboard', 'achats_clients_10000.csv');
    fetch('/api/achats')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erreur HTTP! Statut: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            allData = data; // Stocker les données dans allData
            filteredData = [...allData]; // Initialiser filteredData
            updateDashboard(); // Mettre à jour le dashboard
        })
        .catch(error => {
            console.error("Erreur lors du chargement des données:", error);
            alert("Impossible de charger les données du fichier CSV.");
        });
} 