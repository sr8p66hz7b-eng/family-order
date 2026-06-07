const DT='Dishes',OT='Orders';
const CATS=[{id:'猪肉',icon:'🐖',label:'猪肉'},{id:'鸡类',icon:'🐔',label:'鸡类'},{id:'鸭类',icon:'🦆',label:'鸭类'},{id:'鱼类',icon:'🐟',label:'鱼类'},{id:'海鲜水产',icon:'🦐',label:'海鲜'},{id:'牛羊肉',icon:'🐂',label:'牛羊肉'},{id:'蔬菜素菜',icon:'🥬',label:'素菜'},{id:'汤羹',icon:'🍲',label:'汤羹'},{id:'凉菜',icon:'🥗',label:'凉菜'},{id:'主食',icon:'🍜',label:'主食'},{id:'小吃甜品',icon:'🍪',label:'甜品'},{id:'饮品',icon:'🥤',label:'饮品'}];
const LOCAL_DISHES=[
  {objectId:'local_1',name:'辣椒炒肉',category:'猪肉',imageUrl:'img/辣椒炒肉.jpg'},
  {objectId:'local_2',name:'土豆焖排骨',category:'猪肉',imageUrl:'img/土豆焖排骨.jpg'},
  {objectId:'local_3',name:'油豆腐焖五花肉',category:'猪肉',imageUrl:'img/油豆腐焖五花肉.jpg'},
  {objectId:'local_4',name:'油豆腐焖排骨',category:'猪肉',imageUrl:'img/油豆腐焖排骨.jpg'},
  {objectId:'local_5',name:'水煮牛肉',category:'牛羊肉',imageUrl:'img/水煮牛肉.jpg'},
  {objectId:'local_6',name:'白灼菜心',category:'蔬菜素菜',imageUrl:'img/白灼菜心.jpg'}
];
let allDishes=[],curCat='',cart={},currentUser='嘟嘟';

/* ===== 身份选择 ===== */
function selectUser(name){
  currentUser=name;
  document.querySelectorAll('.user-chip').forEach(c=>c.classList.toggle('active',c.dataset.user===name));
  localStorage.setItem('fo_user',name);
}

/* ===== 页面切换 ===== */
function switchPage(p){
  document.querySelectorAll('.nav-item').forEach(i=>i.classList.toggle('active',i.dataset.page===p));
  document.querySelectorAll('.page').forEach(q=>q.classList.remove('active'));
  document.getElementById('page-'+p).classList.add('active');
  const t={menu:'菜单',orders:'订单',my:'我的'};
  document.getElementById('page-title').textContent=t[p];
  if(p==='orders')renderCartPage();
  if(p==='my')loadMyDishes();
}

/* ===== 工具函数 ===== */
function showToast(m){const o=document.querySelector('.toast');if(o)o.remove();const e=document.createElement('div');e.className='toast';e.textContent=m;document.body.appendChild(e);setTimeout(()=>e.remove(),2000)}
function getCatIcon(id){const c=CATS.find(x=>x.id===id);return c?c.icon:'🍽️'}

/* ===== 菜品加载 ===== */
async function loadDishes(){
  allDishes=[...LOCAL_DISHES];
  const usedCats=CATS.filter(c=>allDishes.some(d=>d.category===c.id));
  curCat=usedCats.length>0?usedCats[0].id:CATS[0].id;
  renderCategories();renderDishes();
  document.getElementById('menu-loading')?.remove();
}

/* ===== 左侧分类栏 ===== */
function renderCategories(){
  document.getElementById('category-list').innerHTML=CATS.map(c=>{
    const n=allDishes.filter(d=>d.category===c.id).length;
    if(n===0)return '';
    return '<div class="category-item '+(c.id===curCat?'active':'')+'" onclick="selectCat(\''+c.id+'\')">'
      +'<span class="cat-icon">'+c.icon+'</span>'
      +'<span class="cat-label">'+c.label+'</span>'
      +'<span class="cat-count">'+n+'</span></div>';
  }).join('');
}
function selectCat(id){curCat=id;renderCategories();renderDishes()}

/* ===== 菜品列表（左文右图） ===== */
function renderDishes(){
  const c=document.getElementById('dish-list'),items=allDishes.filter(d=>d.category===curCat);
  if(!items.length){
    c.innerHTML='<div class="empty-state" style="padding-top:60px"><p class="empty-title">这个分类还没有菜品</p><p class="empty-sub">去「我的」页面添加吧~</p></div>';
    return;
  }
  c.innerHTML=items.map(d=>{
    const icon=getCatIcon(d.category);
    return '<div class="dish-card">'
      +'<div class="dish-info"><div><div class="dish-name">'+d.name+'</div><div class="dish-meta">'+d.category+'</div></div>'
      +'<div class="dish-action"><button class="btn-add-cart" onclick="addToCart(\''+d.objectId+'\')">下单</button></div></div>'
      +(d.imageUrl?'<img class="dish-image" src="'+d.imageUrl+'" alt="'+d.name+'" loading="lazy">':'<div class="dish-placeholder">'+icon+'</div>')
      +'</div>';
  }).join('');
}

/* ===== 加入购物车 ===== */
function addToCart(id){cart[id]=(cart[id]||0)+1;showToast('已加入购物车')}

/* ===== 订单页（购物车） ===== */
function renderCartPage(){
  const ids=Object.keys(cart);
  const cartItems=document.getElementById('cart-items');
  const cartEmpty=document.getElementById('cart-empty');
  const cartBottom=document.getElementById('cart-bottom');
  const orderHistory=document.getElementById('order-history');
  if(ids.length===0){
    cartItems.innerHTML='';
    cartEmpty.style.display='block';
    cartBottom.style.display='none';
    loadOrderHistory();
    return;
  }
  cartEmpty.style.display='none';
  cartBottom.style.display='block';
  orderHistory.style.display='none';
  let total=0;
  cartItems.innerHTML='<div class="card" style="margin:12px;border-radius:14px;padding:0">'
    +ids.map(id=>{
      const d=allDishes.find(x=>x.objectId===id);if(!d)return '';
      const n=cart[id];total+=n;const icon=getCatIcon(d.category);
      return '<div class="cart-item">'
        +(d.imageUrl?'<img class="cart-item-img" src="'+d.imageUrl+'" alt="'+d.name+'">':'<div class="cart-item-placeholder">'+icon+'</div>')
        +'<div class="cart-item-info"><div class="cart-item-name">'+d.name+'</div><div class="cart-item-cat">'+d.category+'</div></div>'
        +'<div class="cart-item-qty"><button class="qty-btn" onclick="cartQty(\''+id+'\',-1)">&#8722;</button><span class="qty-num">'+n+'</span><button class="qty-btn" onclick="cartQty(\''+id+'\',1)">+</button></div></div>';
    }).join('')+'</div>';
  document.getElementById('cart-total-num').textContent=total;
}
function cartQty(id,delta){cart[id]=(cart[id]||0)+delta;if(cart[id]<=0)delete cart[id];renderCartPage()}

/* ===== 下单（保存到localStorage） ===== */
function submitOrder(){
  const ids=Object.keys(cart);
  if(!ids.length){showToast('请先选择菜品');return}
  const note=document.getElementById('order-note').value.trim();
  const dishes=ids.map(id=>{
    const d=allDishes.find(x=>x.objectId===id);
    return{name:d.name,category:d.category,imageUrl:d.imageUrl||'',count:cart[id]};
  });
  const order={
    id:'o_'+Date.now(),
    user:currentUser,
    dishes:dishes,
    date:new Date().toISOString(),
    total:Object.values(cart).reduce((s,n)=>s+n,0),
    note:note
  };
  const orders=JSON.parse(localStorage.getItem('fo_orders')||'[]');
  orders.unshift(order);
  localStorage.setItem('fo_orders',JSON.stringify(orders));
  cart={};
  document.getElementById('order-note').value='';
  showToast('下单成功！');
  renderCartPage();
}

/* ===== 订单历史（从localStorage读取） ===== */
function loadOrderHistory(){
  const container=document.getElementById('order-history');
  const orderList=document.getElementById('order-list');
  const ids=Object.keys(cart);
  if(ids.length>0){container.style.display='none';return}
  container.style.display='block';
  const orders=JSON.parse(localStorage.getItem('fo_orders')||'[]');
  if(!orders.length){
    orderList.innerHTML='<div class="empty-state"><p class="empty-title">还没有订单</p><p class="empty-sub">下单后会显示在这里~</p></div>';
    return;
  }
  orderList.innerHTML=orders.map(o=>{
    const d=new Date(o.date);
    const ds=(d.getMonth()+1)+'月'+d.getDate()+'日 '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
    const noteHtml=o.note?'<div class="order-note-text">备注：'+o.note+'</div>':'';
    const userBadge='<span class="order-user-badge">'+(o.user||'未知')+'</span>';
    return '<div class="order-card"><div class="order-header"><div class="order-date">'+ds+'</div>'+userBadge+'<div class="order-badge">'+(o.total||o.dishes.length)+' 道菜</div></div>'
      +noteHtml+'<div class="order-dishes">'
      +o.dishes.map(x=>{
        const icon=getCatIcon(x.category);
        return '<div class="order-dish-item">'
          +(x.imageUrl?'<img class="order-dish-img" src="'+x.imageUrl+'" alt="'+x.name+'">':'<div class="order-dish-placeholder">'+icon+'</div>')
          +'<span class="order-dish-name">'+x.name+'</span>'
          +(x.count>1?'<span class="order-dish-count">x'+x.count+'</span>':'')+'</div>';
      }).join('')+'</div></div>';
  }).join('');
}

/* ===== 我的页面 ===== */
function loadMyDishes(){
  const c=document.getElementById('my-dish-list');
  if(!allDishes.length){c.innerHTML='<div class="loading"><p>还没有菜品，快去添加吧~</p></div>';return}
  c.innerHTML=allDishes.map(d=>{
    const icon=getCatIcon(d.category);
    return '<div class="my-dish-item">'
      +(d.imageUrl?'<img class="my-dish-img" src="'+d.imageUrl+'" alt="'+d.name+'">':'<div class="my-dish-placeholder">'+icon+'</div>')
      +'<div class="my-dish-info"><div class="my-dish-name">'+d.name+'</div><div class="my-dish-cat">'+d.category+'</div></div>'
      +'<button class="btn-delete" onclick="deleteLocalDish(\''+d.objectId+'\')">删除</button></div>';
  }).join('');
}
function deleteLocalDish(id){
  if(!confirm('确定要删除这道菜吗？'))return;
  const idx=LOCAL_DISHES.findIndex(d=>d.objectId===id);
  if(idx>=0)LOCAL_DISHES.splice(idx,1);
  loadDishes();loadMyDishes();showToast('已删除');
}

/* ===== 初始化 ===== */
document.addEventListener('DOMContentLoaded',()=>{
  const saved=localStorage.getItem('fo_user');
  if(saved)currentUser=saved;
  document.querySelectorAll('.user-chip').forEach(c=>c.classList.toggle('active',c.dataset.user===currentUser));
  loadDishes();
});
