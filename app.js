const API_URL = 'https://bhhh-dxxz.onrender.com/api'; // Link Render của bạn

const loginScreen = document.getElementById('loginScreen');
const mainApp = document.getElementById('mainApp');
const durationSelect = document.getElementById('durationSelect');
const loginKeyInput = document.getElementById('loginKeyInput');
const generateKeyBtn = document.getElementById('generateKeyBtn');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');

const userForm = document.getElementById('userForm');
const submitBtn = document.getElementById('submitBtn');
const userList = document.getElementById('userList');
const refreshBtn = document.getElementById('refreshBtn');
const toast = document.getElementById('toast');

let API_KEY = localStorage.getItem('my_api_key') || '';
let usersCache = [];

// ===== HÀM TIỆN ÍCH =====
function showToast(message, type = 'success') {
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  setTimeout(() => toast.classList.remove('show'), 3000);
}

const fetchAPI = (endpoint, options = {}) => {
  return fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      ...options.headers,
    },
  });
};

// ===== 1. TẠO KEY THEO THỜI HẠN (1 ngày, 2 ngày, 1 tháng...) =====
generateKeyBtn.addEventListener('click', () => {
  const duration = durationSelect.value;
  let d = new Date();

  if (duration === '1d') d.setDate(d.getDate() + 1);
  if (duration === '2d') d.setDate(d.getDate() + 2);
  if (duration === '1m') d.setMonth(d.getMonth() + 1);
  if (duration === '3m') d.setMonth(d.getMonth() + 3);
  if (duration === '5m') d.setMonth(d.getMonth() + 5);

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  const generatedKey = `LAT-${day}${month}${year}`;
  loginKeyInput.value = generatedKey;
  
  showToast(`Đã tạo Key hết hạn vào: ${day}/${month}/${year}`, 'success');
});

// ===== 2. XỬ LÝ ĐĂNG NHẬP =====
loginBtn.addEventListener('click', async () => {
  const key = loginKeyInput.value.trim();
  if (!key) return showToast('Vui lòng tạo hoặc nhập Key!', 'error');

  loginBtn.textContent = 'Đang kiểm tra...';
  loginBtn.disabled = true;

  API_KEY = key;
  try {
    const res = await fetchAPI('/users');
    if (res.ok) {
      localStorage.setItem('my_api_key', API_KEY);
      loginScreen.style.display = 'none';
      mainApp.style.display = 'block';
      checkHealth();
      loadUsers();
    } else {
      const err = await res.json();
      showToast(err.error || 'Key không hợp lệ!', 'error');
      API_KEY = '';
    }
  } catch {
    showToast('Lỗi kết nối Server!', 'error');
  } finally {
    loginBtn.textContent = 'Đăng Nhập';
    loginBtn.disabled = false;
  }
});

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('my_api_key');
  location.reload();
});

// ===== 3. CÁC HÀM XỬ LÝ DỮ LIỆU =====
async function checkHealth() {
  const statusDot = document.querySelector('.dot');
  const statusText = document.getElementById('statusText');
  try {
    const res = await fetch(`${API_URL}/health`);
    if (res.ok) {
      statusDot.className = 'dot online';
      statusText.textContent = 'Online';
    }
  } catch {
    statusDot.className = 'dot offline';
    statusText.textContent = 'Offline';
  }
}

async function loadUsers() {
  try {
    userList.innerHTML = '<p class="loading">Đang tải dữ liệu...</p>';
    const res = await fetchAPI('/users');
    if (res.status === 403) return logoutBtn.click(); // Hết hạn key thì đá ra ngoài
    
    usersCache = await res.json();
    renderUsers();
  } catch (err) {
    userList.innerHTML = '<p class="empty">❌ Không thể kết nối server</p>';
  }
}

function renderUsers() {
  if (usersCache.length === 0) {
    userList.innerHTML = '<p class="empty">Chưa có user nào. Hãy thêm mới!</p>';
    return;
  }

  userList.innerHTML = usersCache.map((user) => `
    <div class="user-item" data-id="${user.id}">
      <div class="user-info">
        <div class="avatar">${user.name.charAt(0).toUpperCase()}</div>
        <div class="user-details">
          <strong>${user.name}</strong>
          <span>${user.email}</span>
        </div>
      </div>
      <div class="user-actions">
        <button class="btn btn-edit" onclick="editUser(${user.id}, '${user.name}', '${user.email}')">✏️ Sửa</button>
        <button class="btn btn-delete" onclick="deleteUser(${user.id})">🗑️ Xoá</button>
      </div>
    </div>
  `).join('');
}

// ===== 4. UPLOAD NHANH (OPTIMISTIC UI) =====
userForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  if (!name || !email) return;

  submitBtn.textContent = 'Đang thêm...';
  submitBtn.disabled = true;

  // Hiện ngay lên màn hình
  const tempId = Date.now();
  usersCache.push({ id: tempId, name, email });
  renderUsers();
  userForm.reset();

  try {
    const res = await fetchAPI('/users', {
      method: 'POST',
      body: JSON.stringify({ name, email }),
    });

    if (!res.ok) {
      usersCache = usersCache.filter(u => u.id !== tempId);
      renderUsers();
      showToast('Lỗi khi thêm user!', 'error');
    } else {
      showToast('✅ Thêm thành công!');
      loadUsers(); // Đồng bộ lại ID thật từ server
    }
  } catch {
    usersCache = usersCache.filter(u => u.id !== tempId);
    renderUsers();
    showToast('Lỗi kết nối!', 'error');
  } finally {
    submitBtn.textContent = 'Thêm User';
    submitBtn.disabled = false;
  }
});

// ===== 5. SỬA & XOÁ =====
async function editUser(id, oldName, oldEmail) {
  const newName = prompt('Nhập tên mới:', oldName);
  if (!newName) return;
  const newEmail = prompt('Nhập email mới:', oldEmail);
  if (!newEmail) return;

  try {
    const res = await fetchAPI(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name: newName, email: newEmail }),
    });
    if (res.ok) {
      showToast('✅ Cập nhật thành công!');
      loadUsers();
    }
  } catch { showToast('Lỗi kết nối server', 'error'); }
}

async function deleteUser(id) {
  if (!confirm('Bạn có chắc muốn xoá?')) return;
  
  const oldCache = [...usersCache];
  usersCache = usersCache.filter(u => u.id !== id);
  renderUsers();

  try {
    const res = await fetchAPI(`/users/${id}`, { method: 'DELETE' });
    if (res.ok) showToast('🗑️ Đã xoá!');
  } catch {
    usersCache = oldCache;
    renderUsers();
    showToast('Lỗi khi xoá', 'error');
  }
}

refreshBtn.addEventListener('click', loadUsers);

// ===== KHỞI TẠO =====
if (API_KEY) {
  loginScreen.style.display = 'none';
  mainApp.style.display = 'block';
  checkHealth();
  loadUsers();
} else {
  loginScreen.style.display = 'flex';
}
