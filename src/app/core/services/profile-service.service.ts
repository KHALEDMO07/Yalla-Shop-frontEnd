import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ResponseModel } from '../Interfaces/response-model';
import { ProfileResponse } from '../models/profile-response';
import { UpdateProfile } from '../models/update-profile';
import { ChangePassword } from '../models/change-password';
import { UpdateEmailRequest } from '../models/update-email-request';
import { ConfirmChangeEmail } from '../models/confirm-change-email';

@Injectable({
  providedIn: 'root'
})
export class ProfileServiceService {

  private apiUrl = 'https://yallashop-api.runasp.net/api/account';
  private readonly clientUrl = typeof window !== 'undefined'
    ? window.location.origin
    : 'https://yalla-shop-front-avk96jtda-khaledmo07s-projects.vercel.app/';

  constructor(private http: HttpClient) { }

  getProfile(token: string): Observable<ResponseModel<ProfileResponse>> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<ResponseModel<ProfileResponse>>(`${this.apiUrl}/profile`, { headers });
  }

  updateProfile(token: string, updateProfile: UpdateProfile): Observable<ResponseModel<ProfileResponse>> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.put<ResponseModel<ProfileResponse>>(`${this.apiUrl}/profile`, updateProfile, { headers });
  }
  changePassword(token: string, changePassword: ChangePassword): Observable<ResponseModel<boolean>> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.put<ResponseModel<boolean>>(`${this.apiUrl}/change-password`, changePassword, { headers });
  }
  updateEmailRequest(token: string, updateEmailRequest: UpdateEmailRequest): Observable<ResponseModel<boolean>> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const body = {
      ...updateEmailRequest,
      clientUrl: this.clientUrl
    };
    return this.http.post<ResponseModel<boolean>>(`${this.apiUrl}/update-email`, body, { headers });
  }
  confirmChangeEmail(confirmChangeEmail: ConfirmChangeEmail): Observable<ResponseModel<boolean>> {
    return this.http.post<ResponseModel<boolean>>(`${this.apiUrl}/confirm-change-email`, confirmChangeEmail);
  }
}

