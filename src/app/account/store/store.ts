import { ChangeDetectionStrategy, Component, inject, OnInit, output, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StoreService } from './store-service';
import { validateNewStoreSchema } from '../../../schemas/create-account-schema';

@Component({
  selector: 'app-store',
  imports: [],
  templateUrl: './store.html',
  styleUrl: './store.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Store implements OnInit {
  private readonly storeService = inject(StoreService);
  protected readonly storeState = this.storeService.state;
  protected processing = signal(new Set<string>());
  
  private readonly fb = inject(FormBuilder);
  protected storeForm!: FormGroup;

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

  initForms() {
    this.storeForm = this.fb.group({
      address: this.fb.group({
        address: ['', [Validators.required, Validators.maxLength(100)]],
        apartment: ['', Validators.maxLength(10)],
        city: ['', [Validators.required, Validators.maxLength(100)]],
        zip: ['', [Validators.required, Validators.maxLength(10)]],
        country: ['', [Validators.required, Validators.maxLength(100)]]
      }),
      phone: ['', [Validators.required, Validators.maxLength(50)]]
    });
  }

  ngOnInit(){
    this.initForms();
    this.storeService.getStoreList();
  };

  async onDelete(storeId: string){
    this.addToSignal(storeId);
    const result = await this.storeService.deleteStore(storeId);
    if(result){
      // mostrar alerta generica de que algo fallo, vuelva a intentar.
    };
    this.deleteFromSignal(storeId);
  }

  async onConfirm(){
    if(this.storeForm.invalid) return;
    
    const result = validateNewStoreSchema(this.storeForm.value);

    if(!result.success){
      // alerta con error de valibot
    }else {
      const response = await this.storeService.addStore(result.output);
      if(response){
        this.initForms();
      };
    };
  };

  onRetry(){ 
    if(this.storeState().data){
      this.storeService.cleanError();
    }else{
      this.storeService.getStoreList();
    };
  };

  onBack(){
    this.onClose.emit();
  };
}
