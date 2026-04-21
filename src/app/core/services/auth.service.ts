import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { API_BASE_URL } from '../config/api-base'
import { ResponseModel } from '../Interfaces/response-model'
import { LoginResponse } from '../Interfaces/login-response'

export interface AuthSessionUser {
  userId: string
  fullName: string
  userName: string
  role: string
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  /** Matches `api/Auth` on the server (see Swagger). */
  // private readonly apiUrl = `https://yallashop-api.runasp.net/api/Auth`;
  private readonly apiUrl = `${API_BASE_URL}/Auth`
  private readonly clientUrl = typeof window !== 'undefined'
    ? window.location.origin
    : 'https://yalla-shop-front-avk96jtda-khaledmo07s-projects.vercel.app/';

  constructor (private http: HttpClient) {}

  register (userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, {
      ...userData,
      clientUrl: this.clientUrl
    });
  }


  confirmEmail (userId: string, code: string) {
    return this.http.post<ResponseModel<boolean>>(
      `${this.apiUrl}/confirm-email`,
      { userId, code }
    )
  }
  ForgetPassword (data: { userName: string }): Observable<any> {
    return this.http.post<ResponseModel<any>>(
      `${this.apiUrl}/forgot-password`,
      {
        ...data,
        clientUrl: this.clientUrl
      }
    )
  }
  ResetPassword (userId: string, code: string, data: any): Observable<any> {
    return this.http.post<ResponseModel<any>>(
      `${this.apiUrl}/reset-password?userId=${userId}&code=${code}`,
      data
    )
  }
  Login (userData: any): Observable<any> {
    return this.http.post<ResponseModel<LoginResponse>>(
      `${this.apiUrl}/login`,
      userData
    )
  }
  setSession (loginResponse: LoginResponse) {
    localStorage.setItem('token', loginResponse.token)
    localStorage.setItem(
      'expiresOn',
      new Date(loginResponse.tokenExpiryTime).toISOString()
    )
    localStorage.setItem('userId', loginResponse.userId)
    localStorage.setItem('fullName', loginResponse.fullName)
    localStorage.setItem('userName', loginResponse.userName)
    localStorage.setItem('role', loginResponse.role)
  }
  Logout () {
    if (typeof localStorage === 'undefined') {
      return
    }

    ;['token', 'expiresOn', 'userId', 'fullName', 'userName', 'role'].forEach(
      key => localStorage.removeItem(key)
    )
  }

  isAuthenticated (): boolean {
    if (typeof localStorage === 'undefined') {
      return false
    }

    const token = localStorage.getItem('token')
    const expiresOn = localStorage.getItem('expiresOn')

    if (!token) {
      return false
    }

    if (!expiresOn) {
      return true
    }

    const expiresAt = new Date(expiresOn).getTime()
    if (Number.isNaN(expiresAt)) {
      return true
    }

    if (expiresAt <= Date.now()) {
      this.Logout()
      return false
    }

    return true
  }

  getCurrentRole (): string | null {
    if (typeof localStorage === 'undefined') {
      return null
    }

    return localStorage.getItem('role')?.trim() || null;
  }

  hasRole (role: string): boolean {
    const currentRole = this.getCurrentRole()
    return currentRole?.toLowerCase() === role.toLowerCase()
  }

  getRole (): string | null {
    return this.getCurrentRole()
  }

  decodeTokenPayload (token: string): Record<string, unknown> | null {
    if (!token) {
      return null
    }

    try {
      const parts = token.split('.')
      if (parts.length < 2) {
        return null
      }

      let payload = parts[1].replace(/-/g, '+').replace(/_/g, '/')
      while (payload.length % 4 !== 0) {
        payload += '='
      }

      return JSON.parse(atob(payload)) as Record<string, unknown>
    } catch {
      return null
    }
  }

  getRoleFromToken (token: string): string | null {
    const payload = this.decodeTokenPayload(token)
    if (!payload) {
      return null
    }

    const candidateKeys = [
      'role',
      'Role',
      'roles',
      'Roles',
      'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role'
    ]

    for (const key of candidateKeys) {
      const value = payload[key]
      if (typeof value === 'string' && value.trim()) {
        return value.trim()
      }
      if (Array.isArray(value) && typeof value[0] === 'string') {
        return value[0].trim()
      }
    }

    return null
  }

  getDashboardRouteByRole (role: string | null = this.getCurrentRole()): string {
    console.log('Determining dashboard route for role:', role)
    switch (role?.toLowerCase()) {
      case 'admin':
        return '/admin/dashboard'
      case 'seller':
        return '/seller'
      case 'marketing':
        return '/marketing'
      case 'user':
        return '/home'
      default:
        // return '/';
        return '/products'
    }
  }

  getSessionUser (): AuthSessionUser | null {
    if (!this.isAuthenticated() || typeof localStorage === 'undefined') {
      return null
    }

    const userId = localStorage.getItem('userId')?.trim();
    const fullName = localStorage.getItem('fullName')?.trim();
    const userName = localStorage.getItem('userName')?.trim();
    const role = localStorage.getItem('role')?.trim();

    if (!userId || !fullName || !userName || !role) {
      return null
    }

    return {
      userId,
      fullName,
      userName,
      role
    }
  }
}
