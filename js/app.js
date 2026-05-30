/* ==========================================
   家庭点餐 - 核心逻辑
   ========================================== */

// ===== Bmob 配置 =====
// ⚠️ 请将下面的值替换为你自己的 Bmob 密钥
const BMOB_APP_ID  = 'abfeca061abca0b733b0b88e69825f57';
const BMOB_API_KEY = 'ec05027585424bc7adce38afa2e5e344';

Bmob.initialize(BMOB_APP_ID, BMOB_API_KEY);

// ===== 数据表名 =====
const DISHES_TABLE  = 'Dishes';   // 菜品表
const ORDERS_TABLE  = 'Orders';   // 订单表

// ===== 分类定义 =====
const CATEGORIES = [
  { id: '鸡类',     icon: '🐔', label: '鸡类' },
  { id: '鸭类',     icon: '🦆', label: '鸭类' },
  { id: '鱼类',     icon: '🐟', label: '鱼类' },
  { id: '海鲜水产', icon: '🦐', label: '海鲜' },
  { id: '猪肉',     icon: '🥩', label: '猪肉' },
  { id: '牛羊肉',   icon: '🐂', label: '牛羊肉' },
  { id: '蔬菜素菜', icon: '🥬', label: '素菜' },
  { id: '汤羹',     icon: '🍲', label: '汤羹' },
  { id: '凉菜',     icon: '🥗', label: '凉菜' },
  { id: '主食',     icon: '🍜', label: '主食' },
  { id: '小吃甜品', icon: '🍪', label: '甜品' },
  { id: '饮品',     icon: '🥤', label: '饮品' },
];

// ===== 全局状态 =====
let allDishes = [];          // 所有菜品
let currentCategory = '';    // 当前选中分类
let cart = {};               // 购物车 { dishId: count }

// ===== 页面切换 =====
function switchPage(page) {
  // 更新导航栏
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === page);
  });
  // 切换页面
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  // 更新标题
  const titles = { menu: '菜单', orders: '订单', my: '我的' };
  document.getElementById('page-title').textContent = titles[page];
  // 切换到订单页时加载订单
  if (page === 'orders') loadOrders();
  if (page === 'my') loadMyDishes();
}

// ===== Toast 提示 =====
function showToast(msg) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2000);
}

// ===== 菜单页 =====
async function loadDishes() {
  try {
    const query = Bmob.Query(DISHES_TABLE);
    query.order('-createdAt');
    const res = await query.find();
    allDishes = res.results || [];
    
    // 默认选第一个有数据的分类
    const catsWithDishes = CATEGORIES.filter(c => 
      allDishes.some(d => d.category === c.id)
    );
    currentCategory = catsWithDishes.length > 0 ? catsWithDishes[0].id : CATEGORIES[0].id;
    
    renderCategories();
    renderDishes();
    document.getElementById('menu-loading')?.remove();
  } catch (err) {
    console.error('加载菜品失败:', err);
    document.getElementById('menu-loading').innerHTML = '<p>加载失败，请刷新重试</p>';
  }
}

function renderCategories() {
  const container = document.getElementById('category-list');
  container.innerHTML = CATEGORIES.map(cat => {
    const count = allDishes.filter(d => d.category === cat.id).length;
    return `
      <div class="category-item ${cat.id === currentCategory ? 'active' : ''}" 
           onclick="selectCategory('${cat.id}')">
        <div>${cat.icon}</div>
        <div>${cat.label}</div>
        ${count > 0 ? `<div class="cat-count">${count}</div>` : ''}
      </div>
    `;
  }).join('');
}

function selectCategory(catId) {
  currentCategory = catId;
  renderCategories();
  renderDishes();
}

function renderDishes() {
  const container = document.getElementById('dish-list');
  const filtered = allDishes.filter(d => d.category === currentCategory);
  
  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding-top:60px">
        <div class="empty-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ddd" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <p class="empty-title">这个分类还没有菜品</p>
        <p class="empty-sub">去「我的」页面添加吧~</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = filtered.map(dish => {
    const count = cart[dish.objectId] || 0;
    const imgUrl = dish.imageUrl || '';
    return `
      <div class="dish-card">
        ${imgUrl 
          ? `<img class="dish-image" src="${imgUrl}" alt="${dish.name}" loading="lazy">`
          : `<div class="dish-image" style="display:flex;align-items:center;justify-content:center;font-size:28px;">${getCategoryIcon(dish.category)}</div>`
        }
        <div class="dish-info">
          <div class="dish-name">${dish.name}</div>
          <div class="dish-meta">${dish.category}</div>
        </div>
        <div class="dish-action">
          ${count > 0 
            ? `<button class="btn-remove-cart" onclick="removeFromCart('${dish.objectId}')">-</button>`
            : ''
          }
          ${count > 0 
            ? `<span style="margin:0 8px;font-weight:600;">${count}</span>`
            : ''
          }
          <button class="btn-add-cart" onclick="addToCart('${dish.objectId}')">+</button>
        </div>
      </div>
    `;
  }).join('');
}

function getCategoryIcon(catId) {
  const cat = CATEGORIES.find(c => c.id === catId);
  return cat ? cat.icon : '🍽️';
}

// ===== 购物车 =====
function addToCart(dishId) {
  cart[dishId] = (cart[dishId] || 0) + 1;
  updateCart();
  renderDishes();
}

function removeFromCart(dishId) {
  if (cart[dishId] > 1) {
    cart[dishId]--;
  } else {
    delete cart[dishId];
  }
  updateCart();
  renderDishes();
}

function updateCart() {
  const total = Object.values(cart).reduce((sum, n) => sum + n, 0);
  const cartBar = document.getElementById('cart-bar');
  
  if (total > 0) {
    cartBar.style.display = 'flex';
    document.getElementById('cart-count').textContent = total;
    document.getElementById('cart-count-text').textContent = total;
  } else {
    cartBar.style.display = 'none';
  }
}

// ===== 下单 =====
async function submitOrder() {
  const dishIds = Object.keys(cart);
  if (dishIds.length === 0) {
    showToast('请先选择菜品');
    return;
  }
  
  // 构建订单数据
  const dishes = dishIds.map(id => {
    const dish = allDishes.find(d => d.objectId === id);
    return {
      name: dish.name,
      category: dish.category,
      imageUrl: dish.imageUrl || '',
      count: cart[id]
    };
  });
  
  try {
    const query = Bmob.Query(ORDERS_TABLE);
    query.set('dishes', JSON.stringify(dishes));
    query.set('date', new Date().toISOString());
    query.set('total', Object.values(cart).reduce((s, n) => s + n, 0));
    await query.save();
    
    cart = {};
    updateCart();
    renderDishes();
    showToast('下单成功！');
  } catch (err) {
    console.error('下单失败:', err);
    showToast('下单失败，请重试');
  }
}

// ===== 订单页 =====
async function loadOrders() {
  const container = document.getElementById('order-list');
  const emptyState = document.getElementById('empty-orders');
  
  try {
    const query = Bmob.Query(ORDERS_TABLE);
    query.order('-createdAt');
    query.limit(50);
    const res = await query.find();
    const orders = res.results || [];
    
    if (orders.length === 0) {
      container.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }
    
    emptyState.style.display = 'none';
    container.innerHTML = orders.map(order => {
      const dishes = JSON.parse(order.dishes || '[]');
      const date = new Date(order.date || order.createdAt);
      const dateStr = formatDate(date);
      
      return `
        <div class="order-card">
          <div class="order-header">
            <div class="order-date">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              ${dateStr}
            </div>
            <div class="order-status">${order.total || dishes.length} 道菜</div>
          </div>
          <div class="order-dishes">
            ${dishes.map(d => `
              <div class="order-dish-item">
                ${d.imageUrl 
                  ? `<img class="order-dish-img" src="${d.imageUrl}" alt="${d.name}">`
                  : `<div class="order-dish-img" style="display:flex;align-items:center;justify-content:center;font-size:18px;">${getCategoryIcon(d.category)}</div>`
                }
                <span class="order-dish-name">${d.name} ${d.count > 1 ? '×' + d.count : ''}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('加载订单失败:', err);
  }
}

function formatDate(date) {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${m}月${d}日 ${h}:${min}`;
}

// ===== 我的页 - 添加菜品 =====
let selectedFile = null;

function previewImage(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  selectedFile = file;
  const reader = new FileReader();
  reader.onload = function(e) {
    const preview = document.getElementById('image-preview');
    preview.src = e.target.result;
    preview.style.display = 'block';
    document.getElementById('upload-placeholder').style.display = 'none';
  };
  reader.readAsDataURL(file);
}

async function addDish() {
  const name = document.getElementById('dish-name').value.trim();
  const category = document.getElementById('dish-category').value;
  
  if (!name) {
    showToast('请输入菜品名称');
    return;
  }
  
  try {
    // 上传图片到 Bmob 文件存储
    let imageUrl = '';
    if (selectedFile) {
      const file = new Bmob.File(selectedFile.name, selectedFile);
      const res = await file.save();
      imageUrl = res.url || res.cdn || '';
    }
    
    // 保存菜品数据
    const query = Bmob.Query(DISHES_TABLE);
    query.set('name', name);
    query.set('category', category);
    query.set('imageUrl', imageUrl);
    await query.save();
    
    showToast('添加成功！');
    
    // 清空表单
    document.getElementById('dish-name').value = '';
    document.getElementById('dish-image').value = '';
    document.getElementById('image-preview').style.display = 'none';
    document.getElementById('upload-placeholder').style.display = 'block';
    selectedFile = null;
    
    // 刷新数据
    await loadDishes();
    loadMyDishes();
  } catch (err) {
    console.error('添加菜品失败:', err);
    showToast('添加失败，请重试');
  }
}

// ===== 我的页 - 菜品列表 =====
async function loadMyDishes() {
  const container = document.getElementById('my-dish-list');
  try {
    const query = Bmob.Query(DISHES_TABLE);
    query.order('-createdAt');
    const res = await query.find();
    const dishes = res.results || [];
    
    if (dishes.length === 0) {
      container.innerHTML = '<div class="loading"><p>还没有菜品，快去添加吧~</p></div>';
      return;
    }
    
    container.innerHTML = dishes.map(dish => `
      <div class="my-dish-item">
        ${dish.imageUrl 
          ? `<img class="my-dish-img" src="${dish.imageUrl}" alt="${dish.name}">`
          : `<div class="my-dish-img" style="display:flex;align-items:center;justify-content:center;font-size:20px;">${getCategoryIcon(dish.category)}</div>`
        }
        <div class="my-dish-info">
          <div class="my-dish-name">${dish.name}</div>
          <div class="my-dish-cat">${dish.category}</div>
        </div>
        <button class="btn-delete" onclick="deleteDish('${dish.objectId}')">删除</button>
      </div>
    `).join('');
  } catch (err) {
    console.error('加载菜品列表失败:', err);
  }
}

async function deleteDish(dishId) {
  if (!confirm('确定要删除这道菜吗？')) return;
  
  try {
    const query = Bmob.Query(DISHES_TABLE);
    await query.destroy(dishId);
    showToast('已删除');
    loadMyDishes();
    loadDishes(); // 刷新菜单
  } catch (err) {
    console.error('删除失败:', err);
    showToast('删除失败');
  }
}

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', () => {
  loadDishes();
});
