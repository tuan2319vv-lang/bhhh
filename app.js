const API_URL = 'https://bhhh-dxxz.onrender.com/api'; // Link Render của bạn
const API_KEY = 'LAT-TGX-DQK-TTX'; // 🔑 Phải giống y hệt bên server.js

// ===== Lấy các element =====
const userForm = document.getElementById('userForm');
const userList = document.getElementById('userList');
const refreshBtn = document.getElementById('refreshBtn');
const statusDot = document.querySelector('.dot');
const statusText = document.getElementById('statusText');
const toast = document.getElementById('toast');

// ===== Hàm gọi API tự động gắn Key =====
const fetchAPI = (endpoint, options = {}) => {
  return fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY, // Trình duyệt tự động gửi Key lên
      ...options.headers,
    },
  });
};

// ===== Hiển thị thông báo =====
function showToast(message, type = 'success') {
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ===== Kiểm tra server =====
async function checkHealth() {
  try {
    const res = await fetch(`${API_URL}/health`); 
    if (res.ok) {
      statusDot.className = 'dot online';
      statusText.textContent = 'Online';
    } else {
      throw new Error();
    }
  } catch {
    statusDot.className = 'dot offline';
    statusText.textContent = 'Offline';
  }
}

// ===== Load danh sách users =====
async function loadUsers() {
  try {
    userList.innerHTML = '<p class="loading">Đang tải dữ liệu...</p>';
    const res = await fetchAPI('/users'); 
    
    if (res.status === 403) {
      userList.innerHTML = '<p class="empty">❌ Sai API Key! Không có quyền xem.</p>';
      return;
    }

    const users = await res.json();

    if (users.length === 0) {
      userList.innerHTML = '<p class="empty">Chưa có user nào. Hãy thêm mới!</p>';
      return;
    }

    userList.innerHTML = users.map((user) => `
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
  } catch (err) {
    userList.innerHTML = '<p class="empty">❌ Không thể kết nối server</p>';
    showToast('Không thể tải dữ liệu', 'error');
  }
}

// ===== Thêm user =====
userForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();

  try {
    const res = await fetchAPI('/users', {
      method: 'POST',
      body: JSON.stringify({ name, email }),
    });

    if (res.ok) {
      showToast('✅ Thêm user thành công!');
      userForm.reset();
      loadUsers();
    } else if (res.status === 403) {
      showToast('Sai API Key!', 'error');
    } else {
      const data = await res.json();
      showToast(data.error || 'Lỗi khi thêm', 'error');
    }
  } catch {
    showToast('Lỗi kết nối server', 'error');
  }
});

// ===== Sửa user =====
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
    } else {
      showToast('Lỗi khi cập nhật', 'error');
    }
  } catch {
    showToast('Lỗi kết nối server', 'error');
  }
}

// ===== Xoá user =====
async function deleteUser(id) {
  if (!confirm('Bạn có chắc muốn xoá user này?')) return;

  try {
    const res = await fetchAPI(`/users/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('🗑️ Đã xoá user!');
      loadUsers();
    } else {
      showToast('Lỗi khi xoá', 'error');
    }
  } catch {
    showToast('Lỗi kết nối server', 'error');
  }
}

// ===== Refresh =====
refreshBtn.addEventListener('click', loadUsers);

// ===== Khởi tạo =====
checkHealth();
loadUsers();
