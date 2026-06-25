import { ChangeDetectionStrategy, Component, inject, OnInit, output, signal } from '@angular/core';
import { AddressService } from './address-service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { validateNewAddressSchema } from '../../../schemas/create-account-schema';

@Component({
  selector: 'app-address',
  imports: [ReactiveFormsModule],
  templateUrl: './address.html',
  styleUrl: './address.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Address implements OnInit{
  private readonly addressService = inject(AddressService);
  protected readonly addressState = this.addressService.state;
  protected processing = signal(new Set<string>());
  
  private readonly fb = inject(FormBuilder);
  protected addressForm!: FormGroup;

  onClose = output();

  addToSignal(id: string){
    this.processing.update((set) => new Set(set).add(id));
  }

  deleteFromSignal(id: string){
    this.processing.update((set) => {
      const newSet = new Set(set);
      newSet.delete(id);
      return newSet;
    });
  }

  initForms(){
    this.addressForm = this.fb.group({
      address: ['', [Validators.required, Validators.maxLength(100)]],
      apartment: ['', Validators.maxLength(10)],
      city: ['', [Validators.required, Validators.maxLength(100)]],
      zip: ['', [Validators.required, Validators.maxLength(10)]],
      country: ['', [Validators.required, Validators.maxLength(100)]]
    });
  };

  ngOnInit(){
    this.initForms();
    this.addressService.getAddressList();
  };

  async onDelete(addressId: string){
    this.addToSignal(addressId);
    const result = await this.addressService.deleteAddress(addressId);
    if(result){
      // mostrar alerta generica de que algo fallo, vuelva a intentar.
    };
    this.deleteFromSignal(addressId);
  }

  async onConfirm(){
    if(this.addressForm.invalid) return;
    
    const result = validateNewAddressSchema(this.addressForm.value);

    if(!result.success){
      // alerta con error de valibot
    }else {
      const response = await this.addressService.addAddress(result.output);
      if(response){
        this.initForms();
      };
    };
  };

  onRetry(){
    if(this.addressState().data){
      this.addressService.cleanError();
    }else {
      this.addressService.getAddressList();
    };
  };

  onBack(){
    this.onClose.emit();
  };
}
