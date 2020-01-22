import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { DeliveryType } from './deliveryType.model';
import { HttpClient } from '@angular/common/http';
import { DeliveryForm } from './deliveryForm.model';
import { PostForm } from './postForm.model';

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    constructor(private http: HttpClient) { }

    getDeliveryTypes(): Observable<DeliveryType[]> {
        return this.http.get<[DeliveryType]>('https://backend.api.com/deliveryTypes');
    }

    getDeliveryForms(): Observable<DeliveryForm[]> {
        return this.http.get<[DeliveryForm]>('https://backend.api.com/deliveryForms');
    }

    postForm(postForm): void {
        this.http.post<PostForm>('https://backend.api.com/deliveryForms', postForm)
    }
}