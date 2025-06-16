<template>
  <div class="user-profile">
    <h1>{{ $t('user_profile') }}</h1>
    <div class="form-group">
      <label>{{ $t('name') }}：</label>
      <input v-model="user.name" :placeholder="$t('enter_name')" />
    </div>
    <div class="form-group">
      <label>{{ $t('email') }}：</label>
      <input v-model="user.email" :placeholder="$t('enter_email')" />
    </div>
    <button @click="saveProfile">{{ $t('save_profile') }}</button>
    <button @click="cancelEdit">{{ $t('cancel_edit') }}</button>
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
        this.showError(this.$t('please_enter_name'));
        return;
      }
      if (!this.user.email) {
        this.showError(this.$t('please_enter_email'));
        return;
      }
      this.showSuccess(this.$t('save_success'));
    },
    cancelEdit() {
      if (window.confirm(this.$t('confirm_cancel_edit'))) {
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
