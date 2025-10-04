export const useAuth = () => {
  const token = useState<string | null>('auth_token', () => null)
  const user = useState<any>('auth_user', () => null)

  const login = async (email: string, password: string) => {
    try {
      const response = await $fetch('/api/auth/login', {
        method: 'POST',
        body: { email, password }
      })

      if (response.success) {
        token.value = response.token
        user.value = response.user

        // Guardar en localStorage
        if (process.client) {
          localStorage.setItem('auth_token', response.token)
          localStorage.setItem('auth_user', JSON.stringify(response.user))
        }

        return { success: true }
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.data?.statusMessage || 'Error al iniciar sesión'
      }
    }
  }

  const logout = () => {
    token.value = null
    user.value = null

    if (process.client) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
    }

    navigateTo('/login')
  }

  const loadFromStorage = () => {
    if (process.client) {
      const storedToken = localStorage.getItem('auth_token')
      const storedUser = localStorage.getItem('auth_user')

      if (storedToken) {
        token.value = storedToken
      }

      if (storedUser) {
        user.value = JSON.parse(storedUser)
      }
    }
  }

  const isAuthenticated = computed(() => !!token.value)

  return {
    token,
    user,
    login,
    logout,
    loadFromStorage,
    isAuthenticated
  }
}
