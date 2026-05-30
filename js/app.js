const BMOB_APP_ID='abfeca061abca0b733b0b88e69825f57',BMOB_API_KEY='ec05027585424bc7adce38afa2e5e344';
Bmob.initialize(BMOB_APP_ID,BMOB_API_KEY);
const DT='Dishes',OT='Orders';
const CATS=[{id:'鸡类',icon:'🐔',label:'鸡类'},{id:'鸭类',icon:'🦆',label:'鸭类'},{id:'鱼类',icon:'🐟',label:'鱼类'},{id:'海鲜水产',icon:'🦐',label:'海鲜'},{id:'猪肉',icon:'🥩',label:'猪肉'},{id:'牛羊肉',icon:'🐂',label:'牛羊肉'},{id:'蔬菜素菜',icon:'🥬',label:'素菜'},{id:'汤羹',icon:'🍲',label:'汤羹'},{id:'凉菜',icon:'🥗',label:'凉菜'},{id:'主食',icon:'🍜',label:'主食'},{id:'小吃甜品',icon:'🍪',label:'甜品'},{id:'饮品',icon:'🥤',label:'饮品'}];
let allDishes=[],curCat='',cart={};

function switchPage(p){
  document.querySelectorAll('.nav-item').forEach(i=>i.classList.toggle('active',i.dataset.page===p));
  document.querySelectorAll('.page').forEach(q=>q.classList.remove('active'));
  document.getElementById('page-'+p).classList.add('active');
  const t={menu:'菜单',orders:'订单',my:'我的'};
  document.getElementById('page-title').textContent=t[p];
  if(p==='orders')renderCartPage();
  if(p==='my')loadMyDishes();
}

function showToast(m){const o=document.querySelector('.toast');if(o)o.remove();const e=document.createElement('div');e.className='toast';e.textContent=m;document.body.appendChild(e);setTimeout(()=>e.remove(),2000)}
function getCatIcon(id){const c=CATS.find(x=>x.id===id);return c?c.icon:'🍽️'}

// === Menu ===
async function loadDishes(){
  try{const q=Bmob.Query(DT);q.order('-createdAt');const r=await q.find();allDishes=r.results||[];
  const cs=CATS.filter(c=>allDishes.some(d=>d.category===c.id));
  curCat=cs.length>0?cs[0].id:CATS[0].id;
  renderCategories();renderDishes();
  document.getElementById('menu-loading')?.remove();
  }catch(e){console.error(e)}
}
function renderCategories(){
  document.getElementById('category-list').innerHTML=CATS.map(c=>{
    const n=allDishes.filter(d=>d.category===c.id).length;
    return'<div class="category-item '+(c.id===curCat?'active':'')+'" onclick="selectCat(\''+c.id+'\')"><span class="cat-icon">'+c.icon+'</span><span class="cat-label">'+c.label+'</span>'+(n>0?'<span class="cat-count">'+n+'</span>':'')+'</div>'}).join('');
}
function selectCat(id){curCat=id;renderCategories();renderDishes()}
function renderDishes(){
  const c=document.getElementById('dish-list'),items=allDishes.filter(d=>d.category===curCat);
  if(!items.length){c.innerHTML='<div class="empty-state" style="padding-top:60px"><p class="empty-title">这个分类还没有菜品</p><p class="empty-sub">去「我的」页面添加吧~</p></div>';return}
  c.innerHTML=items.map(d=>{
    const icon=getCatIcon(d.category);
    return'<div class="dish-card">'+(d.imageUrl?'<img class="dish-image" src="'+d.imageUrl+'" alt="'+d.name+'" loading="lazy">':'<div class="dish-placeholder">'+icon+'</div>')+'<div class="dish-info"><div class="dish-name">'+d.name+'</div><div class="dish-meta">'+d.category+'</div></div><div class="dish-action"><button class="btn-add-cart" onclick="addToCart(\''+d.objectId+'\')"><svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></button></div></div>'}).join('');
}
function addToCart(id){cart[id]=(cart[id]||0)+1;showToast('已添加')}

// === Cart / Orders ===
function renderCartPage(){
  const ids=Object.keys(cart);
  const cartItems=document.getElementById('cart-items');
  const cartEmpty=document.getElementById('cart-empty');
  const cartBottom=document.getElementById('cart-bottom');
  const orderHistory=document.getElementById('order-history');
  if(ids.length===0){
    cartItems.innerHTML='';cartEmpty.style.display='block';cartBottom.style.display='none';
    loadOrderHistory(orderHistory);
    return;
  }
  cartEmpty.style.display='none';cartBottom.style.display='block';orderHistory.style.display='none';
  let total=0;
  cartItems.innerHTML='<div class="card" style="margin:12px;border-radius:14px;padding:0;">'+ids.map(id=>{
    const d=allDishes.find(x=>x.objectId===id);if(!d)return'';
    const n=cart[id];total+=n;const icon=getCatIcon(d.category);
    return'<div class="cart-item">'+(d.imageUrl?'<img class="cart-item-img" src="'+d.imageUrl+'" alt="'+d.name+'">':'<div class="cart-item-placeholder">'+icon+'</div>')+'<div class="cart-item-info"><div class="cart-item-name">'+d.name+'</div><div class="cart-item-cat">'+d.category+'</div></div><div class="cart-item-qty"><button class="qty-btn" onclick="cartQty(\''+id+'\',-1)">−</button><span class="qty-num">'+n+'</span><button class="qty-btn" onclick="cartQty(\''+id+'\',1)">+</button></div></div>'}).join('')+'</div>';
  document.getElementById('cart-total-num').textContent=total;
}
function cartQty(id,delta){
  cart[id]=(cart[id]||0)+delta;
  if(cart[id]<=0)delete cart[id];
  renderCartPage();
}
async function submitOrder(){
  const ids=Object.keys(cart);
  if(!ids.length){showToast('请先选择菜品');return}
  const note=document.getElementById('order-note').value.trim();
  const dishes=ids.map(id=>{const d=allDishes.find(x=>x.objectId===id);return{name:d.name,category:d.category,imageUrl:d.imageUrl||'',count:cart[id]}});
  try{
    const q=Bmob.Query(OT);
    q.set('dishes',JSON.stringify(dishes));
    q.set('date',new Date().toISOString());
    q.set('total',Object.values(cart).reduce((s,n)=>s+n,0));
    q.set('note',note);
    await q.save();
    cart={};document.getElementById('order-note').value='';
    showToast('下单成功！');
    renderCartPage();
  }catch(e){console.error(e);showToast('下单失败')}
}
async function loadOrderHistory(container){
  container.style.display='block';
  try{const q=Bmob.Query(OT);q.order('-createdAt');q.limit(50);const r=await q.find(),orders=r.results||[];
  if(!orders.length){container.innerHTML='<div class="empty-state"><div class="empty-icon"><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div><p class="empty-title">还没有订单</p><p class="empty-sub">下单后会显示在这里~</p></div>';return}
  container.innerHTML=orders.map(o=>{
    const ds=JSON.parse(o.dishes||'[]');
    const d=new Date(o.date||o.createdAt);
    const ds2=(d.getMonth()+1)+'月'+d.getDate()+'日 '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
    const noteHtml=o.note?'<div class="order-note-text">备注：'+o.note+'</div>':'';
    return'<div class="order-card"><div class="order-header"><div class="order-date"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>'+ds2+'</div><div class="order-badge">'+(o.total||ds.length)+' 道菜</div></div>'+noteHtml+'<div class="order-dishes">'+ds.map(x=>{
      const icon=getCatIcon(x.category);
      return'<div class="order-dish-item">'+(x.imageUrl?'<img class="order-dish-img" src="'+x.imageUrl+'" alt="'+x.name+'">':'<div class="order-dish-placeholder">'+icon+'</div>')+'<span class="order-dish-name">'+x.name+'</span>'+(x.count>1?'<span class="order-dish-count">×'+x.count+'</span>':'')+'</div>'}).join('')}</div></div>'}).join('')}catch(e){console.error(e)}
}

// === My ===
let selectedFile=null;
function previewImage(e){const f=e.target.files[0];if(!f)return;selectedFile=f;const r=new FileReader();r.onload=ev=>{const p=document.getElementById('image-preview');p.src=ev.target.result;p.style.display='block';document.getElementById('upload-placeholder').style.display='none'};r.readAsDataURL(f)}
async function addDish(){
  const name=document.getElementById('dish-name').value.trim(),cat=document.getElementById('dish-category').value;
  if(!name){showToast('请输入菜品名称');return}
  try{let imageUrl='';if(selectedFile){const file=new Bmob.File(selectedFile.name,selectedFile),res=await file.save();imageUrl=res.url||res.cdn||''}
  const q=Bmob.Query(DT);q.set('name',name);q.set('category',cat);q.set('imageUrl',imageUrl);await q.save();
  showToast('添加成功！');document.getElementById('dish-name').value='';document.getElementById('dish-image').value='';document.getElementById('image-preview').style.display='none';document.getElementById('upload-placeholder').style.display='block';selectedFile=null;
  await loadDishes();loadMyDishes()}catch(e){console.error(e);showToast('添加失败')}
}
async function loadMyDishes(){
  const c=document.getElementById('my-dish-list');
  try{const q=Bmob.Query(DT);q.order('-createdAt');const r=await q.find(),dishes=r.results||[];
  if(!dishes.length){c.innerHTML='<div class="loading"><p>还没有菜品，快去添加吧~</p></div>';return}
  c.innerHTML=dishes.map(d=>{const icon=getCatIcon(d.category);
    return'<div class="my-dish-item">'+(d.imageUrl?'<img class="my-dish-img" src="'+d.imageUrl+'" alt="'+d.name+'">':'<div class="my-dish-placeholder">'+icon+'</div>')+'<div class="my-dish-info"><div class="my-dish-name">'+d.name+'</div><div class="my-dish-cat">'+d.category+'</div></div><button class="btn-delete" onclick="deleteDish(\''+d.objectId+'\')">删除</button></div>'}).join('')}catch(e){console.error(e)}
}
async function deleteDish(id){if(!confirm('确定要删除这道菜吗？'))return;try{const q=Bmob.Query(DT);await q.destroy(id);showToast('已删除');loadMyDishes();loadDishes()}catch(e){console.error(e);showToast('删除失败')}}
document.addEventListener('DOMContentLoaded',()=>loadDishes());
