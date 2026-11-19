
const STORAGE_KEY = "findit_items";
const CLAIM_KEY = "findit_claims";

let items = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let claims = JSON.parse(localStorage.getItem(CLAIM_KEY)) || [];

const app = document.querySelector("#app") || document.querySelector("main");

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    localStorage.setItem(CLAIM_KEY, JSON.stringify(claims));
}

function showPage(page) {
    if (!app) return;

    if (page === "Dashboard") {
        showDashboard();
    } else if (page === "Browse Items") {
        showItems();
    } else if (page === "Report Item") {
        showReportForm();
    } else if (page === "Possible Matches") {
        showMatches();
    } else if (page === "Claim Requests") {
        showClaims();
    }
}

function showDashboard() {
    const lost = items.filter(item => item.type === "Lost").length;
    const found = items.filter(item => item.type === "Found").length;
    const returned = items.filter(item => item.status === "Returned").length;

    app.innerHTML = `
        <h1>Dashboard</h1>
        <p>Welcome to FindIt!</p>

        <div class="dashboard-cards">
            <div class="card">
                <h3>Total Reports</h3>
                <h2>${items.length}</h2>
            </div>

            <div class="card">
                <h3>Lost Items</h3>
                <h2>${lost}</h2>
            </div>

            <div class="card">
                <h3>Found Items</h3>
                <h2>${found}</h2>
            </div>

            <div class="card">
                <h3>Returned Items</h3>
                <h2>${returned}</h2>
            </div>
        </div>

        <h2>Recent Reports</h2>
        <div class="item-list">
            ${items.slice(-5).reverse().map(item => `
                <div class="card">
                    <h3>${escapeHTML(item.name)}</h3>
                    <p>Category: ${escapeHTML(item.category)}</p>
                    <p>Type: ${item.type}</p>
                    <p>Location: ${escapeHTML(item.location)}</p>
                    <p>Status: ${item.status}</p>
                </div>
            `).join("") || "<p>No reports available.</p>"}
        </div>
    `;
}

function showItems() {
    app.innerHTML = `
        <h1>Browse Items</h1>

        <input type="text" id="searchItem"
            placeholder="Search items...">

        <select id="filterType">
            <option value="All">All Items</option>
            <option value="Lost">Lost Items</option>
            <option value="Found">Found Items</option>
        </select>

        <div id="itemsContainer"></div>
    `;

    document.getElementById("searchItem")
        .addEventListener("input", displayItems);

    document.getElementById("filterType")
        .addEventListener("change", displayItems);

    displayItems();
}

function displayItems() {
    const search = document.getElementById("searchItem")
        .value.toLowerCase();

    const filter = document.getElementById("filterType").value;

    const filtered = items.filter(item => {
        const matchesSearch =
            item.name.toLowerCase().includes(search) ||
            item.category.toLowerCase().includes(search) ||
            item.location.toLowerCase().includes(search);

        const matchesType =
            filter === "All" || item.type === filter;

        return matchesSearch && matchesType;
    });

    document.getElementById("itemsContainer").innerHTML =
        filtered.map(item => `
            <div class="card">
                <h3>${escapeHTML(item.name)}</h3>
                <p>Category: ${escapeHTML(item.category)}</p>
                <p>Description: ${escapeHTML(item.description)}</p>
                <p>Location: ${escapeHTML(item.location)}</p>
                <p>Date: ${item.date}</p>
                <p>Type: ${item.type}</p>
                <p>Status: ${item.status}</p>

                ${item.type === "Found" && item.status !== "Returned" ?
                    `<button onclick="submitClaim(${item.id})">
                        Claim Item
                    </button>` : ""}
            </div>
        `).join("") || "<p>No items found.</p>";
}

function showReportForm() {
    app.innerHTML = `
        <h1>Report an Item</h1>

        <form id="reportForm">

            <label>Item Name</label>
            <input type="text" id="itemName" required>

            <label>Category</label>
            <select id="itemCategory" required>
                <option value="">Select Category</option>
                <option>Electronics</option>
                <option>School Supplies</option>
                <option>Personal Belongings</option>
                <option>Clothing</option>
                <option>Accessories</option>
                <option>Others</option>
            </select>

            <label>Description</label>
            <textarea id="itemDescription" required></textarea>

            <label>Location</label>
            <input type="text" id="itemLocation" required>

            <label>Date</label>
            <input type="date" id="itemDate" required>

            <label>Report Type</label>
            <select id="itemType" required>
                <option value="Lost">Lost Item</option>
                <option value="Found">Found Item</option>
            </select>

            <label>Your Name</label>
            <input type="text" id="reporterName" required>

            <button type="submit">Submit Report</button>

        </form>
    `;

    document.getElementById("reportForm")
        .addEventListener("submit", function(event) {
            event.preventDefault();

            const newItem = {
                id: Date.now(),
                name: document.getElementById("itemName").value.trim(),
                category: document.getElementById("itemCategory").value,
                description: document.getElementById("itemDescription").value.trim(),
                location: document.getElementById("itemLocation").value.trim(),
                date: document.getElementById("itemDate").value,
                type: document.getElementById("itemType").value,
                reporter: document.getElementById("reporterName").value.trim(),
                status: "Available"
            };

            items.push(newItem);
            saveData();

            alert("Item reported successfully!");

            showDashboard();
        });
}

function showMatches() {
    const lostItems = items.filter(item =>
        item.type === "Lost" && item.status !== "Returned"
    );

    const foundItems = items.filter(item =>
        item.type === "Found" && item.status !== "Returned"
    );

    let matchesHTML = "";

    lostItems.forEach(lost => {
        foundItems.forEach(found => {
            let score = 0;

            if (lost.name.toLowerCase() === found.name.toLowerCase()) {
                score += 50;
            } else if (
                lost.name.toLowerCase().includes(found.name.toLowerCase()) ||
                found.name.toLowerCase().includes(lost.name.toLowerCase())
            ) {
                score += 30;
            }

            if (lost.category === found.category) {
                score += 25;
            }

            if (lost.location.toLowerCase() === found.location.toLowerCase()) {
                score += 25;
            }

            if (score >= 25) {
                matchesHTML += `
                    <div class="card">
                        <h3>Possible Match: ${score}%</h3>

                        <p>Lost Item: ${escapeHTML(lost.name)}</p>
                        <p>Found Item: ${escapeHTML(found.name)}</p>
                        <p>Category: ${escapeHTML(found.category)}</p>
                        <p>Location: ${escapeHTML(found.location)}</p>
                    </div>
                `;
            }
        });
    });

    app.innerHTML = `
        <h1>Possible Matches</h1>
        ${matchesHTML || "<p>No possible matches found.</p>"}
    `;
}

function submitClaim(itemId) {
    const item = items.find(item => item.id === itemId);

    if (!item) return;

    const claimant = prompt("Enter your name:");

    if (!claimant || !claimant.trim()) return;

    claims.push({
        id: Date.now(),
        itemId: itemId,
        itemName: item.name,
        claimant: claimant.trim(),
        status: "Pending"
    });

    saveData();

    alert("Claim request submitted successfully!");

    showItems();
}

function showClaims() {
    app.innerHTML = `
        <h1>Claim Requests</h1>

        ${claims.map(claim => `
            <div class="card">
                <h3>${escapeHTML(claim.itemName)}</h3>
                <p>Claimant: ${escapeHTML(claim.claimant)}</p>
                <p>Status: ${claim.status}</p>

                ${claim.status === "Pending" ? `
                    <button onclick="updateClaim(${claim.id}, 'Approved')">
                        Approve
                    </button>

                    <button onclick="updateClaim(${claim.id}, 'Rejected')">
                        Reject
                    </button>
                ` : ""}
            </div>
        `).join("") || "<p>No claim requests yet.</p>"}
    `;
}

function updateClaim(claimId, status) {
    const claim = claims.find(claim => claim.id === claimId);

    if (!claim) return;

    claim.status = status;

    if (status === "Approved") {
        const item = items.find(item => item.id === claim.itemId);

        if (item) {
            item.status = "Returned";
        }
    }

    saveData();
    showClaims();
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

document.addEventListener("DOMContentLoaded", function() {
    showDashboard();
});
