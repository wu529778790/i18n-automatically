<template>
  <div class="user-profile">
    <h1>用户个人资料</h1>
    <div class="form-group">
      <label>姓名：</label>
      <input v-model="user.name" placeholder="请输入姓名" />
    </div>
    <div class="form-group">
      <label>邮箱：</label>
      <input v-model="user.email" placeholder="请输入邮箱地址" />
    </div>
    <button @click="saveProfile">保存资料</button>
    <button @click="cancelEdit">取消编辑</button>
    <p v-if="showMessage">{{ message }}</p>
  </div>
</template>

<script>
export default {
  name: 'UserProfile',
  data() {
    return {
      user: {
        name: '',
        email: '',
      },
      showMessage: false,
      message: '',
    };
  },
  methods: {
    saveProfile() {
      if (!this.user.name) {
        this.showError('请输入姓名');
        return;
      }
      if (!this.user.email) {
        this.showError('请输入邮箱');
        return;
      }
      this.showSuccess('保存成功！');
    },
    cancelEdit() {
      if (confirm('确定要取消编辑吗？')) {
        this.resetForm();
      }
    },
    showError(msg) {
      this.message = msg;
      this.showMessage = true;
    },
    showSuccess(msg) {
      this.message = msg;
      this.showMessage = true;
    },
    resetForm() {
      this.user = { name: '', email: '' };
      this.showMessage = false;
    },
  },
};
</script>
