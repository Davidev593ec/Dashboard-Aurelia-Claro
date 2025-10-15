<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1>Estadísticas Aurelia</h1>
        <p>Inicia sesión para continuar</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="admin@claro.com"
            required
          />
        </div>

        <div class="form-group">
          <label for="password">Contraseña</label>
          <div class="password-input-wrapper">
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              class="toggle-password"
              @click="showPassword = !showPassword"
              tabindex="-1"
            >
              <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
            </button>
          </div>
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <button type="submit" class="btn-login" :disabled="loading">
          {{ loading ? 'Cargando...' : 'Iniciar Sesión' }}
        </button>
      </form>

      <div class="login-footer">
        <img src="~/assets/images/Claro-Logo.png" alt="Claro Logo" class="claro-logo" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { login } = useAuth()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const showPassword = ref(false)

const handleLogin = async () => {
  loading.value = true
  error.value = ''

  const result = await login(email.value, password.value)

  if (result.success) {
    navigateTo('/')
  } else {
    error.value = result.message || 'Error al iniciar sesión'
  }

  loading.value = false
}
</script>

<style lang="stylus" scoped>
.login-container
  min-height 100vh
  display flex
  align-items center
  justify-content center
  background-image url('~/assets/images/Foto dashboard claro aurelia.svg')
  background-size contain
  background-position center
  background-repeat no-repeat
  background-color #e5e5e5
  padding 20px
  position relative
  overflow hidden

  &::before
    content ''
    position absolute
    top 0
    left 0
    right 0
    bottom 0
    background rgba(0, 0, 0, 0.3)
    z-index 0

@keyframes float
  0%, 100%
    transform translate(0, 0)
  50%
    transform translate(30px, 30px)

.login-card
  background rgba(255, 255, 255, 0.95)
  backdrop-filter blur(10px)
  border-radius 16px
  box-shadow 0 20px 60px rgba(0, 0, 0, 0.3)
  max-width 400px
  width 100%
  padding 40px
  animation fadeIn 0.5s ease-in-out
  position relative
  z-index 1
  margin-right 200px

@keyframes fadeIn
  from
    opacity 0
    transform translateY(-20px)
  to
    opacity 1
    transform translateY(0)

.login-header
  text-align center
  margin-bottom 30px

  h1
    font-size 28px
    color #e30613
    margin-bottom 8px
    font-weight 700
    letter-spacing -0.5px

  p
    color #666
    font-size 14px

.login-form
  .form-group
    margin-bottom 20px

    label
      display block
      font-size 14px
      font-weight 600
      color #333
      margin-bottom 8px

    .password-input-wrapper
      position relative
      width 100%

      input
        padding-right 45px

    input
      width 100%
      padding 12px 16px
      border 2px solid #e0e0e0
      border-radius 8px
      font-size 14px
      transition all 0.3s ease
      box-sizing border-box

      &:focus
        outline none
        border-color #e30613
        box-shadow 0 0 0 3px rgba(227, 6, 19, 0.1)

    .toggle-password
      position absolute
      right 12px
      top 50%
      transform translateY(-50%)
      background transparent
      border none
      color #666
      cursor pointer
      padding 4px
      display flex
      align-items center
      justify-content center
      transition all 0.3s ease
      border-radius 4px

      &:hover
        color #e30613
        background rgba(227, 6, 19, 0.1)

      &:focus
        outline none

      svg
        display block
        width 20px
        height 20px

  .error-message
    background #ffe0e0
    color #e30613
    padding 12px
    border-radius 8px
    font-size 14px
    margin-bottom 20px
    text-align center
    border 1px solid #ffcccc

  .btn-login
    width 100%
    padding 14px
    background #e30613
    color white
    border none
    border-radius 8px
    font-size 16px
    font-weight 700
    cursor pointer
    transition all 0.3s ease

    &:hover:not(:disabled)
      background #c50510
      transform translateY(-2px)
      box-shadow 0 8px 20px rgba(227, 6, 19, 0.4)

    &:active:not(:disabled)
      transform translateY(0)

    &:disabled
      opacity 0.6
      cursor not-allowed

.login-footer
  margin-top 30px
  padding-top 20px
  border-top 1px solid #e0e0e0
  text-align center

  .claro-logo
    max-width 120px
    height auto
    margin 0 auto
</style>
