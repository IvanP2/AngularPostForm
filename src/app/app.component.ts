import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ValidatorFn, FormControl, ValidationErrors } from '@angular/forms';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DeliveryType } from './deliveryType.model';
import { DeliveryForm } from './deliveryForm.model';
import { ApiService } from './api.service';
import { PostForm } from './postForm.model';

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  userForm: FormGroup;
  deliveryType: DeliveryType[];
  deliveryForm: DeliveryForm[];
  selectedDeliveryType = 0;
  selectedDeliveryForm = 0;
  isTrackingNumberValid = false;
  isInternalTrackingNumber = false;
  isWeightValid = false;

  readonly internalTrackingNumberTypeId = "0";
  readonly externalTrackingNumberTypeId = "1";

  constructor(private fb: FormBuilder, private apiService: ApiService) { 
    apiService.getDeliveryTypes().subscribe( res => {
        this.deliveryType = res;
    });
    apiService.getDeliveryForms().subscribe( res => {
        this.deliveryForm = res;
    });
  }

  ngOnInit() {
    this.initForm();
  }

  ngOnDestroy() {
  }

  public onSubmit(): void {
    const controls = this.userForm.controls;

    Object.keys(controls).forEach(key => {
      controls[key].markAsPristine();
      controls[key].markAsTouched();
    })

    /* this.apiService.postForm(new PostForm{
      trackingNumber = this.userForm.get('trackingNumber').value,
      weight = this.userForm.get('weight').value,
      isOrganization = false
    });*/

    this.userForm.reset();
    this.selectedDeliveryType = 0;
    this.selectedDeliveryForm = 0;
  }

  /** Инициализация формы */
  private initForm(): void {
    this.userForm = this.fb.group({
      trackingNumber: ['', [
        Validators.required,
        this.trackingNumberValidator]
      ],
      weight: [0, [
        Validators.required,
        this.weightValidator]
      ],
      departureType: [null, [Validators.required]],
      departureForm: [null, [Validators.required]],
      address: [null, [
        Validators.required,
        Validators.pattern(/^[0-9]{6}/)]
      ],
      recipient: [null, [
        Validators.required]
      ]
    });
  }

    private onTrackingNumberChange(): void {
      const patternValid = /^([0-9]{14}$|[a-zA-Z]{2}[0-9]{9}[a-zA-Z]{2})$/.test(this.userForm.get('trackingNumber').value);
      if (patternValid)
      {
        this.isTrackingNumberValid = true;
        const internalTrackingNumber = /^[0-9]{14}$/.test(this.userForm.get('trackingNumber').value);
        if (internalTrackingNumber) {
          this.isInternalTrackingNumber = true;
          this.sortDeliveryTypes(this.internalTrackingNumberTypeId);
        }
        else {
          this.isInternalTrackingNumber = false;
          this.sortDeliveryTypes(this.externalTrackingNumberTypeId);
        }
      }
      else {
        this.isTrackingNumberValid = false;    
      }
    }

    private onWeightChange(): void {
      let weight = Number(this.userForm.get('weight').value);
      const patternValid = Number.isInteger(weight);
      if (patternValid)
      {
        this.isWeightValid = true;
        if (this.isTrackingNumberValid) {
          if (this.isInternalTrackingNumber) {
            this.sortDeliveryTypesAndForms(this.internalTrackingNumberTypeId, weight);
          } else {
            this.sortDeliveryTypesAndForms(this.externalTrackingNumberTypeId, weight);
          }
        } else {
          this.sortDeliveryTypesAndForms(null, weight);
        }  
      }
      else {
        this.isWeightValid = false;    
      }
    }
    
    private sortDeliveryTypesAndForms(trackingNumberTypeId, weight): void {
      this.sortDeliveryTypes(trackingNumberTypeId, weight);
      this.sortDeliveryForms(weight);
    }

    private sortDeliveryTypes(trackingNumberTypeId, weight = null): void {
      var deliveryTypes = this.apiService.getDeliveryTypes();
      deliveryTypes.pipe(
        map(arr =>
          arr.filter(r => (trackingNumberTypeId == null || r.trackerNumberTypeId == trackingNumberTypeId
                          && (weight == null || r.minWeight <= weight)
                          && (weight == null || r.maxWeight >= weight)))
          )
        ).subscribe(res => {
                      this.deliveryType = res;
                    });
    }

    private sortDeliveryForms(weight): void {
      var deliveryTypes = this.apiService.getDeliveryForms();
      deliveryTypes.pipe(
        map(arr =>
          arr.filter(r => ((weight == null || r.minWeight <= weight)
                          && (weight == null || r.maxWeight >= weight)))
          )
        ).subscribe(res => {
                      this.deliveryForm = res;
                    });
    }

    /** Валидатор для ШПИ */
    private trackingNumberValidator(control: FormControl): ValidationErrors {
      const value = control.value;
      const patternValid = /^([0-9]{14}$|[a-zA-Z]{2}[0-9]{9}[a-zA-Z]{2})$/.test(value);
      
      if (!patternValid) {
        return { invalidPattern: 'ШПИ не прошел валидацию' };
      }
  
      return null;
    }

    /** Валидатор для веса */
    private weightValidator(control: FormControl): ValidationErrors {
      const value = control.value;

      if (!Number.isInteger(Number(value))) {
        return { invalidMessage: 'Вес должен быть целым числом (в граммах)' };
      }

      return null;
    }    

}
