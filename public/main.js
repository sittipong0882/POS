// main.js

// Function to send data to Google Sheets using Apps Script URL
// ปรับฟังก์ชัน saveToGoogleSheets ให้คืนค่า Promise<boolean>
function saveToGoogleSheets(data) {
    return fetch('https://script.google.com/macros/s/AKfycbyUANiBO8y25Pgp0ZV2g4DKJuUAkMLvAzyzeNg6ShnApu-7-bz3NzwP2ils-WcxwKRT/exec', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(result => {
            console.log('Success:', result);
            return true;  // คืนค่า true เมื่อสำเร็จ
        })
        .catch(error => {
            console.error('Error:', error);
            return false; // คืนค่า false เมื่อเกิดข้อผิดพลาด
        });
}


// Google Sheets Configuration
const GOOGLE_SHEETS_URL = 'https://docs.google.com/spreadsheets/d/1H83uZSGkKSe5vNeRufTx8DC4U_t4a0qJIFG27e4vnEM/edit?gid=0#gid=0';

// Sample data
let products = [
    { id: 1, name: 'ชาไทย', price: 25, cost: 12, stock: 50, category: 'ชา' },
    { id: 2, name: 'กาแฟเย็น', price: 30, cost: 15, stock: 40, category: 'กาแฟ' },
    { id: 3, name: 'น้ำส้มคั้น', price: 35, cost: 18, stock: 30, category: 'น้ำผลไม้' },
    { id: 4, name: 'โกโก้เย็น', price: 28, cost: 14, stock: 35, category: 'โกโก้' },
    { id: 5, name: 'น้ำเปล่า', price: 10, cost: 5, stock: 100, category: 'น้ำ' },
    { id: 6, name: 'ชาเขียว', price: 25, cost: 13, stock: 45, category: 'ชา' },
    { id: 7, name: 'น้ำมะนาว', price: 20, cost: 8, stock: 60, category: 'น้ำผลไม้' }
];

let materials = [
    { id: 1, name: 'น้ำ', unit: 'ลิตร', stock: 500, cost: 2, minStock: 50 },
    { id: 2, name: 'น้ำแข็ง', unit: 'กิโลกรัม', stock: 20, cost: 10, minStock: 5 },
    { id: 3, name: 'แก้วพลาสติก', unit: 'ใบ', stock: 200, cost: 1.5, minStock: 50 },
    { id: 4, name: 'ฝาแก้ว', unit: 'ใบ', stock: 180, cost: 0.5, minStock: 40 },
    { id: 5, name: 'หลอดดูด', unit: 'อัน', stock: 150, cost: 0.3, minStock: 30 },
    { id: 6, name: 'น้ำตาล', unit: 'กิโลกรัม', stock: 25, cost: 25, minStock: 5 },
    { id: 7, name: 'นม', unit: 'ลิตร', stock: 15, cost: 35, minStock: 5 }
];

let sales = [];
let cart = [];

// Initialize
// ...ย้ายฟังก์ชันทั้งหมดจาก index.html มาวางตรงนี้...

async function processSale(event) {
    console.log('processSale called');
    if (cart.length === 0) {
        showAlert('ไม่มีสินค้าในตะกร้า', 'error');
        return;
    }
    const button = event.target;
    const originalText = button.innerHTML;

    button.innerHTML = '<span class="loading"></span> กำลังบันทึก...';
    button.disabled = true;

    const today = new Date().toISOString().split('T')[0];
    const timestamp = new Date().toISOString();
    const saleData = cart.map((item, index) => ({
        id: Date.now() + index,
        date: today,
        timestamp: timestamp,
        productId: item.id,
        productName: item.name,
        quantity: item.quantity,
        price: item.price,
        cost: item.cost,
        revenue: item.price * item.quantity,
        profit: (item.price - item.cost) * item.quantity
    }));

    try {
        const success = await saveToGoogleSheets(saleData);
        if (success) {
            sales.push(...saleData);
            console.log('sales after push:', sales);
            cart.forEach(cartItem => {
                const product = products.find(p => p.id === cartItem.id);
                if (product) {
                    product.stock -= cartItem.quantity;
                }
            });
            saveData();
            cart = [];
            updateCartDisplay();
            renderProducts();
            updateDashboard();
            updateRecentSales();
            showAlert('✅ บันทึกการขายเรียบร้อย! ข้อมูลได้ถูกบันทึกไปยัง Google Sheets แล้ว', 'success');
        } else {
            throw new Error('ไม่สามารถบันทึกไปยัง Google Sheets ได้');
        }
    } catch (error) {
        console.error('Error processing sale:', error);
        showAlert('❌ เกิดข้อผิดพลาดในการบันทึกการขาย กรุณาลองใหม่อีกครั้ง', 'error');
    } finally {
        button.innerHTML = originalText;
        button.disabled = false;
    }
}

function updateCurrentDate() {
    const now = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    document.getElementById('currentDate').textContent = now.toLocaleDateString('th-TH', options);
}
function loadData() {
    const savedSales = localStorage.getItem('beveragePOSSales');
    if (savedSales) sales = JSON.parse(savedSales);
    const savedProducts = localStorage.getItem('beveragePOSProducts');
    if (savedProducts) products = JSON.parse(savedProducts);
    const savedMaterials = localStorage.getItem('beveragePOSMaterials');
    if (savedMaterials) materials = JSON.parse(savedMaterials);
}
function saveData() {
    localStorage.setItem('beveragePOSSales', JSON.stringify(sales));
    localStorage.setItem('beveragePOSProducts', JSON.stringify(products));
    localStorage.setItem('beveragePOSMaterials', JSON.stringify(materials));
}
function renderProducts() {
    const html = products.map(product => {
        const stockStatus = product.stock <= 10 ? 'status-low' : product.stock <= 20 ? 'status-medium' : 'status-good';
        return `
            <div class="product-card">
                <div class="product-image" style="text-align:center; margin-bottom:10px;">
                    ${product.image ? `<img src="${product.image}" alt="${product.name}" style="max-width:100%; max-height:150px; border-radius:8px;">`
                : '<div style="width:100%; height:150px; background:#eee; display:flex; align-items:center; justify-content:center; color:#999; border-radius:8px;">ไม่มีรูปภาพ</div>'}
                </div>
                <div class="product-name">${product.name}</div>
                <div class="product-category">${product.category}</div>
                <div class="product-price">฿${product.price.toLocaleString()}</div>
                <div class="product-stock">
                    สต็อก: <span class="status-badge ${stockStatus}">${product.stock}</span>
                </div>
                <div style="color: #666; margin-bottom: 15px; font-size: 0.9rem;">
                    กำไร: ฿${(product.price - product.cost).toLocaleString()}/แก้ว
                </div>
                <button class="btn btn-primary" onclick="addToCart(${product.id})" ${product.stock === 0 ? 'disabled' : ''}>
                    🛒 เพิ่มลงตะกร้า
                </button>
            </div>
        `;
    }).join('');
    document.getElementById('productsList').innerHTML = html;
}


function previewProductImage(event) {
    const preview = document.getElementById('productImagePreview');
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            preview.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width: 100%; border-radius: 8px;">`;
        };
        reader.readAsDataURL(file);
    } else {
        preview.innerHTML = '';
    }
}


function addProduct(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    const name = formData.get('name').trim();
    const price = parseFloat(formData.get('price'));
    const cost = parseFloat(formData.get('cost'));
    const stock = parseInt(formData.get('stock'));
    const category = formData.get('category').trim();
    const imageInput = document.getElementById('productImageInput');
    const file = imageInput.files[0];

    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const imageBase64 = e.target.result;
            saveProduct(name, price, cost, stock, category, imageBase64);
        };
        reader.readAsDataURL(file);
    } else {
        saveProduct(name, price, cost, stock, category, null);
    }
}


function saveProduct(name, price, cost, stock, category, image) {
    const newId = products.length ? Math.max(...products.map(p => p.id)) + 1 : 1;
    const newProduct = { id: newId, name, price, cost, stock, category, image };
    products.push(newProduct);
    saveData();
    console.log('Added product:', newProduct);  // <-- เช็คตรงนี้
    renderProducts();
    renderProductsTable();
    closeModal('addProductModal');
    showAlert('✅ เพิ่มสินค้าเรียบร้อย', 'success');
}



function renderProductsTable() {
    const html = `
        <table class="table">
            <thead>
                <tr>
                    <th>สินค้า</th>
                    <th>หมวดหมู่</th>
                    <th>ราคาขาย</th>
                    <th>ต้นทุน</th>
                    <th>กำไร/แก้ว</th>
                    <th>สต็อก</th>
                    <th>จัดการ</th>
                </tr>
            </thead>
            <tbody>
                ${products.map(product => {
        const stockStatus = product.stock <= 10 ? 'status-low' : product.stock <= 20 ? 'status-medium' : 'status-good';
        return `
                        <tr>
                            <td style="font-weight: 600;">${product.name}</td>
                            <td>${product.category}</td>
                            <td style="text-align: right;">฿${product.price.toLocaleString()}</td>
                            <td style="text-align: right;">฿${product.cost.toLocaleString()}</td>
                            <td style="text-align: right; color: #28a745; font-weight: 600;">฿${(product.price - product.cost).toLocaleString()}</td>
                            <td style="text-align: center;">
                                <span class="status-badge ${stockStatus}">${product.stock}</span>
                            </td>
                            <td style="text-align: center;">
                                <button class="btn btn-primary" style="padding: 8px 16px; margin-right: 8px; font-size: 0.9rem;" onclick="editProduct(${product.id})">✏️ แก้ไข</button>
                                <button class="btn btn-danger" style="padding: 8px 16px; font-size: 0.9rem;" onclick="deleteProduct(${product.id})">🗑️ ลบ</button>
                            </td>
                        </tr>
                    `;
    }).join('')}
            </tbody>
        </table>
    `;
    document.getElementById('productsTable').innerHTML = html;
}
function renderMaterialsTable() {
    const html = `
        <table class="table">
            <thead>
                <tr>
                    <th>วัตถุดิบ</th>
                    <th>หน่วย</th>
                    <th>สต็อกปัจจุบัน</th>
                    <th>สต็อกขั้นต่ำ</th>
                    <th>ต้นทุน/หน่วย</th>
                    <th>สถานะ</th>
                    <th>จัดการ</th>
                </tr>
            </thead>
            <tbody>
                ${materials.map(material => {
        const isLow = material.stock <= material.minStock;
        return `
                        <tr>
                            <td style="font-weight: 600;">${material.name}</td>
                            <td>${material.unit}</td>
                            <td style="text-align: center; font-weight: 600;">${material.stock}</td>
                            <td style="text-align: center;">${material.minStock}</td>
                            <td style="text-align: right;">฿${material.cost.toLocaleString()}</td>
                            <td style="text-align: center;">
                                <span class="status-badge ${isLow ? 'status-low' : 'status-good'}">${isLow ? '⚠️ ต่ำ' : '✅ ปกติ'}</span>
                            </td>
                            <td style="text-align: center;">
                                <button class="btn btn-success" style="padding: 8px 12px; margin-right: 5px; font-size: 0.9rem;" onclick="addStock(${material.id})">➕ เพิ่ม</button>
                                <button class="btn btn-primary" style="padding: 8px 12px; margin-right: 5px; font-size: 0.9rem;" onclick="editMaterial(${material.id})">✏️ แก้ไข</button>
                                <button class="btn btn-danger" style="padding: 8px 12px; font-size: 0.9rem;" onclick="deleteMaterial(${material.id})">🗑️ ลบ</button>
                            </td>
                        </tr>
                    `;
    }).join('')}
            </tbody>
        </table>
    `;
    document.getElementById('materialsTable').innerHTML = html;
}
function updateRecentSales() {
    const recent = sales.slice(-10).reverse();
    const container = document.getElementById('recentSales');
    if (recent.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="icon">📝</div><p>ยังไม่มีประวัติการขาย</p></div>`;
        return;
    }
    const html = `
        <div class="table-container">
            <table class="table">
                <thead>
                    <tr>
                        <th>วันที่/เวลา</th>
                        <th>สินค้า</th>
                        <th>จำนวน</th>
                        <th>ราคา</th>
                        <th>รวม</th>
                        <th>กำไร</th>
                    </tr>
                </thead>
                <tbody>
                    ${recent.map(sale => `
                        <tr>
                            <td>${new Date(sale.timestamp || sale.date).toLocaleString('th-TH')}</td>
                            <td style="font-weight: 600;">${sale.productName}</td>
                            <td style="text-align: center;">${sale.quantity}</td>
                            <td style="text-align: right;">฿${sale.price.toLocaleString()}</td>
                            <td style="text-align: right; font-weight: 600;">฿${(sale.quantity * sale.price).toLocaleString()}</td>
                            <td style="text-align: right; color: #28a745; font-weight: 600;">฿${(sale.quantity * (sale.price - sale.cost)).toLocaleString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    container.innerHTML = html;
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product || product.stock === 0) return;
    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        if (existingItem.quantity < product.stock) {
            existingItem.quantity += 1;
        } else {
            showAlert('สต็อกไม่เพียงพอ!', 'error');
            return;
        }
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    updateCartDisplay();
}
function updateCartDisplay() {
    const cartContainer = document.getElementById('cartItems');
    const cartSummary = document.getElementById('cartSummary');
    if (cart.length === 0) {
        cartContainer.innerHTML = `<div class="empty-state"><div class="icon">🛒</div><p>ไม่มีสินค้าในตะกร้า</p></div>`;
        cartSummary.style.display = 'none';
        return;
    }
    const html = cart.map(item => `
        <div class="cart-item">
            <div>
                <div style="font-weight: 600; margin-bottom: 5px;">${item.name}</div>
                <div style="color: #666; font-size: 0.9rem;">฿${item.price.toLocaleString()} × ${item.quantity} = ฿${(item.price * item.quantity).toLocaleString()}</div>
            </div>
            <div class="quantity-controls">
                <button class="quantity-btn" onclick="updateCartQuantity(${item.id}, -1)">-</button>
                <span style="margin: 0 10px; font-weight: 600;">${item.quantity}</span>
                <button class="quantity-btn" onclick="updateCartQuantity(${item.id}, 1)">+</button>
                <button class="btn btn-danger" style="margin-left: 10px; padding: 8px 12px; font-size: 0.9rem;" onclick="removeFromCart(${item.id})">🗑️</button>
            </div>
        </div>
    `).join('');
    cartContainer.innerHTML = html;
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const profit = cart.reduce((sum, item) => sum + ((item.price - item.cost) * item.quantity), 0);
    document.getElementById('cartTotal').textContent = '฿' + total.toLocaleString();
    document.getElementById('cartProfit').textContent = '฿' + profit.toLocaleString();
    cartSummary.style.display = 'block';
}
function updateCartQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    const product = products.find(p => p.id === productId);
    if (!item || !product) return;
    const newQuantity = item.quantity + change;
    if (newQuantity <= 0) {
        cart = cart.filter(item => item.id !== productId);
    } else if (newQuantity <= product.stock) {
        item.quantity = newQuantity;
    } else {
        showAlert('สต็อกไม่เพียงพอ!', 'error');
        return;
    }
    updateCartDisplay();
}
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartDisplay();
}
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type === 'success' ? 'success' : 'danger'}`;
    alertDiv.innerHTML = message;
    alertDiv.style.position = 'fixed';
    alertDiv.style.top = '20px';
    alertDiv.style.right = '20px';
    alertDiv.style.zIndex = '9999';
    alertDiv.style.minWidth = '350px';
    alertDiv.style.maxWidth = '500px';
    alertDiv.style.boxShadow = '0 15px 35px rgba(0,0,0,0.2)';
    alertDiv.style.animation = 'slideInRight 0.3s ease';
    document.body.appendChild(alertDiv);
    setTimeout(() => {
        alertDiv.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (alertDiv.parentNode) alertDiv.remove();
        }, 300);
    }, 4000);
}
function updateDashboard() {
    const today = new Date().toISOString().split('T')[0];
    const todaySales = sales.filter(sale => sale.date === today);
    const todayRevenue = todaySales.reduce((sum, sale) => sum + (sale.quantity * sale.price), 0);
    const todayProfit = todaySales.reduce((sum, sale) => sum + (sale.quantity * (sale.price - sale.cost)), 0);
    const todayQuantity = todaySales.reduce((sum, sale) => sum + sale.quantity, 0);
    const currentMonth = new Date().toISOString().substring(0, 7);
    const monthSales = sales.filter(sale => sale.date.startsWith(currentMonth));
    const monthRevenue = monthSales.reduce((sum, sale) => sum + (sale.quantity * sale.price), 0);
    document.getElementById('todayRevenue').textContent = '฿' + todayRevenue.toLocaleString();
    document.getElementById('todayProfit').textContent = '฿' + todayProfit.toLocaleString();
    document.getElementById('todayQuantity').textContent = todayQuantity.toLocaleString();
    document.getElementById('monthRevenue').textContent = '฿' + monthRevenue.toLocaleString();
}
function updateLowStockAlert() {
    const lowStockMaterials = materials.filter(m => m.stock <= m.minStock);
    const alertDiv = document.getElementById('lowStockAlert');
    const listDiv = document.getElementById('lowStockList');
    if (lowStockMaterials.length > 0) {
        alertDiv.style.display = 'block';
        const html = lowStockMaterials.map(material => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: rgba(255, 107, 107, 0.1); border: 1px solid rgba(255, 107, 107, 0.3); border-radius: 10px; margin-bottom: 10px;">
                <div>
                    <div style="font-weight: 600; color: #dc3545;">${material.name}</div>
                    <div style="color: #666; font-size: 0.9rem;">เหลือ: ${material.stock} ${material.unit} (ขั้นต่ำ: ${material.minStock})</div>
                </div>
                <button class="btn btn-warning" style="padding: 8px 16px;" onclick="addStock(${material.id})">➕ เพิ่มสต็อก</button>
            </div>
        `).join('');
        listDiv.innerHTML = html;
    } else {
        alertDiv.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', function () {
    updateCurrentDate && updateCurrentDate();
    loadData && loadData();
    updateDashboard && updateDashboard();
    renderProducts && renderProducts();
    renderProductsTable && renderProductsTable();
    renderMaterialsTable && renderMaterialsTable();
    updateRecentSales && updateRecentSales();
    updateLowStockAlert && updateLowStockAlert();
});

